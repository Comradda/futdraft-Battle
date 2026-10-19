import { create } from 'zustand'
import type {
  ActiveDrawerType,
  AspectRatio,
  AudioFXConfig,
  BlendMode,
  CanvasBackgroundConfig,
  ChromaKeyConfig,
  ClipAnimationConfig,
  ClipKeyframe,
  ClipTransform,
  ClipTransition,
  ColorGradingConfig,
  ExportConfig,
  HistogramData,
  KeyframeEasing,
  MaskConfig,
  QualityEnhancerConfig,
  SnapGuideState,
  SocialSafeZoneMode,
  SpeedConfig,
  SpeedCurvePoint,
  SpeedCurvePresetId,
  TextStyleConfig,
  TimelineClip,
  TimelineTrack,
  TrackType,
} from '../types/editor'

export const DEFAULT_COLOR_GRADING: ColorGradingConfig = {
  exposure: 0,
  contrast: 0,
  brightness: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
  filmGrain: 0,
  vignette: 0,
  chromaticAberration: 0,
  halation: 0,
}

export const DEFAULT_QUALITY_ENHANCER: QualityEnhancerConfig = {
  enabled: false,
  casSharpen: 45,
  bilateralDenoise: 25,
  debandDither: 30,
  midtoneClarity: 35,
}

export const DEFAULT_MASK: MaskConfig = {
  shape: 'none',
  x: 0,
  y: 0,
  scaleX: 0.55,
  scaleY: 0.55,
  rotation: 0,
  feather: 15,
  invert: false,
  cornerRadius: 20,
}

export const DEFAULT_CHROMA_KEY: ChromaKeyConfig = {
  enabled: false,
  keyColor: [0.0, 0.85, 0.15],
  similarity: 35,
  smoothness: 18,
  spillSuppression: 40,
}

export const DEFAULT_ANIMATION: ClipAnimationConfig = {
  inType: 'none',
  inDuration: 0.5,
  outType: 'none',
  outDuration: 0.5,
  comboType: 'none',
}

export const DEFAULT_TRANSFORM: ClipTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  flipH: false,
  flipV: false,
  cropTop: 0,
  cropBottom: 0,
  cropLeft: 0,
  cropRight: 0,
}

export const SPEED_CURVE_PRESETS: Record<
  SpeedCurvePresetId,
  { name: string; points: SpeedCurvePoint[] }
> = {
  normal: {
    name: 'Normal',
    points: [
      { t: 0, speed: 1 },
      { t: 0.25, speed: 1 },
      { t: 0.5, speed: 1 },
      { t: 0.75, speed: 1 },
      { t: 1, speed: 1 },
    ],
  },
  montaje: {
    name: 'Montaje',
    points: [
      { t: 0, speed: 0.8 },
      { t: 0.22, speed: 3.8 },
      { t: 0.5, speed: 0.45 },
      { t: 0.78, speed: 2.6 },
      { t: 1, speed: 0.9 },
    ],
  },
  heroe: {
    name: 'Héroe',
    points: [
      { t: 0, speed: 1.2 },
      { t: 0.3, speed: 4.5 },
      { t: 0.52, speed: 0.3 },
      { t: 0.75, speed: 0.35 },
      { t: 1, speed: 2.2 },
    ],
  },
  bala: {
    name: 'Bala',
    points: [
      { t: 0, speed: 5.5 },
      { t: 0.35, speed: 0.25 },
      { t: 0.65, speed: 0.25 },
      { t: 1, speed: 5.5 },
    ],
  },
  salto: {
    name: 'Salto / Jump Cut',
    points: [
      { t: 0, speed: 0.7 },
      { t: 0.25, speed: 0.7 },
      { t: 0.48, speed: 6.0 },
      { t: 0.72, speed: 0.6 },
      { t: 1, speed: 0.8 },
    ],
  },
  flash_in: {
    name: 'Flash In',
    points: [
      { t: 0, speed: 6.5 },
      { t: 0.28, speed: 1.8 },
      { t: 0.6, speed: 1.0 },
      { t: 1, speed: 1.0 },
    ],
  },
  flash_out: {
    name: 'Flash Out',
    points: [
      { t: 0, speed: 1.0 },
      { t: 0.4, speed: 1.0 },
      { t: 0.72, speed: 2.0 },
      { t: 1, speed: 6.8 },
    ],
  },
  personalizado: {
    name: 'Personalizado',
    points: [
      { t: 0, speed: 1.0 },
      { t: 0.25, speed: 2.2 },
      { t: 0.5, speed: 0.5 },
      { t: 0.75, speed: 2.5 },
      { t: 1, speed: 1.0 },
    ],
  },
}

export const DEFAULT_SPEED: SpeedConfig = {
  mode: 'normal',
  normalSpeed: 1,
  keepPitch: true,
  curvePreset: 'normal',
  curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
}

export const DEFAULT_AUDIO_FX: AudioFXConfig = {
  volume: 100,
  muted: false,
  fadeIn: 0,
  fadeOut: 0,
  autoDucking: false,
  voiceIsolate: false,
  voiceEffect: 'none',
  beatMarkers: [],
}

export const INITIAL_TRACKS: TimelineTrack[] = [
  {
    id: 'track_adjustment',
    type: 'adjustment',
    name: 'Capa de Ajuste',
    shortLabel: 'AJUSTE',
    muted: false,
    locked: false,
    visible: true,
  },
  {
    id: 'track_text',
    type: 'text',
    name: 'Texto y Stickers',
    shortLabel: 'TEXTO',
    muted: false,
    locked: false,
    visible: true,
  },
  {
    id: 'track_pip',
    type: 'pip',
    name: 'Superposición / PIP',
    shortLabel: 'PIP',
    muted: false,
    locked: false,
    visible: true,
  },
  {
    id: 'track_video',
    type: 'video',
    name: 'Pista Principal de Video',
    shortLabel: 'VIDEO',
    muted: false,
    locked: false,
    visible: true,
  },
  {
    id: 'track_audio',
    type: 'audio',
    name: 'Pistas de Audio Multi-Capa',
    shortLabel: 'AUDIO',
    muted: false,
    locked: false,
    visible: true,
  },
]

function generateDemoWaveform(count: number, seed = 1): number[] {
  const arr: number[] = []
  for (let i = 0; i < count; i++) {
    const beatPulse = i % 6 === 0 ? 0.92 : 0.35
    const wave =
      Math.abs(Math.sin(i * 0.43 + seed) * Math.cos(i * 0.19 - seed)) * 0.55 +
      beatPulse * 0.4
    arr.push(Math.min(1, Math.max(0.08, Number(wave.toFixed(3)))))
  }
  return arr
}

function generateDemoBeats(duration: number, bpm = 128): number[] {
  const interval = 60 / bpm
  const beats: number[] = []
  for (let t = interval; t < duration - 0.1; t += interval) {
    beats.push(Number(t.toFixed(3)))
  }
  return beats
}

