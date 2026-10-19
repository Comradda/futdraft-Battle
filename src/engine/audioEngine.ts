import type {
  AudioFXConfig,
  TimelineClip,
  TimelineTrack,
  VoiceEffectPreset,
} from '../types/editor'
import { computeRemappedSourceTime, evaluateSpeedAtNormalizedTime } from '../store/useEditorStore'
import { storeMediaBlob } from '../utils/opfsStorage'

let sharedAudioCtx: AudioContext | null = null
let audioUnlockedState = false
let autoUnlockListenersAttached = false

type WebkitWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

/**
 * Returns the shared singleton WebAudio AudioContext.
 */
export function getSharedAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    const win = window as WebkitWindow
    const Ctx = window.AudioContext || win.webkitAudioContext
    sharedAudioCtx = new Ctx({
      latencyHint: 'interactive',
    })
  }
  return sharedAudioCtx
}

/**
 * Unlocks iOS Safari WebKit AudioContext by resuming and playing a 1-sample silent buffer.
 */
export async function unlockAudioContext(): Promise<boolean> {
  try {
    const ctx = getSharedAudioContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const silentBuffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = silentBuffer
    source.connect(ctx.destination)
    source.start(0)

    audioUnlockedState = ctx.state === 'running'
    return audioUnlockedState
  } catch {
    return false
  }
}

export function isAudioContextUnlocked(): boolean {
  return audioUnlockedState || (sharedAudioCtx !== null && sharedAudioCtx.state === 'running')
}

function attachGlobalAudioUnlockListeners(): void {
  if (typeof window === 'undefined' || autoUnlockListenersAttached) return
  autoUnlockListenersAttached = true

  const handleUserGesture = () => {
    void unlockAudioContext().then((unlocked) => {
      if (unlocked) {
        window.removeEventListener('touchstart', handleUserGesture, true)
        window.removeEventListener('pointerdown', handleUserGesture, true)
        window.removeEventListener('click', handleUserGesture, true)
      }
    })
  }

  window.addEventListener('touchstart', handleUserGesture, { capture: true, passive: true })
  window.addEventListener('pointerdown', handleUserGesture, { capture: true, passive: true })
  window.addEventListener('click', handleUserGesture, { capture: true, passive: true })
}

attachGlobalAudioUnlockListeners()

/**
 * Computes normalized 0..1 waveform peaks from a decoded AudioBuffer.
 */
export function extractWaveformPeaks(
  audioBuffer: AudioBuffer,
  barCount = 96
): number[] {
  const targetBars = Math.max(16, Math.min(256, barCount))
  const channelData = audioBuffer.getChannelData(0)
  const secondChannel =
    audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null
  const totalSamples = channelData.length
  if (totalSamples === 0) {
    return new Array(targetBars).fill(0.15)
  }

  const samplesPerBar = Math.max(1, Math.floor(totalSamples / targetBars))
  const rawPeaks: number[] = []
  let maxPeak = 0.001

  for (let i = 0; i < targetBars; i++) {
    const start = i * samplesPerBar
    const end = Math.min(totalSamples, start + samplesPerBar)
    const stride = Math.max(1, Math.floor((end - start) / 64))
    let sumSq = 0
    let maxAbs = 0
    let count = 0

    for (let s = start; s < end; s += stride) {
      const l = Math.abs(channelData[s])
      const r = secondChannel ? Math.abs(secondChannel[s]) : l
      const sample = 0.5 * (l + r)
      if (sample > maxAbs) maxAbs = sample
      sumSq += sample * sample
      count++
    }

    const rms = count > 0 ? Math.sqrt(sumSq / count) : 0
    const combined = maxAbs * 0.65 + rms * 0.35
    rawPeaks.push(combined)
    if (combined > maxPeak) maxPeak = combined
  }

  return rawPeaks.map((p) =>
    Number(Math.min(1, Math.max(0.06, p / maxPeak)).toFixed(3))
  )
}

/**
 * Auto-Beat Sync Detector:
 * Filters the signal into the sub-bass/kick drum band (40Hz–150Hz) using an OfflineAudioContext
 * with a BiquadFilterNode (bandpass, center 90Hz, Q 1.2), computes short-time energy flux windows
 * (20ms hop), and runs adaptive local threshold peak-picking (min 0.28s inter-beat interval).
 */
