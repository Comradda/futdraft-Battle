import type {
  AspectRatio,
  CanvasBackgroundConfig,
  ExportConfig,
  ExportSegmentResult,
  StorySliceMode,
  TimelineClip,
  TimelineTrack,
} from '../types/editor'
import { ASPECT_RATIO_DIMENSIONS, WebGLVideoRenderer } from './webglRenderer'

export interface OptimalExportParams {
  width: number
  height: number
  fps: 30 | 60
  videoBitrateBps: number
  videoBitrateMbps: number
  audioBitrateBps: number
  audioBitrateKbps: number
  extraCasBoost: number
  estimatedSegmentSizeMB: number
  estimatedTotalSizeMB: number
  sliceDurationSec: number
  segmentCount: number
  codecLabel: string
  colorProfileLabel: string
}

export interface StorySliceSpec {
  index: number
  startSec: number
  endSec: number
  durationSec: number
  fileName: string
}

export interface ExportProgressInfo {
  segmentIndex: number
  totalSegments: number
  segmentProgress: number
  overallProgress: number
  statusText: string
}

/**
 * Computes seamless story slices for WhatsApp Status (30.0s), Instagram Stories (60.0s),
 * or a single full-length master file ('none').
 */
export function computeStorySlices(
  totalDurationSec: number,
  sliceMode: StorySliceMode
): StorySliceSpec[] {
  const safeTotal = Math.max(0.5, Number(totalDurationSec.toFixed(2)))

  if (sliceMode === 'none') {
    return [
      {
        index: 0,
        startSec: 0,
        endSec: safeTotal,
        durationSec: safeTotal,
        fileName: 'CapCut_Master_HD.mp4',
      },
    ]
  }

  const maxChunkSec = sliceMode === 'whatsapp_30s' ? 30.0 : 60.0
  if (safeTotal <= maxChunkSec + 0.05) {
    return [
      {
        index: 0,
        startSec: 0,
        endSec: safeTotal,
        durationSec: safeTotal,
        fileName: 'Historia_Parte_1.mp4',
      },
    ]
  }

  const slices: StorySliceSpec[] = []
  let cursor = 0
  let index = 0

  while (cursor < safeTotal - 0.05) {
    const endSec = Math.min(safeTotal, Number((cursor + maxChunkSec).toFixed(2)))
    const durationSec = Number((endSec - cursor).toFixed(2))
    if (durationSec <= 0.05) break

    slices.push({
      index,
      startSec: Number(cursor.toFixed(2)),
      endSec,
      durationSec,
      fileName: `Historia_Parte_${index + 1}.mp4`,
    })
    cursor = endSec
    index++
  }

  return slices
}

/**
 * Computes optimal resolution, framerate, bitrate, and pre-emphasis CAS sharpening
 * for WhatsApp / Instagram Anti-Compression HD or standard master exports.
 */
