import React, { useState, useRef, useEffect } from 'react'
import {
  RotateCcw,
  Undo2,
  Redo2,
  Activity,
  ShieldAlert,
  Sparkles,
  Upload,
  Check,
  ChevronDown,
  Smartphone,
  FolderOpen,
} from 'lucide-react'

import { useEditorStore } from '../store/useEditorStore'
import type { SocialSafeZoneMode } from '../types/editor'

const SAFE_ZONE_OPTIONS: {
  id: SocialSafeZoneMode
  label: string
  shortLabel: string
  badgeColor: string
}[] = [
  {
    id: 'none',
    label: 'Ninguno (Sin Guías)',
    shortLabel: 'Safe: OFF',
    badgeColor: '#A1A1AA',
  },
  {
    id: 'ig_stories',
    label: 'Instagram Stories',
    shortLabel: 'IG Stories',
    badgeColor: '#F43F5E',
  },
  {
    id: 'ig_reels',
    label: 'Instagram Reels',
    shortLabel: 'IG Reels',
    badgeColor: '#EC4899',
  },
  {
    id: 'whatsapp_status',
    label: 'WhatsApp Status (Estados)',
    shortLabel: 'WA Status',
    badgeColor: '#22C55E',
  },
  {
    id: 'tiktok',
    label: 'TikTok Vertical',
    shortLabel: 'TikTok',
    badgeColor: '#00E5FF',
  },
]