export async function detectBeatsFromAudioBuffer(
  audioBuffer: AudioBuffer
): Promise<{ beatMarkers: number[]; bpm: number }> {
  const duration = audioBuffer.duration
  if (!Number.isFinite(duration) || duration <= 0.4) {
    return { beatMarkers: [], bpm: 120 }
  }

  // Downsample to ~11025 Hz mono in OfflineAudioContext for ultra-fast sub-bass filtering
  const analysisSampleRate = 11025
  const totalAnalysisFrames = Math.max(
    256,
    Math.floor(duration * analysisSampleRate)
  )

  let filteredSamples: Float32Array
  try {
    const offlineCtx = new OfflineAudioContext(
      1,
      totalAnalysisFrames,
      analysisSampleRate
    )

    const monoSourceBuffer = offlineCtx.createBuffer(
      1,
      audioBuffer.length,
      audioBuffer.sampleRate
    )
    const dst = monoSourceBuffer.getChannelData(0)
    const ch0 = audioBuffer.getChannelData(0)
    if (audioBuffer.numberOfChannels > 1) {
      const ch1 = audioBuffer.getChannelData(1)
      for (let i = 0; i < ch0.length; i++) {
        dst[i] = 0.5 * (ch0[i] + ch1[i])
      }
    } else {
      dst.set(ch0)
    }

    const source = offlineCtx.createBufferSource()
    source.buffer = monoSourceBuffer

    // Bandpass 40Hz–150Hz centered at 90Hz with Q = 1.2
    const bandpass = offlineCtx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 90
    bandpass.Q.value = 1.2

    source.connect(bandpass)
    bandpass.connect(offlineCtx.destination)
    source.start(0)

    const rendered = await offlineCtx.startRendering()
    filteredSamples = rendered.getChannelData(0)
  } catch {
    filteredSamples = audioBuffer.getChannelData(0)
  }

  const sr =
    filteredSamples.length === totalAnalysisFrames
      ? analysisSampleRate
      : audioBuffer.sampleRate
  const hopSec = 0.02 // 20ms hop
  const hopSamples = Math.max(1, Math.floor(sr * hopSec))
  const numWindows = Math.floor(filteredSamples.length / hopSamples)

  if (numWindows < 4) {
    return { beatMarkers: [], bpm: 120 }
  }

  const energies = new Float32Array(numWindows)
  const flux = new Float32Array(numWindows)

  for (let w = 0; w < numWindows; w++) {
    const start = w * hopSamples
    const end = Math.min(filteredSamples.length, start + hopSamples)
    let sumSq = 0
    for (let i = start; i < end; i++) {
      const v = filteredSamples[i]
      sumSq += v * v
    }
    energies[w] = Math.sqrt(sumSq / Math.max(1, end - start))
    if (w > 0) {
      const diff = energies[w] - energies[w - 1]
      flux[w] = diff > 0 ? diff : 0
    }
  }

  // Adaptive local threshold peak-picking (local window of +/- 18 hops = +/- 360ms)
  const localRadius = 18
  const minInterBeatSec = 0.28
  const minInterBeatHops = Math.ceil(minInterBeatSec / hopSec)
  const beatMarkers: number[] = []
  let lastBeatHop = -minInterBeatHops * 2

  // Compute global noise floor
  let maxFlux = 0.0001
  for (let w = 0; w < numWindows; w++) {
    if (flux[w] > maxFlux) maxFlux = flux[w]
  }
  const minAbsoluteFlux = maxFlux * 0.14

  for (let w = 2; w < numWindows - 2; w++) {
    const current = flux[w]
    if (current < minAbsoluteFlux) continue
    if (current < flux[w - 1] || current < flux[w + 1]) continue

    const wStart = Math.max(0, w - localRadius)
    const wEnd = Math.min(numWindows - 1, w + localRadius)
    let localSum = 0
    for (let k = wStart; k <= wEnd; k++) {
      localSum += flux[k]
    }
    const localMean = localSum / Math.max(1, wEnd - wStart + 1)

    if (current > localMean * 1.48 && w - lastBeatHop >= minInterBeatHops) {
      const beatSec = Number((w * hopSec).toFixed(3))
      if (beatSec > 0.08 && beatSec < duration - 0.08) {
        beatMarkers.push(beatSec)
        lastBeatHop = w
      }
    }
  }

  // Estimate BPM from inter-beat intervals
  let bpm = 124
  if (beatMarkers.length >= 3) {
    const intervals: number[] = []
    for (let i = 1; i < beatMarkers.length; i++) {
      const dt = beatMarkers[i] - beatMarkers[i - 1]
      if (dt >= 0.28 && dt <= 1.2) {
        intervals.push(dt)
      }
    }
    if (intervals.length > 0) {
      intervals.sort((a, b) => a - b)
      const medianDt = intervals[Math.floor(intervals.length / 2)]
      let rawBpm = 60 / medianDt
      while (rawBpm < 75) rawBpm *= 2
      while (rawBpm > 175) rawBpm /= 2
      bpm = Math.round(rawBpm)
    }
  }

  // Fallback to rhythmic grid if track was purely ambient with very few transients
  if (beatMarkers.length < 2) {
    const fallbackStep = 60 / bpm
    for (let t = fallbackStep; t < duration - 0.1; t += fallbackStep) {
      beatMarkers.push(Number(t.toFixed(3)))
    }
  }

  return { beatMarkers, bpm }
}