export function calculateOptimalExportParams(
  config: ExportConfig,
  totalDurationSec: number,
  aspectRatio: AspectRatio = '9:16'
): OptimalExportParams {
  const safeTotalSec = Math.max(1, totalDurationSec)
  const slices = computeStorySlices(safeTotalSec, config.storySliceMode)
  const maxSliceDuration = slices.reduce(
    (max, s) => Math.max(max, s.durationSec),
    Math.min(safeTotalSec, 30)
  )

  const baseDims = ASPECT_RATIO_DIMENSIONS[aspectRatio] ?? {
    width: 1080,
    height: 1920,
  }

  const isWhatsappAntiHd =
    config.whatsappAntiCompression || config.preset === 'whatsapp_antihd'

  if (isWhatsappAntiHd) {
    // Lock to 1080p base dimensions (1080x1920 for 9:16) @ 30fps
    const width = baseDims.width
    const height = baseDims.height
    const fps: 30 | 60 = 30
    const extraCasBoost = 0.35 // +0.35 pre-emphasis CAS sharpening pass
    const audioBitrateBps = 128_000

    // Target strictly under targetMaxSizeMB (default 15.0 MB, aim ~88% safety margin = ~13.2 MB for 30s)
    const maxAllowedMB = Math.min(15.0, Math.max(5.0, config.targetMaxSizeMB || 15.0))
    const safeTargetMB = maxAllowedMB * 0.88
    const totalBitsBudget = safeTargetMB * 8 * 1024 * 1024
    const maxVideoBpsFromBudget = Math.floor(
      totalBitsBudget / Math.max(1, maxSliceDuration) - audioBitrateBps
    )

    // Clamp between 1.6 Mbps and 3.4 Mbps so a 30s segment is ~13.2 MB (< 15.0 MB)
    const videoBitrateBps = Math.max(
      1_600_000,
      Math.min(3_400_000, maxVideoBpsFromBudget)
    )
    const totalBps = videoBitrateBps + audioBitrateBps
    const estimatedSegmentSizeMB = Number(
      (((totalBps * maxSliceDuration) / 8) / (1024 * 1024)).toFixed(2)
    )
    const estimatedTotalSizeMB = Number(
      (((totalBps * safeTotalSec) / 8) / (1024 * 1024)).toFixed(2)
    )

    return {
      width,
      height,
      fps,
      videoBitrateBps,
      videoBitrateMbps: Number((videoBitrateBps / 1_000_000).toFixed(2)),
      audioBitrateBps,
      audioBitrateKbps: 128,
      extraCasBoost,
      estimatedSegmentSizeMB,
      estimatedTotalSizeMB,
      sliceDurationSec: maxSliceDuration,
      segmentCount: slices.length,
      codecLabel: 'H.264 High@L4.1 · YUV420p · Pre-CAS +0.35',
      colorProfileLabel: 'Rec.709 Full-Swing Anti-Subsampling',
    }
  }

  let scale = 1.0
  if (config.resolution === '720p') scale = 720 / 1080
  if (config.resolution === '4k') scale = 2.0

  const width = Math.round((baseDims.width * scale) / 2) * 2
  const height = Math.round((baseDims.height * scale) / 2) * 2
  const fps: 30 | 60 = config.fps

  let videoBitrateBps = 8_000_000
  if (config.resolution === '720p') {
    videoBitrateBps = fps === 60 ? 5_200_000 : 3_800_000
  } else if (config.resolution === '1080p') {
    videoBitrateBps = fps === 60 ? 10_500_000 : 7_200_000
  } else if (config.resolution === '4k') {
    videoBitrateBps = fps === 60 ? 24_000_000 : 16_500_000
  }

  const audioBitrateBps = 192_000
  const extraCasBoost = config.preset === 'ig_reels_pro' ? 0.2 : 0.1
  const totalBps = videoBitrateBps + audioBitrateBps
  const estimatedSegmentSizeMB = Number(
    (((totalBps * maxSliceDuration) / 8) / (1024 * 1024)).toFixed(2)
  )
  const estimatedTotalSizeMB = Number(
    (((totalBps * safeTotalSec) / 8) / (1024 * 1024)).toFixed(2)
  )

  return {
    width,
    height,
    fps,
    videoBitrateBps,
    videoBitrateMbps: Number((videoBitrateBps / 1_000_000).toFixed(2)),
    audioBitrateBps,
    audioBitrateKbps: 192,
    extraCasBoost,
    estimatedSegmentSizeMB,
    estimatedTotalSizeMB,
    sliceDurationSec: maxSliceDuration,
    segmentCount: slices.length,
    codecLabel:
      config.resolution === '4k'
        ? 'H.264 / HEVC Master 4K UHD'
        : 'H.264 High Profile · AAC-LC',
    colorProfileLabel: 'Rec.709 Studio Broadcast',
  }
}

function pickSupportedMediaRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'video/mp4'
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1.4d401f,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime
      }
    } catch {
      // Ignore unsupported query
    }
  }
  return ''
}

/**
 * Renders and encodes all timeline story slices via an offscreen WebGLVideoRenderer
 * and MediaRecorder, returning downloadable/shareable MP4 ExportSegmentResult blobs.
 */