export function createInitialClips(): TimelineClip[] {
  return [
    {
      id: 'clip_video_1',
      trackId: 'track_video',
      trackType: 'video',
      name: 'Cyberpunk_Reels_01.mov',
      mediaUrl: 'demo://cyberpunk_city',
      sourceDuration: 8,
      startTime: 0,
      duration: 6,
      sourceStartOffset: 0,
      isFrozen: false,
      thumbnails: [],
      waveform: generateDemoWaveform(48, 1),
      opacity: 100,
      filterId: 'teal_orange',
      filterIntensity: 75,
      colorGrading: {
        ...DEFAULT_COLOR_GRADING,
        contrast: 12,
        vibrance: 18,
      },
      qualityEnhancer: {
        ...DEFAULT_QUALITY_ENHANCER,
        enabled: true,
        casSharpen: 52,
        midtoneClarity: 35,
      },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: { ...DEFAULT_MASK },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'normal',
      animation: { ...DEFAULT_ANIMATION, inType: 'zoom_in', inDuration: 0.6 },
      transitionIn: { type: 'none', duration: 0.5 },
      keyframes: [
        {
          id: 'kf_demo_1',
          timeOffset: 0,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 100,
          filterIntensity: 75,
          easing: 'ease_in_out',
        },
        {
          id: 'kf_demo_2',
          timeOffset: 3.0,
          x: 0,
          y: 0,
          scale: 1.08,
          rotation: 0,
          opacity: 100,
          filterIntensity: 85,
          easing: 'ease_in_out',
        },
      ],
      audioFX: { ...DEFAULT_AUDIO_FX, volume: 100 },
      transform: { ...DEFAULT_TRANSFORM },
    },
    {
      id: 'clip_video_2',
      trackId: 'track_video',
      trackType: 'video',
      name: 'Golden_Hour_Miami.mp4',
      mediaUrl: 'demo://golden_sunset',
      sourceDuration: 8,
      startTime: 6,
      duration: 6,
      sourceStartOffset: 0,
      isFrozen: false,
      thumbnails: [],
      waveform: generateDemoWaveform(48, 3),
      opacity: 100,
      filterId: 'golden_hour',
      filterIntensity: 80,
      colorGrading: {
        ...DEFAULT_COLOR_GRADING,
        temperature: 15,
        halation: 20,
      },
      qualityEnhancer: {
        ...DEFAULT_QUALITY_ENHANCER,
        enabled: true,
        casSharpen: 40,
      },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: { ...DEFAULT_MASK },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'normal',
      animation: { ...DEFAULT_ANIMATION },
      transitionIn: { type: 'whip_zoom', duration: 0.6 },
      keyframes: [],
      audioFX: { ...DEFAULT_AUDIO_FX, volume: 100 },
      transform: { ...DEFAULT_TRANSFORM },
    },
    {
      id: 'clip_pip_1',
      trackId: 'track_pip',
      trackType: 'pip',
      name: 'PIP_Cam_Overlay.mov',
      mediaUrl: 'demo://neon_grid',
      sourceDuration: 6,
      startTime: 1.0,
      duration: 4.5,
      sourceStartOffset: 0,
      isFrozen: false,
      thumbnails: [],
      waveform: generateDemoWaveform(32, 7),
      opacity: 95,
      filterId: 'cyberpunk_neon',
      filterIntensity: 85,
      colorGrading: { ...DEFAULT_COLOR_GRADING },
      qualityEnhancer: { ...DEFAULT_QUALITY_ENHANCER },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: {
        ...DEFAULT_MASK,
        shape: 'circle',
        scaleX: 0.65,
        scaleY: 0.65,
        feather: 12,
      },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'screen',
      animation: { ...DEFAULT_ANIMATION, inType: 'bounce_pop', inDuration: 0.4 },
      transitionIn: { type: 'none', duration: 0.4 },
      keyframes: [],
      audioFX: { ...DEFAULT_AUDIO_FX, volume: 0, muted: true },
      transform: {
        ...DEFAULT_TRANSFORM,
        x: 0.26,
        y: -0.28,
        scale: 0.42,
      },
    },
    {
      id: 'clip_text_1',
      trackId: 'track_text',
      trackType: 'text',
      name: 'Texto: CAPCUT PRO 60FPS',
      mediaUrl: 'text://main_title',
      sourceDuration: 10,
      startTime: 0.4,
      duration: 5.2,
      sourceStartOffset: 0,
      isFrozen: false,
      thumbnails: [],
      waveform: [],
      opacity: 100,
      filterId: 'none',
      filterIntensity: 100,
      colorGrading: { ...DEFAULT_COLOR_GRADING },
      qualityEnhancer: { ...DEFAULT_QUALITY_ENHANCER },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: { ...DEFAULT_MASK },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'normal',
      animation: { ...DEFAULT_ANIMATION, inType: 'bounce_pop', inDuration: 0.45 },
      transitionIn: { type: 'none', duration: 0.3 },
      keyframes: [],
      audioFX: { ...DEFAULT_AUDIO_FX, volume: 0, muted: true },
      transform: {
        ...DEFAULT_TRANSFORM,
        x: 0,
        y: 0.28,
        scale: 1,
      },
      textStyle: {
        text: 'CAPCUT STUDIO PRO ✨',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 46,
        color: '#FFFFFF',
        strokeColor: '#00E5FF',
        strokeWidth: 4,
        backgroundColor: 'rgba(9, 9, 11, 0.65)',
        shadowBlur: 18,
        align: 'center',
        isSticker: false,
      },
    },
    {
      id: 'clip_adj_1',
      trackId: 'track_adjustment',
      trackType: 'adjustment',
      name: 'Look IMAX + Nitidez CAS',
      mediaUrl: 'adjustment://master_grade',
      sourceDuration: 12,
      startTime: 0,
      duration: 12,
      sourceStartOffset: 0,
      isFrozen: false,
      thumbnails: [],
      waveform: [],
      opacity: 100,
      filterId: 'oppenheimer_imax',
      filterIntensity: 35,
      colorGrading: {
        ...DEFAULT_COLOR_GRADING,
        contrast: 8,
        highlights: -6,
        shadows: 6,
        sharpness: 22,
      },
      qualityEnhancer: {
        enabled: true,
        casSharpen: 38,
        bilateralDenoise: 15,
        debandDither: 25,
        midtoneClarity: 28,
      },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: { ...DEFAULT_MASK },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'normal',
      animation: { ...DEFAULT_ANIMATION },
      transitionIn: { type: 'none', duration: 0.3 },
      keyframes: [],
      audioFX: { ...DEFAULT_AUDIO_FX, volume: 0, muted: true },
      transform: { ...DEFAULT_TRANSFORM },
    },
    {
      id: 'clip_audio_1',
      trackId: 'track_audio',
      trackType: 'audio',
      name: 'Synthwave_Beat_128BPM.wav',
      mediaUrl: 'demo://synth_beat_128',
      sourceDuration: 16,
      startTime: 0,
      duration: 12,
      sourceStartOffset: 0,
      isFrozen: false,
      thumbnails: [],
      waveform: generateDemoWaveform(96, 5),
      opacity: 100,
      filterId: 'none',
      filterIntensity: 0,
      colorGrading: { ...DEFAULT_COLOR_GRADING },
      qualityEnhancer: { ...DEFAULT_QUALITY_ENHANCER },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: { ...DEFAULT_MASK },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'normal',
      animation: { ...DEFAULT_ANIMATION },
      transitionIn: { type: 'none', duration: 0.3 },
      keyframes: [],
      audioFX: {
        ...DEFAULT_AUDIO_FX,
        volume: 110,
        fadeIn: 0.4,
        fadeOut: 0.8,
        autoDucking: true,
        beatMarkers: generateDemoBeats(12, 128),
      },
      transform: { ...DEFAULT_TRANSFORM },
    },
  ]
}

interface EditorSnapshot {
  clips: TimelineClip[]
  tracks: TimelineTrack[]
  aspectRatio: AspectRatio
  canvasBackground: CanvasBackgroundConfig
}

