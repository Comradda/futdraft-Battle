import { del, get, set } from 'idb-keyval'
import type {
  SavedProjectMetadata,
  SerializedProjectData,
  TimelineClip,
} from '../types/editor'
import { loadMediaBlobUrl } from './opfsStorage'

const PROJECTS_INDEX_KEY = 'capcut_projects_index_v1'
const ACTIVE_PROJECT_ID_KEY = 'capcut_active_project_id_v1'
const PROJECT_PREFIX = 'capcut_project_data_v1_'
const LOCAL_MIRROR_KEY = 'capcut_studio_project_autosave_v1'
const LOCAL_INDEX_KEY = 'capcut_projects_index_cache_v1'

function computeProjectDuration(clips: TimelineClip[]): number {
  if (!clips || clips.length === 0) return 0
  let maxTime = 0
  for (const c of clips) {
    const end = (c.startTime || 0) + (c.duration || 0)
    if (end > maxTime) maxTime = end
  }
  return Number(maxTime.toFixed(2))
}

export function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Returns the currently active project ID or null.
 */
export function getActiveProjectIdSync(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage.getItem(ACTIVE_PROJECT_ID_KEY)
}

export function setActiveProjectIdSync(id: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id)
  } catch {
    // Ignore storage quota
  }
}

/**
 * Lists all saved projects metadata sorted by most recently edited.
 */
export async function listSavedProjects(): Promise<SavedProjectMetadata[]> {
  try {
    const idbIndex = await get<SavedProjectMetadata[]>(PROJECTS_INDEX_KEY)
    if (Array.isArray(idbIndex) && idbIndex.length > 0) {
      return [...idbIndex].sort((a, b) => b.updatedAt - a.updatedAt)
    }
  } catch {
    // Fallback to localStorage cache
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_INDEX_KEY)
      if (raw) {
        const cached = JSON.parse(raw) as SavedProjectMetadata[]
        if (Array.isArray(cached)) {
          return cached.sort((a, b) => b.updatedAt - a.updatedAt)
        }
      }
    } catch {
      // Ignore
    }
  }

  return []
}

/**
 * Synchronous write to localStorage mirror for instantaneous tab close / navigation safety.
 */
export function saveProjectDataSync(data: SerializedProjectData): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    setActiveProjectIdSync(data.id)
    const jsonStr = JSON.stringify(data)
    window.localStorage.setItem(LOCAL_MIRROR_KEY, jsonStr)

    // Update metadata in fast localStorage index cache
    let list: SavedProjectMetadata[] = []
    const raw = window.localStorage.getItem(LOCAL_INDEX_KEY)
    if (raw) {
      try {
        list = JSON.parse(raw)
      } catch {
        list = []
      }
    }
    const durationSec = computeProjectDuration(data.clips)
    const meta: SavedProjectMetadata = {
      id: data.id,
      name: data.projectName,
      aspectRatio: data.aspectRatio,
      clipCount: data.clips.length,
      durationSec,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.savedAt,
    }
    const existingIdx = list.findIndex((p) => p.id === data.id)
    if (existingIdx >= 0) {
      list[existingIdx] = meta
    } else {
      list.unshift(meta)
    }
    window.localStorage.setItem(LOCAL_INDEX_KEY, JSON.stringify(list))
  } catch {
    // Quota exceeded in localStorage, IndexedDB remains the source of truth
  }
}

/**
 * Saves full project data to IndexedDB and updates the multi-project index.
 */
export async function saveProjectData(data: SerializedProjectData): Promise<void> {
  // 1. Immediate sync save to localStorage mirror
  saveProjectDataSync(data)

  // 2. Persist full data in IndexedDB (handles gigabytes with zero quota issues)
  const projectKey = `${PROJECT_PREFIX}${data.id}`
  try {
    await set(projectKey, data)
  } catch (err) {
    console.warn('Could not save project to IndexedDB:', err)
  }

  // 3. Update multi-project index in IndexedDB
  try {
    const durationSec = computeProjectDuration(data.clips)
    const meta: SavedProjectMetadata = {
      id: data.id,
      name: data.projectName,
      aspectRatio: data.aspectRatio,
      clipCount: data.clips.length,
      durationSec,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.savedAt,
    }

    let currentIndex = (await get<SavedProjectMetadata[]>(PROJECTS_INDEX_KEY)) || []
    if (!Array.isArray(currentIndex)) currentIndex = []

    const existingIdx = currentIndex.findIndex((p) => p.id === data.id)
    if (existingIdx >= 0) {
      currentIndex[existingIdx] = meta
    } else {
      currentIndex.unshift(meta)
    }

    await set(PROJECTS_INDEX_KEY, currentIndex)
  } catch (err) {
    console.warn('Could not update project index in IndexedDB:', err)
  }
}

