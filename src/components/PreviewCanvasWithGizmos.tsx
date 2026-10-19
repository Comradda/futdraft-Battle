import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  Play,
  Pause,
  Diamond,
  Snowflake,
  Plus,
  Maximize2,
  Minimize2,
  RotateCw,
} from 'lucide-react'
import {
  useEditorStore,
  getInterpolatedClipProps,
} from '../store/useEditorStore'
import { WebGLVideoRenderer } from '../engine/webglRenderer'
import { audioEngine, unlockAudioContext } from '../engine/audioEngine'
import { storeMediaBlob, probeVideoFile } from '../utils/opfsStorage'
import { SocialSafeZoneHUD } from './SocialSafeZoneHUD'
import { LiveHistogram } from './LiveHistogram'
import type { AspectRatio } from '../types/editor'

function getAspectNumeric(ratio: AspectRatio): number {
  switch (ratio) {
    case '9:16':
      return 9 / 16
    case '4:5':
      return 4 / 5
    case '1:1':
      return 1
    case '16:9':
      return 16 / 9
    case '2.35:1':
      return 2.35
    default:
      return 9 / 16
  }
}

function getCanvasResolution(ratio: AspectRatio): { w: number; h: number } {
  switch (ratio) {
    case '9:16':
      return { w: 720, h: 1280 }
    case '4:5':
      return { w: 864, h: 1080 }
    case '1:1':
      return { w: 960, h: 960 }
    case '16:9':
      return { w: 1280, h: 720 }
    case '2.35:1':
      return { w: 1280, h: 544 }
  }
}

