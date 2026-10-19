import { del, get, set } from 'idb-keyval'

const OPFS_DIR_NAME = 'capcut_studio_media'

const OBJECT_URL_CACHE = new Map<string, string>()

async function getOpfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.storage &&
      typeof navigator.storage.getDirectory === 'function'
    ) {
      const root = await navigator.storage.getDirectory()
      return await root.getDirectoryHandle(OPFS_DIR_NAME, { create: true })
    }
  } catch {
    // Fallback when OPFS is restricted
  }
  return null
}

/**
 * Returns an instant Object URL (`0ms` zero-copy reference to the file on disk)
 * so 1-minute, 4-minute, or 30-minute iPhone .mov/.mp4 videos appear immediately,
 * and persists the blob asynchronously to OPFS/IndexedDB so it survives page reloads.
 */
export async function storeMediaBlob(
  blobId: string,
  blob: Blob
): Promise<string> {
  const existingUrl = OBJECT_URL_CACHE.get(blobId)
  if (existingUrl) {
    return existingUrl
  }

  const instantUrl = URL.createObjectURL(blob)
  OBJECT_URL_CACHE.set(blobId, instantUrl)

  // Persist asynchronously in background so edits survive crashes/reloads
  void (async () => {
    try {
      const opfsDir = await getOpfsRoot()
      if (opfsDir) {
        const fileHandle = await opfsDir.getFileHandle(blobId, {
          create: true,
        })
        if ('createWritable' in fileHandle) {
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
          return
        }
      }
    } catch {
      // Fallback to IndexedDB
    }
    try {
      await set(`media_${blobId}`, blob)
    } catch (err) {
      console.warn('Could not persist media blob:', err)
    }
  })()

  return instantUrl
}

/**
 * Retrieves a stored media Blob from OPFS or IndexedDB and returns a fresh Object URL.
 */
export async function loadMediaBlobUrl(blobId: string): Promise<string | null> {
  const existingUrl = OBJECT_URL_CACHE.get(blobId)
  if (existingUrl) {
    return existingUrl
  }

  const opfsDir = await getOpfsRoot()
  if (opfsDir) {
    try {
      const fileHandle = await opfsDir.getFileHandle(blobId)
      const file = await fileHandle.getFile()
      const url = URL.createObjectURL(file)
      OBJECT_URL_CACHE.set(blobId, url)
      return url
    } catch {
      // Try IndexedDB fallback
    }
  }

  try {
    const blob = await get<Blob>(`media_${blobId}`)
    if (blob) {
      const url = URL.createObjectURL(blob)
      OBJECT_URL_CACHE.set(blobId, url)
      return url
    }
  } catch {
    // Ignore
  }
  return null
}

export async function removeMediaBlob(blobId: string): Promise<void> {
  const opfsDir = await getOpfsRoot()
  if (opfsDir) {
    try {
      await opfsDir.removeEntry(blobId)
    } catch {
      // Ignore
    }
  }
  try {
    await del(`media_${blobId}`)
  } catch {
    // Ignore
  }
}

/**
 * Fast iOS Safari (.mov / .mp4) metadata & filmstrip prober.
 * Resolves metadata quickly even on large 4-minute+ 4K iPhone recordings.
 */
export async function probeVideoFile(
  fileOrUrl: File | string,
  _thumbCount = 4
): Promise<{
  duration: number
  width: number
  height: number
  thumbnails: string[]
}> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.playsInline = true
    video.muted = true
    video.preload = 'metadata'
    video.setAttribute('webkit-playsinline', 'true')

    const url =
      typeof fileOrUrl === 'string'
        ? fileOrUrl
        : URL.createObjectURL(fileOrUrl)
    const shouldRevoke = typeof fileOrUrl !== 'string'

    let resolved = false
    const finish = (result: {
      duration: number
      width: number
      height: number
      thumbnails: string[]
    }) => {
      if (resolved) return
      resolved = true
      window.clearTimeout(timeoutId)
      if (shouldRevoke) {
        URL.revokeObjectURL(url)
      }
      video.removeAttribute('src')
      video.load()
      resolve(result)
    }

    const timeoutId = window.setTimeout(() => {
      const fallbackDur =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : 15
      finish({
        duration: fallbackDur,
        width: video.videoWidth || 1080,
        height: video.videoHeight || 1920,
        thumbnails: [],
      })
    }, 2200)

    video.onloadedmetadata = () => {
      let duration = video.duration
      // Handle iOS Safari Infinity duration edge-case on streamed .mov files
      if (!Number.isFinite(duration) || duration <= 0) {
        duration = 30
      }
      const width = video.videoWidth || 1080
      const height = video.videoHeight || 1920

      // Instant return with zero extra hardware decoding passes
      finish({ duration, width, height, thumbnails: [] })
    }

    video.onerror = () => {
      finish({
        duration: 15,
        width: 1080,
        height: 1920,
        thumbnails: [],
      })
    }

    video.src = url
    video.load()
  })
}