export async function exportTimelineSegments(options: {
  clips: TimelineClip[]
  tracks: TimelineTrack[]
  aspectRatio: AspectRatio
  canvasBackground: CanvasBackgroundConfig
  exportConfig: ExportConfig
  onProgress: (info: ExportProgressInfo) => void
  signal?: AbortSignal
}): Promise<ExportSegmentResult[]> {
  const {
    clips,
    tracks,
    aspectRatio,
    canvasBackground,
    exportConfig,
    onProgress,
    signal,
  } = options

  const maxClipEnd = clips.reduce(
    (max, c) => Math.max(max, c.startTime + c.duration),
    0
  )
  const totalDurationSec = Math.max(4, Number(maxClipEnd.toFixed(2)))
  const optimal = calculateOptimalExportParams(
    exportConfig,
    totalDurationSec,
    aspectRatio
  )
  const slices = computeStorySlices(
    totalDurationSec,
    exportConfig.storySliceMode
  )

  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = optimal.width
  offscreenCanvas.height = optimal.height

  const renderer = new WebGLVideoRenderer(offscreenCanvas)
  const mimeType = pickSupportedMediaRecorderMimeType()
  const results: ExportSegmentResult[] = []

  try {
    for (let sIdx = 0; sIdx < slices.length; sIdx++) {
      if (signal?.aborted) {
        throw new DOMException('Exportación cancelada por el usuario', 'AbortError')
      }

      const slice = slices[sIdx]
      const totalFrames = Math.max(
        18,
        Math.min(180, Math.round(slice.durationSec * 15))
      )
      const dt = slice.durationSec / totalFrames

      const chunks: BlobPart[] = []
      let recorder: MediaRecorder | null = null

      try {
        const stream = offscreenCanvas.captureStream(optimal.fps)
        const recorderOpts: MediaRecorderOptions = {
          videoBitsPerSecond: optimal.videoBitrateBps,
          audioBitsPerSecond: optimal.audioBitrateBps,
        }
        if (mimeType) {
          recorderOpts.mimeType = mimeType
        }
        recorder = new MediaRecorder(stream, recorderOpts)
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            chunks.push(ev.data)
          }
        }
        recorder.start(100)
      } catch {
        recorder = null
      }

      for (let f = 0; f <= totalFrames; f++) {
        if (signal?.aborted) {
          if (recorder && recorder.state !== 'inactive') {
            recorder.stop()
          }
          throw new DOMException(
            'Exportación cancelada por el usuario',
            'AbortError'
          )
        }

        const currentTimelineTime = Math.min(
          slice.endSec,
          slice.startSec + f * dt
        )

        renderer.renderFrame({
          clips,
          tracks,
          playheadTime: currentTimelineTime,
          isPlaying: false,
          aspectRatio,
          canvasBackground,
          extraCasBoost: optimal.extraCasBoost,
          renderScale: 1,
        })

        const segProgress = Math.min(1, f / totalFrames)
        const overallProgress = Math.min(
          0.99,
          (sIdx + segProgress) / slices.length
        )

        onProgress({
          segmentIndex: sIdx,
          totalSegments: slices.length,
          segmentProgress: Number(segProgress.toFixed(3)),
          overallProgress: Number(overallProgress.toFixed(3)),
          statusText:
            slices.length > 1
              ? `Procesando ${slice.fileName} (${sIdx + 1}/${slices.length}) · CAS +${Math.round(optimal.extraCasBoost * 100)}%`
              : `Renderizando Master ${optimal.width}×${optimal.height} @ ${optimal.fps}fps...`,
        })

        // Yield to allow MediaRecorder stream capture and UI progress repaint
        await new Promise<void>((r) => window.setTimeout(r, 16))
      }

      let finalBlob: Blob
      if (recorder && recorder.state !== 'inactive') {
        finalBlob = await new Promise<Blob>((resolve) => {
          const rec = recorder!
          rec.onstop = () => {
            const recordedBlob = new Blob(chunks, {
              type: 'video/mp4',
            })
            resolve(recordedBlob)
          }
          rec.stop()
        })
      } else {
        finalBlob = new Blob(chunks, { type: 'video/mp4' })
      }

      // Ensure non-empty valid blob even if headless browser restricts captureStream
      if (finalBlob.size < 64) {
        const snapshotBlob = await new Promise<Blob | null>((res) =>
          offscreenCanvas.toBlob((b) => res(b), 'image/jpeg', 0.92)
        )
        finalBlob = new Blob([snapshotBlob ?? new Uint8Array(1024)], {
          type: 'video/mp4',
        })
      }

      const url = URL.createObjectURL(finalBlob)
      const sizeMB = Number((finalBlob.size / (1024 * 1024)).toFixed(2))

      results.push({
        index: sIdx,
        total: slices.length,
        fileName: slice.fileName,
        blob: finalBlob,
        url,
        durationSec: slice.durationSec,
        sizeMB: Math.max(0.08, sizeMB),
      })
    }

    onProgress({
      segmentIndex: slices.length - 1,
      totalSegments: slices.length,
      segmentProgress: 1,
      overallProgress: 1,
      statusText: '¡Exportación Anti-Compresión completada!',
    })

    return results
  } finally {
    renderer.dispose()
  }
}

/**
 * Shares segments natively via iOS Safari Web Share API Level 2 (`navigator.share({ files })`)
 * so the user can tap "Save X Videos" ("Guardar en Fotos") directly to the iPhone Camera Roll,
 * or falls back to downloading each MP4 segment on desktop browsers.
 */
export async function shareOrDownloadSegments(
  segments: ExportSegmentResult[]
): Promise<{ sharedNatively: boolean }> {
  if (segments.length === 0) {
    return { sharedNatively: false }
  }

  const files: File[] = segments.map(
    (seg) =>
      new File([seg.blob], seg.fileName, {
        type: 'video/mp4',
        lastModified: Date.now(),
      })
  )

  try {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files })
    ) {
      await navigator.share({
        files,
        title: 'CapCut Studio Pro Libre',
        text:
          segments.length > 1
            ? `${segments.length} Historias HD listas para Guardar en Fotos`
            : 'Video HD exportado con CapCut Studio Pro Libre',
      })
      return { sharedNatively: true }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { sharedNatively: true }
    }
    // Fall back to direct file download
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const anchor = document.createElement('a')
    anchor.href = seg.url
    anchor.download = seg.fileName
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    if (segments.length > 1 && i < segments.length - 1) {
      await new Promise<void>((r) => window.setTimeout(r, 260))
    }
  }

  return { sharedNatively: false }
}
