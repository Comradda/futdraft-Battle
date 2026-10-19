import React, { useRef, useState } from 'react'
import {
  ChevronLeft,
  Copy,
  Cpu,
  Crop,
  Droplet,
  Film,
  FlipHorizontal,
  FlipVertical,
  Frame,
  Gauge,
  Image,
  Layers,
  Mic,
  Music,
  Palette,
  Pipette,
  Plus,
  Radio,
  RotateCcw,
  RotateCw,
  Scissors,
  Sliders,
  Smile,
  Snowflake,
  Sparkles,
  Square,
  Trash2,
  Type,
  Upload,
  Volume2,
  Wand2,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import { analyzeClipBeats } from '../engine/audioEngine'
import { DEFAULT_TRANSFORM, useEditorStore } from '../store/useEditorStore'
import type {
  AspectRatio,
  BlendMode,
  ClipAnimationType,
  MaskShape,
  TrackType,
  TransitionType,
  VoiceEffectPreset,
} from '../types/editor'
import { probeVideoFile, storeMediaBlob } from '../utils/opfsStorage'

const MASK_SHAPES: { id: MaskShape; label: string; icon: string }[] = [
  { id: 'none', label: 'Ninguna', icon: '⊘' },
  { id: 'split', label: 'Dividir', icon: '◧' },
  { id: 'mirror', label: 'Espejo', icon: '▤' },
  { id: 'circle', label: 'Círculo', icon: '◯' },
  { id: 'rectangle', label: 'Rectángulo', icon: '▭' },
  { id: 'heart', label: 'Corazón', icon: '♥' },
  { id: 'star', label: 'Estrella', icon: '★' },
]

const BLEND_MODES: { id: BlendMode; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'screen', label: 'Pantalla (Screen)' },
  { id: 'multiply', label: 'Multiplicar (Multiply)' },
  { id: 'overlay', label: 'Superponer (Overlay)' },
  { id: 'soft-light', label: 'Luz Suave (Soft Light)' },
  { id: 'lighten', label: 'Aclarar (Lighten)' },
]

const ANIMATION_PRESETS: { id: ClipAnimationType; label: string }[] = [
  { id: 'none', label: 'Ninguna' },
  { id: 'fade', label: 'Fundido' },
  { id: 'zoom_in', label: 'Zoom In' },
  { id: 'zoom_out', label: 'Zoom Out' },
  { id: 'slide_up', label: 'Deslizar Arriba' },
  { id: 'slide_left', label: 'Deslizar Izq' },
  { id: 'spin', label: 'Giro Spin' },
  { id: 'bounce_pop', label: 'Rebote Pop' },
  { id: 'pendulum', label: 'Péndulo' },
]

const TRANSITION_PRESETS: {
  id: TransitionType
  label: string
  badge: string
}[] = [
  { id: 'none', label: 'Ninguna', badge: 'Corte' },
  { id: 'dissolve', label: 'Disolver', badge: 'Suave' },
  { id: 'white_flash', label: 'Flash Blanco', badge: 'Estrob.' },
  { id: 'black_flash', label: 'Flash Negro', badge: 'Cine' },
  { id: 'whip_zoom', label: 'Zoom Rápido (Whip Zoom)', badge: 'Reels' },
  { id: 'whip_pan', label: 'Deslizar (Whip Pan)', badge: 'Veloz' },
  { id: 'digital_glitch', label: 'Glitch Digital', badge: 'RGB' },
  { id: 'directional_blur', label: 'Desenfoque Direccional', badge: 'Motion' },
]

const VOICE_FX_PRESETS: {
  id: VoiceEffectPreset
  label: string
  desc: string
}[] = [
  { id: 'none', label: 'Original', desc: 'Sin filtro vocal' },
  { id: 'deep_voice', label: 'Voz Profunda', desc: 'Sub-grave + Formante' },
  {
    id: 'podcast_studio',
    label: 'Estudio Podcast',
    desc: '120Hz Cuerpo + 3.8kHz Claridad',
  },
  { id: 'megaphone', label: 'Megáfono', desc: 'Banda estrecha + Overdrive' },
  { id: 'vintage_radio', label: 'Radio Vintage', desc: 'AM 1950 + Saturación' },
  { id: 'space_echo', label: 'Eco Espacial', desc: 'Delay 220ms Estéreo' },
]

const ASPECT_RATIO_OPTIONS: {
  id: AspectRatio
  label: string
  subtitle: string
}[] = [
  { id: '9:16', label: '9:16', subtitle: 'Historias / Reels / WhatsApp' },
  { id: '4:5', label: '4:5', subtitle: 'Feed Instagram Vertical' },
  { id: '1:1', label: '1:1', subtitle: 'Cuadrado Post' },
  { id: '16:9', label: '16:9', subtitle: 'YouTube / Horizontal' },
  { id: '2.35:1', label: '2.35:1', subtitle: 'Anamórfico Cine' },
]

const SOLID_COLORS = [
  '#09090B',
  '#18181B',
  '#1E1B4B',
  '#31102F',
  '#042F2E',
  '#450A0A',
  '#F4F4F6',
  '#00E5FF',
  '#FE2C55',
]

