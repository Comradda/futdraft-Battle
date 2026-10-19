import { del, get, set } from 'idb-keyval'

const OPFS_DIR_NAME = 'capcut_studio_media'

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
    // Fallback to IndexedDB when OPFS is restricted in private browsing
  }
  return null
}

/**
 * Stores a large video/audio Blob in Origin Private File System (OPFS)
 * or IndexedDB (`idb-keyval`) so iOS Safari WebKit never hits RAM Jetsam limits.
 */
export async function storeMediaBlob(
  blobId: string,
  blob: Blob
): Promise<string> {
  const opfsDir = await getOpfsRoot()
  if (opfsDir) {
    try {
      const fileHandle = await opfsDir.getFileHandle(blobId, { create: true })
      if ('createWritable' in fileHandle) {
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()
        const file = await fileHandle.getFile()
        return URL.createObjectURL(file)
      }
    } catch {
      // Fall through to IndexedDB
    }
  }

  await set(`media_${blobId}`, blob)
  return URL.createObjectURL(blob)
}

/**
 * Retrieves a stored media Blob from OPFS or IndexedDB and returns a fresh Object URL.
 */
export async function loadMediaBlobUrl(blobId: string): Promise<string | null> {
  const opfsDir = await getOpfsRoot()
  if (opfsDir) {
    try {
      const fileHandle = await opfsDir.getFileHandle(blobId)
      const file = await fileHandle.getFile()
      return URL.createObjectURL(file)
    } catch {
      // Try IndexedDB fallback
    }
  }

  try {
    const blob = await get<Blob>(`media_${blobId}`)
    if (blob) {
      return URL.createObjectURL(blob)
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
 * Extracts duration and filmstrip thumbnails from a video file on iOS Safari (.mov / .mp4).
 */
export async function probeVideoFile(
  fileOrUrl: File | string,
  thumbCount = 6
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
    video.crossOrigin = 'anonymous'

    const url =
      typeof fileOrUrl === 'string'
        ? fileOrUrl
        : URL.createObjectURL(fileOrUrl)
    const shouldRevoke = typeof fileOrUrl !== 'string'

    const cleanup = () => {
      if (shouldRevoke) {
        URL.revokeObjectURL(url)
      }
      video.removeAttribute('src')
      video.load()
    }

    const timeoutId = window.setTimeout(() => {
      cleanup()
      resolve({
        duration: 10,
        width: 1080,
        height: 1920,
        thumbnails: [],
      })
    }, 6500)

    video.onloadedmetadata = async () => {
      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : 10
      const width = video.videoWidth || 1080
      const height = video.videoHeight || 1920
      const thumbnails: string[] = []

      try {
        const canvas = document.createElement('canvas')
        canvas.width = 96
        canvas.height = 54
        const ctx = canvas.getContext('2d')

        if (ctx) {
          for (let i = 0; i < thumbCount; i++) {
            const targetTime = Math.min(
              duration - 0.05,
              Math.max(0.05, (duration * (i + 0.5)) / thumbCount)
            )
            await new Promise<void>((seekResolve) => {
              const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked)
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                thumbnails.push(canvas.toDataURL('image/jpeg', 0.55))
                seekResolve()
              }
              video.addEventListener('seeked', onSeeked)
              video.currentTime = targetTime
              setTimeout(() => {
                video.removeEventListener('seeked', onSeeked)
                seekResolve()
              }, 450)
            })
          }
        }
      } catch {
        // Fallback if seeking restricted
      }

      window.clearTimeout(timeoutId)
      cleanup()
      resolve({ duration, width, height, thumbnails })
    }

    video.onerror = () => {
      window.clearTimeout(timeoutId)
      cleanup()
      resolve({
        duration: 10,
        width: 1080,
        height: 1920,
        thumbnails: [],
      })
    }

    video.src = url
  })
}