function formatTimecode60Fps(seconds: number): string {
  const safe = Math.max(0, seconds)
  const mins = Math.floor(safe / 60)
  const secs = Math.floor(safe % 60)
  const frames = Math.floor((safe - Math.floor(safe)) * 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
}

export const PreviewCanvasWithGizmos: React.FC = () => {
  const clips = useEditorStore((s) => s.clips)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const playheadTime = useEditorStore((s) => s.playheadTime)
  const isPlaying = useEditorStore((s) => s.isPlaying)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const snapGuides = useEditorStore((s) => s.snapGuides)

  const togglePlay = useEditorStore((s) => s.togglePlay)
  const setAudioUnlocked = useEditorStore((s) => s.setAudioUnlocked)
  const toggleKeyframeAtPlayhead = useEditorStore(
    (s) => s.toggleKeyframeAtPlayhead
  )
  const hasKeyframeAtPlayhead = useEditorStore((s) => s.hasKeyframeAtPlayhead)
  const freezeSelectedClip = useEditorStore((s) => s.freezeSelectedClip)
  const addMediaClip = useEditorStore((s) => s.addMediaClip)
  const updateClipTransform = useEditorStore((s) => s.updateClipTransform)
  const setSnapGuides = useEditorStore((s) => s.setSnapGuides)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const getTotalDuration = useEditorStore((s) => s.getTotalDuration)

  const viewportContainerRef = useRef<HTMLDivElement>(null)
  const stageBoxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGLVideoRenderer | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [stageDimensions, setStageDimensions] = useState<{
    width: number
    height: number
  }>({ width: 220, height: 391 })
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Multi-touch / Mouse Gizmo Drag State
  const gizmoGestureRef = useRef<{
    mode: 'move' | 'scale' | 'rotate' | 'pinch'
    clipId: string
    startClientX: number
    startClientY: number
    initialX: number
    initialY: number
    initialScale: number
    initialRotation: number
    pinchStartDist: number
    pinchStartAngle: number
  } | null>(null)

  // Compute responsive stage dimensions that fit inside the 42% viewport
  const recomputeStageSize = useCallback(() => {
    const container = viewportContainerRef.current
    if (!container) return
    const pad = 12
    const availW = Math.max(120, container.clientWidth - pad * 2)
    const availH = Math.max(120, container.clientHeight - pad * 2)
    const targetAspect = getAspectNumeric(aspectRatio)

    let w = availH * targetAspect
    let h = availH
    if (w > availW) {
      w = availW
      h = availW / targetAspect
    }
    setStageDimensions({
      width: Math.round(w),
      height: Math.round(h),
    })
  }, [aspectRatio])

  useEffect(() => {
    recomputeStageSize()
    const el = viewportContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(recomputeStageSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [recomputeStageSize])

  // Instantiate WebGLVideoRenderer and run 60fps rAF loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rendererInstance = new WebGLVideoRenderer(canvas)
    rendererRef.current = rendererInstance

    let rafId = 0
    let lastFrameTime = performance.now()
    let lastHistogramUpdate = 0
    let lastStoreSync = 0
    let livePlayhead = useEditorStore.getState().playheadTime
    let lastKnownStorePlayhead = livePlayhead

    const tick = (now: number) => {
      const dt = Math.min(0.065, Math.max(0, (now - lastFrameTime) / 1000))
      lastFrameTime = now

      const state = useEditorStore.getState()

      // Detect if user scrubbed or jumped playhead externally
      if (Math.abs(state.playheadTime - lastKnownStorePlayhead) > 0.05) {
        livePlayhead = state.playheadTime
        lastKnownStorePlayhead = state.playheadTime
      }

      if (state.isPlaying) {
        const totalDur = state.getTotalDuration()
        const hwClock = rendererRef.current?.getActiveVideoClock(
          state.clips,
          livePlayhead
        )
        if (
          hwClock !== null &&
          hwClock !== undefined &&
          Math.abs(hwClock - livePlayhead) < 0.75
        ) {
          livePlayhead = hwClock
        } else {
          livePlayhead += dt
        }

        if (livePlayhead >= totalDur) {
          livePlayhead = 0
          state.setPlayhead(0, false)
          lastKnownStorePlayhead = 0
        } else if (now - lastStoreSync >= 42) {
          // Update React store at ~24Hz so UI timecode & timeline scroll stay smooth without 60Hz React DOM thrashing
          lastStoreSync = now
          state.setPlayhead(livePlayhead, false)
          lastKnownStorePlayhead = livePlayhead
        }
      } else {
        livePlayhead = state.playheadTime
        lastKnownStorePlayhead = state.playheadTime
      }

      // Sync WebAudio playback & DSP chains
      audioEngine.sync({
        playheadTime: livePlayhead,
        isPlaying: state.isPlaying,
        clips: state.clips,
        tracks: state.tracks,
      })

      // Render WebGL composite frame
      if (rendererRef.current) {
        rendererRef.current.renderFrame({
          clips: state.clips,
          tracks: state.tracks,
          playheadTime: livePlayhead,
          isPlaying: state.isPlaying,
          aspectRatio: state.aspectRatio,
          canvasBackground: state.canvasBackground,
          renderScale: state.isPlaying ? 0.65 : 0.85,
        })

        // Throttle histogram readout to ~10Hz when visible
        if (state.showHistogram && now - lastHistogramUpdate >= 100) {
          lastHistogramUpdate = now
          const hist = rendererRef.current.computeHistogram()
          state.setHistogramData(hist)
        }
      }

      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(rafId)
      audioEngine.stopAll()
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
    }
  }, [])

  // Update internal canvas pixel resolution when aspectRatio changes
  const canvasRes = getCanvasResolution(aspectRatio)

  // Selected visual clip for On-Canvas Gizmo
  const selectedClip = clips.find((c) => c.id === selectedClipId) ?? null
  const isVisualClipSelected =
    selectedClip !== null &&
    (selectedClip.trackType === 'video' ||
      selectedClip.trackType === 'pip' ||
      selectedClip.trackType === 'text')

  const interpolatedProps = selectedClip
    ? getInterpolatedClipProps(selectedClip, playheadTime)
    : null

  // Snap helper for x, y (-1..1)
  const applyMagneticSnapping = useCallback(
    (rawX: number, rawY: number) => {
      const snapThreshold = 0.035
      let finalX = rawX
      let finalY = rawY
      let snapCenterX = false
      let snapCenterY = false
      let snapThirdsX: number | null = null
      let snapThirdsY: number | null = null

      if (Math.abs(rawX) <= snapThreshold) {
        finalX = 0
        snapCenterX = true
      } else if (Math.abs(rawX - 0.333) <= snapThreshold) {
        finalX = 0.333
        snapThirdsX = 0.333
      } else if (Math.abs(rawX + 0.333) <= snapThreshold) {
        finalX = -0.333
        snapThirdsX = -0.333
      }

      if (Math.abs(rawY) <= snapThreshold) {
        finalY = 0
        snapCenterY = true
      } else if (Math.abs(rawY - 0.333) <= snapThreshold) {
        finalY = 0.333
        snapThirdsY = 0.333
      } else if (Math.abs(rawY + 0.333) <= snapThreshold) {
        finalY = -0.333
        snapThirdsY = -0.333
      }

      setSnapGuides({
        snapCenterX,
        snapCenterY,
        snapThirdsX,
        snapThirdsY,
      })

      return { x: Number(finalX.toFixed(4)), y: Number(finalY.toFixed(4)) }
    },
    [setSnapGuides]
  )

  const clearCanvasSnapGuides = useCallback(() => {
    setSnapGuides({
      snapCenterX: false,
      snapCenterY: false,
      snapThirdsX: null,
      snapThirdsY: null,
    })
  }, [setSnapGuides])

  // Global pointer move/up for 1-finger / mouse Gizmo operations
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const g = gizmoGestureRef.current
      if (!g || g.mode === 'pinch') return
      const stage = stageBoxRef.current
      if (!stage) return
      const rect = stage.getBoundingClientRect()

      if (g.mode === 'move') {
        const dxNorm = ((e.clientX - g.startClientX) / Math.max(1, rect.width)) * 2
        const dyNorm =
          ((e.clientY - g.startClientY) / Math.max(1, rect.height)) * 2
        const snapped = applyMagneticSnapping(
          g.initialX + dxNorm,
          g.initialY + dyNorm
        )
        updateClipTransform(g.clipId, { x: snapped.x, y: snapped.y }, false)
      } else if (g.mode === 'scale') {
        const dx = e.clientX - g.startClientX
        const dy = e.clientY - g.startClientY
        const deltaScale = (dx - dy) / Math.max(80, rect.width * 0.6)
        const nextScale = Math.max(
          0.15,
          Math.min(4.5, Number((g.initialScale + deltaScale).toFixed(3)))
        )
        updateClipTransform(g.clipId, { scale: nextScale }, false)
      } else if (g.mode === 'rotate') {
        const centerX = rect.left + rect.width * (0.5 + g.initialX * 0.5)
        const centerY = rect.top + rect.height * (0.5 + g.initialY * 0.5)
        const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX)
        let angleDeg = (angleRad * 180) / Math.PI + 90
        // Snap rotation to 0, 90, -90, 180 within 4 degrees
        for (const snapAngle of [-180, -90, 0, 90, 180]) {
          if (Math.abs(angleDeg - snapAngle) <= 4) {
            angleDeg = snapAngle
            break
          }
        }
        updateClipTransform(
          g.clipId,
          { rotation: Math.round(angleDeg) },
          false
        )
      }
    }

    const handlePointerUp = () => {
      if (gizmoGestureRef.current) {
        gizmoGestureRef.current = null
        clearCanvasSnapGuides()
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [applyMagneticSnapping, clearCanvasSnapGuides, updateClipTransform])

  // 2-Finger Multi-Touch Pinch (Scale) + Twist (Rotate) on Stage
  const handleStageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!selectedClip || !isVisualClipSelected) return
    if (e.touches.length === 2) {
      e.stopPropagation()
      const t0 = e.touches[0]
      const t1 = e.touches[1]
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
      const angle =
        (Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX) * 180) /
        Math.PI
      pushHistory()
      gizmoGestureRef.current = {
        mode: 'pinch',
        clipId: selectedClip.id,
        startClientX: 0,
        startClientY: 0,
        initialX: selectedClip.transform.x,
        initialY: selectedClip.transform.y,
        initialScale: selectedClip.transform.scale,
        initialRotation: selectedClip.transform.rotation,
        pinchStartDist: Math.max(12, dist),
        pinchStartAngle: angle,
      }
    }
  }

  const handleStageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const g = gizmoGestureRef.current
    if (!g || g.mode !== 'pinch' || e.touches.length !== 2) return
    e.preventDefault()
    const t0 = e.touches[0]
    const t1 = e.touches[1]
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
    const angle =
      (Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX) * 180) /
      Math.PI

    const scaleRatio = dist / g.pinchStartDist
    const nextScale = Math.max(
      0.15,
      Math.min(4.5, Number((g.initialScale * scaleRatio).toFixed(3)))
    )
    let nextRotation = Math.round(
      g.initialRotation + (angle - g.pinchStartAngle)
    )
    if (Math.abs(nextRotation) <= 3) nextRotation = 0

    updateClipTransform(
      g.clipId,
      { scale: nextScale, rotation: nextRotation },
      false
    )
  }

  const handleStageTouchEnd = () => {
    if (gizmoGestureRef.current?.mode === 'pinch') {
      gizmoGestureRef.current = null
      clearCanvasSnapGuides()
    }
  }

  const handlePlayToggle = async () => {
    const unlocked = await unlockAudioContext()
    if (unlocked) {
      setAudioUnlocked(true)
    }
    togglePlay()
  }

  const handleQuickMediaImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const blobId = `media_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const mediaUrl = await storeMediaBlob(blobId, file)

    if (file.type.startsWith('audio/')) {
      addMediaClip({
        trackType: 'audio',
        name: file.name,
        mediaUrl,
        mediaBlobId: blobId,
        sourceDuration: 12,
      })
    } else {
      const meta = await probeVideoFile(file, 6)
      addMediaClip({
        trackType: 'video',
        name: file.name,
        mediaUrl,
        mediaBlobId: blobId,
        sourceDuration: meta.duration,
        thumbnails: meta.thumbnails,
      })
    }
  }

  const handleToggleFullscreen = () => {
    const el = viewportContainerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      if (typeof el.requestFullscreen === 'function') {
        void el.requestFullscreen().catch(() => {
          setIsFullscreen((v) => !v)
        })
      } else {
        setIsFullscreen((v) => !v)
      }
    } else {
      void document.exitFullscreen().catch(() => {
        setIsFullscreen(false)
      })
    }
  }

  const totalDuration = getTotalDuration()
  const keyframeActive = hasKeyframeAtPlayhead()

  // Calculate Gizmo Box geometry in stage pixels
  const gizmoBaseW =
    selectedClip?.trackType === 'text'
      ? stageDimensions.width * 0.72
      : stageDimensions.width * 0.82
  const gizmoBaseH =
    selectedClip?.trackType === 'text'
      ? stageDimensions.height * 0.16
      : stageDimensions.height * 0.82

  return (
    <>
      {/* 1. Interactive Preview Viewport (Flex-1 Responsive Height) */}
      <div
        ref={viewportContainerRef}
        className={`relative flex w-full items-center justify-center overflow-hidden bg-[#09090B] select-none ${
          isFullscreen ? 'fixed inset-0 z-50 h-full' : 'flex-1 min-h-[140px]'
        }`}
      >
        {/* Floating Broadcast RGB/IRE Histogram HUD */}
        <LiveHistogram />

        {/* Aspect-Ratio Locked Stage Container */}
        <div
          ref={stageBoxRef}
          style={{
            width: stageDimensions.width,
            height: stageDimensions.height,
          }}
          onTouchStart={handleStageTouchStart}
          onTouchMove={handleStageTouchMove}
          onTouchEnd={handleStageTouchEnd}
          className="relative overflow-hidden rounded-xl border border-white/15 bg-black shadow-[0_8px_30px_rgba(0,0,0,0.85)]"
        >
          {/* Real-Time WebGL 2.0 / 1.0 Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasRes.w}
            height={canvasRes.h}
            className="block h-full w-full object-contain"
          />

          {/* Social Safe-Zone HUD Overlay (IG Stories, IG Reels, WhatsApp Status, TikTok) */}
          <SocialSafeZoneHUD />

          {/* Magnetic Cyan Snapping Guides (#00E5FF) */}
          {snapGuides.snapCenterX && (
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-[1.5px] -translate-x-1/2 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />
          )}
          {snapGuides.snapCenterY && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-[1.5px] -translate-y-1/2 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />
          )}
          {snapGuides.snapThirdsX !== null && (
            <div
              style={{
                left: `${(0.5 + snapGuides.snapThirdsX * 0.5) * 100}%`,
              }}
              className="pointer-events-none absolute inset-y-0 z-30 w-px -translate-x-1/2 border-l border-dashed border-[#00E5FF] shadow-[0_0_8px_#00E5FF]"
            />
          )}
          {snapGuides.snapThirdsY !== null && (
            <div
              style={{
                top: `${(0.5 + snapGuides.snapThirdsY * 0.5) * 100}%`,
              }}
              className="pointer-events-none absolute inset-x-0 z-30 h-px -translate-y-1/2 border-t border-dashed border-[#00E5FF] shadow-[0_0_8px_#00E5FF]"
            />
          )}

          {/* Direct On-Canvas Multi-Touch Transform Gizmo */}
          {isVisualClipSelected && selectedClip && interpolatedProps && (
            <div
              style={{
                width: gizmoBaseW,
                height: gizmoBaseH,
                left: `${(0.5 + interpolatedProps.x * 0.5) * 100}%`,
                top: `${(0.5 + interpolatedProps.y * 0.5) * 100}%`,
                transform: `translate(-50%, -50%) scale(${interpolatedProps.scale}) rotate(${interpolatedProps.rotation}deg)`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation()
                pushHistory()
                gizmoGestureRef.current = {
                  mode: 'move',
                  clipId: selectedClip.id,
                  startClientX: e.clientX,
                  startClientY: e.clientY,
                  initialX: selectedClip.transform.x,
                  initialY: selectedClip.transform.y,
                  initialScale: selectedClip.transform.scale,
                  initialRotation: selectedClip.transform.rotation,
                  pinchStartDist: 100,
                  pinchStartAngle: 0,
                }
              }}
              className=" absolute z-25 cursor-move rounded border-[1.5px] border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.35)]"
            >
              {/* Top Rotation Stem Handle */}
              <div
                onPointerDown={(e) => {
                  e.stopPropagation()
                  pushHistory()
                  gizmoGestureRef.current = {
                    mode: 'rotate',
                    clipId: selectedClip.id,
                    startClientX: e.clientX,
                    startClientY: e.clientY,
                    initialX: selectedClip.transform.x,
                    initialY: selectedClip.transform.y,
                    initialScale: selectedClip.transform.scale,
                    initialRotation: selectedClip.transform.rotation,
                    pinchStartDist: 100,
                    pinchStartAngle: 0,
                  }
                }}
                title="Rotar capa"
                className="absolute -top-6 left-1/2 flex h-5 w-5 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-[#09090B] bg-[#00E5FF] text-[#09090B] shadow-md"
              >
                <RotateCw className="h-3 w-3" />
              </div>

              {/* 4 Corner Scale Handles */}
              {(
                [
                  '-top-1.5 -left-1.5 cursor-nwse-resize',
                  '-top-1.5 -right-1.5 cursor-nesw-resize',
                  '-bottom-1.5 -left-1.5 cursor-nesw-resize',
                  '-bottom-1.5 -right-1.5 cursor-nwse-resize',
                ] as const
              ).map((posClass, idx) => (
                <div
                  key={idx}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    pushHistory()
                    gizmoGestureRef.current = {
                      mode: 'scale',
                      clipId: selectedClip.id,
                      startClientX: e.clientX,
                      startClientY: e.clientY,
                      initialX: selectedClip.transform.x,
                      initialY: selectedClip.transform.y,
                      initialScale: selectedClip.transform.scale,
                      initialRotation: selectedClip.transform.rotation,
                      pinchStartDist: 100,
                      pinchStartAngle: 0,
                    }
                  }}
                  title="Escalar capa"
                  className={`absolute h-3 w-3 rounded-full border border-[#09090B] bg-white shadow ${posClass}`}
                />
              ))}

              {/* Subtle HUD readout pill on gizmo */}
              <div className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 rounded bg-[#09090B]/85 px-1.5 py-0.5 font-mono text-[8px] font-bold whitespace-nowrap text-[#00E5FF]">
                {Math.round(interpolatedProps.scale * 100)}% •{' '}
                {Math.round(interpolatedProps.rotation)}°
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Playback & Quick-Action Strip (36px height) */}
      <div className="flex h-[36px] min-h-[36px] w-full shrink-0 items-center justify-between border-t border-[#1F1F23] bg-[#0E0E11] px-2.5 select-none">
        {/* Left: Play/Pause + 60fps Timecode */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handlePlayToggle()}
            title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F4F6] text-[#09090B] shadow transition-transform active:scale-90"
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
            )}
          </button>

          <div className="flex items-baseline gap-1 font-mono text-[11px]">
            <span className="font-bold text-[#F4F4F6]">
              {formatTimecode60Fps(playheadTime)}
            </span>
            <span className="text-[10px] text-[#A1A1AA]">
              / {formatTimecode60Fps(totalDuration)}
            </span>
          </div>
        </div>

        {/* Right: Keyframe Diamond (♦+ / ♦-), Freeze ('Congelar'), + Media, Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* Keyframe Diamond Button */}
          <button
            type="button"
            onClick={toggleKeyframeAtPlayhead}
            disabled={!selectedClipId}
            title={
              keyframeActive
                ? 'Eliminar Keyframe en el cabezal (♦-)'
                : 'Añadir Keyframe en el cabezal (♦+)'
            }
            className={`flex h-7 items-center gap-1 rounded-lg border px-2 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-35 ${
              keyframeActive
                ? 'border-[#FE2C55] bg-[#FE2C55] text-white shadow-[0_0_12px_rgba(254,44,85,0.55)]'
                : 'border-[#27272A] bg-[#141417] text-[#F4F4F6] hover:border-[#FE2C55]/60'
            }`}
          >
            <Diamond className="h-3 w-3 fill-current" />
            <span>{keyframeActive ? '♦-' : '♦+'}</span>
          </button>

          {/* Freeze Frame ('Congelar') Shortcut Button */}
          <button
            type="button"
            onClick={freezeSelectedClip}
            title="Congelar fotograma actual (2.5s)"
            className="flex h-7 items-center gap-1 rounded-lg border border-[#27272A] bg-[#141417] px-2 text-[11px] font-semibold text-[#F4F4F6] transition-colors hover:border-[#00E5FF]/50 hover:text-[#00E5FF] active:scale-95"
          >
            <Snowflake className="h-3 w-3 text-[#00E5FF]" />
            <span className="hidden sm:inline">Congelar</span>
          </button>

          {/* Quick Import Media (+ Media) Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            onChange={(e) => void handleQuickMediaImport(e)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Importar Video o Audio desde tu dispositivo"
            className="flex h-7 items-center gap-1 rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF]/15 px-2 text-[11px] font-bold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/25 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Media</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title="Pantalla completa"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#27272A] bg-[#141417] text-[#A1A1AA] hover:text-white active:scale-95"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </>
  )
}