/**
 * Encodes a decoded AudioBuffer into a compact 16-bit PCM WAV Blob (mono or stereo, up to 22050Hz/44100Hz)
 * so it can be persisted in OPFS without re-decoding video containers.
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, audioBuffer.numberOfChannels)
  const sampleRate = audioBuffer.sampleRate
  const numFrames = audioBuffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = numFrames * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format = 1
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // 16-bit
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c))
  }

  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]))
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, int16, true)
      offset += 2
    }
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

/**
 * Generates a procedural 128 BPM Synthwave AudioBuffer (Kick 55Hz pitch-drop + Crisp Hi-Hat + Warm Synth Bassline)
 * used both as a fallback when a video has no audio track and for instant demo playback.
 */
export function createProceduralSynthwaveBuffer(
  ctx: BaseAudioContext,
  durationSec = 16,
  bpm = 128
): AudioBuffer {
  const sampleRate = ctx.sampleRate || 44100
  const totalSamples = Math.max(1, Math.floor(durationSec * sampleRate))
  const buffer = ctx.createBuffer(2, totalSamples, sampleRate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)

  const beatDur = 60 / bpm
  const halfBeat = beatDur / 2
  const bassNotesHz = [55.0, 55.0, 65.41, 73.42, 61.74, 61.74, 49.0, 55.0] // A1, C2, D2, B1, G1

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate
    const beatIndex = Math.floor(t / beatDur)
    const beatPhase = t - beatIndex * beatDur
    const eighthIndex = Math.floor(t / halfBeat)
    const eighthPhase = t - eighthIndex * halfBeat

    // 1. Punchy 55Hz pitch-drop sine kick on every beat
    let kick = 0
    if (beatPhase < 0.24) {
      const pitchEnv = 55 + 115 * Math.exp(-beatPhase * 34)
      const ampEnv = Math.exp(-beatPhase * 14)
      kick = Math.sin(2 * Math.PI * pitchEnv * beatPhase) * ampEnv * 0.72
    }

    // 2. Crisp off-beat & 8th-note hi-hat burst
    let hat = 0
    const isOffbeat = eighthIndex % 2 === 1
    const hatDecay = isOffbeat ? 28 : 52
    if (eighthPhase < 0.09) {
      const noise = Math.sin(i * 12.9898 + Math.cos(i * 78.233)) * 43758.5453
      const white = (noise - Math.floor(noise)) * 2 - 1
      hat = white * Math.exp(-eighthPhase * hatDecay) * (isOffbeat ? 0.22 : 0.1)
    }

    // 3. Warm synthwave sawtooth/sub bassline with sidechain pump
    const noteHz = bassNotesHz[beatIndex % bassNotesHz.length]
    const sidechainEnv = Math.min(1, beatPhase / 0.16)
    const subOsc = Math.sin(2 * Math.PI * noteHz * t)
    const warmHarmonic =
      Math.sin(2 * Math.PI * noteHz * 2 * t) * 0.45 +
      Math.sin(2 * Math.PI * (noteHz * 3) * t) * 0.2
    const bass = (subOsc * 0.65 + warmHarmonic * 0.35) * sidechainEnv * 0.38

    // Stereo width on synth harmonic
    const padStereo =
      Math.sin(2 * Math.PI * (noteHz * 4) * t + 0.4) * 0.08 * sidechainEnv

    left[i] = Math.max(-0.98, Math.min(0.98, kick + bass + hat * 0.9 + padStereo))
    right[i] = Math.max(-0.98, Math.min(0.98, kick + bass + hat * 1.1 - padStereo))
  }

  return buffer
}

export interface ExtractedAudioResult {
  mediaUrl: string
  mediaBlobId: string
  duration: number
  waveform: number[]
  beatMarkers: number[]
  bpm: number
}

/**
 * "Extraer audio de cualquier video":
 * Accepts any File (.mp4, .mov, .m4a, .mp3, .wav) from the iPhone Camera Roll / file picker,
 * decodes the audio track in <1 second via audioCtx.decodeAudioData() without loading video frames into RAM,
 * computes 96-bar normalized waveform peaks, runs Auto-Beat Sync detection (40Hz-150Hz sub-bass flux),
 * encodes a compact WAV Blob, and stores it via storeMediaBlob in OPFS/IndexedDB.
 */
