export type TrackType = 'adjustment' | 'text' | 'pip' | 'video' | 'audio'

export type SocialSafeZoneMode =
  | 'none'
  | 'ig_stories'
  | 'ig_reels'
  | 'whatsapp_status'
  | 'tiktok'

export type AspectRatio = '9:16' | '4:5' | '1:1' | '16:9' | '2.35:1'

export type CanvasBackgroundMode = 'blur' | 'solid' | 'gradient'

export interface CanvasBackgroundConfig {
  mode: CanvasBackgroundMode
  blurLevel: 1 | 2 | 3 | 4
  solidColor: string
  gradientId: string
  gradientColors: [string, string]
}

export interface QualityEnhancerConfig {
  enabled: boolean
  /** AMD FidelityFX CAS (Contrast Adaptive Sharpening) 0..100 */
  casSharpen: number
  /** Edge-Preserving Bilateral Denoiser 0..100 */
  bilateralDenoise: number
  /** Debanding Dither 0..100 */
  debandDither: number
  /** Midtone Punch / Clarity 0..100 */
  midtoneClarity: number
}

export interface ColorGradingConfig {
  exposure: number // -100..100
  contrast: number // -100..100
  brightness: number // -100..100
  highlights: number // -100..100
  shadows: number // -100..100
  whites: number // -100..100
  blacks: number // -100..100
  saturation: number // -100..100
  vibrance: number // -100..100 (Skin-tone protected)
  temperature: number // -100..100 (Cool / Warm)
  tint: number // -100..100 (Green / Magenta)
  sharpness: number // 0..100
  filmGrain: number // 0..100
  vignette: number // -100..100
  chromaticAberration: number // 0..100
  halation: number // 0..100 (Red cinema glow)
}

export type FilterCategory = 'cine' | 'lifestyle' | 'urbano' | 'retro' | 'bw'

export interface FilterPreset {
  id: string
  name: string
  category: FilterCategory
  categoryLabel: string
  description: string
  badgeColor: string
  /** 4x4 RGBA color matrix (16 floats, row-major) */
  matrix: number[]
  /** Shadow tint offset RGB (-0.2 .. 0.2) */
  lift: [number, number, number]
  /** Midtone gamma RGB (0.6 .. 1.5) */
  gamma: [number, number, number]
  /** Highlight multiplier RGB (0.7 .. 1.4) */
  gain: [number, number, number]
  contrast: number
  saturation: number
  scanlines?: number
  halation?: number
  grain?: number
}

export type SpeedCurvePresetId =
  | 'normal'
  | 'montaje'
  | 'heroe'
  | 'bala'
  | 'salto'
  | 'flash_in'
  | 'flash_out'
  | 'personalizado'

export interface SpeedCurvePoint {
  /** Normalized position in clip (0.0 to 1.0) */
  t: number
  /** Playback speed multiplier (0.1 to 10.0) */
  speed: number
}

export interface SpeedConfig {
  mode: 'normal' | 'curve'
  normalSpeed: number // 0.1 to 10.0
  keepPitch: boolean
  curvePreset: SpeedCurvePresetId
  curvePoints: SpeedCurvePoint[]
}

export type MaskShape =
  | 'none'
  | 'split'
  | 'mirror'
  | 'circle'
  | 'rectangle'
  | 'heart'
  | 'star'

export interface MaskConfig {
  shape: MaskShape
  /** Normalized X center (-1 to 1, 0 = center) */
  x: number
  /** Normalized Y center (-1 to 1, 0 = center) */
  y: number
  /** Width radius scale (0.05 to 2.0) */
  scaleX: number
  /** Height radius scale (0.05 to 2.0) */
  scaleY: number
  /** Rotation in degrees (-180 to 180) */
  rotation: number
  /** Soft edge feathering (0 to 100) */
  feather: number
  /** Invert mask region */
  invert: boolean
  /** Corner roundness for rectangle mask (0 to 100) */
  cornerRadius: number
}

export interface ChromaKeyConfig {
  enabled: boolean
  /** RGB normalized 0..1 */
  keyColor: [number, number, number]
  /** Color distance threshold (0..100) */
  similarity: number
  /** Edge softness (0..100) */
  smoothness: number
  /** Green/Blue spill desaturation (0..100) */
  spillSuppression: number
}

export type BlendMode =
  | 'normal'
  | 'screen'
  | 'multiply'
  | 'overlay'
  | 'soft-light'
  | 'lighten'

export type ClipAnimationType =
  | 'none'
  | 'fade'
  | 'zoom_in'
  | 'zoom_out'
  | 'slide_up'
  | 'slide_left'
  | 'spin'
  | 'bounce_pop'
  | 'pendulum'

export interface ClipAnimationConfig {
  inType: ClipAnimationType
  inDuration: number
  outType: ClipAnimationType
  outDuration: number
  comboType: ClipAnimationType
}

export type TransitionType =
  | 'none'
  | 'dissolve'
  | 'white_flash'
  | 'black_flash'
  | 'whip_zoom'
  | 'whip_pan'
  | 'digital_glitch'
  | 'directional_blur'

export interface ClipTransition {
  type: TransitionType
  duration: number // 0.2s to 2.0s
}