/**
 * Loads project data by ID from IndexedDB or localStorage, restoring fresh Object URLs for media blobs.
 */
export async function loadProjectData(
  projectId: string
): Promise<SerializedProjectData | null> {
  let project: SerializedProjectData | null = null

  // Try IndexedDB first
  try {
    project = (await get<SerializedProjectData>(`${PROJECT_PREFIX}${projectId}`)) ?? null
  } catch {
    // Ignore and fallback
  }

  // Fallback to localStorage mirror if ID matches
  if (!project && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_MIRROR_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SerializedProjectData
        if (parsed && (parsed.id === projectId || !parsed.id)) {
          project = {
            ...parsed,
            id: projectId,
            createdAt: parsed.createdAt || Date.now(),
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  if (!project) return null

  // Re-acquire fresh Object URLs for all media blobs in this session
  const refreshedClips: TimelineClip[] = []
  for (const clip of project.clips) {
    if (clip.mediaBlobId) {
      const freshUrl = await loadMediaBlobUrl(clip.mediaBlobId)
      refreshedClips.push(freshUrl ? { ...clip, mediaUrl: freshUrl } : clip)
    } else {
      refreshedClips.push(clip)
    }
  }

  return {
    ...project,
    clips: refreshedClips,
  }
}

/**
 * Deletes a project from IndexedDB and removes it from the index.
 */
export async function deleteProjectData(projectId: string): Promise<void> {
  const projectKey = `${PROJECT_PREFIX}${projectId}`
  try {
    await del(projectKey)
  } catch {
    // Ignore
  }

  try {
    let index = (await get<SavedProjectMetadata[]>(PROJECTS_INDEX_KEY)) || []
    if (Array.isArray(index)) {
      index = index.filter((p) => p.id !== projectId)
      await set(PROJECTS_INDEX_KEY, index)
    }
  } catch {
    // Ignore
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_INDEX_KEY)
      if (raw) {
        const list = (JSON.parse(raw) as SavedProjectMetadata[]).filter(
          (p) => p.id !== projectId
        )
        window.localStorage.setItem(LOCAL_INDEX_KEY, JSON.stringify(list))
      }
      if (getActiveProjectIdSync() === projectId) {
        window.localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Duplicates an existing project under a new unique ID.
 */
export async function duplicateProjectData(
  projectId: string
): Promise<string | null> {
  const source = await loadProjectData(projectId)
  if (!source) return null

  const newId = generateProjectId()
  const duplicate: SerializedProjectData = {
    ...source,
    id: newId,
    projectName: `${source.projectName} (Copia)`,
    savedAt: Date.now(),
    createdAt: Date.now(),
  }

  await saveProjectData(duplicate)
  return newId
}

/**
 * Exports project as a downloadable `.capcutproj` JSON backup file.
 */
export function downloadProjectBackup(data: SerializedProjectData): void {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const sanitizedName = (data.projectName || 'Proyecto')
    .replace(/[^\w\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '_')
  const fileName = `${sanitizedName || 'Proyecto'}_${Date.now()}.capcutproj`

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Parses and validates an uploaded `.capcutproj` or `.json` project backup file.
 */
export async function parseProjectBackupFile(
  file: File
): Promise<SerializedProjectData> {
  const text = await file.text()
  const parsed = JSON.parse(text) as Partial<SerializedProjectData>

  if (!parsed || !Array.isArray(parsed.clips)) {
    throw new Error('El archivo no contiene una estructura de proyecto válida.')
  }

  const newId = generateProjectId()
  const restored: SerializedProjectData = {
    version: 1,
    id: newId,
    projectName: (parsed.projectName || file.name.replace(/\.[^/.]+$/, '')).trim(),
    aspectRatio: parsed.aspectRatio || '9:16',
    canvasBackground: parsed.canvasBackground || {
      mode: 'blur',
      blurLevel: 3,
      solidColor: '#09090B',
      gradientId: 'cyber_night',
      gradientColors: ['#09090B', '#1A103C'],
    },
    tracks: Array.isArray(parsed.tracks) && parsed.tracks.length > 0 ? parsed.tracks : [],
    clips: parsed.clips,
    playheadTime: 0,
    savedAt: Date.now(),
    createdAt: Date.now(),
  }

  return restored
}