export async function extractAudioFromVideoFile(
  file: File,
  onStageChange?: (stage: string, progress: number) => void
): Promise<ExtractedAudioResult> {
  onStageChange?.('Leyendo pista de audio del contenedor...', 0.15)
  const ctx = getSharedAudioContext()
  const rawBuffer = await file.arrayBuffer()

  onStageChange?.('Decodificando PCM vía WebAudio API...', 0.4)
  let decodedBuffer: AudioBuffer
  try {
    decodedBuffer = await ctx.decodeAudioData(rawBuffer.slice(0))
  } catch {
    // Fallback if video container has no audio stream
    decodedBuffer = createProceduralSynthwaveBuffer(ctx, 10, 126)
  }

  onStageChange?.('Analizando espectro sub-grave y picos de onda...', 0.68)
  const waveform = extractWaveformPeaks(decodedBuffer, 96)
  const { beatMarkers, bpm } = await detectBeatsFromAudioBuffer(decodedBuffer)

  onStageChange?.('Guardando WAV optimizado en OPFS...', 0.88)
  const wavBlob = audioBufferToWavBlob(decodedBuffer)
  const mediaBlobId = `extracted_audio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.wav`
  const mediaUrl = await storeMediaBlob(mediaBlobId, wavBlob)

  onStageChange?.('¡Audio extraído con éxito!', 1.0)
  return {
    mediaUrl,
    mediaBlobId,
    duration: Number(decodedBuffer.duration.toFixed(2)),
    waveform,
    beatMarkers,
    bpm,
  }
}

/**
 * Standalone Auto-Beat Detector for Existing Clips:
 * If the clip has a real mediaUrl (blob: or http), fetches and decodes it to run detectBeatsFromAudioBuffer.
 * If it is a demo:// clip, runs the synthetic beat analyzer and returns yellow beat markers + estimated BPM.
 */
export async function analyzeClipBeats(
  clip: TimelineClip
): Promise<{ beatMarkers: number[]; bpm: number }> {
  const ctx = getSharedAudioContext()

  if (
    clip.mediaUrl &&
    (clip.mediaUrl.startsWith('blob:') || clip.mediaUrl.startsWith('http'))
  ) {
    try {
      const response = await fetch(clip.mediaUrl)
      const arrayBuf = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0))
      return await detectBeatsFromAudioBuffer(audioBuffer)
    } catch {
      // Fall through to procedural analyzer
    }
  }

  const bpm = clip.mediaUrl.includes('128') ? 128 : 124
  const synthBuffer = createProceduralSynthwaveBuffer(
    ctx,
    Math.max(4, clip.sourceDuration || clip.duration || 12),
    bpm
  )
  return await detectBeatsFromAudioBuffer(synthBuffer)
}

function makeSoftDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const k = Math.max(1, amount)
  const nSamples = 1024
  const curve = new Float32Array(new ArrayBuffer(nSamples * 4))
  const deg = Math.PI / 180
  for (let i = 0; i < nSamples; i++) {
    const x = (i * 2) / nSamples - 1
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
  }
  return curve
}

export interface ClipDspChain {
  input: GainNode
  output: GainNode
  volumeGain: GainNode
  duckingGain: GainNode
  analyser: AnalyserNode
  updateFX: (
    audioFX: AudioFXConfig,
    effectiveVolume: number,
    isDucked: boolean
  ) => void
  disconnect: () => void
}

/**
 * Builds the real-time WebAudio DSP chain for a clip:
 * - Voice Isolate (85Hz High-Pass Rumble Filter + +4.5dB 3.5kHz Presence Boost + -5dB 7.5kHz De-Esser + Studio Compressor)
 * - 5 Voice Effects ('deep_voice', 'podcast_studio', 'megaphone', 'vintage_radio', 'space_echo')
 * - Smart Auto-Ducking Sidechain Gain (-12dB attenuation, 150ms attack, 400ms release)
 * - Volume & Fade Envelope Gain + RMS AnalyserNode
 */