export type KeyframeEasing =
  | 'linear'
  | 'ease_in'
  | 'ease_out'
  | 'ease_in_out'
  | 'bounce'

export interface ClipKeyframe {
  id: string
  /** Seconds from the start of the clip (0 .. clip.duration) */
  timeOffset: number
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
  filterIntensity: number
  easing: KeyframeEasing
}

export type VoiceEffectPreset =
  | 'none'
  | 'deep_voice'
  | 'podcast_studio'
  | 'megaphone'
  | 'vintage_radio'
  | 'space_echo'

export interface AudioFXConfig {
  volume: number // 0 to 200 (%)
  muted: boolean
  fadeIn: number // seconds
  fadeOut: number // seconds
  /** Sidechain envelope (-12dB attenuation, 150ms attack, 400ms release when main voice speaks) */
  autoDucking: boolean
  /** Parametric 85Hz HPF + 3.5kHz Vocal Presence + 7.5kHz De-Esser + Compressor */
  voiceIsolate: boolean
  voiceEffect: VoiceEffectPreset
  /** Detected FFT sub-bass/kick onset timestamps (seconds relative to clip source start) */
  beatMarkers: number[]
}

export interface ClipTransform {
  x: number // -1 to 1 (0 is center)
  y: number // -1 to 1 (0 is center)
  scale: number // 0.1 to 5.0 (1 is 100%)
  rotation: number // degrees
  flipH: boolean
  flipV: boolean
  cropTop: number // 0..0.45
  cropBottom: number // 0..0.45
  cropLeft: number // 0..0.45
  cropRight: number // 0..0.45
}

export interface TextStyleConfig {
  text: string
  fontFamily: string
  fontSize: number
  color: string
  strokeColor: string
  strokeWidth: number
  backgroundColor: string
  shadowBlur: number
  align: 'left' | 'center' | 'right'
  isSticker?: boolean
}

export interface TimelineClip {
  id: string
  trackId: string
  trackType: TrackType
  name: string
  /** Key in OPFS / IndexedDB blob storage */
  mediaBlobId?: string
  /** Object URL or procedural generator identifier ('demo://cyberpunk', 'demo://sunset', etc.) */
  mediaUrl: string
  /** Original media file duration in seconds */
  sourceDuration: number
  /** Start time on the timeline in seconds */
  startTime: number
  /** Duration on the timeline in seconds */
  duration: number
  /** Trim offset inside the source media in seconds */
  sourceStartOffset: number
  /** Freeze frame state ('Congelar') */
  isFrozen: boolean
  frozenSourceTime?: number
  /** Filmstrip preview data URLs or procedural colors */
  thumbnails: string[]
  /** Normalized 0..1 audio waveform peaks */
  waveform: number[]
  /** Opacity 0..100 */
  opacity: number
  /** Active filter preset ID (from the 32 built-in filters, or 'none') */
  filterId: string
  /** Filter intensity 0..100 */
  filterIntensity: number
  colorGrading: ColorGradingConfig
  qualityEnhancer: QualityEnhancerConfig
  speed: SpeedConfig
  mask: MaskConfig
  chromaKey: ChromaKeyConfig
  blendMode: BlendMode
  animation: ClipAnimationConfig
  transitionIn: ClipTransition
  keyframes: ClipKeyframe[]
  audioFX: AudioFXConfig
  transform: ClipTransform
  textStyle?: TextStyleConfig
}

export interface TimelineTrack {
  id: string
  type: TrackType
  name: string
  shortLabel: string
  muted: boolean
  locked: boolean
  visible: boolean
}

export type ActiveDrawerType =
  | 'none'
  | 'speed'
  | 'filters'
  | 'adjust'
  | 'quality_pro'
  | 'mask'
  | 'chromakey'
  | 'blend'
  | 'transform'
  | 'animation'
  | 'audio_fx'
  | 'voice_fx'
  | 'text_edit'
  | 'aspect_ratio'
  | 'canvas_bg'
  | 'transition'
  | 'effects'

export type StorySliceMode = 'none' | 'whatsapp_30s' | 'ig_stories_60s'

export type ExportPresetId =
  | 'standard_1080p_60'
  | 'whatsapp_antihd'
  | 'ig_reels_pro'
  | 'ultra_4k_master'

export interface ExportConfig {
  preset: ExportPresetId
  resolution: '720p' | '1080p' | '4k'
  fps: 30 | 60
  whatsappAntiCompression: boolean
  storySliceMode: StorySliceMode
  targetMaxSizeMB: number
}

export interface ExportSegmentResult {
  index: number
  total: number
  fileName: string
  blob: Blob
  url: string
  durationSec: number
  sizeMB: number
}

export interface HistogramData {
  r: number[] // 64 bins normalized 0..1
  g: number[] // 64 bins normalized 0..1
  b: number[] // 64 bins normalized 0..1
  luma: number[] // 64 bins normalized 0..1
  shadowsClippedPct: number
  highlightsClippedPct: number
  avgIRE: number
}

export interface SnapGuideState {
  snapCenterX: boolean
  snapCenterY: boolean
  snapThirdsX: number | null // -0.333 or +0.333
  snapThirdsY: number | null // -0.333 or +0.333
  snapTimelineBeatTime: number | null
}
