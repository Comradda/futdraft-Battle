import { del, get, set } from 'idb-keyval'

const OPFS_DIR_NAME = 'capcut_studio_media'
// Only persist blobs <= 45 MB in background storage so large 4-minute+ iPhone .mov files load in 0ms
const MAX_PERSIST_BLOB_BYTES = 45 * 1024 * 1024

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
 * while persisting smaller blobs asynchronously in the background.
 */
export async function storeMediaBlob(
  blobId: string,
  blob: Blob
): Promise<string> {
  const instantUrl = URL.createObjectURL(blob)

  if (blob.size <= MAX_PERSIST_BLOB_BYTES) {
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
        await set(`media_${blobId}`, blob)
      } catch {
        // Ignore background quota errors on mobile Safari
      }
    })()
  }

  return instantUrl
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
 * Fast iOS Safari (.mov / .mp4) metadata & filmstrip prober.
 * Resolves metadata quickly even on large 4-minute+ 4K iPhone recordings.
 */
export async function probeVideoFile(
  fileOrUrl: File | string,
  thumbCount = 4
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

    video.onloadedmetadata = async () => {
      let duration = video.duration
      // Handle iOS Safari Infinity duration edge-case on streamed .mov files
      if (!Number.isFinite(duration) || duration <= 0) {
        duration = 30
      }
      const width = video.videoWidth || 1080
      const height = video.videoHeight || 1920
      const thumbnails: string[] = []

      // For very large files (> 120 MB), skip multi-seek thumbnail extraction so import is instant
      const isLargeFile =
        typeof fileOrUrl !== 'string' && fileOrUrl.size > 120 * 1024 * 1024

      if (!isLargeFile && thumbCount > 0) {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 80
          canvas.height = 45
          const ctx = canvas.getContext('2d')

          if (ctx) {
            const count = Math.min(4, thumbCount)
            for (let i = 0; i < count; i++) {
              const targetTime = Math.min(
                duration - 0.05,
                Math.max(0.05, (duration * (i + 0.5)) / count)
              )
              await new Promise<void>((seekResolve) => {
                const seekTimer = window.setTimeout(() => {
                  video.removeEventListener('seeked', onSeeked)
                  seekResolve()
                }, 220)
                const onSeeked = () => {
                  window.clearTimeout(seekTimer)
                  video.removeEventListener('seeked', onSeeked)
                  try {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                    thumbnails.push(canvas.toDataURL('image/jpeg', 0.5))
                  } catch {
                    // Ignore
                  }
                  seekResolve()
                }
                video.addEventListener('seeked', onSeeked)
                try {
                  video.currentTime = targetTime
                } catch {
                  window.clearTimeout(seekTimer)
                  video.removeEventListener('seeked', onSeeked)
                  seekResolve()
                }
              })
            }
          }
        } catch {
          // Ignore thumbnail errors
        }
      }

      finish({ duration, width, height, thumbnails })
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