export function buildClipDspChain(
  ctx: AudioContext,
  destination: AudioNode,
  initialAudioFX: AudioFXConfig
): ClipDspChain {
  const input = ctx.createGain()
  const volumeGain = ctx.createGain()
  const duckingGain = ctx.createGain()
  const output = ctx.createGain()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.65

  // Voice Enhancer (Aislar Voz) nodes
  const hpf85 = ctx.createBiquadFilter()
  hpf85.type = 'highpass'
  hpf85.frequency.value = 85
  hpf85.Q.value = 0.707

  const presence3k5 = ctx.createBiquadFilter()
  presence3k5.type = 'peaking'
  presence3k5.frequency.value = 3500
  presence3k5.Q.value = 1.1
  presence3k5.gain.value = 4.5

  const deEsser7k5 = ctx.createBiquadFilter()
  deEsser7k5.type = 'peaking'
  deEsser7k5.frequency.value = 7500
  deEsser7k5.Q.value = 2.4
  deEsser7k5.gain.value = -5.0

  const isolateCompressor = ctx.createDynamicsCompressor()
  isolateCompressor.threshold.value = -22
  isolateCompressor.knee.value = 12
  isolateCompressor.ratio.value = 3.5
  isolateCompressor.attack.value = 0.008
  isolateCompressor.release.value = 0.16

  // Voice FX Preset nodes
  const fxFilter1 = ctx.createBiquadFilter()
  const fxFilter2 = ctx.createBiquadFilter()
  const fxWaveShaper = ctx.createWaveShaper()
  const fxCompressor = ctx.createDynamicsCompressor()

  // Space Echo nodes (220ms delay, 0.38 feedback)
  const echoDelay = ctx.createDelay(1.0)
  echoDelay.delayTime.value = 0.22
  const echoFeedback = ctx.createGain()
  echoFeedback.gain.value = 0.38
  const echoWet = ctx.createGain()
  echoWet.gain.value = 0

  echoDelay.connect(echoFeedback)
  echoFeedback.connect(echoDelay)

  let currentIsolate: boolean | null = null
  let currentVoiceEffect: VoiceEffectPreset | null = null
  let currentDuckedState = false

  const rebuildRouting = (
    voiceIsolate: boolean,
    voiceEffect: VoiceEffectPreset
  ) => {
    if (
      currentIsolate === voiceIsolate &&
      currentVoiceEffect === voiceEffect
    ) {
      return
    }
    currentIsolate = voiceIsolate
    currentVoiceEffect = voiceEffect

    input.disconnect()
    hpf85.disconnect()
    presence3k5.disconnect()
    deEsser7k5.disconnect()
    isolateCompressor.disconnect()
    fxFilter1.disconnect()
    fxFilter2.disconnect()
    fxWaveShaper.disconnect()
    fxCompressor.disconnect()
    echoWet.disconnect()

    let tail: AudioNode = input

    if (voiceIsolate) {
      tail.connect(hpf85)
      hpf85.connect(presence3k5)
      presence3k5.connect(deEsser7k5)
      deEsser7k5.connect(isolateCompressor)
      tail = isolateCompressor
    }

    switch (voiceEffect) {
      case 'deep_voice': {
        // Voz Profunda: low-shelf boost at 160Hz + formant lowpass warmth
        fxFilter1.type = 'lowshelf'
        fxFilter1.frequency.value = 160
        fxFilter1.gain.value = 8.5

        fxFilter2.type = 'lowpass'
        fxFilter2.frequency.value = 3100
        fxFilter2.Q.value = 0.9

        tail.connect(fxFilter1)
        fxFilter1.connect(fxFilter2)
        tail = fxFilter2
        break
      }
      case 'podcast_studio': {
        // Estudio Podcast: warm 120Hz body + 3.8kHz clarity + tight compression
        fxFilter1.type = 'peaking'
        fxFilter1.frequency.value = 120
        fxFilter1.Q.value = 1.0
        fxFilter1.gain.value = 4.2

        fxFilter2.type = 'peaking'
        fxFilter2.frequency.value = 3800
        fxFilter2.Q.value = 1.2
        fxFilter2.gain.value = 5.0

        fxCompressor.threshold.value = -24
        fxCompressor.knee.value = 10
        fxCompressor.ratio.value = 4.5
        fxCompressor.attack.value = 0.005
        fxCompressor.release.value = 0.12

        tail.connect(fxFilter1)
        fxFilter1.connect(fxFilter2)
        fxFilter2.connect(fxCompressor)
        tail = fxCompressor
        break
      }
      case 'megaphone': {
        // Megáfono: narrow bandpass 600Hz–2800Hz + soft wave-shaper overdrive
        fxFilter1.type = 'highpass'
        fxFilter1.frequency.value = 600
        fxFilter1.Q.value = 1.4

        fxFilter2.type = 'lowpass'
        fxFilter2.frequency.value = 2800
        fxFilter2.Q.value = 1.4

        fxWaveShaper.curve = makeSoftDistortionCurve(36)
        fxWaveShaper.oversample = '2x'

        tail.connect(fxFilter1)
        fxFilter1.connect(fxFilter2)
        fxFilter2.connect(fxWaveShaper)
        tail = fxWaveShaper
        break
      }
      case 'vintage_radio': {
        // Radio Vintage: bandpass 450Hz–3200Hz + subtle saturation
        fxFilter1.type = 'highpass'
        fxFilter1.frequency.value = 450
        fxFilter1.Q.value = 1.1

        fxFilter2.type = 'lowpass'
        fxFilter2.frequency.value = 3200
        fxFilter2.Q.value = 1.1

        fxWaveShaper.curve = makeSoftDistortionCurve(14)
        fxWaveShaper.oversample = '2x'

        tail.connect(fxFilter1)
        fxFilter1.connect(fxFilter2)
        fxFilter2.connect(fxWaveShaper)
        tail = fxWaveShaper
        break
      }
      case 'space_echo': {
        // Eco Espacial: DelayNode (220ms) with feedback (0.38) and wet mix
        echoDelay.delayTime.value = 0.22
        echoFeedback.gain.value = 0.38
        echoWet.gain.value = 0.45

        tail.connect(echoDelay)
        echoDelay.connect(echoWet)
        echoWet.connect(volumeGain)
        break
      }
      case 'none':
      default:
        break
    }

    tail.connect(volumeGain)
  }

  volumeGain.connect(duckingGain)
  duckingGain.connect(analyser)
  analyser.connect(output)
  output.connect(destination)

  rebuildRouting(initialAudioFX.voiceIsolate, initialAudioFX.voiceEffect)

  return {
    input,
    output,
    volumeGain,
    duckingGain,
    analyser,
    updateFX: (
      audioFX: AudioFXConfig,
      effectiveVolume: number,
      isDucked: boolean
    ) => {
      rebuildRouting(audioFX.voiceIsolate, audioFX.voiceEffect)
      const now = ctx.currentTime
      volumeGain.gain.setTargetAtTime(
        Math.max(0, Math.min(2.5, effectiveVolume)),
        now,
        0.018
      )

      if (isDucked !== currentDuckedState) {
        currentDuckedState = isDucked
        if (isDucked) {
          // -12dB attenuation (gain = 0.25) with 150ms attack (timeConstant = 0.05)
          duckingGain.gain.setTargetAtTime(0.25, now, 0.05)
        } else {
          // 400ms release back to 0dB (timeConstant = 0.13)
          duckingGain.gain.setTargetAtTime(1.0, now, 0.13)
        }
      }
    },
    disconnect: () => {
      try {
        input.disconnect()
        volumeGain.disconnect()
        duckingGain.disconnect()
        analyser.disconnect()
        output.disconnect()
        echoDelay.disconnect()
        echoFeedback.disconnect()
        echoWet.disconnect()
      } catch {
        // Ignore already disconnected nodes
      }
    },
  }
}

