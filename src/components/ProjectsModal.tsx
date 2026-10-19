import React, { useState, useEffect, useRef } from 'react'
import {
  FolderOpen,
  Plus,
  X,
  Download,
  Upload,
  Trash2,
  Copy,
  Check,
  Clock,
  Film,
  HardDrive,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

import { useEditorStore } from '../store/useEditorStore'
import {
  listSavedProjects,
  loadProjectData,
  downloadProjectBackup,
} from '../utils/projectStorage'
import type { SavedProjectMetadata } from '../types/editor'

function formatDuration(sec: number): string {
  const safe = Math.max(0, Math.floor(sec || 0))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatDate(timestamp: number): string {
  if (!timestamp) return 'Reciente'
  const date = new Date(timestamp)
  const now = Date.now()
  const diffMinutes = Math.floor((now - timestamp) / 60000)

  if (diffMinutes < 1) return 'Hace unos segundos'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`
  if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60)
    return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const ProjectsModal: React.FC = () => {
  const isProjectsModalOpen = useEditorStore((s) => s.isProjectsModalOpen)
  const setProjectsModalOpen = useEditorStore((s) => s.setProjectsModalOpen)
  const currentProjectId = useEditorStore((s) => s.currentProjectId)
  const loadProjectById = useEditorStore((s) => s.loadProjectById)
  const createNewProjectInStore = useEditorStore(
    (s) => s.createNewProjectInStore
  )
  const duplicateCurrentProject = useEditorStore(
    (s) => s.duplicateCurrentProject
  )
  const deleteProjectById = useEditorStore((s) => s.deleteProjectById)
  const exportCurrentProjectBackup = useEditorStore(
    (s) => s.exportCurrentProjectBackup
  )
  const importProjectBackupFile = useEditorStore(
    (s) => s.importProjectBackupFile
  )
  const saveStatus = useEditorStore((s) => s.saveStatus)

  const [projects, setProjects] = useState<SavedProjectMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshProjectsList = async () => {
    setLoading(true)
    try {
      const list = await listSavedProjects()
      setProjects(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isProjectsModalOpen) {
      void refreshProjectsList()
      setProjectToDelete(null)
    }
  }, [isProjectsModalOpen, currentProjectId])

  if (!isProjectsModalOpen) return null

  const handleOpenProject = async (id: string) => {
    if (id === currentProjectId) {
      setProjectsModalOpen(false)
      return
    }
    await loadProjectById(id)
  }

  const handleCreateNew = async () => {
    await createNewProjectInStore()
    await refreshProjectsList()
  }

  const handleDuplicate = async () => {
    await duplicateCurrentProject()
    await refreshProjectsList()
  }

  const handleDelete = async (id: string) => {
    await deleteProjectById(id)
    setProjectToDelete(null)
    await refreshProjectsList()
  }

  const handleExportProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (id === currentProjectId) {
      exportCurrentProjectBackup()
      return
    }
    const data = await loadProjectData(id)
    if (data) {
      downloadProjectBackup(data)
    }
  }

  const handleImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const ok = await importProjectBackupFile(file)
      if (ok) {
        await refreshProjectsList()
        setProjectsModalOpen(false)
      } else {
        alert('No se pudo importar el archivo de proyecto.')
      }
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden text-[#F4F4F6]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A] bg-[#09090B]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#F4F4F6]">
                Mis Proyectos
              </h2>
              <p className="text-[11px] text-[#A1A1AA]">
                {projects.length}{' '}
                {projects.length === 1 ? 'proyecto guardado' : 'proyectos guardados'} localmente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00E5FF] text-[#09090B] text-xs font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)] transition hover:bg-[#00c8e0] active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nuevo Proyecto</span>
            </button>
            <button
              type="button"
              onClick={() => setProjectsModalOpen(false)}
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Storage Notice Banner */}
        <div className="px-5 py-3 bg-[#1F1F23]/80 border-b border-[#27272A] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
          <div className="text-xs text-[#A1A1AA] leading-relaxed">
            <span className="font-semibold text-white">
              Guardado 100% Automático en tu Dispositivo:
            </span>{' '}
            Tus proyectos y ediciones se almacenan en la memoria interna de tu iPhone o PC
            (mediante <span className="text-[#00E5FF] font-medium">IndexedDB</span>). No necesitas registrarte ni
            crear cuenta, evitando subir videos pesados y protegiendo tu privacidad.
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-[#27272A]/50 bg-[#141417]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full sm:w-64 h-8 px-3 rounded-lg bg-[#09090B] border border-[#27272A] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#00E5FF]/60 transition"
          />

          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".capcutproj,.json"
              onChange={handleImportFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#27272A] bg-[#09090B] text-xs font-medium text-[#A1A1AA] hover:text-white hover:border-[#00E5FF]/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Restaurar proyecto desde copia de seguridad .capcutproj"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Importar Copia</span>
            </button>

            <button
              type="button"
              onClick={exportCurrentProjectBackup}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#27272A] bg-[#09090B] text-xs font-medium text-[#A1A1AA] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition active:scale-95 cursor-pointer"
              title="Descargar copia de seguridad .capcutproj para iCloud / Google Drive"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Actual</span>
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#A1A1AA] space-y-2">
              <div className="w-6 h-6 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Cargando proyectos guardados...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#71717A] space-y-3">
              <Film className="w-10 h-10 text-[#27272A]" />
              <div>
                <p className="text-sm font-semibold text-[#A1A1AA]">
                  {searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos guardados'}
                </p>
                <p className="text-xs mt-1">
                  {searchQuery
                    ? 'Prueba con otro término de búsqueda.'
                    : 'Crea un nuevo proyecto o comienza a editar para que se guarde automáticamente.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateNew}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 text-xs font-semibold hover:bg-[#00E5FF]/25 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear Proyecto
              </button>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isActive = p.id === currentProjectId
              const isDeletingThis = projectToDelete === p.id

              return (
                <div
                  key={p.id}
                  onClick={() => handleOpenProject(p.id)}
                  className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#00E5FF]/60 bg-[#00E5FF]/10 shadow-[0_0_15px_rgba(0,229,255,0.12)]'
                      : 'border-[#27272A] bg-[#09090B]/60 hover:bg-[#1F1F23]/60 hover:border-white/20'
                  }`}
                >
                  {/* Left: Thumbnail & Project Meta */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0 border ${
                        p.aspectRatio === '9:16'
                          ? 'aspect-[9/16]'
                          : p.aspectRatio === '16:9'
                            ? 'aspect-[16/9]'
                            : 'aspect-square'
                      } ${
                        isActive
                          ? 'border-[#00E5FF]/50 bg-[#00E5FF]/20 text-[#00E5FF]'
                          : 'border-white/10 bg-white/5 text-[#A1A1AA]'
                      }`}
                    >
                      <Film className="w-5 h-5" />
                      <span className="text-[9px] font-bold mt-0.5 tracking-tighter">
                        {p.aspectRatio}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[280px]">
                          {p.name}
                        </h3>
                        {isActive && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] text-[10px] font-bold uppercase tracking-wider shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
                            Editando
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[#A1A1AA]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#71717A]" />
                          {formatDuration(p.durationSec)}
                        </span>
                        <span>•</span>
                        <span>
                          {p.clipCount} {p.clipCount === 1 ? 'clip' : 'clips'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(p.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    {isDeletingThis ? (
                      <div className="flex items-center gap-1 bg-red-500/15 border border-red-500/30 p-1 rounded-lg">
                        <span className="text-[11px] text-red-400 font-semibold px-1">
                          ¿Borrar?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="px-2 py-0.5 rounded bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition"
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(null)}
                          className="px-2 py-0.5 rounded bg-white/10 text-white text-[11px] hover:bg-white/20 transition"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleExportProject(p.id, e)}
                          title="Descargar copia de respaldo (.capcutproj)"
                          className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#00E5FF] hover:bg-white/5 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleDuplicate}
                          title="Duplicar proyecto"
                          className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setProjectToDelete(p.id)}
                          title="Eliminar proyecto"
                          className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenProject(p.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            isActive
                              ? 'bg-[#00E5FF] text-[#09090B]'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          <span>{isActive ? 'Abierto' : 'Abrir'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#27272A] bg-[#09090B] text-[11px] text-[#A1A1AA]">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Almacenamiento Local del Dispositivo</span>
          </div>

          <div className="flex items-center gap-1.5">
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-1 text-[#00E5FF] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
                Guardando cambios...
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-1 text-[#22C55E] font-medium">
                <Check className="w-3.5 h-3.5" />
                Todo guardado
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