function cloneSnapshot(
  clips: TimelineClip[],
  tracks: TimelineTrack[],
  aspectRatio: AspectRatio,
  canvasBackground: CanvasBackgroundConfig
): EditorSnapshot {
  return JSON.parse(
    JSON.stringify({ clips, tracks, aspectRatio, canvasBackground })
  ) as EditorSnapshot
}

/**
 * Evaluates keyframe easing curve for t in [0..1]
 */
export function evaluateEasing(t: number, easing: KeyframeEasing): number {
  const clamped = Math.max(0, Math.min(1, t))
  switch (easing) {
    case 'ease_in':
      return clamped * clamped * clamped
    case 'ease_out':
      return 1 - Math.pow(1 - clamped, 3)
    case 'ease_in_out':
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2
    case 'bounce': {
      const n1 = 7.5625
      const d1 = 2.75
      let x = clamped
      if (x < 1 / d1) {
        return n1 * x * x
      } else if (x < 2 / d1) {
        x -= 1.5 / d1
        return n1 * x * x + 0.75
      } else if (x < 2.5 / d1) {
        x -= 2.25 / d1
        return n1 * x * x + 0.9375
      } else {
        x -= 2.625 / d1
        return n1 * x * x + 0.984375
      }
    }
    case 'linear':
    default:
      return clamped
  }
}

/**
 * Evaluates instantaneous playback speed at normalized clip time u in [0..1]
 */
export function evaluateSpeedAtNormalizedTime(
  speed: SpeedConfig,
  u: number
): number {
  if (speed.mode === 'normal') {
    return Math.max(0.1, Math.min(10, speed.normalSpeed))
  }
  const pts = speed.curvePoints
  if (!pts || pts.length === 0) return 1
  const clampedU = Math.max(0, Math.min(1, u))
  if (clampedU <= pts[0].t) return pts[0].speed
  if (clampedU >= pts[pts.length - 1].t) return pts[pts.length - 1].speed

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]
    const p1 = pts[i + 1]
    if (clampedU >= p0.t && clampedU <= p1.t) {
      const span = Math.max(0.0001, p1.t - p0.t)
      const localT = (clampedU - p0.t) / span
      // Smooth Hermite cubic interpolation (Catmull-Rom style tangents)
      const smoothT = localT * localT * (3 - 2 * localT)
      return Math.max(
        0.1,
        Math.min(10, p0.speed + (p1.speed - p0.speed) * smoothT)
      )
    }
  }
  return 1
}

/**
 * Integrates the speed curve from clip start (0) to localTime (0..clip.duration)
 * using trapezoidal numerical integration so variable-speed ramps map accurately to source video time.
 */
export function computeRemappedSourceTime(
  clip: TimelineClip,
  timelineTime: number
): number {
  if (clip.isFrozen && typeof clip.frozenSourceTime === 'number') {
    return clip.frozenSourceTime
  }
  const localTime = Math.max(0, Math.min(clip.duration, timelineTime - clip.startTime))
  if (clip.speed.mode === 'normal') {
    const mapped = clip.sourceStartOffset + localTime * clip.speed.normalSpeed
    return Math.min(clip.sourceDuration, Math.max(0, mapped))
  }

  const steps = 24
  const uEnd = clip.duration > 0 ? localTime / clip.duration : 0
  const du = uEnd / steps
  let integral = 0
  for (let i = 0; i < steps; i++) {
    const u0 = i * du
    const u1 = (i + 1) * du
    const s0 = evaluateSpeedAtNormalizedTime(clip.speed, u0)
    const s1 = evaluateSpeedAtNormalizedTime(clip.speed, u1)
    integral += 0.5 * (s0 + s1) * du * clip.duration
  }
  return Math.min(
    clip.sourceDuration,
    Math.max(0, clip.sourceStartOffset + integral)
  )
}

/**
 * Resolves the active visual clip (video, pip, adjustment) for color grading, filters, and quality shaders,
 * guaranteeing audio or non-visual clips never hijack visual editing drawers.
 */
export function resolveVisualTargetClip(
  clips: TimelineClip[],
  selectedClipId: string | null,
  playheadTime: number
): TimelineClip | null {
  // 1. If user explicitly selected a visual clip (video, pip, or adjustment), check it
  if (selectedClipId) {
    const sel = clips.find((c) => c.id === selectedClipId)
    if (
      sel &&
      (sel.trackType === 'video' ||
        sel.trackType === 'pip' ||
        sel.trackType === 'adjustment')
    ) {
      return sel
    }
  }

  // 2. Active video clip under the playhead
  const activeVideo = clips.find(
    (c) =>
      c.trackType === 'video' &&
      playheadTime >= c.startTime &&
      playheadTime <= c.startTime + c.duration
  )
  if (activeVideo) return activeVideo

  // 3. Active adjustment layer at playheadTime
  const activeAdj = clips.find(
    (c) =>
      c.trackType === 'adjustment' &&
      playheadTime >= c.startTime &&
      playheadTime <= c.startTime + c.duration
  )
  if (activeAdj) return activeAdj

  // 4. Active PIP clip at playheadTime
  const activePip = clips.find(
    (c) =>
      c.trackType === 'pip' &&
      playheadTime >= c.startTime &&
      playheadTime <= c.startTime + c.duration
  )
  if (activePip) return activePip

  // 5. Fallback to first video clip, adjustment clip, or pip clip
  return (
    clips.find((c) => c.trackType === 'video') ??
    clips.find((c) => c.trackType === 'adjustment') ??
    clips.find((c) => c.trackType === 'pip') ??
    null
  )
}

/**
 * Computes interpolated transform, opacity, and filterIntensity for a clip at timelineTime,
 * combining Keyframes (♦) + Entry/Exit/Combo Animations.
 */