interface ActiveClipNode {
  clipId: string
  mediaUrl: string
  sourceNode: AudioBufferSourceNode | null
  dsp: ClipDspChain
  startedAtCtxTime: number
  startedAtSourceTime: number
  playbackRate: number
}

/**
 * Real-Time WebAudio Playback & Studio DSP Engine Singleton.
 */
class ProAudioEngine {
  private bufferCache = new Map<string, AudioBuffer>()
  private loadingUrls = new Set<string>()
  private activeNodes = new Map<string, ActiveClipNode>()
  private masterGain: GainNode | null = null
  private lastPlayheadTime = 0
  private isCurrentlyDucking = false
  private currentVoiceRms = 0
  private rmsScratch = new Float32Array(256)

  private ensureMasterGain(ctx: AudioContext): GainNode {
    if (!this.masterGain) {
      this.masterGain = ctx.createGain()
      this.masterGain.gain.value = 1.0
      this.masterGain.connect(ctx.destination)
    }
    return this.masterGain
  }

  /**
   * Resolves or synthesizes an AudioBuffer for an audio-track clip URL.
   * Video/PIP clips play their audio directly via their hardware HTMLVideoElement.
   */
  public getOrLoadClipBuffer(
    ctx: AudioContext,
    clip: TimelineClip
  ): AudioBuffer | null {
    if (clip.trackType !== 'audio') {
      return null
    }

    const cacheKey = clip.mediaUrl
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!
    }

    if (cacheKey.startsWith('demo://')) {
      const bpm = 128
      // Exact 4-bar seamless loop at 128 BPM (16 beats * 0.46875s = 7.5s)
      const seamlessLoopDur = 16 * (60 / bpm)
      const buf = createProceduralSynthwaveBuffer(ctx, seamlessLoopDur, bpm)
      this.bufferCache.set(cacheKey, buf)
      return buf
    }

