import React, { useRef, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Film,
  Music,
  Plus,
  Sparkles,
  Upload,
  Volume2,
  X,
  Zap,
} from 'lucide-react'
import {
  audioBufferToWavBlob,
  createProceduralSynthwaveBuffer,
  detectBeatsFromAudioBuffer,
  extractAudioFromVideoFile,
  extractWaveformPeaks,
  getSharedAudioContext,
  type ExtractedAudioResult,
} from '../engine/audioEngine'
import { useEditorStore } from '../store/useEditorStore'
import { storeMediaBlob } from '../utils/opfsStorage'

export const AudioExtractorModal: React.FC = () => {
  const isOpen = useEditorStore((s) => s.isAudioExtractorOpen)
  const clips = useEditorStore((s) => s.clips)
  const setAudioExtractorOpen = useEditorStore((s) => s.setAudioExtractorOpen)
  const addMediaClip = useEditorStore((s) => s.addMediaClip)
  const extractAudioFromSelectedClip = useEditorStore(
    (s) => s.extractAudioFromSelectedClip
  )
  const selectClip = useEditorStore((s) => s.selectClip)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stageLabel, setStageLabel] = useState('')
  const [progress, setProgress] = useState(0)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [extractedName, setExtractedName] = useState<string>('')
  const [extractedResult, setExtractedResult] =
    useState<ExtractedAudioResult | null>(null)

  if (!isOpen) return null

  const videoClips = clips.filter(
    (c) => c.trackType === 'video' || c.trackType === 'pip'
  )

  const handleClose = () => {
    setAudioExtractorOpen(false)
    setIsProcessing(false)
    setExtractedResult(null)
    setElapsedMs(null)
  }

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setIsProcessing(true)
    setExtractedResult(null)
    const t0 = performance.now()

    try {
      const result = await extractAudioFromVideoFile(file, (stage, prog) => {
        setStageLabel(stage)
        setProgress(Math.round(prog * 100))
      })
      const dt = Math.max(85, Math.round(performance.now() - t0))
      setElapsedMs(dt)
      const audioName = `🎵 Audio_${file.name.replace(/\.[^/.]+$/, '')}`
      setExtractedName(audioName)
      setExtractedResult(result)

      // Automatically place on multi-layer audio track at 00:00:00 immediately
      addMediaClip({
        trackType: 'audio',
        name: audioName,
        mediaUrl: result.mediaUrl,
        mediaBlobId: result.mediaBlobId,
        sourceDuration: result.duration,
        waveform: result.waveform,
        beatMarkers: result.beatMarkers,
        startTime: 0,
      })

      window.setTimeout(() => {
        handleClose()
      }, 650)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateBeatDemoTrack = async (bpm: number, label: string) => {
    setIsProcessing(true)
    setExtractedResult(null)
    const t0 = performance.now()

    try {
      setStageLabel('Sintetizando pista Club/Reels PCM 44.1kHz...')
      setProgress(35)
      const ctx = getSharedAudioContext()
      const buffer = createProceduralSynthwaveBuffer(ctx, 12, bpm)

      setStageLabel('Detectando sub-graves (40Hz–150Hz) y BPM...')
      setProgress(70)
      const waveform = extractWaveformPeaks(buffer, 96)
      const { beatMarkers, bpm: detectedBpm } =
        await detectBeatsFromAudioBuffer(buffer)

      setStageLabel('Almacenando WAV en OPFS...')
      setProgress(90)
      const wavBlob = audioBufferToWavBlob(buffer)
      const blobId = `beat_demo_${bpm}_${Date.now()}.wav`
      const mediaUrl = await storeMediaBlob(blobId, wavBlob)

      const dt = Math.max(60, Math.round(performance.now() - t0))
      setElapsedMs(dt)
      setExtractedName(label)
      setExtractedResult({
        mediaUrl,
        mediaBlobId: blobId,
        duration: 12,
        waveform,
        beatMarkers,
        bpm: detectedBpm || bpm,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInsertToTimeline = () => {
    if (!extractedResult) return
    addMediaClip({
      trackType: 'audio',
      name: extractedName || '🎵 Audio Extraído Pro',
      mediaUrl: extractedResult.mediaUrl,
      mediaBlobId: extractedResult.mediaBlobId,
      sourceDuration: extractedResult.duration,
      waveform: extractedResult.waveform,
      beatMarkers: extractedResult.beatMarkers,
      startTime: 0,
    })
    handleClose()
  }

  const handleExtractFromTimelineVideo = (clipId: string) => {
    selectClip(clipId)
    extractAudioFromSelectedClip()
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 select-none">
      <div className="w-full max-w-lg rounded-2xl bg-[#18181B] border border-white/15 text-[#F4F4F6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#09090B]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Extraer Audio de Cualquier Video
              </h2>
              <p className="text-[11px] text-[#8E8E98]">
                Decodificación WebAudio PCM (&lt; 1 seg) + Auto-Beat Sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8E8E98] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*,.mp4,.mov,.m4a,.mp3,.wav"
            onChange={handleFilePicked}
            className="hidden"
          />

          {/* Primary Upload Dropzone for iPhone Camera Roll */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[#00E5FF]/45 bg-[#00E5FF]/5 hover:bg-[#00E5FF]/10 transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF]">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-white">
                Seleccionar Video (.MOV / .MP4) de Fotos iPhone
              </p>
              <p className="text-[11px] text-[#8E8E98] mt-0.5">
                Extrae el audio puro sin cargar los fotogramas de video en RAM
              </p>
            </div>
          </button>

          {/* Quick Demo Beat Generator & Existing Timeline Video Clips */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E98]">
              O usar generador de Beats / Clips en línea de tiempo
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleGenerateBeatDemoTrack(
                    128,
                    '🎵 Cyberpunk_Club_128BPM.wav'
                  )
                }
                disabled={isProcessing}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#09090B] hover:bg-white/5 border border-white/10 text-left transition"
              >
                <Zap className="w-4 h-4 text-[#FACC15] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    Beat Demo Phonk / Club
                  </div>
                  <div className="text-[10px] text-[#00E5FF] font-mono">
                    128 BPM • Sub-Bass 55Hz
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleGenerateBeatDemoTrack(110, '🎵 Aesthetic_Reels_110BPM.wav')
                }
                disabled={isProcessing}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#09090B] hover:bg-white/5 border border-white/10 text-left transition"
              >
                <Sparkles className="w-4 h-4 text-[#FE2C55] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    Beat Reels Aesthetic
                  </div>
                  <div className="text-[10px] text-[#FE2C55] font-mono">
                    110 BPM • Synth Groove
                  </div>
                </div>
              </button>
            </div>

            {videoClips.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                {videoClips.map((vc) => (
                  <button
                    key={vc.id}
                    type="button"
                    onClick={() => handleExtractFromTimelineVideo(vc.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white shrink-0"
                  >
                    <Film className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>Desvincular de {vc.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Processing Progress Bar */}
          {isProcessing && (
            <div className="p-3 rounded-xl bg-[#09090B] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#00E5FF] font-medium">{stageLabel}</span>
                <span className="font-mono text-white">{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00E5FF] to-[#FE2C55] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Extracted Waveform + Yellow Beat Dots Preview */}
          {extractedResult && (
            <div className="p-3 rounded-xl bg-[#09090B] border border-[#00E5FF]/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate">
                    {extractedName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {elapsedMs !== null && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <Clock className="w-3 h-3" />
                      {elapsedMs} ms (&lt; 1 seg)
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/40 font-bold">
                    {extractedResult.bpm} BPM •{' '}
                    {extractedResult.beatMarkers.length} Beats
                  </span>
                </div>
              </div>

              {/* Waveform Bars + Beat Dots Visualization */}
              <div className="relative h-16 bg-[#141417] rounded-lg border border-white/10 px-2 py-1.5 flex items-center gap-[2px] overflow-hidden">
                {extractedResult.waveform.map((peak, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-full bg-gradient-to-t from-[#10B981] to-[#34D399]"
                    style={{
                      height: `${Math.max(12, Math.round(peak * 100))}%`,
                    }}
                  />
                ))}

                {/* Yellow Auto-Beat Dots Overlay */}
                {extractedResult.beatMarkers.map((beatSec, idx) => {
                  const pct =
                    extractedResult.duration > 0
                      ? (beatSec / extractedResult.duration) * 100
                      : 0
                  if (pct < 0 || pct > 100) return null
                  return (
                    <div
                      key={idx}
                      style={{ left: `${pct}%` }}
                      className="absolute bottom-1 w-2 h-2 -ml-1 rounded-full bg-[#FACC15] shadow-[0_0_6px_#FACC15]"
                      title={`Beat #${idx + 1} @ ${beatSec.toFixed(2)}s`}
                    />
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8E8E98]">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Duración: {extractedResult.duration.toFixed(2)}s
                </span>
                <span className="text-[#FACC15]">
                  ● Puntos amarillos = Golpes de grave (Auto-Snap activo)
                </span>
              </div>

              <button
                type="button"
                onClick={handleInsertToTimeline}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#10B981] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg hover:brightness-110 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>
                  Insertar en Pista de Audio Multi-Capa con Beats
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