export const TopBar: React.FC = () => {
  const projectName = useEditorStore((s) => s.projectName)
  const setProjectName = useEditorStore((s) => s.setProjectName)
  const resetProjectToDemo = useEditorStore((s) => s.resetProjectToDemo)
  const socialSafeZone = useEditorStore((s) => s.socialSafeZone)
  const setSocialSafeZone = useEditorStore((s) => s.setSocialSafeZone)
  const showHistogram = useEditorStore((s) => s.showHistogram)
  const setShowHistogram = useEditorStore((s) => s.setShowHistogram)
  const exportConfig = useEditorStore((s) => s.exportConfig)
  const setExportModalOpen = useEditorStore((s) => s.setExportModalOpen)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const pastCount = useEditorStore((s) => s.past.length)
  const futureCount = useEditorStore((s) => s.future.length)
  const saveStatus = useEditorStore((s) => s.saveStatus)
  const saveCurrentProject = useEditorStore((s) => s.saveCurrentProject)
  const setProjectsModalOpen = useEditorStore((s) => s.setProjectsModalOpen)

  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(projectName)
  const [safeMenuOpen, setSafeMenuOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraftName(projectName)
  }, [projectName])

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  useEffect(() => {
    if (!safeMenuOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSafeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [safeMenuOpen])

  const commitProjectName = () => {
    const trimmed = draftName.trim()
    if (trimmed.length > 0) {
      setProjectName(trimmed)
    } else {
      setDraftName(projectName)
    }
    setIsEditingName(false)
  }

  const currentSafeOption =
    SAFE_ZONE_OPTIONS.find((o) => o.id === socialSafeZone) ?? SAFE_ZONE_OPTIONS[0]

  const handleResetClick = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      window.setTimeout(() => setConfirmReset(false), 3000)
      return
    }
    resetProjectToDemo()
    setConfirmReset(false)
  }

  return (
    <header className="safe-top relative z-40 flex h-[44px] min-h-[44px] w-full shrink-0 items-center justify-between border-b border-[#1F1F23] bg-[#09090B] px-2.5 select-none">
      {/* Left section: Brand Logo + Mis Proyectos button + Reset/Demo + Editable Project Title + Save Status */}
      <div className="flex min-w-0 items-center gap-1.5">
        <img
          src="/favicon.svg"
          alt="CapCut Studio Pro"
          className="h-6 w-6 shrink-0 rounded-[6px] shadow-sm border border-white/10"
        />

        {/* Mis Proyectos Button */}
        <button
          type="button"
          onClick={() => setProjectsModalOpen(true)}
          title="Ver Mis Proyectos guardados en este dispositivo"
          className="flex h-7 items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#141417] px-2 text-[11px] font-semibold text-[#F4F4F6] transition-all hover:border-[#00E5FF]/50 hover:bg-[#1F1F23] active:scale-95 cursor-pointer"
        >
          <FolderOpen className="h-3.5 w-3.5 text-[#00E5FF]" />
          <span className="hidden sm:inline">Proyectos</span>
        </button>

        <button
          type="button"
          onClick={handleResetClick}
          title={
            confirmReset
              ? 'Pulsa de nuevo para restaurar proyecto demo'
              : 'Restaurar proyecto Demo'
          }
          className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-all active:scale-95 ${
            confirmReset
              ? 'bg-[#FE2C55]/20 text-[#FE2C55] ring-1 ring-[#FE2C55]/60'
              : 'bg-[#141417] text-[#A1A1AA] hover:bg-[#1F1F23] hover:text-[#F4F4F6]'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" />
          {confirmReset && <span className="whitespace-nowrap">¿Reiniciar?</span>}
        </button>

        {isEditingName ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitProjectName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitProjectName()
                if (e.key === 'Escape') {
                  setDraftName(projectName)
                  setIsEditingName(false)
                }
              }}
              maxLength={28}
              className="h-7 w-28 rounded-md border border-[#00E5FF] bg-[#141417] px-2 text-xs font-semibold text-[#F4F4F6] outline-none sm:w-36"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                commitProjectName()
              }}
              className="flex h-6 w-6 items-center justify-center rounded bg-[#00E5FF] text-[#09090B]"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingName(true)}
            title="Renombrar proyecto"
            className="group flex max-w-[105px] items-center gap-1 truncate rounded-md px-1.5 py-1 text-left text-xs font-semibold text-[#F4F4F6] transition-colors hover:bg-[#141417] sm:max-w-[150px]"
          >
            <span className="truncate">{projectName}</span>
            <span className="text-[10px] text-[#00E5FF] opacity-70 group-hover:opacity-100">
              ✎
            </span>
          </button>
        )}

        {/* Live Save Status Indicator */}
        <button
          type="button"
          onClick={() => void saveCurrentProject()}
          title="Guardado automático en tu dispositivo. Haz clic para forzar guardado."
          className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer hover:bg-white/5 shrink-0"
        >
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1 text-[#00E5FF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF] animate-ping" />
              <span>Guardando...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#22C55E]/90 hover:text-[#22C55E]">
              <Check className="h-3 w-3 text-[#22C55E]" />
              <span>Guardado</span>
            </span>
          )}
        </button>
      </div>


      {/* Center section: Social Safe-Zone HUD Selector + Live RGB Histogram + Undo/Redo */}
      <div className="flex items-center gap-1">
        {/* Social Safe-Zone Dropdown Pill */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setSafeMenuOpen((v) => !v)}
            title="Guías de Zona Segura para Redes Sociales"
            className={`flex h-7 items-center gap-1 rounded-full border px-2 text-[11px] font-medium transition-all active:scale-95 ${
              socialSafeZone !== 'none'
                ? 'border-[#00E5FF]/60 bg-[#00E5FF]/15 text-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                : 'border-[#27272A] bg-[#141417] text-[#A1A1AA] hover:text-[#F4F4F6]'
            }`}
          >
            <Smartphone className="h-3 w-3 shrink-0" />
            <span className="max-w-[68px] truncate sm:max-w-none">
              {currentSafeOption.shortLabel}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
          </button>

          {safeMenuOpen && (
            <div className="absolute left-0 top-9 z-50 w-56 rounded-xl border border-[#27272A] bg-[#141417]/95 p-1.5 shadow-2xl backdrop-blur-xl">
              <div className=" flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#A1A1AA] uppercase">
                <ShieldAlert className="h-3 w-3 text-[#00E5FF]" />
                Zona Segura Social HUD
              </div>
              {SAFE_ZONE_OPTIONS.map((opt) => {
                const active = opt.id === socialSafeZone
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSocialSafeZone(opt.id)
                      setSafeMenuOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      active
                        ? 'bg-[#00E5FF]/15 font-semibold text-[#00E5FF]'
                        : 'text-[#F4F4F6] hover:bg-[#1F1F23]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: opt.badgeColor }}
                      />
                      {opt.label}
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-[#00E5FF]" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Live RGB Histogram Toggle */}
        <button
          type="button"
          onClick={() => setShowHistogram(!showHistogram)}
          title="Histograma RGB / IRE en Tiempo Real"
          className={`flex h-7 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold transition-all active:scale-95 ${
            showHistogram
              ? 'border-[#00E5FF] bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.3)]'
              : 'border-[#27272A] bg-[#141417] text-[#A1A1AA] hover:text-[#F4F4F6]'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span className="hidden text-[10px] sm:inline">IRE</span>
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center rounded-lg border border-[#1F1F23] bg-[#141417] p-0.5">
          <button
            type="button"
            onClick={undo}
            disabled={pastCount === 0}
            title={`Deshacer (${pastCount})`}
            className="relative flex h-6 w-6 items-center justify-center rounded text-[#F4F4F6] transition-opacity hover:bg-[#1F1F23] disabled:opacity-30"
          >
            <Undo2 className="h-3.5 w-3.5" />
            {pastCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
            )}
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={futureCount === 0}
            title={`Rehacer (${futureCount})`}
            className="relative flex h-6 w-6 items-center justify-center rounded text-[#F4F4F6] transition-opacity hover:bg-[#1F1F23] disabled:opacity-30"
          >
            <Redo2 className="h-3.5 w-3.5" />
            {futureCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#FE2C55]" />
            )}
          </button>
        </div>
      </div>

      {/* Right section: Resolution/FPS Pill + Gradient Exportar Button */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          title="Configuración de Resolución y Fotogramas"
          className="hidden h-7 items-center gap-1 rounded-full border border-[#27272A] bg-[#141417] px-2.5 text-[10px] font-bold tracking-tight text-[#F4F4F6] transition-colors hover:border-[#00E5FF]/50 sm:flex"
        >
          <Sparkles className="h-3 w-3 text-[#00E5FF]" />
          <span>
            {exportConfig.resolution === '4k' ? '4K' : exportConfig.resolution} •{' '}
            {exportConfig.fps} FPS
          </span>
        </button>

        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          className="capcut-export-gradient flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold tracking-tight text-[#09090B] shadow-[0_0_15px_rgba(0,229,255,0.35)] transition-transform active:scale-95"
        >
          <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Exportar</span>
        </button>
      </div>
    </header>
  )
}