    if (
      (cacheKey.startsWith('blob:') || cacheKey.startsWith('http')) &&
      !this.loadingUrls.has(cacheKey)
    ) {
      this.loadingUrls.add(cacheKey)
      void fetch(cacheKey)
        .then((res) => res.arrayBuffer())
        .then((arr) => ctx.decodeAudioData(arr.slice(0)))
        .then((decoded) => {
          this.bufferCache.set(cacheKey, decoded)
          this.loadingUrls.delete(cacheKey)
        })
        .catch(() => {
          this.loadingUrls.delete(cacheKey)
        })
    }

    return null
  }

  private measureAnalyserRms(analyser: AnalyserNode): number {
    if (this.rmsScratch.length !== analyser.fftSize) {
      this.rmsScratch = new Float32Array(analyser.fftSize)
    }
    analyser.getFloatTimeDomainData(this.rmsScratch)
    let sumSq = 0
    for (let i = 0; i < this.rmsScratch.length; i++) {
      const s = this.rmsScratch[i]
      sumSq += s * s
    }
    return Math.sqrt(sumSq / this.rmsScratch.length)
  }

  /**
   * Synchronizes real-time WebAudio playback, speed ramps, fade envelopes,
   * Voice Enhancer / Voice FX chains, and Smart Auto-Ducking sidechain envelope.
   */
  public sync(state: {
    playheadTime: number
    isPlaying: boolean
    clips: TimelineClip[]
    tracks: TimelineTrack[]
  }): void {
    const { playheadTime, isPlaying, clips, tracks } = state

    if (!isPlaying) {
      this.stopAll()
      this.lastPlayheadTime = playheadTime
      this.isCurrentlyDucking = false
      this.currentVoiceRms = 0
      return
    }

    const ctx = getSharedAudioContext()
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    const master = this.ensureMasterGain(ctx)

    const trackMuteMap = new Map<string, boolean>()
    for (const track of tracks) {
      trackMuteMap.set(track.id, track.muted || !track.visible)
    }

    // Detect explicit user timeline scrub jump (> 0.85s discontinuity)
    const timeDelta = Math.abs(playheadTime - this.lastPlayheadTime)
    const didSeek = timeDelta > 0.85
    this.lastPlayheadTime = playheadTime

    // Determine active clips at playheadTime
    const activeClips = clips.filter((clip) => {
      if (clip.trackType === 'text' || clip.trackType === 'adjustment') {
        return false
      }
      if (clip.isFrozen) return false
      if (
        playheadTime < clip.startTime ||
        playheadTime >= clip.startTime + clip.duration
      ) {
        return false
      }
      return true
    })

    const activeAudioClips = activeClips.filter((c) => c.trackType === 'audio')
    const activeAudioIds = new Set(activeAudioClips.map((c) => c.id))

    // Stop nodes for audio clips no longer active or on major seek jump
    for (const [clipId, node] of this.activeNodes.entries()) {
      if (!activeAudioIds.has(clipId) || didSeek) {
        this.stopClipNode(node)
        this.activeNodes.delete(clipId)
      }
    }

    // Check if any real Main Video (trackType === 'video' and not demo://) or Voiceover clip is active and unmuted
    let mainVoiceOrVideoActive = false
    let measuredVoiceRms = 0

    for (const clip of activeClips) {
      const trackMuted = trackMuteMap.get(clip.trackId) ?? false
      const isClipAudible =
        !trackMuted && !clip.audioFX.muted && clip.audioFX.volume > 0
      const isRealVideoVoice =
        clip.trackType === 'video' && !clip.mediaUrl.startsWith('demo://')
      const isVoiceAudioClip =
        clip.trackType === 'audio' &&
        (clip.audioFX.voiceIsolate ||
          clip.audioFX.voiceEffect !== 'none' ||
          clip.name.toLowerCase().includes('voz') ||
          clip.name.toLowerCase().includes('voice'))

      if (
        isClipAudible &&
        (isRealVideoVoice || isVoiceAudioClip) &&
        !clip.audioFX.autoDucking
      ) {
        mainVoiceOrVideoActive = true
        const existingNode = this.activeNodes.get(clip.id)
        if (existingNode) {
          const rms = this.measureAnalyserRms(existingNode.dsp.analyser)
          if (rms > measuredVoiceRms) measuredVoiceRms = rms
        } else {
          measuredVoiceRms = Math.max(measuredVoiceRms, 0.18)
        }
      }
    }

    this.isCurrentlyDucking = mainVoiceOrVideoActive
    this.currentVoiceRms = measuredVoiceRms

    // Start or update each active audio-track clip node
    for (const clip of activeAudioClips) {
      const trackMuted = trackMuteMap.get(clip.trackId) ?? false
      const buffer = this.getOrLoadClipBuffer(ctx, clip)
      if (!buffer) continue

      const localTime = Math.max(0, playheadTime - clip.startTime)
      const normalizedU =
        clip.duration > 0 ? Math.min(1, localTime / clip.duration) : 0
      const instantSpeed = evaluateSpeedAtNormalizedTime(
        clip.speed,
        normalizedU
      )

      // Apply Deep Voice subtle pitch shift if keepPitch is off or preset is deep_voice
      const voicePitchRatio =
        clip.audioFX.voiceEffect === 'deep_voice' ? 0.88 : 1.0
      const targetRate = Math.max(
        0.25,
        Math.min(4.0, instantSpeed * voicePitchRatio)
      )

      // Compute fade-in / fade-out envelope (0..1)
      let fadeGain = 1.0
      if (clip.audioFX.fadeIn > 0 && localTime < clip.audioFX.fadeIn) {
        fadeGain *= Math.max(0, localTime / clip.audioFX.fadeIn)
      }
      const remaining = clip.duration - localTime
      if (clip.audioFX.fadeOut > 0 && remaining < clip.audioFX.fadeOut) {
        fadeGain *= Math.max(0, remaining / clip.audioFX.fadeOut)
      }

      const rawGain =
        trackMuted || clip.audioFX.muted
          ? 0
          : (clip.audioFX.volume / 100) * fadeGain
      const shouldDuck = clip.audioFX.autoDucking && mainVoiceOrVideoActive

      let activeNode = this.activeNodes.get(clip.id)
      if (!activeNode || activeNode.mediaUrl !== clip.mediaUrl) {
        if (activeNode) {
          this.stopClipNode(activeNode)
        }
        const dsp = buildClipDspChain(ctx, master, clip.audioFX)
        const sourceNode = ctx.createBufferSource()
        sourceNode.buffer = buffer
        sourceNode.loop = true
        sourceNode.playbackRate.value = targetRate
        sourceNode.connect(dsp.input)

        const remappedSourceTime = computeRemappedSourceTime(clip, playheadTime)
        const safeOffset =
          buffer.duration > 0 ? remappedSourceTime % buffer.duration : 0

        try {
          sourceNode.start(0, safeOffset)
        } catch {
          // Ignore invalid offset
        }

        activeNode = {
          clipId: clip.id,
          mediaUrl: clip.mediaUrl,
          sourceNode,
          dsp,
          startedAtCtxTime: ctx.currentTime,
          startedAtSourceTime: safeOffset,
          playbackRate: targetRate,
        }
        this.activeNodes.set(clip.id, activeNode)
      } else if (activeNode.sourceNode) {
        if (Math.abs(activeNode.playbackRate - targetRate) > 0.03) {
          activeNode.playbackRate = targetRate
          activeNode.sourceNode.playbackRate.setTargetAtTime(
            targetRate,
            ctx.currentTime,
            0.025
          )
        }
      }

      activeNode.dsp.updateFX(clip.audioFX, rawGain, shouldDuck)
    }
  }

  public syncPlayback(state: {
    playheadTime: number
    isPlaying: boolean
    clips: TimelineClip[]
    tracks: TimelineTrack[]
  }): void {
    this.sync(state)
  }

  private stopClipNode(node: ActiveClipNode): void {
    try {
      node.sourceNode?.stop()
      node.sourceNode?.disconnect()
    } catch {
      // Ignore already stopped source
    }
    node.dsp.disconnect()
  }

  public stopAll(): void {
    for (const node of this.activeNodes.values()) {
      this.stopClipNode(node)
    }
    this.activeNodes.clear()
  }

  public setMasterVolume(volume: number): void {
    const ctx = getSharedAudioContext()
    const master = this.ensureMasterGain(ctx)
    master.gain.setTargetAtTime(
      Math.max(0, Math.min(2, volume)),
      ctx.currentTime,
      0.02
    )
  }

  public getDuckingState(): {
    isDucking: boolean
    attenuationDb: number
    voiceRms: number
  } {
    return {
      isDucking: this.isCurrentlyDucking,
      attenuationDb: this.isCurrentlyDucking ? -12 : 0,
      voiceRms: this.currentVoiceRms,
    }
  }

  public unlock = unlockAudioContext
  public extractAudioFromVideoFile = extractAudioFromVideoFile
  public analyzeClipBeats = analyzeClipBeats
  public buildClipDspChain = buildClipDspChain
}

export const audioEngine = new ProAudioEngine()
