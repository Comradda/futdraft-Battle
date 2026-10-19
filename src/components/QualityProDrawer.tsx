import React, { useState } from 'react'
import {
  Activity,
  Check,
  Cpu,
  Layers,
  RotateCcw,
  Sliders,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import {
  DEFAULT_QUALITY_ENHANCER,
  resolveVisualTargetClip,
  useEditorStore,
} from '../store/useEditorStore'
import type { ColorGradingConfig, QualityEnhancerConfig } from '../types/editor'

interface ColorParamMeta {
  key: keyof ColorGradingConfig
  label: string
  shortLabel: string
  min: number
  max: number
  badge?: string
}

const COLOR_PARAMS: ColorParamMeta[] = [
  { key: 'exposure', label: 'Exposición', shortLabel: 'Expos.', min: -100, max: 100 },
  { key: 'contrast', label: 'Contraste', shortLabel: 'Contr.', min: -100, max: 100 },
  { key: 'brightness', label: 'Brillo', shortLabel: 'Brillo', min: -100, max: 100 },
  {
    key: 'highlights',
    label: 'Destacados (Highlights)',
    shortLabel: 'Altas Luces',
    min: -100,
    max: 100,
  },
  {
    key: 'shadows',
    label: 'Sombras (Shadows)',
    shortLabel: 'Sombras',
    min: -100,
    max: 100,
  },
  { key: 'whites', label: 'Blancos', shortLabel: 'Blancos', min: -100, max: 100 },
  { key: 'blacks', label: 'Negros', shortLabel: 'Negros', min: -100, max: 100 },
  {
    key: 'saturation',
    label: 'Saturación',
    shortLabel: 'Satur.',
    min: -100,
    max: 100,
  },
  {
    key: 'vibrance',
    label: 'Vibrancia (Piel Protegida)',
    shortLabel: 'Vibrancia',
    min: -100,
    max: 100,
    badge: 'Skin Safe',
  },
  {
    key: 'temperature',
    label: 'Temperatura',
    shortLabel: 'Temp.',
    min: -100,
    max: 100,
  },
  { key: 'tint', label: 'Tinte', shortLabel: 'Tinte', min: -100, max: 100 },
  { key: 'sharpness', label: 'Nitidez', shortLabel: 'Nitidez', min: -100, max: 100 },
  {
    key: 'filmGrain',
    label: 'Grano de Película',
    shortLabel: 'Grano 35mm',
    min: 0,
    max: 100,
  },
  { key: 'vignette', label: 'Viñeta', shortLabel: 'Viñeta', min: -100, max: 100 },
  {
    key: 'chromaticAberration',
    label: 'Aberración Cromática',
    shortLabel: 'Aberr. RGB',
    min: 0,
    max: 100,
  },
  {
    key: 'halation',
    label: 'Halation (Cine Rojo)',
    shortLabel: 'Halation',
    min: 0,
    max: 100,
    badge: 'Cine',
  },
]

const QUALITY_SLIDERS: {
  key: keyof Omit<QualityEnhancerConfig, 'enabled'>
  title: string
  subtitle: string
}[] = [
  {
    key: 'casSharpen',
    title: 'AMD FidelityFX CAS (Nitidez Adaptativa 5-Tap)',
    subtitle: 'Realza bordes finos sin crear halos blancos ni artefactos',
  },
  {
    key: 'bilateralDenoise',
    title: 'Denoiser Bilateral (Reducción de Ruido Nocturno)',
    subtitle: 'Limpia grano ISO de baja luz en iPhone preservando contornos',
  },
  {
    key: 'debandDither',
    title: 'Debanding Dither (Eliminar Bloques en Cielos/Degradados)',
    subtitle: 'Inyecta ruido azul perceptual para suavizar bandas de 8-bit',
  },
  {
    key: 'midtoneClarity',
    title: 'Claridad de Medios Tonos (Punch Micro-Contraste)',
    subtitle: 'Aumenta rango dinámico local para sobrevivir compresión social',
  },
]

export const QualityProDrawer: React.FC = () => {
  const activeDrawer = useEditorStore((s) => s.activeDrawer)
  const clips = useEditorStore((s) => s.clips)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const showHistogram = useEditorStore((s) => s.showHistogram)
  const setShowHistogram = useEditorStore((s) => s.setShowHistogram)
  const setActiveDrawer = useEditorStore((s) => s.setActiveDrawer)
  const updateClipQualityEnhancer = useEditorStore(
    (s) => s.updateClipQualityEnhancer
  )
  const updateClipColorGrading = useEditorStore((s) => s.updateClipColorGrading)
  const resetClipColorGrading = useEditorStore((s) => s.resetClipColorGrading)
  const addAdjustmentClip = useEditorStore((s) => s.addAdjustmentClip)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const [selectedColorKey, setSelectedColorKey] =
    useState<keyof ColorGradingConfig>('exposure')

  const playheadTime = useEditorStore((s) => s.playheadTime)

  if (activeDrawer !== 'quality_pro' && activeDrawer !== 'adjust') {
    return null
  }

  const targetClip =
    resolveVisualTargetClip(clips, selectedClipId, playheadTime) ??
    clips[0]

  if (!targetClip) return null

  const { qualityEnhancer, colorGrading } = targetClip
  const activeColorMeta =
    COLOR_PARAMS.find((p) => p.key === selectedColorKey) ?? COLOR_PARAMS[0]
  const currentColorValue = colorGrading[activeColorMeta.key]

  const applyQualityPreset = (
    preset: 'reels_sharp' | 'iphone_night' | 'whatsapp_anti'
  ) => {
    pushHistory()
    if (preset === 'reels_sharp') {
      updateClipQualityEnhancer(targetClip.id, {
        enabled: true,
        casSharpen: 78,
        bilateralDenoise: 18,
        debandDither: 30,
        midtoneClarity: 58,
      })
    } else if (preset === 'iphone_night') {
      updateClipQualityEnhancer(targetClip.id, {
        enabled: true,
        casSharpen: 45,
        bilateralDenoise: 82,
        debandDither: 65,
        midtoneClarity: 40,
      })
    } else {
      updateClipQualityEnhancer(targetClip.id, {
        enabled: true,
        casSharpen: 68,
        bilateralDenoise: 32,
        debandDither: 55,
        midtoneClarity: 52,
      })
    }
  }

  return (
    <div className="bg-[#18181B]/98 border-t border-white/10 px-3 py-2.5 text-[#F4F4F6] shadow-2xl backdrop-blur-xl select-none">
      {/* Top Tab Switcher */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1 bg-[#09090B] p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setActiveDrawer('quality_pro')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              activeDrawer === 'quality_pro'
                ? 'bg-gradient-to-r from-[#00E5FF] to-[#38BDF8] text-black font-semibold'
                : 'text-[#8E8E98] hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Calidad Ultra HD (Shader)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDrawer('adjust')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              activeDrawer === 'adjust'
                ? 'bg-[#FE2C55] text-white font-semibold'
                : 'text-[#8E8E98] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ajustar Color Pro (16)</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowHistogram(!showHistogram)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border transition ${
              showHistogram
                ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF]'
                : 'bg-white/5 border-white/10 text-[#8E8E98] hover:text-white'
            }`}
            title="Mostrar/Ocultar Histograma RGB + Luma IRE en tiempo real"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scopes IRE</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer('none')}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeDrawer === 'quality_pro' ? (
        <div className="pt-2 space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {/* Master Toggle & Smart One-Tap Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                pushHistory()
                updateClipQualityEnhancer(targetClip.id, {
                  enabled: !qualityEnhancer.enabled,
                })
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                qualityEnhancer.enabled
                  ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                  : 'bg-white/5 border-white/10 text-[#8E8E98]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Motor Remaster GLSL: {qualityEnhancer.enabled ? 'ACTIVO' : 'OFF'}
              </span>
              {qualityEnhancer.enabled && <Check className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => applyQualityPreset('reels_sharp')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-[#00E5FF]/20 border border-white/10 hover:border-[#00E5FF]/50 text-white shrink-0 transition"
              >
                ⚡ Nitidez extrema Reels
              </button>
              <button
                type="button"
                onClick={() => applyQualityPreset('iphone_night')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-[#00E5FF]/20 border border-white/10 hover:border-[#00E5FF]/50 text-white shrink-0 transition"
              >
                🌙 Restaurar Noche iPhone
              </button>
              <button
                type="button"
                onClick={() => applyQualityPreset('whatsapp_anti')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-[#00E5FF]/20 border border-white/10 hover:border-[#00E5FF]/50 text-white shrink-0 transition"
              >
                🛡️ Anti-Compresión WhatsApp
              </button>
            </div>
          </div>

          {/* 4 Hardware Shader Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUALITY_SLIDERS.map((item) => {
              const val = qualityEnhancer[item.key]
              return (
                <div
                  key={item.key}
                  className="bg-[#09090B] border border-white/10 rounded-lg px-2.5 py-2 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-white leading-tight">
                      {item.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#00E5FF]">
                      {val}%
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8E8E98] leading-tight">
                    {item.subtitle}
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={val}
                    onMouseDown={() => pushHistory()}
                    onTouchStart={() => pushHistory()}
                    onChange={(e) =>
                      updateClipQualityEnhancer(targetClip.id, {
                        enabled: true,
                        [item.key]: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#00E5FF] h-1.5 bg-white/15 rounded-lg cursor-pointer"
                  />
                </div>
              )
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => addAdjustmentClip()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-purple-500/15 border border-purple-400/40 text-purple-200 hover:bg-purple-500/25 transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Aplicar en Capa de Ajuste Global</span>
            </button>

            <button
              type="button"
              onClick={() => {
                pushHistory()
                updateClipQualityEnhancer(targetClip.id, {
                  ...DEFAULT_QUALITY_ENHANCER,
                })
              }}
              className="flex items-center gap-1 text-[11px] text-[#8E8E98] hover:text-white"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer shader</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2 space-y-2.5">
          {/* Active Parameter Fine Slider */}
          <div className="bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 flex items-center gap-3">
            <div className="min-w-[130px]">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#FE2C55]" />
                <span>{activeColorMeta.label}</span>
              </div>
              <span className="text-[10px] text-[#8E8E98]">
                Rango [{activeColorMeta.min} a +{activeColorMeta.max}]
              </span>
            </div>

            <input
              type="range"
              min={activeColorMeta.min}
              max={activeColorMeta.max}
              step={1}
              value={currentColorValue}
              onMouseDown={() => pushHistory()}
              onTouchStart={() => pushHistory()}
              onChange={(e) =>
                updateClipColorGrading(targetClip.id, {
                  [activeColorMeta.key]: Number(e.target.value),
                })
              }
              className="flex-1 accent-[#FE2C55] h-1.5 bg-white/15 rounded-lg cursor-pointer"
            />

            <span className="w-12 text-right font-mono text-xs font-bold text-[#00E5FF]">
              {currentColorValue > 0
                ? `+${currentColorValue}`
                : currentColorValue}
            </span>

            <button
              type="button"
              onClick={() => {
                pushHistory()
                updateClipColorGrading(targetClip.id, {
                  [activeColorMeta.key]: 0,
                })
              }}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-[#8E8E98] hover:text-white"
              title="Poner este parámetro en 0"
            >
              0
            </button>
          </div>

          {/* Horizontal Scrollable Pill Strip for all 16 Color Parameters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {COLOR_PARAMS.map((param) => {
              const val = colorGrading[param.key]
              const isSelected = param.key === selectedColorKey
              const isModified = val !== 0
              return (
                <button
                  key={param.key}
                  type="button"
                  onClick={() => setSelectedColorKey(param.key)}
                  className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg border shrink-0 min-w-[74px] transition ${
                    isSelected
                      ? 'bg-[#FE2C55]/20 border-[#FE2C55] text-white'
                      : isModified
                        ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-white'
                        : 'bg-[#09090B] border-white/10 text-[#8E8E98] hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-medium truncate max-w-[84px]">
                    {param.shortLabel}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      isModified ? 'text-[#00E5FF] font-bold' : 'text-[#8E8E98]'
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Reset All 16 Parameters */}
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-[#8E8E98]">
              Clip objetivo:{' '}
              <strong className="text-white">{targetClip.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => resetClipColorGrading(targetClip.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8E8E98] hover:text-white"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer los 16 parámetros</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
