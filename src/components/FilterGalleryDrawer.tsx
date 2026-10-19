import React, { useState } from 'react'
import { Check, Layers, Palette, RotateCcw, Sparkles, X } from 'lucide-react'
import { FILTER_PRESETS } from '../engine/shaders'
import { useEditorStore } from '../store/useEditorStore'
import type { FilterCategory } from '../types/editor'

type CategoryTab = 'all' | FilterCategory

const CATEGORY_TABS: { id: CategoryTab; label: string }[] = [
  { id: 'all', label: 'Todos (32)' },
  { id: 'cine', label: 'Cine & Película (8)' },
  { id: 'lifestyle', label: 'Historias IG & Lifestyle (8)' },
  { id: 'urbano', label: 'Urbano & Nocturno (6)' },
  { id: 'retro', label: 'Retro & Analógico (5)' },
  { id: 'bw', label: 'Blanco y Negro (5)' },
]

export const FilterGalleryDrawer: React.FC = () => {
  const activeDrawer = useEditorStore((s) => s.activeDrawer)
  const clips = useEditorStore((s) => s.clips)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const setActiveDrawer = useEditorStore((s) => s.setActiveDrawer)
  const updateClip = useEditorStore((s) => s.updateClip)
  const addAdjustmentClip = useEditorStore((s) => s.addAdjustmentClip)
  const selectClip = useEditorStore((s) => s.selectClip)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all')

  if (activeDrawer !== 'filters') return null

  const targetClip =
    clips.find((c) => c.id === selectedClipId) ??
    clips.find((c) => c.trackType === 'video') ??
    clips[0]

  if (!targetClip) return null

  const filteredPresets =
    selectedCategory === 'all'
      ? FILTER_PRESETS
      : FILTER_PRESETS.filter((p) => p.category === selectedCategory)

  const activePreset = FILTER_PRESETS.find((p) => p.id === targetClip.filterId)

  const handleSelectFilter = (filterId: string) => {
    pushHistory()
    updateClip(targetClip.id, {
      filterId,
      filterIntensity:
        filterId === 'none'
          ? 0
          : targetClip.filterIntensity > 0
            ? targetClip.filterIntensity
            : 80,
    })
  }

  const handleApplyToAdjustmentLayer = () => {
    const chosenFilter =
      targetClip.filterId !== 'none' ? targetClip.filterId : 'oppenheimer_imax'
    const chosenIntensity =
      targetClip.filterIntensity > 0 ? targetClip.filterIntensity : 75

    const existingAdj = clips.find((c) => c.trackType === 'adjustment')
    if (existingAdj) {
      pushHistory()
      updateClip(existingAdj.id, {
        filterId: chosenFilter,
        filterIntensity: chosenIntensity,
      })
      selectClip(existingAdj.id)
      setActiveDrawer('filters')
    } else {
      const created = addAdjustmentClip()
      updateClip(created.id, {
        filterId: chosenFilter,
        filterIntensity: chosenIntensity,
      })
      setActiveDrawer('filters')
    }
  }

  return (
    <div className="bg-[#18181B]/98 border-t border-white/10 px-3 py-2.5 text-[#F4F4F6] shadow-2xl backdrop-blur-xl select-none">
      {/* Header Bar + Intensity Slider */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#00E5FF]" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Galería LUTs & Filtros (32)
          </span>
          {activePreset && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#00E5FF]/15 text-[#00E5FF] font-semibold">
              {activePreset.name}
            </span>
          )}
        </div>

        {/* Intensity Slider (0% - 100%) */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <span className="text-[11px] text-[#8E8E98]">Intensidad</span>
          <input
            type="range"
            min={0}
            max={100}
            value={targetClip.filterId === 'none' ? 0 : targetClip.filterIntensity}
            disabled={targetClip.filterId === 'none'}
            onMouseDown={() => pushHistory()}
            onTouchStart={() => pushHistory()}
            onChange={(e) =>
              updateClip(targetClip.id, {
                filterIntensity: Number(e.target.value),
              })
            }
            className="flex-1 accent-[#00E5FF] h-1.5 bg-white/15 rounded-lg cursor-pointer disabled:opacity-40"
          />
          <span className="text-xs font-mono font-bold text-[#00E5FF] w-9 text-right">
            {targetClip.filterId === 'none' ? 0 : targetClip.filterIntensity}%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleApplyToAdjustmentLayer}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-400/50 text-purple-200 hover:bg-purple-500/30 text-[11px] font-medium transition"
            title="Aplicar este filtro a la Capa de Ajuste sobre toda la línea de tiempo"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aplicar a Capa de Ajuste</span>
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

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
        {CATEGORY_TABS.map((tab) => {
          const active = selectedCategory === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition ${
                active
                  ? 'bg-[#00E5FF] text-black font-bold shadow-sm'
                  : 'bg-[#09090B] text-[#8E8E98] hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Horizontal Filter Preview Cards (Sin Filtro + 32 Presets) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5">
        {/* Sin Filtro Card */}
        <button
          type="button"
          onClick={() => handleSelectFilter('none')}
          className={`group relative flex flex-col items-center w-20 shrink-0 rounded-xl p-1.5 border transition cursor-pointer ${
            targetClip.filterId === 'none'
              ? 'bg-[#00E5FF]/15 border-[#00E5FF] ring-1 ring-[#00E5FF]'
              : 'bg-[#09090B] border-white/10 hover:border-white/30'
          }`}
        >
          <div className="w-full h-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10">
            <RotateCcw className="w-4 h-4 text-[#8E8E98]" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-white truncate w-full text-center">
            Sin Filtro
          </span>
          <span className="text-[9px] text-[#8E8E98]">Original</span>
        </button>

        {filteredPresets.map((preset) => {
          const isSelected = targetClip.filterId === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectFilter(preset.id)}
              title={preset.description}
              className={`group relative flex flex-col items-center w-24 shrink-0 rounded-xl p-1.5 border transition cursor-pointer ${
                isSelected
                  ? 'bg-[#00E5FF]/15 border-[#00E5FF] ring-1 ring-[#00E5FF]'
                  : 'bg-[#09090B] border-white/10 hover:border-white/30'
              }`}
            >
              {/* Color Swatch Preview */}
              <div
                className="relative w-full h-12 rounded-lg overflow-hidden border border-white/15 flex items-end justify-between p-1"
                style={{ background: preset.badgeColor }}
              >
                {preset.scanlines && (
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] pointer-events-none" />
                )}
                <Sparkles className="w-3 h-3 text-white/80 drop-shadow" />
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-[#00E5FF] text-black flex items-center justify-center shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <span className="mt-1 text-[10px] font-semibold text-white truncate w-full text-center">
                {preset.name}
              </span>
              <span className="text-[9px] text-[#8E8E98] truncate w-full text-center">
                {preset.categoryLabel.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