const GRADIENT_PRESETS: {
  id: string
  name: string
  colors: [string, string]
}[] = [
  { id: 'cyber_night', name: 'Cyber Night', colors: ['#09090B', '#1A103C'] },
  { id: 'neon_pulse', name: 'Neon Pulse', colors: ['#0F172A', '#00E5FF'] },
  { id: 'sunset_reels', name: 'Sunset Reels', colors: ['#4C0519', '#FE2C55'] },
  { id: 'emerald_glow', name: 'Emerald Glow', colors: ['#022C22', '#10B981'] },
  { id: 'amber_cinema', name: 'Amber Cinema', colors: ['#271202', '#F59E0B'] },
]

const QUICK_STICKERS = ['🔥', '🚀', '💎', '✨', '⚡', '💯', '🎬', '🎧']

function rgbToHex(rgb: [number, number, number]): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n * 255)))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`
}

function hexToRgbNormalized(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2) || '00', 16) / 255
  const g = parseInt(clean.slice(2, 4) || 'ff', 16) / 255
  const b = parseInt(clean.slice(4, 6) || '00', 16) / 255
  return [
    Number(r.toFixed(3)),
    Number(g.toFixed(3)),
    Number(b.toFixed(3)),
  ]
}

export const ContextualBottomDock: React.FC = () => {
  const clips = useEditorStore((s) => s.clips)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const activeDrawer = useEditorStore((s) => s.activeDrawer)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const canvasBackground = useEditorStore((s) => s.canvasBackground)

  const selectClip = useEditorStore((s) => s.selectClip)
  const setActiveDrawer = useEditorStore((s) => s.setActiveDrawer)
  const setAudioExtractorOpen = useEditorStore((s) => s.setAudioExtractorOpen)
  const splitSelectedClip = useEditorStore((s) => s.splitSelectedClip)
  const deleteSelectedClip = useEditorStore((s) => s.deleteSelectedClip)
  const duplicateSelectedClip = useEditorStore((s) => s.duplicateSelectedClip)
  const freezeSelectedClip = useEditorStore((s) => s.freezeSelectedClip)
  const extractAudioFromSelectedClip = useEditorStore(
    (s) => s.extractAudioFromSelectedClip
  )
  const addMediaClip = useEditorStore((s) => s.addMediaClip)
  const addTextClip = useEditorStore((s) => s.addTextClip)
  const addAdjustmentClip = useEditorStore((s) => s.addAdjustmentClip)
  const updateClip = useEditorStore((s) => s.updateClip)
  const updateClipMask = useEditorStore((s) => s.updateClipMask)
  const updateClipChromaKey = useEditorStore((s) => s.updateClipChromaKey)
  const updateClipBlendMode = useEditorStore((s) => s.updateClipBlendMode)
  const updateClipTransform = useEditorStore((s) => s.updateClipTransform)
  const updateClipAnimation = useEditorStore((s) => s.updateClipAnimation)
  const updateClipAudioFX = useEditorStore((s) => s.updateClipAudioFX)
  const updateClipTextStyle = useEditorStore((s) => s.updateClipTextStyle)
  const updateClipColorGrading = useEditorStore((s) => s.updateClipColorGrading)
  const setClipTransition = useEditorStore((s) => s.setClipTransition)
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio)
  const setCanvasBackground = useEditorStore((s) => s.setCanvasBackground)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingUploadTrack, setPendingUploadTrack] =
    useState<TrackType>('video')
  const [animTab, setAnimTab] = useState<'in' | 'out' | 'combo'>('in')
  const [beatAnalyzing, setBeatAnalyzing] = useState(false)

  const selectedClip = clips.find((c) => c.id === selectedClipId) ?? null
  const fallbackClip =
    selectedClip ??
    clips.find((c) => c.trackType === 'video') ??
    clips[0] ??
    null

  const triggerVideoUpload = (trackType: TrackType) => {
    setPendingUploadTrack(trackType)
    fileInputRef.current?.click()
  }

  const handleVideoFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const blobId = `media_${pendingUploadTrack}_${Date.now()}_${file.name}`
    const mediaUrl = await storeMediaBlob(blobId, file)
    const meta = await probeVideoFile(file, 6)

    addMediaClip({
      trackType: pendingUploadTrack,
      name: file.name,
      mediaUrl,
      mediaBlobId: blobId,
      sourceDuration: meta.duration,
      thumbnails: meta.thumbnails,
    })
  }

  const handleRunBeatDetection = async () => {
    if (!fallbackClip) return
    setBeatAnalyzing(true)
    try {
      const { beatMarkers } = await analyzeClipBeats(fallbackClip)
      pushHistory()
      updateClipAudioFX(fallbackClip.id, { beatMarkers })
    } finally {
      setBeatAnalyzing(false)
    }
  }

  const renderContextualSubDrawer = () => {
    if (
      activeDrawer === 'none' ||
      activeDrawer === 'speed' ||
      activeDrawer === 'filters' ||
      activeDrawer === 'adjust' ||
      activeDrawer === 'quality_pro'
    ) {
      return null
    }

    return (
      <div className="bg-[#18181B]/98 border-t border-white/10 px-3 py-2.5 text-[#F4F4F6] shadow-2xl backdrop-blur-xl">
        {/* Sub-Drawer Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00E5FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {activeDrawer === 'mask' && 'Máscara Geométrica SDF'}
              {activeDrawer === 'chromakey' && 'Chroma Key + Despill'}
              {activeDrawer === 'blend' && 'Modo de Fusión y Opacidad'}
              {activeDrawer === 'transform' && 'Transformar / Recortar'}
              {activeDrawer === 'animation' && 'Animación de Clip'}
              {activeDrawer === 'transition' && 'Transición GLSL entre Clips'}
              {activeDrawer === 'audio_fx' &&
                'Volumen, Fundido y Auto-Ducking'}
              {activeDrawer === 'voice_fx' && 'Efectos de Voz Estudio DSP'}
              {activeDrawer === 'text_edit' && 'Editor de Texto y Stickers'}
              {activeDrawer === 'aspect_ratio' && 'Formato de Lienzo Social'}
              {activeDrawer === 'canvas_bg' && 'Fondo del Lienzo (Canvas)'}
              {activeDrawer === 'effects' && 'Efectos Visuales y Capa de Ajuste'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveDrawer('none')}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. MASK SUB-DRAWER */}
        {activeDrawer === 'mask' && fallbackClip && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {MASK_SHAPES.map((m) => {
                const active = fallbackClip.mask.shape === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      pushHistory()
                      updateClipMask(fallbackClip.id, { shape: m.id })
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs shrink-0 transition ${
                      active
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white font-semibold'
                        : 'bg-[#09090B] border-white/10 text-[#8E8E98] hover:text-white'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                )
              })}
            </div>

            {fallbackClip.mask.shape !== 'none' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10">
                  <span className="text-[#8E8E98] w-24">Difuminado</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={fallbackClip.mask.feather}
                    onChange={(e) =>
                      updateClipMask(fallbackClip.id, {
                        feather: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-[#00E5FF]"
                  />
                  <span className="font-mono w-8 text-right">
                    {fallbackClip.mask.feather}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10">
                  <span className="text-[#8E8E98] w-24">Escala X/Y</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1.5}
                    step={0.02}
                    value={fallbackClip.mask.scaleX}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      updateClipMask(fallbackClip.id, { scaleX: v, scaleY: v })
                    }}
                    className="flex-1 accent-[#00E5FF]"
                  />
                  <span className="font-mono w-10 text-right">
                    {Math.round(fallbackClip.mask.scaleX * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10">
                  <span className="text-[#8E8E98] w-24">Rotación</span>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={fallbackClip.mask.rotation}
                    onChange={(e) =>
                      updateClipMask(fallbackClip.id, {
                        rotation: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-[#00E5FF]"
                  />
                  <span className="font-mono w-10 text-right">
                    {fallbackClip.mask.rotation}°
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10">
                  <span className="text-[#8E8E98]">Bordes / Invertir</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={fallbackClip.mask.cornerRadius}
                    onChange={(e) =>
                      updateClipMask(fallbackClip.id, {
                        cornerRadius: Number(e.target.value),
                      })
                    }
                    className="w-20 accent-[#00E5FF]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateClipMask(fallbackClip.id, {
                        invert: !fallbackClip.mask.invert,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      fallbackClip.mask.invert
                        ? 'bg-[#FE2C55] border-[#FE2C55] text-white'
                        : 'bg-white/5 border-white/10 text-[#8E8E98]'
                    }`}
                  >
                    Invertir
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. CHROMA KEY SUB-DRAWER */}
        {activeDrawer === 'chromakey' && fallbackClip && (
          <div className="space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  updateClipChromaKey(fallbackClip.id, {
                    enabled: !fallbackClip.chromaKey.enabled,
                  })
                }
                className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
                  fallbackClip.chromaKey.enabled
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-[#8E8E98]'
                }`}
              >
                Chroma Key: {fallbackClip.chromaKey.enabled ? 'ACTIVO' : 'OFF'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updateClipChromaKey(fallbackClip.id, {
                      enabled: true,
                      keyColor: [0.0, 0.85, 0.15],
                    })
                  }
                  className="px-2.5 py-1 rounded bg-emerald-600/30 border border-emerald-400/50 text-emerald-200 text-[11px]"
                >
                  Verde Chroma
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateClipChromaKey(fallbackClip.id, {
                      enabled: true,
                      keyColor: [0.05, 0.35, 0.95],
                    })
                  }
                  className="px-2.5 py-1 rounded bg-blue-600/30 border border-blue-400/50 text-blue-200 text-[11px]"
                >
                  Azul Chroma
                </button>
                <input
                  type="color"
                  value={rgbToHex(fallbackClip.chromaKey.keyColor)}
                  onChange={(e) =>
                    updateClipChromaKey(fallbackClip.id, {
                      enabled: true,
                      keyColor: hexToRgbNormalized(e.target.value),
                    })
                  }
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/20"
                  title="Color personalizado"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-[#8E8E98] w-20">Similitud</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fallbackClip.chromaKey.similarity}
                  onChange={(e) =>
                    updateClipChromaKey(fallbackClip.id, {
                      enabled: true,
                      similarity: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono w-8 text-right">
                  {fallbackClip.chromaKey.similarity}
                </span>
              </div>

              <div className="bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-[#8E8E98] w-20">Suavidad</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fallbackClip.chromaKey.smoothness}
                  onChange={(e) =>
                    updateClipChromaKey(fallbackClip.id, {
                      enabled: true,
                      smoothness: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono w-8 text-right">
                  {fallbackClip.chromaKey.smoothness}
                </span>
              </div>

              <div className="bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-[#8E8E98] w-20">Spill</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fallbackClip.chromaKey.spillSuppression}
                  onChange={(e) =>
                    updateClipChromaKey(fallbackClip.id, {
                      enabled: true,
                      spillSuppression: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono w-8 text-right">
                  {fallbackClip.chromaKey.spillSuppression}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. BLEND MODE & OPACITY SUB-DRAWER */}
        {activeDrawer === 'blend' && fallbackClip && (
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {BLEND_MODES.map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => updateClipBlendMode(fallbackClip.id, bm.id)}
                  className={`px-2.5 py-1.5 rounded-lg border shrink-0 transition ${
                    fallbackClip.blendMode === bm.id
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white font-semibold'
                      : 'bg-[#09090B] border-white/10 text-[#8E8E98] hover:text-white'
                  }`}
                >
                  {bm.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 bg-[#09090B] px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-[#8E8E98]">Opacidad</span>
              <input
                type="range"
                min={0}
                max={100}
                value={fallbackClip.opacity}
                onChange={(e) =>
                  updateClip(fallbackClip.id, {
                    opacity: Number(e.target.value),
                  })
                }
                className="flex-1 accent-[#00E5FF]"
              />
              <span className="font-mono text-[#00E5FF] w-10 text-right">
                {fallbackClip.opacity}%
              </span>
            </div>
          </div>
        )}

        {/* 4. TRANSFORM & CROP SUB-DRAWER */}
        {activeDrawer === 'transform' && fallbackClip && (
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  updateClipTransform(
                    fallbackClip.id,
                    { flipH: !fallbackClip.transform.flipH },
                    true
                  )
                }
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${
                  fallbackClip.transform.flipH
                    ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                    : 'bg-[#09090B] border-white/10 text-white'
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Espejo H</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateClipTransform(
                    fallbackClip.id,
                    { flipV: !fallbackClip.transform.flipV },
                    true
                  )
                }
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${
                  fallbackClip.transform.flipV
                    ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                    : 'bg-[#09090B] border-white/10 text-white'
                }`}
              >
                <FlipVertical className="w-3.5 h-3.5" />
                <span>Espejo V</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateClipTransform(
                    fallbackClip.id,
                    {
                      rotation: (fallbackClip.transform.rotation + 90) % 360,
                    },
                    true
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#09090B] border border-white/10 text-white"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotar +90°</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateClipTransform(
                    fallbackClip.id,
                    { ...DEFAULT_TRANSFORM },
                    true
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-[#8E8E98] hover:text-white ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10">
                <span className="text-[#8E8E98] w-16">Escala</span>
                <input
                  type="range"
                  min={0.1}
                  max={4.0}
                  step={0.05}
                  value={fallbackClip.transform.scale}
                  onChange={(e) =>
                    updateClipTransform(fallbackClip.id, {
                      scale: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono w-12 text-right">
                  {Math.round(fallbackClip.transform.scale * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2 bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10">
                <span className="text-[#8E8E98] w-16">Rotación</span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={fallbackClip.transform.rotation}
                  onChange={(e) =>
                    updateClipTransform(fallbackClip.id, {
                      rotation: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono w-12 text-right">
                  {Math.round(fallbackClip.transform.rotation)}°
                </span>
              </div>
            </div>

            {/* Crop Sliders */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(
                [
                  ['cropTop', 'Recorte Sup.'],
                  ['cropBottom', 'Recorte Inf.'],
                  ['cropLeft', 'Recorte Izq.'],
                  ['cropRight', 'Recorte Der.'],
                ] as const
              ).map(([cropKey, label]) => (
                <div
                  key={cropKey}
                  className="bg-[#09090B] px-2 py-1 rounded border border-white/10"
                >
                  <div className="flex justify-between text-[10px] text-[#8E8E98]">
                    <span>{label}</span>
                    <span className="font-mono text-white">
                      {Math.round(fallbackClip.transform[cropKey] * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.45}
                    step={0.01}
                    value={fallbackClip.transform[cropKey]}
                    onChange={(e) =>
                      updateClipTransform(fallbackClip.id, {
                        [cropKey]: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#00E5FF]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. ANIMATION SUB-DRAWER */}
        {activeDrawer === 'animation' && fallbackClip && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-1 bg-[#09090B] p-0.5 rounded-lg border border-white/10 w-fit">
              {(
                [
                  ['in', 'Entrada'],
                  ['out', 'Salida'],
                  ['combo', 'Combo'],
                ] as const
              ).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setAnimTab(tabId)}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition ${
                    animTab === tabId
                      ? 'bg-[#00E5FF] text-black'
                      : 'text-[#8E8E98] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {ANIMATION_PRESETS.map((preset) => {
                const currentType =
                  animTab === 'in'
                    ? fallbackClip.animation.inType
                    : animTab === 'out'
                      ? fallbackClip.animation.outType
                      : fallbackClip.animation.comboType
                const active = currentType === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      pushHistory()
                      if (animTab === 'in') {
                        updateClipAnimation(fallbackClip.id, {
                          inType: preset.id,
                        })
                      } else if (animTab === 'out') {
                        updateClipAnimation(fallbackClip.id, {
                          outType: preset.id,
                        })
                      } else {
                        updateClipAnimation(fallbackClip.id, {
                          comboType: preset.id,
                        })
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border shrink-0 transition ${
                      active
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white font-semibold'
                        : 'bg-[#09090B] border-white/10 text-[#8E8E98] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {animTab !== 'combo' && (
              <div className="flex items-center gap-3 bg-[#09090B] px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-[#8E8E98]">
                  Duración ({animTab === 'in' ? 'Entrada' : 'Salida'})
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={2.5}
                  step={0.05}
                  value={
                    animTab === 'in'
                      ? fallbackClip.animation.inDuration
                      : fallbackClip.animation.outDuration
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (animTab === 'in') {
                      updateClipAnimation(fallbackClip.id, { inDuration: val })
                    } else {
                      updateClipAnimation(fallbackClip.id, { outDuration: val })
                    }
                  }}
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono text-[#00E5FF] w-12 text-right">
                  {(animTab === 'in'
                    ? fallbackClip.animation.inDuration
                    : fallbackClip.animation.outDuration
                  ).toFixed(2)}
                  s
                </span>
              </div>
            )}
          </div>
        )}

        {/* 6. TRANSITION SUB-DRAWER */}
        {activeDrawer === 'transition' && fallbackClip && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {TRANSITION_PRESETS.map((tr) => {
                const active = fallbackClip.transitionIn.type === tr.id
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() =>
                      setClipTransition(fallbackClip.id, {
                        type: tr.id,
                        duration: fallbackClip.transitionIn.duration || 0.5,
                      })
                    }
                    className={`flex flex-col items-start px-2.5 py-1.5 rounded-lg border shrink-0 transition ${
                      active
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white font-semibold'
                        : 'bg-[#09090B] border-white/10 text-[#8E8E98] hover:text-white'
                    }`}
                  >
                    <span>{tr.label}</span>
                    <span className="text-[9px] font-mono text-[#00E5FF]">
                      {tr.badge}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-3 bg-[#09090B] px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-[#8E8E98]">Duración de Transición</span>
              <input
                type="range"
                min={0.2}
                max={2.0}
                step={0.05}
                value={fallbackClip.transitionIn.duration}
                onChange={(e) =>
                  setClipTransition(fallbackClip.id, {
                    type: fallbackClip.transitionIn.type,
                    duration: Number(e.target.value),
                  })
                }
                className="flex-1 accent-[#00E5FF]"
              />
              <span className="font-mono text-[#00E5FF] w-12 text-right">
                {fallbackClip.transitionIn.duration.toFixed(2)}s
              </span>
            </div>
          </div>
        )}

        {/* 7. AUDIO FX SUB-DRAWER */}
        {activeDrawer === 'audio_fx' && fallbackClip && (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-[#8E8E98] w-16">Volumen</span>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={fallbackClip.audioFX.volume}
                  onChange={(e) =>
                    updateClipAudioFX(fallbackClip.id, {
                      volume: Number(e.target.value),
                      muted: Number(e.target.value) === 0,
                    })
                  }
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono text-[#00E5FF] w-10 text-right">
                  {fallbackClip.audioFX.volume}%
                </span>
              </div>

              <div className="bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-[#8E8E98] w-16">Fade In</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={fallbackClip.audioFX.fadeIn}
                  onChange={(e) =>
                    updateClipAudioFX(fallbackClip.id, {
                      fadeIn: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono w-10 text-right">
                  {fallbackClip.audioFX.fadeIn.toFixed(1)}s
                </span>
              </div>

              <div className="bg-[#09090B] px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-[#8E8E98] w-16">Fade Out</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={fallbackClip.audioFX.fadeOut}
                  onChange={(e) =>
                    updateClipAudioFX(fallbackClip.id, {
                      fadeOut: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono w-10 text-right">
                  {fallbackClip.audioFX.fadeOut.toFixed(1)}s
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateClipAudioFX(fallbackClip.id, {
                    autoDucking: !fallbackClip.audioFX.autoDucking,
                  })
                }
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                  fallbackClip.audioFX.autoDucking
                    ? 'bg-[#FACC15]/20 border-[#FACC15] text-[#FACC15]'
                    : 'bg-white/5 border-white/10 text-[#8E8E98]'
                }`}
              >
                Auto-Ducking (-12dB Sidechain con Voz):{' '}
                {fallbackClip.audioFX.autoDucking ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() =>
                  updateClipAudioFX(fallbackClip.id, {
                    voiceIsolate: !fallbackClip.audioFX.voiceIsolate,
                  })
                }
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                  fallbackClip.audioFX.voiceIsolate
                    ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                    : 'bg-white/5 border-white/10 text-[#8E8E98]'
                }`}
              >
                Aislar Voz DSP (85Hz HPF + 3.5kHz + De-Esser):{' '}
                {fallbackClip.audioFX.voiceIsolate ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {/* 8. VOICE FX SUB-DRAWER */}
        {activeDrawer === 'voice_fx' && fallbackClip && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {VOICE_FX_PRESETS.map((vfx) => {
              const active = fallbackClip.audioFX.voiceEffect === vfx.id
              return (
                <button
                  key={vfx.id}
                  type="button"
                  onClick={() =>
                    updateClipAudioFX(fallbackClip.id, {
                      voiceEffect: vfx.id,
                    })
                  }
                  className={`flex flex-col items-start px-3 py-1.5 rounded-xl border shrink-0 transition ${
                    active
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white'
                      : 'bg-[#09090B] border-white/10 text-[#8E8E98] hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold">{vfx.label}</span>
                  <span className="text-[10px] text-[#00E5FF]">{vfx.desc}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* 9. TEXT & STICKER EDIT SUB-DRAWER */}
        {activeDrawer === 'text_edit' && fallbackClip && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fallbackClip.textStyle?.text ?? fallbackClip.name}
                onChange={(e) => {
                  updateClipTextStyle(fallbackClip.id, { text: e.target.value })
                  updateClip(fallbackClip.id, {
                    name: `Texto: ${e.target.value}`,
                  })
                }}
                placeholder="Escribe tu título para Reels..."
                className="flex-1 bg-[#09090B] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              />
              <input
                type="color"
                value={fallbackClip.textStyle?.color ?? '#FFFFFF'}
                onChange={(e) =>
                  updateClipTextStyle(fallbackClip.id, {
                    color: e.target.value,
                  })
                }
                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/20"
                title="Color de texto"
              />
              <input
                type="color"
                value={
                  fallbackClip.textStyle?.strokeColor &&
                  fallbackClip.textStyle.strokeColor !== 'transparent'
                    ? fallbackClip.textStyle.strokeColor
                    : '#00E5FF'
                }
                onChange={(e) =>
                  updateClipTextStyle(fallbackClip.id, {
                    strokeColor: e.target.value,
                    strokeWidth: 4,
                  })
                }
                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/20"
                title="Color de borde (Stroke)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-[#09090B] px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-[#8E8E98]">Tamaño</span>
                <input
                  type="range"
                  min={20}
                  max={96}
                  value={fallbackClip.textStyle?.fontSize ?? 44}
                  onChange={(e) =>
                    updateClipTextStyle(fallbackClip.id, {
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#00E5FF]"
                />
                <span className="font-mono w-8 text-right">
                  {fallbackClip.textStyle?.fontSize ?? 44}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {QUICK_STICKERS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addTextClip(emoji, true)}
                    className="px-2 py-1 rounded bg-[#09090B] hover:bg-white/10 border border-white/10 text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 10. ASPECT RATIO SUB-DRAWER */}
        {activeDrawer === 'aspect_ratio' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {ASPECT_RATIO_OPTIONS.map((ar) => {
              const active = aspectRatio === ar.id
              return (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setAspectRatio(ar.id)}
                  className={`flex flex-col items-start px-3 py-1.5 rounded-xl border shrink-0 transition ${
                    active
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white font-bold'
                      : 'bg-[#09090B] border-white/10 text-[#8E8E98] hover:text-white'
                  }`}
                >
                  <span className="text-xs font-mono">{ar.label}</span>
                  <span className="text-[10px] text-[#8E8E98]">
                    {ar.subtitle}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* 11. CANVAS BACKGROUND SUB-DRAWER */}
        {activeDrawer === 'canvas_bg' && (
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#8E8E98]">Desenfoque Dinámico:</span>
              {([1, 2, 3, 4] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() =>
                    setCanvasBackground({ mode: 'blur', blurLevel: lvl })
                  }
                  className={`px-2.5 py-1 rounded-lg border ${
                    canvasBackground.mode === 'blur' &&
                    canvasBackground.blurLevel === lvl
                      ? 'bg-[#00E5FF] text-black font-bold border-[#00E5FF]'
                      : 'bg-[#09090B] border-white/10 text-white'
                  }`}
                >
                  Grado {lvl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[#8E8E98] shrink-0">Sólidos:</span>
              {SOLID_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() =>
                    setCanvasBackground({ mode: 'solid', solidColor: hex })
                  }
                  style={{ backgroundColor: hex }}
                  className={`w-6 h-6 rounded-full border shrink-0 ${
                    canvasBackground.mode === 'solid' &&
                    canvasBackground.solidColor === hex
                      ? 'border-[#00E5FF] scale-110 ring-2 ring-[#00E5FF]/50'
                      : 'border-white/30'
                  }`}
                />
              ))}

              <span className="text-[#8E8E98] ml-2 shrink-0">Degradados:</span>
              {GRADIENT_PRESETS.map((gr) => (
                <button
                  key={gr.id}
                  type="button"
                  onClick={() =>
                    setCanvasBackground({
                      mode: 'gradient',
                      gradientId: gr.id,
                      gradientColors: gr.colors,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg border text-[11px] shrink-0 ${
                    canvasBackground.mode === 'gradient' &&
                    canvasBackground.gradientId === gr.id
                      ? 'border-[#00E5FF] text-[#00E5FF]'
                      : 'border-white/10 text-white'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${gr.colors[0]}, ${gr.colors[1]})`,
                  }}
                >
                  {gr.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 12. EFFECTS SUB-DRAWER */}
        {activeDrawer === 'effects' && fallbackClip && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => addAdjustmentClip()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-200 font-semibold shrink-0"
            >
              <Layers className="w-4 h-4" />
              <span>+ Añadir Capa de Ajuste Pro</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateClipColorGrading(fallbackClip.id, {
                  chromaticAberration: 65,
                  filmGrain: 35,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-[#09090B] border border-white/10 hover:border-[#00E5FF] text-white shrink-0"
            >
              🌈 Glitch & Aberración RGB
            </button>
            <button
              type="button"
              onClick={() =>
                updateClipColorGrading(fallbackClip.id, {
                  halation: 75,
                  filmGrain: 40,
                  vignette: -35,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-[#09090B] border border-white/10 hover:border-[#FE2C55] text-white shrink-0"
            >
              🎞️ Halation 35mm Analógico
            </button>
          </div>
        )}
      </div>
    )
  }

  // Build Dock Action Items according to CapCut's 3-State Machine
  const renderDockActions = () => {
    // STATE 1: NO CLIP SELECTED (Root Menu)
    if (!selectedClip) {
      const rootItems = [
        {
          id: 'edit',
          label: 'Editar',
          icon: Scissors,
          onClick: () => {
            const firstVideo = clips.find((c) => c.trackType === 'video')
            if (firstVideo) {
              selectClip(firstVideo.id)
            } else {
              triggerVideoUpload('video')
            }
          },
        },
        {
          id: 'import_video',
          label: 'Importar',
          icon: Upload,
          accent: true,
          onClick: () => triggerVideoUpload('video'),
        },
        {
          id: 'audio',
          label: 'Audio',
          icon: Music,
          onClick: () => setAudioExtractorOpen(true),
        },
        {
          id: 'text',
          label: 'Texto',
          icon: Type,
          onClick: () => addTextClip('TEXTO REELS ✨', false),
        },
        {
          id: 'sticker',
          label: 'Sticker',
          icon: Smile,
          onClick: () => addTextClip('🔥🚀💎', true),
        },
        {
          id: 'pip',
          label: 'Superposición',
          icon: Layers,
          onClick: () => triggerVideoUpload('pip'),
        },
        {
          id: 'effects',
          label: 'Efectos',
          icon: Sparkles,
          active: activeDrawer === 'effects',
          onClick: () => setActiveDrawer('effects'),
        },
        {
          id: 'filters',
          label: 'Filtros (32)',
          icon: Palette,
          active: activeDrawer === 'filters',
          onClick: () => setActiveDrawer('filters'),
        },
        {
          id: 'ratio',
          label: `Formato (${aspectRatio})`,
          icon: Frame,
          active: activeDrawer === 'aspect_ratio',
          onClick: () => setActiveDrawer('aspect_ratio'),
        },
        {
          id: 'canvas',
          label: 'Fondo',
          icon: Image,
          active: activeDrawer === 'canvas_bg',
          onClick: () => setActiveDrawer('canvas_bg'),
        },
        {
          id: 'adjust',
          label: 'Ajustar',
          icon: Sliders,
          active: activeDrawer === 'adjust',
          onClick: () => setActiveDrawer('adjust'),
        },
        {
          id: 'quality_pro',
          label: 'Calidad Pro',
          icon: Cpu,
          accent: true,
          active: activeDrawer === 'quality_pro',
          onClick: () => setActiveDrawer('quality_pro'),
        },
      ]

      return (
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 no-scrollbar">
          {rootItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center min-w-[62px] py-1.5 px-2 rounded-xl transition shrink-0 cursor-pointer ${
                  item.active
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50'
                    : item.accent
                      ? 'bg-gradient-to-b from-[#00E5FF]/15 to-transparent text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-[#00E5FF]/25'
                      : 'text-[#F4F4F6] hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      )
    }

    // STATE 3: WHEN AN AUDIO CLIP IS SELECTED
    if (selectedClip.trackType === 'audio') {
      const audioItems = [
        {
          id: 'split',
          label: 'Dividir',
          icon: Scissors,
          onClick: () => splitSelectedClip(),
        },
        {
          id: 'fade',
          label: 'Fundido (Fade)',
          icon: Waves,
          active: activeDrawer === 'audio_fx',
          onClick: () => setActiveDrawer('audio_fx'),
        },
        {
          id: 'volume',
          label: `Volumen (${selectedClip.audioFX.volume}%)`,
          icon: Volume2,
          active: activeDrawer === 'audio_fx',
          onClick: () => setActiveDrawer('audio_fx'),
        },
        {
          id: 'beats',
          label: beatAnalyzing
            ? 'Analizando...'
            : `Ritmo (${selectedClip.audioFX.beatMarkers.length} Beats)`,
          icon: Zap,
          accent: true,
          onClick: () => void handleRunBeatDetection(),
        },
        {
          id: 'ducking',
          label: selectedClip.audioFX.autoDucking
            ? 'Ducking: ON'
            : 'Auto-Ducking',
          icon: Radio,
          active: selectedClip.audioFX.autoDucking,
          onClick: () =>
            updateClipAudioFX(selectedClip.id, {
              autoDucking: !selectedClip.audioFX.autoDucking,
            }),
        },
        {
          id: 'isolate',
          label: selectedClip.audioFX.voiceIsolate
            ? 'Voz Aislada: ON'
            : 'Aislar Voz',
          icon: Mic,
          active: selectedClip.audioFX.voiceIsolate,
          onClick: () =>
            updateClipAudioFX(selectedClip.id, {
              voiceIsolate: !selectedClip.audioFX.voiceIsolate,
            }),
        },
        {
          id: 'voice_fx',
          label: 'Efectos de Voz',
          icon: Wand2,
          active: activeDrawer === 'voice_fx',
          onClick: () => setActiveDrawer('voice_fx'),
        },
        {
          id: 'speed',
          label: 'Velocidad',
          icon: Gauge,
          active: activeDrawer === 'speed',
          onClick: () => setActiveDrawer('speed'),
        },
        {
          id: 'duplicate',
          label: 'Duplicar',
          icon: Copy,
          onClick: () => duplicateSelectedClip(),
        },
        {
          id: 'delete',
          label: 'Eliminar',
          icon: Trash2,
          danger: true,
          onClick: () => deleteSelectedClip(),
        },
      ]

      return (
        <div className="flex items-center gap-1.5 overflow-x-auto px-2 py-1.5 no-scrollbar">
          <button
            type="button"
            onClick={() => selectClip(null)}
            className="flex items-center justify-center w-9 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white shrink-0"
            title="Volver al menú principal"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {audioItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center min-w-[66px] py-1.5 px-2 rounded-xl transition shrink-0 cursor-pointer ${
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/15'
                    : item.active
                      ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50'
                      : item.accent
                        ? 'bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/40'
                        : 'text-[#F4F4F6] hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      )
    }

    // STATE 2: WHEN A VIDEO, PIP, TEXT, OR ADJUSTMENT CLIP IS SELECTED
    const videoClipItems = [
      ...(selectedClip.trackType === 'text'
        ? [
            {
              id: 'text_edit',
              label: 'Editar Texto',
              icon: Type,
              accent: true,
              active: activeDrawer === 'text_edit',
              onClick: () => setActiveDrawer('text_edit'),
            },
          ]
        : []),
      {
        id: 'split',
        label: 'Dividir',
        icon: Scissors,
        onClick: () => splitSelectedClip(),
      },
      {
        id: 'speed',
        label: 'Velocidad',
        icon: Gauge,
        active: activeDrawer === 'speed',
        onClick: () => setActiveDrawer('speed'),
      },
      {
        id: 'animation',
        label: 'Animación',
        icon: Sparkles,
        active: activeDrawer === 'animation',
        onClick: () => setActiveDrawer('animation'),
      },
      {
        id: 'delete',
        label: 'Eliminar',
        icon: Trash2,
        danger: true,
        onClick: () => deleteSelectedClip(),
      },
      {
        id: 'extract_audio',
        label: 'Extraer Audio',
        icon: Music,
        onClick: () => extractAudioFromSelectedClip(),
      },
      {
        id: 'quality_pro',
        label: 'Calidad Ultra HD',
        icon: Cpu,
        accent: true,
        active: activeDrawer === 'quality_pro',
        onClick: () => setActiveDrawer('quality_pro'),
      },
      {
        id: 'volume',
        label: 'Volumen',
        icon: Volume2,
        active: activeDrawer === 'audio_fx',
        onClick: () => setActiveDrawer('audio_fx'),
      },
      {
        id: 'filters',
        label: 'Filtros',
        icon: Palette,
        active: activeDrawer === 'filters',
        onClick: () => setActiveDrawer('filters'),
      },
      {
        id: 'adjust',
        label: 'Ajustar (Color)',
        icon: Sliders,
        active: activeDrawer === 'adjust',
        onClick: () => setActiveDrawer('adjust'),
      },
      {
        id: 'mask',
        label: 'Máscara',
        icon: Square,
        active: activeDrawer === 'mask',
        onClick: () => setActiveDrawer('mask'),
      },
      {
        id: 'chromakey',
        label: 'Chroma Key',
        icon: Pipette,
        active: activeDrawer === 'chromakey',
        onClick: () => setActiveDrawer('chromakey'),
      },
      {
        id: 'blend',
        label: 'Mezcla (Blend)',
        icon: Droplet,
        active: activeDrawer === 'blend',
        onClick: () => setActiveDrawer('blend'),
      },
      {
        id: 'transition',
        label: 'Transición',
        icon: Film,
        active: activeDrawer === 'transition',
        onClick: () => setActiveDrawer('transition'),
      },
      {
        id: 'freeze',
        label: 'Congelar',
        icon: Snowflake,
        onClick: () => freezeSelectedClip(),
      },
      {
        id: 'transform',
        label: 'Transformar',
        icon: Crop,
        active: activeDrawer === 'transform',
        onClick: () => setActiveDrawer('transform'),
      },
      {
        id: 'duplicate',
        label: 'Duplicar',
        icon: Copy,
        onClick: () => duplicateSelectedClip(),
      },
    ]

    return (
      <div className="flex items-center gap-1.5 overflow-x-auto px-2 py-1.5 no-scrollbar">
        <button
          type="button"
          onClick={() => selectClip(null)}
          className="flex items-center justify-center w-9 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white shrink-0"
          title="Volver al menú raíz"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {videoClipItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1.5 px-2 rounded-xl transition shrink-0 cursor-pointer ${
                item.danger
                  ? 'text-red-400 hover:bg-red-500/15'
                  : item.active
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50'
                    : item.accent
                      ? 'bg-gradient-to-b from-[#00E5FF]/15 to-transparent text-[#00E5FF] border border-[#00E5FF]/30'
                      : 'text-[#F4F4F6] hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => triggerVideoUpload('video')}
          className="flex flex-col items-center justify-center min-w-[64px] py-1.5 px-2 rounded-xl bg-[#FE2C55]/15 border border-[#FE2C55]/40 text-[#FE2C55] shrink-0"
        >
          <Plus className="w-4 h-4 mb-1" />
          <span className="text-[10px] font-semibold leading-none whitespace-nowrap">
            + Video
          </span>
        </button>
      </div>
    )
  }

  return (
    <footer className="bg-[#1F1F23] border-t border-white/10 select-none pb-[env(safe-area-inset-bottom,0px)] z-30">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mov,.mp4"
        onChange={handleVideoFileSelected}
        className="hidden"
      />
      {renderContextualSubDrawer()}
      {renderDockActions()}
    </footer>
  )
}