export function getInterpolatedClipProps(
  clip: TimelineClip,
  timelineTime: number
): {
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
  filterIntensity: number
} {
  const localTime = Math.max(0, Math.min(clip.duration, timelineTime - clip.startTime))

  let x = clip.transform.x
  let y = clip.transform.y
  let scale = clip.transform.scale
  let rotation = clip.transform.rotation
  let opacity = clip.opacity
  let filterIntensity = clip.filterIntensity

  if (clip.keyframes.length > 0) {
    const sorted = [...clip.keyframes].sort((a, b) => a.timeOffset - b.timeOffset)
    if (localTime <= sorted[0].timeOffset) {
      const k = sorted[0]
      x = k.x
      y = k.y
      scale = k.scale
      rotation = k.rotation
      opacity = k.opacity
      filterIntensity = k.filterIntensity
    } else if (localTime >= sorted[sorted.length - 1].timeOffset) {
      const k = sorted[sorted.length - 1]
      x = k.x
      y = k.y
      scale = k.scale
      rotation = k.rotation
      opacity = k.opacity
      filterIntensity = k.filterIntensity
    } else {
      for (let i = 0; i < sorted.length - 1; i++) {
        const k0 = sorted[i]
        const k1 = sorted[i + 1]
        if (localTime >= k0.timeOffset && localTime <= k1.timeOffset) {
          const span = Math.max(0.0001, k1.timeOffset - k0.timeOffset)
          const rawT = (localTime - k0.timeOffset) / span
          const e = evaluateEasing(rawT, k1.easing)
          x = k0.x + (k1.x - k0.x) * e
          y = k0.y + (k1.y - k0.y) * e
          scale = k0.scale + (k1.scale - k0.scale) * e
          rotation = k0.rotation + (k1.rotation - k0.rotation) * e
          opacity = k0.opacity + (k1.opacity - k0.opacity) * e
          filterIntensity =
            k0.filterIntensity + (k1.filterIntensity - k0.filterIntensity) * e
          break
        }
      }
    }
  }

  // Apply Entry Animation
  const { inType, inDuration, outType, outDuration, comboType } = clip.animation
  if (inType !== 'none' && inDuration > 0 && localTime < inDuration) {
    const p = evaluateEasing(localTime / inDuration, 'ease_out')
    if (inType === 'fade') opacity *= p
    if (inType === 'zoom_in') {
      scale *= 0.4 + 0.6 * p
      opacity *= p
    }
    if (inType === 'zoom_out') {
      scale *= 1.6 - 0.6 * p
      opacity *= p
    }
    if (inType === 'slide_up') {
      y += (1 - p) * 0.45
      opacity *= p
    }
    if (inType === 'slide_left') {
      x += (1 - p) * 0.55
      opacity *= p
    }
    if (inType === 'spin') {
      rotation += (1 - p) * -180
      scale *= 0.3 + 0.7 * p
      opacity *= p
    }
    if (inType === 'bounce_pop') {
      const b = evaluateEasing(localTime / inDuration, 'bounce')
      scale *= 0.2 + 0.8 * b
      opacity *= Math.min(1, (localTime / inDuration) * 2)
    }
  }

  // Apply Exit Animation
  const timeRemaining = clip.duration - localTime
  if (outType !== 'none' && outDuration > 0 && timeRemaining < outDuration) {
    const p = evaluateEasing(timeRemaining / outDuration, 'ease_in')
    if (outType === 'fade') opacity *= p
    if (outType === 'zoom_in') {
      scale *= 1 + (1 - p) * 0.65
      opacity *= p
    }
    if (outType === 'zoom_out') {
      scale *= 0.3 + 0.7 * p
      opacity *= p
    }
    if (outType === 'slide_up') {
      y -= (1 - p) * 0.45
      opacity *= p
    }
    if (outType === 'slide_left') {
      x -= (1 - p) * 0.55
      opacity *= p
    }
    if (outType === 'spin') {
      rotation += (1 - p) * 180
      scale *= p
      opacity *= p
    }
  }

  // Apply Combo Animation
  if (comboType === 'pendulum') {
    rotation += Math.sin(localTime * Math.PI * 2.2) * 5.5
    scale *= 1 + Math.sin(localTime * Math.PI * 4.4) * 0.03
  } else if (comboType === 'bounce_pop') {
    scale *= 1 + Math.abs(Math.sin(localTime * Math.PI * 3.0)) * 0.06
  }

  return { x, y, scale, rotation, opacity, filterIntensity }
}

export interface EditorState {
  projectName: string
  tracks: TimelineTrack[]
  clips: TimelineClip[]
  selectedClipId: string | null
  playheadTime: number
  isPlaying: boolean
  timelineZoom: number // 10 to 300 px/sec
  aspectRatio: AspectRatio
  canvasBackground: CanvasBackgroundConfig
  socialSafeZone: SocialSafeZoneMode
  showHistogram: boolean
  histogramData: HistogramData
  activeDrawer: ActiveDrawerType
  isAudioExtractorOpen: boolean
  isExportModalOpen: boolean
  exportConfig: ExportConfig
  snapGuides: SnapGuideState
  audioUnlocked: boolean
  past: EditorSnapshot[]
  future: EditorSnapshot[]

  // Actions
  setProjectName: (name: string) => void
  resetProjectToDemo: () => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  setPlayhead: (time: number, snapToMarkers?: boolean) => void
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
  setTimelineZoom: (pxPerSec: number) => void
  selectClip: (clipId: string | null) => void
  setActiveDrawer: (drawer: ActiveDrawerType) => void
  setSocialSafeZone: (mode: SocialSafeZoneMode) => void
  setShowHistogram: (show: boolean) => void
  setHistogramData: (data: HistogramData) => void
  setAspectRatio: (ratio: AspectRatio) => void
  setCanvasBackground: (patch: Partial<CanvasBackgroundConfig>) => void
  setAudioExtractorOpen: (open: boolean) => void
  setExportModalOpen: (open: boolean) => void
  setExportConfig: (patch: Partial<ExportConfig>) => void
  setSnapGuides: (patch: Partial<SnapGuideState>) => void
  setAudioUnlocked: (unlocked: boolean) => void
  toggleTrackMute: (trackId: string) => void
  toggleTrackVisibility: (trackId: string) => void

  // Clip Editing Operations
  getTotalDuration: () => number
  getSelectedClip: () => TimelineClip | null
  hasKeyframeAtPlayhead: (clipId?: string | null) => boolean
  toggleKeyframeAtPlayhead: () => void
  splitSelectedClip: () => void
  deleteSelectedClip: () => void
  duplicateSelectedClip: () => void
  freezeSelectedClip: () => void
  extractAudioFromSelectedClip: () => TimelineClip | null
  addMediaClip: (params: {
    trackType: TrackType
    name: string
    mediaUrl: string
    mediaBlobId?: string
    sourceDuration: number
    thumbnails?: string[]
    waveform?: number[]
    beatMarkers?: number[]
    startTime?: number
  }) => TimelineClip
  addTextClip: (text?: string, isSticker?: boolean) => TimelineClip
  addAdjustmentClip: () => TimelineClip
  updateClip: (
    clipId: string,
    patch: Partial<TimelineClip>,
    recordHistory?: boolean
  ) => void
  updateSelectedClip: (
    patch: Partial<TimelineClip>,
    recordHistory?: boolean
  ) => void
  moveClipOnTimeline: (
    clipId: string,
    newStartTime: number,
    recordHistory?: boolean
  ) => void
  trimClipOnTimeline: (
    clipId: string,
    edge: 'start' | 'end',
    deltaSec: number,
    recordHistory?: boolean
  ) => void
  updateClipTransform: (
    clipId: string,
    patch: Partial<ClipTransform>,
    recordHistory?: boolean
  ) => void
  updateClipColorGrading: (
    clipId: string,
    patch: Partial<ColorGradingConfig>
  ) => void
  resetClipColorGrading: (clipId: string) => void
  updateClipQualityEnhancer: (
    clipId: string,
    patch: Partial<QualityEnhancerConfig>
  ) => void
  updateClipSpeed: (clipId: string, patch: Partial<SpeedConfig>) => void
  applySpeedPreset: (clipId: string, presetId: SpeedCurvePresetId) => void
  updateClipMask: (clipId: string, patch: Partial<MaskConfig>) => void
  updateClipChromaKey: (clipId: string, patch: Partial<ChromaKeyConfig>) => void
  updateClipBlendMode: (clipId: string, blendMode: BlendMode) => void
  updateClipAnimation: (
    clipId: string,
    patch: Partial<ClipAnimationConfig>
  ) => void
  updateClipAudioFX: (clipId: string, patch: Partial<AudioFXConfig>) => void
  updateClipTextStyle: (clipId: string, patch: Partial<TextStyleConfig>) => void
  setClipTransition: (clipId: string, transition: ClipTransition) => void
}

const MAX_HISTORY_STEPS = 50

