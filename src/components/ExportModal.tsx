import React, { useRef, useState } from 'react'
import {
  CheckCircle2,
  Download,
  Film,
  Scissors,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import {
  calculateOptimalExportParams,
  computeStorySlices,
  exportTimelineSegments,
  shareOrDownloadSegments,
  type ExportProgressInfo,
} from '../engine/exportEngine'
import { useEditorStore } from '../store/useEditorStore'
import type {
  ExportConfig,
  ExportPresetId,
  ExportSegmentResult,
  StorySliceMode,
} from '../types/editor'

interface PresetCardMeta {
  id: ExportPresetId
  title: string
  subtitle: string
  badge: string
  badgeColor: string
  patch: Partial<ExportConfig>
}

const EXPORT_PRESET_CARDS: PresetCardMeta[] = [
  {
    id: 'whatsapp_antihd',
    title: 'Estado de WhatsApp (Anti-Compresión HD)',
    subtitle: 'Bloquea 1080×1920 @ 30fps • +0.35 CAS Sharpening • < 15.0 MB/seg',
    badge: 'ANTI-BLUR PRO',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    patch: {
      preset: 'whatsapp_antihd',
      resolution: '1080p',
      fps: 30,
      whatsappAntiCompression: true,
      storySliceMode: 'whatsapp_30s',
      targetMaxSizeMB: 15.0,
    },
  },
  {
    id: 'ig_reels_pro',
    title: 'Instagram Reels / TikTok Pro (1080p • 60 FPS)',
    subtitle: 'Fluidez 60fps de alto bitrate (10.5 Mbps) + Claridad de piel',
    badge: '60 FPS REELS',
    badgeColor: 'bg-[#FE2C55]/20 text-[#FE2C55] border-[#FE2C55]/40',
    patch: {
      preset: 'ig_reels_pro',
      resolution: '1080p',
      fps: 60,
      whatsappAntiCompression: false,
      storySliceMode: 'ig_stories_60s',
      targetMaxSizeMB: 45.0,
    },
  },
  {
    id: 'ultra_4k_master',
    title: 'Master Ultra 4K (2160p • 60 FPS)',
    subtitle: 'Máxima fidelidad de archivo 24 Mbps H.264 / HEVC sin recortes',
    badge: '4K UHD',
    badgeColor: 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40',
    patch: {
      preset: 'ultra_4k_master',
      resolution: '4k',
      fps: 60,
      whatsappAntiCompression: false,
      storySliceMode: 'none',
      targetMaxSizeMB: 120.0,
    },
  },
  {
    id: 'standard_1080p_60',
    title: 'Estándar Rápido (720p • 30 FPS)',
    subtitle: 'Exportación ultraligera para vista previa o envío rápido',
    badge: 'RÁPIDO',
    badgeColor: 'bg-white/10 text-zinc-300 border-white/20',
    patch: {
      preset: 'standard_1080p_60',
      resolution: '720p',
      fps: 30,
      whatsappAntiCompression: false,
      storySliceMode: 'none',
      targetMaxSizeMB: 25.0,
    },
  },
]

const STORY_SLICE_MODES: {
  id: StorySliceMode
  label: string
  desc: string
}[] = [
  { id: 'none', label: 'Sin dividir', desc: '1 archivo completo' },
  {
    id: 'whatsapp_30s',
    label: 'Cada 30 seg (WhatsApp Status)',
    desc: 'Cortes exactos sin pérdida',
  },
  {
    id: 'ig_stories_60s',
    label: 'Cada 60 seg (IG Stories)',
    desc: 'Segmentos de 60s listos',
  },
]

export const ExportModal: React.FC = () => {
  const isOpen = useEditorStore((s) => s.isExportModalOpen)
  const clips = useEditorStore((s) => s.clips)
  const tracks = useEditorStore((s) => s.tracks)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const canvasBackground = useEditorStore((s) => s.canvasBackground)
  const exportConfig = useEditorStore((s) => s.exportConfig)
  const getTotalDuration = useEditorStore((s) => s.getTotalDuration)
  const setExportModalOpen = useEditorStore((s) => s.setExportModalOpen)
  const setExportConfig = useEditorStore((s) => s.setExportConfig)

  const [isExporting, setIsExporting] = useState(false)
  const [progressInfo, setProgressInfo] = useState<ExportProgressInfo | null>(
    null
  )
  const [exportedSegments, setExportedSegments] = useState<
    ExportSegmentResult[]
  >([])
  const abortControllerRef = useRef<AbortController | null>(null)

  if (!isOpen) return null

  const totalDurationSec = getTotalDuration()
  const optimal = calculateOptimalExportParams(
    exportConfig,
    totalDurationSec,
    aspectRatio
  )
  const slicesPreview = computeStorySlices(
    totalDurationSec,
    exportConfig.storySliceMode
  )

  const handleClose = () => {
    if (isExporting && abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsExporting(false)
    setExportModalOpen(false)
  }

  const handleStartExport = async () => {
    setIsExporting(true)
    setExportedSegments([])
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const results = await exportTimelineSegments({
        clips,
        tracks,
        aspectRatio,
        canvasBackground,
        exportConfig,
        onProgress: (info) => setProgressInfo(info),
        signal: controller.signal,
      })
      setExportedSegments(results)
    } catch {
      // User cancelled or interrupted
    } finally {
      setIsExporting(false)
      abortControllerRef.current = null
    }
  }

  const handleShareOrSaveAll = async () => {
    if (exportedSegments.length === 0) return
    await shareOrDownloadSegments(exportedSegments)
  }

  const handleDownloadSingleSegment = (seg: ExportSegmentResult) => {
    const a = document.createElement('a')
    a.href = seg.url
    a.download = seg.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 select-none">
      <div className="w-full max-w-xl rounded-2xl bg-[#18181B] border border-white/15 text-[#F4F4F6] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#09090B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#FE2C55] flex items-center justify-center text-black font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Exportar Master & Anti-Compresión Social
              </h2>
              <p className="text-[11px] text-[#8E8E98]">
                Pre-énfasis AMD CAS + Smart Story Slicer + Guardado en Fotos iPhone
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

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* 1. Preset Cards */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E98]">
              1. Perfil de Calidad y Plataforma
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXPORT_PRESET_CARDS.map((card) => {
                const isSelected = exportConfig.preset === card.id
                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={isExporting}
                    onClick={() => setExportConfig(card.patch)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#00E5FF]/12 border-[#00E5FF] ring-1 ring-[#00E5FF]'
                        : 'bg-[#09090B] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-1 mb-1">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${card.badgeColor}`}
                      >
                        {card.badge}
                      </span>
                      {isSelected && (
                        <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-white leading-snug">
                      {card.title}
                    </div>
                    <div className="text-[10px] text-[#8E8E98] mt-0.5 leading-tight">
                      {card.subtitle}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Smart Story Slicer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E98] flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>
                  2. Dividir automáticamente para Historias / Estados
                </span>
              </label>
              <span className="text-[11px] font-mono text-[#00E5FF]">
                Duración Total: {totalDurationSec.toFixed(1)}s
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {STORY_SLICE_MODES.map((mode) => {
                const active = exportConfig.storySliceMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={isExporting}
                    onClick={() => setExportConfig({ storySliceMode: mode.id })}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      active
                        ? 'bg-[#FE2C55]/15 border-[#FE2C55] text-white'
                        : 'bg-[#09090B] border-white/10 text-[#8E8E98] hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">
                      {mode.label}
                    </div>
                    <div className="text-[10px] text-[#8E8E98]">{mode.desc}</div>
                  </button>
                )
              })}
            </div>

            {/* Preview List of Generated Story Segments */}
            <div className="bg-[#09090B] rounded-xl border border-white/10 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8E8E98] font-medium">
                  Vista previa de archivos ({slicesPreview.length}{' '}
                  {slicesPreview.length === 1 ? 'segmento' : 'segmentos'}):
                </span>
                <span className="font-mono text-xs text-emerald-400 font-semibold">
                  ~{optimal.estimatedSegmentSizeMB} MB / archivo ({optimal.width}×
                  {optimal.height} • {optimal.fps}fps)
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {slicesPreview.map((slice) => (
                  <div
                    key={slice.index}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#18181B] border border-white/10 text-[11px] shrink-0"
                  >
                    <Film className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span className="font-mono text-white font-semibold">
                      {slice.fileName}
                    </span>
                    <span className="text-[10px] font-mono text-[#8E8E98]">
                      ({slice.startSec.toFixed(1)}s–{slice.endSec.toFixed(1)}s)
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[10px] text-[#8E8E98]">
                <span>Códec: {optimal.codecLabel}</span>
                <span>
                  Bitrate: {optimal.videoBitrateMbps} Mbps +{' '}
                  {optimal.audioBitrateKbps} kbps AAC
                </span>
              </div>
            </div>
          </div>

          {/* 3. Real-Time Export Progress Bar */}
          {isExporting && progressInfo && (
            <div className="p-3.5 rounded-xl bg-[#09090B] border border-[#00E5FF]/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#00E5FF] font-semibold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 animate-pulse" />
                  {progressInfo.statusText}
                </span>
                <span className="font-mono font-bold text-white">
                  {Math.round(progressInfo.overallProgress * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00E5FF] via-[#38BDF8] to-[#FE2C55] transition-all duration-150"
                  style={{
                    width: `${Math.round(progressInfo.overallProgress * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* 4. Completed Export Results + Camera Roll Share / Individual Downloads */}
          {exportedSegments.length > 0 && !isExporting && (
            <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    ¡{exportedSegments.length}{' '}
                    {exportedSegments.length === 1
                      ? 'Video Master listo'
                      : 'Partes de Historia listas'}{' '}
                    con Nitidez CAS!
                  </span>
                </div>
              </div>

              {/* Primary iOS Camera Roll / Web Share Level 2 Button */}
              <button
                type="button"
                onClick={handleShareOrSaveAll}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#10B981] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>
                  Guardar en Fotos (Camera Roll) / Compartir (
                  {exportedSegments.length})
                </span>
              </button>

              {/* Individual Segment Download Buttons */}
              <div className="space-y-1.5">
                {exportedSegments.map((seg) => (
                  <div
                    key={seg.index}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#09090B] border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Film className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                      <span className="font-mono text-white truncate">
                        {seg.fileName}
                      </span>
                      <span className="text-[10px] font-mono text-[#8E8E98]">
                        {seg.durationSec.toFixed(1)}s • {seg.sizeMB} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingleSegment(seg)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar MP4</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Export CTA */}
          {!isExporting && (
            <button
              type="button"
              onClick={handleStartExport}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FE2C55] to-[#00E5FF] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:brightness-110 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {exportedSegments.length > 0
                  ? 'Volver a Renderizar MP4 HD'
                  : `Exportar ${slicesPreview.length > 1 ? `${slicesPreview.length} Historias HD` : 'Video Master HD'}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