const INITIAL_HISTOGRAM: HistogramData = {
  r: new Array(64).fill(0.15),
  g: new Array(64).fill(0.18),
  b: new Array(64).fill(0.22),
  luma: new Array(64).fill(0.2),
  shadowsClippedPct: 0.4,
  highlightsClippedPct: 0.2,
  avgIRE: 48,
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectName: 'Reel_Master_Pro',
  tracks: INITIAL_TRACKS.map((t) => ({ ...t })),
  clips: createInitialClips(),
  selectedClipId: null,
  playheadTime: 0,
  isPlaying: false,
  timelineZoom: 64, // px per second
  aspectRatio: '9:16',
  canvasBackground: {
    mode: 'blur',
    blurLevel: 3,
    solidColor: '#09090B',
    gradientId: 'cyber_night',
    gradientColors: ['#09090B', '#1A103C'],
  },
  socialSafeZone: 'none',
  showHistogram: false,
  histogramData: INITIAL_HISTOGRAM,
  activeDrawer: 'none',
  isAudioExtractorOpen: false,
  isExportModalOpen: false,
  exportConfig: {
    preset: 'whatsapp_antihd',
    resolution: '1080p',
    fps: 30,
    whatsappAntiCompression: true,
    storySliceMode: 'whatsapp_30s',
    targetMaxSizeMB: 15.0,
  },
  snapGuides: {
    snapCenterX: false,
    snapCenterY: false,
    snapThirdsX: null,
    snapThirdsY: null,
    snapTimelineBeatTime: null,
  },
  audioUnlocked: false,
  past: [],
  future: [],

  setProjectName: (projectName) => set({ projectName }),

  resetProjectToDemo: () => {
    get().pushHistory()
    set({
      tracks: INITIAL_TRACKS.map((t) => ({ ...t })),
      clips: createInitialClips(),
      selectedClipId: null,
      playheadTime: 0,
      isPlaying: false,
      activeDrawer: 'none',
    })
  },

  pushHistory: () => {
    const { clips, tracks, aspectRatio, canvasBackground, past } = get()
    const snapshot = cloneSnapshot(clips, tracks, aspectRatio, canvasBackground)
    const nextPast = [...past, snapshot].slice(-MAX_HISTORY_STEPS)
    set({ past: nextPast, future: [] })
  },

  undo: () => {
    const { past, future, clips, tracks, aspectRatio, canvasBackground } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    const currentSnapshot = cloneSnapshot(
      clips,
      tracks,
      aspectRatio,
      canvasBackground
    )
    set({
      clips: previous.clips,
      tracks: previous.tracks,
      aspectRatio: previous.aspectRatio,
      canvasBackground: previous.canvasBackground,
      past: past.slice(0, -1),
      future: [currentSnapshot, ...future].slice(0, MAX_HISTORY_STEPS),
    })
  },

  redo: () => {
    const { past, future, clips, tracks, aspectRatio, canvasBackground } = get()
    if (future.length === 0) return
    const next = future[0]
    const currentSnapshot = cloneSnapshot(
      clips,
      tracks,
      aspectRatio,
      canvasBackground
    )
    set({
      clips: next.clips,
      tracks: next.tracks,
      aspectRatio: next.aspectRatio,
      canvasBackground: next.canvasBackground,
      past: [...past, currentSnapshot].slice(-MAX_HISTORY_STEPS),
      future: future.slice(1),
    })
  },

  getTotalDuration: () => {
    const { clips } = get()
    if (clips.length === 0) return 10
    const maxEnd = clips.reduce(
      (acc, c) => Math.max(acc, c.startTime + c.duration),
      0
    )
    return Math.max(4, Number(maxEnd.toFixed(2)))
  },

  getSelectedClip: () => {
    const { clips, selectedClipId } = get()
    if (!selectedClipId) return null
    return clips.find((c) => c.id === selectedClipId) ?? null
  },

  setPlayhead: (time, snapToMarkers = false) => {
    const total = get().getTotalDuration()
    let clamped = Math.max(0, Math.min(total, time))
    let snappedBeat: number | null = null

    if (snapToMarkers) {
      const { clips, timelineZoom } = get()
      const snapThresholdSec = Math.min(0.12, 8 / timelineZoom)

      // Collect beat markers and clip boundaries
      const snapTargets: number[] = [0, total]
      for (const clip of clips) {
        snapTargets.push(clip.startTime)
        snapTargets.push(clip.startTime + clip.duration)
        if (clip.audioFX.beatMarkers.length > 0) {
          for (const bm of clip.audioFX.beatMarkers) {
            const absBeat = clip.startTime + (bm - clip.sourceStartOffset)
            if (
              absBeat >= clip.startTime &&
              absBeat <= clip.startTime + clip.duration
            ) {
              snapTargets.push(absBeat)
            }
          }
        }
      }

      for (const target of snapTargets) {
        if (Math.abs(clamped - target) <= snapThresholdSec) {
          clamped = target
          snappedBeat = target
          break
        }
      }
    }

    set((state) => ({
      playheadTime: Number(clamped.toFixed(4)),
      snapGuides: {
        ...state.snapGuides,
        snapTimelineBeatTime: snappedBeat,
      },
    }))
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => {
    const { isPlaying, playheadTime, getTotalDuration } = get()
    const total = getTotalDuration()
    if (!isPlaying && playheadTime >= total - 0.05) {
      set({ playheadTime: 0, isPlaying: true })
    } else {
      set({ isPlaying: !isPlaying })
    }
  },

  setTimelineZoom: (pxPerSec) =>
    set({
      timelineZoom: Math.max(10, Math.min(300, Math.round(pxPerSec))),
    }),

  selectClip: (clipId) => {
    set({
      selectedClipId: clipId,
      activeDrawer: 'none',
    })
  },

  setActiveDrawer: (activeDrawer) => set({ activeDrawer }),

  setSocialSafeZone: (socialSafeZone) => set({ socialSafeZone }),

  setShowHistogram: (showHistogram) => set({ showHistogram }),

  setHistogramData: (histogramData) => set({ histogramData }),

  setAspectRatio: (aspectRatio) => {
    get().pushHistory()
    set({ aspectRatio })
  },

  setCanvasBackground: (patch) => {
    get().pushHistory()
    set((state) => ({
      canvasBackground: { ...state.canvasBackground, ...patch },
    }))
  },

  setAudioExtractorOpen: (isAudioExtractorOpen) =>
    set({ isAudioExtractorOpen }),

  setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),

  setExportConfig: (patch) =>
    set((state) => ({
      exportConfig: { ...state.exportConfig, ...patch },
    })),

  setSnapGuides: (patch) =>
    set((state) => ({
      snapGuides: { ...state.snapGuides, ...patch },
    })),

  setAudioUnlocked: (audioUnlocked) => set({ audioUnlocked }),

  toggleTrackMute: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      ),
    })),

  toggleTrackVisibility: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, visible: !t.visible } : t
      ),
    })),

  hasKeyframeAtPlayhead: (clipId) => {
    const { clips, selectedClipId, playheadTime } = get()
    const targetId = clipId ?? selectedClipId
    if (!targetId) return false
    const clip = clips.find((c) => c.id === targetId)
    if (!clip) return false
    const localTime = playheadTime - clip.startTime
    if (localTime < -0.05 || localTime > clip.duration + 0.05) return false
    return clip.keyframes.some((kf) => Math.abs(kf.timeOffset - localTime) <= 0.08)
  },

  toggleKeyframeAtPlayhead: () => {
    const { selectedClipId, clips, playheadTime } = get()
    if (!selectedClipId) return
    const clip = clips.find((c) => c.id === selectedClipId)
    if (!clip) return

    const localTime = Math.max(
      0,
      Math.min(clip.duration, playheadTime - clip.startTime)
    )
    get().pushHistory()

    const existingIdx = clip.keyframes.findIndex(
      (kf) => Math.abs(kf.timeOffset - localTime) <= 0.08
    )

    if (existingIdx !== -1) {
      // Remove keyframe (♦-)
      const updated = clip.keyframes.filter((_, i) => i !== existingIdx)
      set({
        clips: clips.map((c) =>
          c.id === clip.id ? { ...c, keyframes: updated } : c
        ),
      })
    } else {
      // Add keyframe (♦+) capturing current interpolated state
      const props = getInterpolatedClipProps(clip, playheadTime)
      const newKf: ClipKeyframe = {
        id: `kf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timeOffset: Number(localTime.toFixed(3)),
        x: props.x,
        y: props.y,
        scale: props.scale,
        rotation: props.rotation,
        opacity: props.opacity,
        filterIntensity: props.filterIntensity,
        easing: 'ease_in_out',
      }
      set({
        clips: clips.map((c) =>
          c.id === clip.id
            ? {
                ...c,
                keyframes: [...c.keyframes, newKf].sort(
                  (a, b) => a.timeOffset - b.timeOffset
                ),
              }
            : c
        ),
      })
    }
  },

  splitSelectedClip: () => {
    const { selectedClipId, clips, playheadTime } = get()
    if (!selectedClipId) return
    const clip = clips.find((c) => c.id === selectedClipId)
    if (!clip) return

    const splitOffset = playheadTime - clip.startTime
    if (splitOffset <= 0.15 || splitOffset >= clip.duration - 0.15) {
      return
    }

    get().pushHistory()

    const firstDuration = Number(splitOffset.toFixed(3))
    const secondDuration = Number((clip.duration - splitOffset).toFixed(3))
    const secondSourceStart = computeRemappedSourceTime(clip, playheadTime)

    const leftKeyframes = clip.keyframes.filter(
      (kf) => kf.timeOffset <= firstDuration
    )
    const rightKeyframes = clip.keyframes
      .filter((kf) => kf.timeOffset > firstDuration)
      .map((kf) => ({
        ...kf,
        id: `kf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timeOffset: Number((kf.timeOffset - firstDuration).toFixed(3)),
      }))

    const leftClip: TimelineClip = {
      ...JSON.parse(JSON.stringify(clip)),
      duration: firstDuration,
      keyframes: leftKeyframes,
    }

    const rightClipId = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const rightClip: TimelineClip = {
      ...JSON.parse(JSON.stringify(clip)),
      id: rightClipId,
      name: `${clip.name} (2)`,
      startTime: Number((clip.startTime + firstDuration).toFixed(3)),
      duration: secondDuration,
      sourceStartOffset: Number(secondSourceStart.toFixed(3)),
      transitionIn: { type: 'none', duration: 0.4 },
      keyframes: rightKeyframes,
    }

    set({
      clips: clips.flatMap((c) =>
        c.id === clip.id ? [leftClip, rightClip] : [c]
      ),
      selectedClipId: rightClipId,
    })
  },

  deleteSelectedClip: () => {
    const { selectedClipId, clips } = get()
    if (!selectedClipId) return
    const target = clips.find((c) => c.id === selectedClipId)
    if (!target) return

    get().pushHistory()

    let remaining = clips.filter((c) => c.id !== selectedClipId)

    // Magnetic ripple on main video track
    if (target.trackType === 'video') {
      const videoClips = remaining
        .filter((c) => c.trackType === 'video')
        .sort((a, b) => a.startTime - b.startTime)

      let cursor = 0
      const rippledIds = new Map<string, number>()
      for (const vc of videoClips) {
        rippledIds.set(vc.id, Number(cursor.toFixed(3)))
        cursor += vc.duration
      }

      remaining = remaining.map((c) =>
        rippledIds.has(c.id) ? { ...c, startTime: rippledIds.get(c.id)! } : c
      )
    }

    set({
      clips: remaining,
      selectedClipId: null,
      activeDrawer: 'none',
    })
  },

  duplicateSelectedClip: () => {
    const { selectedClipId, clips } = get()
    if (!selectedClipId) return
    const target = clips.find((c) => c.id === selectedClipId)
    if (!target) return

    get().pushHistory()
    const newId = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const insertStart = Number((target.startTime + target.duration).toFixed(3))

    const duplicated: TimelineClip = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      name: `${target.name} (Copia)`,
      startTime: insertStart,
    }

    // If on main video track, shift subsequent main video clips right by target.duration
    const updatedClips = clips.map((c) => {
      if (
        target.trackType === 'video' &&
        c.trackType === 'video' &&
        c.startTime >= insertStart - 0.001
      ) {
        return {
          ...c,
          startTime: Number((c.startTime + target.duration).toFixed(3)),
        }
      }
      return c
    })

    set({
      clips: [...updatedClips, duplicated],
      selectedClipId: newId,
    })
  },

  freezeSelectedClip: () => {
    const { selectedClipId, clips, playheadTime } = get()
    const target =
      clips.find((c) => c.id === selectedClipId) ??
      clips.find(
        (c) =>
          c.trackType === 'video' &&
          playheadTime >= c.startTime &&
          playheadTime <= c.startTime + c.duration
      )
    if (!target || (target.trackType !== 'video' && target.trackType !== 'pip'))
      return

    get().pushHistory()
    const freezeDuration = 2.5
    const frozenSourceTime = computeRemappedSourceTime(target, playheadTime)
    const freezeId = `clip_freeze_${Date.now()}`

    const freezeClip: TimelineClip = {
      ...JSON.parse(JSON.stringify(target)),
      id: freezeId,
      name: `❄️ Congelado (${target.name})`,
      startTime: Number((target.startTime + target.duration).toFixed(3)),
      duration: freezeDuration,
      isFrozen: true,
      frozenSourceTime,
      keyframes: [],
      audioFX: { ...DEFAULT_AUDIO_FX, volume: 0, muted: true },
    }

    const updatedClips = clips.map((c) => {
      if (
        target.trackType === 'video' &&
        c.trackType === 'video' &&
        c.startTime >= freezeClip.startTime - 0.001
      ) {
        return {
          ...c,
          startTime: Number((c.startTime + freezeDuration).toFixed(3)),
        }
      }
      return c
    })

    set({
      clips: [...updatedClips, freezeClip],
      selectedClipId: freezeId,
    })
  },

  extractAudioFromSelectedClip: () => {
    const { selectedClipId, clips } = get()
    if (!selectedClipId) return null
    const target = clips.find((c) => c.id === selectedClipId)
    if (!target || (target.trackType !== 'video' && target.trackType !== 'pip'))
      return null

    get().pushHistory()
    const audioId = `clip_audio_${Date.now()}`
    const extractedClip: TimelineClip = {
      id: audioId,
      trackId: 'track_audio',
      trackType: 'audio',
      name: `🎵 Audio de ${target.name}`,
      mediaBlobId: target.mediaBlobId,
      mediaUrl: target.mediaUrl,
      sourceDuration: target.sourceDuration,
      startTime: target.startTime,
      duration: target.duration,
      sourceStartOffset: target.sourceStartOffset,
      isFrozen: false,
      thumbnails: [],
      waveform:
        target.waveform.length > 0
          ? [...target.waveform]
          : generateDemoWaveform(64, 9),
      opacity: 100,
      filterId: 'none',
      filterIntensity: 0,
      colorGrading: { ...DEFAULT_COLOR_GRADING },
      qualityEnhancer: { ...DEFAULT_QUALITY_ENHANCER },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: { ...DEFAULT_MASK },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'normal',
      animation: { ...DEFAULT_ANIMATION },
      transitionIn: { type: 'none', duration: 0.3 },
      keyframes: [],
      audioFX: {
        ...DEFAULT_AUDIO_FX,
        volume: target.audioFX.volume || 100,
        beatMarkers: generateDemoBeats(target.duration, 124),
      },
      transform: { ...DEFAULT_TRANSFORM },
    }

    // Mute original video clip to prevent double audio
    const updated = clips.map((c) =>
      c.id === target.id
        ? { ...c, audioFX: { ...c.audioFX, muted: true, volume: 0 } }
        : c
    )

    set({
      clips: [...updated, extractedClip],
      selectedClipId: audioId,
    })
    return extractedClip
  },

  addMediaClip: ({
    trackType,
    name,
    mediaUrl,
    mediaBlobId,
    sourceDuration,
    thumbnails = [],
    waveform = [],
    beatMarkers = [],
    startTime,
  }) => {
    const { clips, playheadTime, timelineZoom } = get()
    get().pushHistory()

    const trackIdMap: Record<TrackType, string> = {
      adjustment: 'track_adjustment',
      text: 'track_text',
      pip: 'track_pip',
      video: 'track_video',
      audio: 'track_audio',
    }

    let baseClips = clips
    // If importing a real video or audio track, replace initial demo placeholders so user media starts cleanly at 00:00:00
    const isRealMedia = !mediaUrl.startsWith('demo://')
    if (trackType === 'video' && isRealMedia) {
      const existingVideos = clips.filter((c) => c.trackType === 'video')
      const allDemoVideos =
        existingVideos.length > 0 &&
        existingVideos.every((c) => c.mediaUrl.startsWith('demo://'))
      if (allDemoVideos) {
        baseClips = clips.filter(
          (c) =>
            !c.mediaUrl.startsWith('demo://') &&
            c.mediaUrl !== 'text://main_title' &&
            c.mediaUrl !== 'adjustment://master_grade'
        )
      }
    } else if (trackType === 'audio' && isRealMedia) {
      const existingAudios = clips.filter((c) => c.trackType === 'audio')
      const allDemoAudios =
        existingAudios.length > 0 &&
        existingAudios.every((c) => c.mediaUrl.startsWith('demo://'))
      if (allDemoAudios) {
        baseClips = baseClips.filter((c) => !c.mediaUrl.startsWith('demo://'))
      }
    }

    let computedStart = startTime ?? playheadTime
    if (trackType === 'video' && startTime === undefined) {
      const videoClips = baseClips.filter((c) => c.trackType === 'video')
      computedStart = videoClips.reduce(
        (max, c) => Math.max(max, c.startTime + c.duration),
        0
      )
    }

    const duration = Math.max(1, Number(sourceDuration.toFixed(2)))
    const newId = `clip_${trackType}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`

    const newClip: TimelineClip = {
      id: newId,
      trackId: trackIdMap[trackType],
      trackType,
      name,
      mediaBlobId,
      mediaUrl,
      sourceDuration: duration,
      startTime: Number(computedStart.toFixed(2)),
      duration,
      sourceStartOffset: 0,
      isFrozen: false,
      thumbnails,
      waveform:
        waveform.length > 0 ? waveform : generateDemoWaveform(64, Date.now() % 10),
      opacity: 100,
      filterId: 'none',
      filterIntensity: 100,
      colorGrading: { ...DEFAULT_COLOR_GRADING },
      qualityEnhancer: { ...DEFAULT_QUALITY_ENHANCER },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: { ...DEFAULT_MASK },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'normal',
      animation: { ...DEFAULT_ANIMATION },
      transitionIn: { type: 'none', duration: 0.5 },
      keyframes: [],
      audioFX: {
        ...DEFAULT_AUDIO_FX,
        volume: 100,
        beatMarkers:
          beatMarkers.length > 0
            ? beatMarkers
            : trackType === 'audio'
              ? generateDemoBeats(duration, 125)
              : [],
      },
      transform: {
        ...DEFAULT_TRANSFORM,
        scale: trackType === 'pip' ? 0.5 : 1,
      },
    }

    // Automatically adjust zoom if a long video (1 min to 10+ min) is imported so it's easy to navigate
    let nextZoom = timelineZoom
    if (duration > 120) {
      nextZoom = Math.min(timelineZoom, 14)
    } else if (duration > 45) {
      nextZoom = Math.min(timelineZoom, 28)
    }

    const hasExistingVideo = baseClips.some((c) => c.trackType === 'video')
    const nextSelectedId =
      trackType === 'audio' && hasExistingVideo
        ? get().selectedClipId ?? baseClips.find((c) => c.trackType === 'video')?.id ?? newId
        : newId

    set({
      clips: [...baseClips, newClip],
      selectedClipId: nextSelectedId,
      playheadTime: Number(computedStart.toFixed(2)),
      isPlaying: false,
      timelineZoom: nextZoom,
    })
    return newClip
  },

  addTextClip: (text = 'NUEVO TEXTO PRO', isSticker = false) => {
    const { clips, playheadTime } = get()
    get().pushHistory()
    const newId = `clip_text_${Date.now()}`
    const newClip: TimelineClip = {
      id: newId,
      trackId: 'track_text',
      trackType: 'text',
      name: isSticker ? `Sticker: ${text}` : `Texto: ${text}`,
      mediaUrl: 'text://layer',
      sourceDuration: 4,
      startTime: Number(playheadTime.toFixed(2)),
      duration: 4,
      sourceStartOffset: 0,
      isFrozen: false,
      thumbnails: [],
      waveform: [],
      opacity: 100,
      filterId: 'none',
      filterIntensity: 100,
      colorGrading: { ...DEFAULT_COLOR_GRADING },
      qualityEnhancer: { ...DEFAULT_QUALITY_ENHANCER },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: { ...DEFAULT_MASK },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'normal',
      animation: { ...DEFAULT_ANIMATION, inType: 'bounce_pop', inDuration: 0.4 },
      transitionIn: { type: 'none', duration: 0.3 },
      keyframes: [],
      audioFX: { ...DEFAULT_AUDIO_FX, volume: 0, muted: true },
      transform: { ...DEFAULT_TRANSFORM, x: 0, y: 0, scale: 1 },
      textStyle: {
        text,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: isSticker ? 72 : 44,
        color: '#FFFFFF',
        strokeColor: isSticker ? 'transparent' : '#FE2C55',
        strokeWidth: isSticker ? 0 : 4,
        backgroundColor: isSticker ? 'transparent' : 'rgba(9, 9, 11, 0.6)',
        shadowBlur: 14,
        align: 'center',
        isSticker,
      },
    }

    set({
      clips: [...clips, newClip],
      selectedClipId: newId,
      activeDrawer: isSticker ? 'none' : 'text_edit',
    })
    return newClip
  },

  addAdjustmentClip: () => {
    const { clips, getTotalDuration } = get()
    get().pushHistory()
    const totalDur = Math.max(4, getTotalDuration())

    const existingAdj = clips.find((c) => c.trackType === 'adjustment')
    if (existingAdj) {
      set({
        clips: clips.map((c) =>
          c.id === existingAdj.id
            ? { ...c, startTime: 0, duration: Math.max(c.duration, totalDur) }
            : c
        ),
        selectedClipId: existingAdj.id,
        activeDrawer: 'quality_pro',
      })
      return existingAdj
    }

    const newId = `clip_adj_${Date.now()}`
    const newClip: TimelineClip = {
      id: newId,
      trackId: 'track_adjustment',
      trackType: 'adjustment',
      name: 'Capa de Ajuste Pro',
      mediaUrl: 'adjustment://layer',
      sourceDuration: totalDur,
      startTime: 0,
      duration: totalDur,
      sourceStartOffset: 0,
      isFrozen: false,
      thumbnails: [],
      waveform: [],
      opacity: 100,
      filterId: 'kodak_2383',
      filterIntensity: 65,
      colorGrading: {
        ...DEFAULT_COLOR_GRADING,
        contrast: 10,
        vibrance: 15,
      },
      qualityEnhancer: {
        enabled: true,
        casSharpen: 45,
        bilateralDenoise: 20,
        debandDither: 25,
        midtoneClarity: 30,
      },
      speed: {
        ...DEFAULT_SPEED,
        curvePoints: SPEED_CURVE_PRESETS.normal.points.map((p) => ({ ...p })),
      },
      mask: { ...DEFAULT_MASK },
      chromaKey: { ...DEFAULT_CHROMA_KEY },
      blendMode: 'normal',
      animation: { ...DEFAULT_ANIMATION },
      transitionIn: { type: 'none', duration: 0.3 },
      keyframes: [],
      audioFX: { ...DEFAULT_AUDIO_FX, volume: 0, muted: true },
      transform: { ...DEFAULT_TRANSFORM },
    }

    set({
      clips: [...clips, newClip],
      selectedClipId: newId,
      activeDrawer: 'quality_pro',
    })
    return newClip
  },

  updateClip: (clipId, patch, recordHistory = false) => {
    if (recordHistory) get().pushHistory()
    set((state) => ({
      clips: state.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
    }))
  },

  updateSelectedClip: (patch, recordHistory = false) => {
    const { selectedClipId } = get()
    if (!selectedClipId) return
    get().updateClip(selectedClipId, patch, recordHistory)
  },

  moveClipOnTimeline: (clipId, newStartTime, recordHistory = false) => {
    if (recordHistory) get().pushHistory()
    const { clips, timelineZoom } = get()
    const target = clips.find((c) => c.id === clipId)
    if (!target) return

    let snappedStart = Math.max(0, newStartTime)
    const snapThreshold = Math.min(0.14, 10 / timelineZoom)

    // Magnetic snap to beat markers and other clips
    for (const c of clips) {
      if (c.id === clipId) continue
      const edges = [c.startTime, c.startTime + c.duration]
      for (const edge of edges) {
        if (Math.abs(snappedStart - edge) <= snapThreshold) {
          snappedStart = edge
        } else if (
          Math.abs(snappedStart + target.duration - edge) <= snapThreshold
        ) {
          snappedStart = Math.max(0, edge - target.duration)
        }
      }
      for (const bm of c.audioFX.beatMarkers) {
        const absBeat = c.startTime + (bm - c.sourceStartOffset)
        if (Math.abs(snappedStart - absBeat) <= snapThreshold) {
          snappedStart = Math.max(0, absBeat)
          break
        }
      }
    }

    set({
      clips: clips.map((c) =>
        c.id === clipId
          ? { ...c, startTime: Number(snappedStart.toFixed(3)) }
          : c
      ),
    })
  },

  trimClipOnTimeline: (clipId, edge, deltaSec, recordHistory = false) => {
    if (recordHistory) get().pushHistory()
    set((state) => ({
      clips: state.clips.map((c) => {
        if (c.id !== clipId) return c
        if (edge === 'start') {
          const maxDelta = c.duration - 0.3
          const minDelta = -c.startTime
          const clampedDelta = Math.max(minDelta, Math.min(maxDelta, deltaSec))
          return {
            ...c,
            startTime: Number((c.startTime + clampedDelta).toFixed(3)),
            duration: Number((c.duration - clampedDelta).toFixed(3)),
            sourceStartOffset: Math.max(
              0,
              Number((c.sourceStartOffset + clampedDelta).toFixed(3))
            ),
          }
        } else {
          const newDur = Math.max(0.3, c.duration + deltaSec)
          return {
            ...c,
            duration: Number(newDur.toFixed(3)),
          }
        }
      }),
    }))
  },

  updateClipTransform: (clipId, patch, recordHistory = false) => {
    if (recordHistory) get().pushHistory()
    const { playheadTime } = get()
    set((state) => ({
      clips: state.clips.map((c) => {
        if (c.id !== clipId) return c
        const nextTransform = { ...c.transform, ...patch }

        // If clip already has keyframes, update or insert keyframe at playhead
        let nextKeyframes = c.keyframes
        if (c.keyframes.length > 0) {
          const localT = Math.max(
            0,
            Math.min(c.duration, playheadTime - c.startTime)
          )
          const idx = c.keyframes.findIndex(
            (kf) => Math.abs(kf.timeOffset - localT) <= 0.08
          )
          if (idx !== -1) {
            nextKeyframes = c.keyframes.map((kf, i) =>
              i === idx
                ? {
                    ...kf,
                    x: nextTransform.x,
                    y: nextTransform.y,
                    scale: nextTransform.scale,
                    rotation: nextTransform.rotation,
                  }
                : kf
            )
          }
        }

        return {
          ...c,
          transform: nextTransform,
          keyframes: nextKeyframes,
        }
      }),
    }))
  },

  updateClipColorGrading: (clipId, patch) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? { ...c, colorGrading: { ...c.colorGrading, ...patch } }
          : c
      ),
    }))
  },

  resetClipColorGrading: (clipId) => {
    get().pushHistory()
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? { ...c, colorGrading: { ...DEFAULT_COLOR_GRADING } }
          : c
      ),
    }))
  },

  updateClipQualityEnhancer: (clipId, patch) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? { ...c, qualityEnhancer: { ...c.qualityEnhancer, ...patch } }
          : c
      ),
    }))
  },

  updateClipSpeed: (clipId, patch) => {
    set((state) => ({
      clips: state.clips.map((c) => {
        if (c.id !== clipId) return c
        const nextSpeed = { ...c.speed, ...patch }
        return { ...c, speed: nextSpeed }
      }),
    }))
  },

  applySpeedPreset: (clipId, presetId) => {
    get().pushHistory()
    const preset = SPEED_CURVE_PRESETS[presetId]
    if (!preset) return
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              speed: {
                ...c.speed,
                mode: 'curve',
                curvePreset: presetId,
                curvePoints: preset.points.map((p) => ({ ...p })),
              },
            }
          : c
      ),
    }))
  },

  updateClipMask: (clipId, patch) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId ? { ...c, mask: { ...c.mask, ...patch } } : c
      ),
    }))
  },

  updateClipChromaKey: (clipId, patch) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? { ...c, chromaKey: { ...c.chromaKey, ...patch } }
          : c
      ),
    }))
  },

  updateClipBlendMode: (clipId, blendMode) => {
    get().pushHistory()
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId ? { ...c, blendMode } : c
      ),
    }))
  },

  updateClipAnimation: (clipId, patch) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? { ...c, animation: { ...c.animation, ...patch } }
          : c
      ),
    }))
  },

  updateClipAudioFX: (clipId, patch) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId ? { ...c, audioFX: { ...c.audioFX, ...patch } } : c
      ),
    }))
  },

  updateClipTextStyle: (clipId, patch) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId && c.textStyle
          ? { ...c, textStyle: { ...c.textStyle, ...patch } }
          : c
      ),
    }))
  },

  setClipTransition: (clipId, transitionIn) => {
    get().pushHistory()
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId ? { ...c, transitionIn } : c
      ),
    }))
  },
}))
