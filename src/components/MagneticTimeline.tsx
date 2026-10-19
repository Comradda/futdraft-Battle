import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Sparkles,
  Type,
  Layers,
  Film,
  Music,
  Snowflake,
  Gauge,
} from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'
import type { TimelineClip, TimelineTrack, TrackType } from '../types/editor'

const TRACK_HEADER_WIDTH = 68

const TRACK_HEIGHTS: Record<TrackType, number> = {
  adjustment: 24,
  text: 26,
  pip: 30,
  video: 46,
  audio: 36,
}

function formatRulerTime(sec: number): string {
  const mins = Math.floor(sec / 60)
  const secs = Math.floor(sec % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function getClipGradientStyle(clip: TimelineClip): React.CSSProperties {
  if (clip.trackType === 'adjustment') {
    return {
      background:
        'linear-gradient(90deg, rgba(168,85,247,0.42) 0%, rgba(0,229,255,0.35) 100%)',
    }
  }
  if (clip.trackType === 'text') {
    return {
      background:
        'linear-gradient(90deg, rgba(249,115,22,0.5) 0%, rgba(236,72,153,0.45) 100%)',
    }
  }
  if (clip.trackType === 'pip') {
    return {
      background:
        'linear-gradient(90deg, rgba(99,102,241,0.5) 0%, rgba(0,229,255,0.42) 100%)',
    }
  }
  if (clip.trackType === 'audio') {
    return {
      background:
        'linear-gradient(90deg, rgba(6,182,212,0.28) 0%, rgba(16,185,129,0.25) 100%)',
    }
  }
  // Main video track procedural filmstrip look
  if (clip.mediaUrl.includes('golden')) {
    return {
      background:
        'linear-gradient(90deg, #431407 0%, #9a3412 35%, #ea580c 70%, #7c2d12 100%)',
    }
  }
  return {
    background:
      'linear-gradient(90deg, #0f172a 0%, #1e1b4b 35%, #0e7490 70%, #3b0764 100%)',
  }
}

export const MagneticTimeline: React.FC = () => {
  const tracks = useEditorStore((s) => s.tracks)
  const clips = useEditorStore((s) => s.clips)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const playheadTime = useEditorStore((s) => s.playheadTime)
  const isPlaying = useEditorStore((s) => s.isPlaying)
  const timelineZoom = useEditorStore((s) => s.timelineZoom)
  const snapGuides = useEditorStore((s) => s.snapGuides)

  const setPlayhead = useEditorStore((s) => s.setPlayhead)
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying)
  const setTimelineZoom = useEditorStore((s) => s.setTimelineZoom)
  const selectClip = useEditorStore((s) => s.selectClip)
  const setActiveDrawer = useEditorStore((s) => s.setActiveDrawer)
  const toggleTrackMute = useEditorStore((s) => s.toggleTrackMute)
  const toggleTrackVisibility = useEditorStore((s) => s.toggleTrackVisibility)
  const moveClipOnTimeline = useEditorStore((s) => s.moveClipOnTimeline)
  const trimClipOnTimeline = useEditorStore((s) => s.trimClipOnTimeline)
  const getTotalDuration = useEditorStore((s) => s.getTotalDuration)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [viewportHalfWidth, setViewportHalfWidth] = useState(160)

  const isProgrammaticScrollRef = useRef(false)
  const isUserScrubbingScrollRef = useRef(false)
  const scrollTimeoutRef = useRef<number | null>(null)

  // Pinch-to-zoom state
  const pinchStartDistRef = useRef<number | null>(null)
  const pinchStartZoomRef = useRef<number>(timelineZoom)

  // Active clip move or trim drag state
  const dragStateRef = useRef<{
    mode: 'move' | 'trim-start' | 'trim-end' | 'ruler-scrub'
    clipId: string
    startX: number
    initialStartTime: number
    lastX: number
  } | null>(null)

  const totalDuration = getTotalDuration()
  const timelineDuration = Math.max(totalDuration + 6, 16)
  const timelineWidthPx = timelineDuration * timelineZoom

  // Measure scroll viewport width so center playhead aligns with scrollLeft = playheadTime * timelineZoom
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const updateSize = () => {
      setViewportHalfWidth(Math.max(80, Math.floor(el.clientWidth / 2)))
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Keep scroll position synced when playheadTime or timelineZoom changes programmatically
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el || isUserScrubbingScrollRef.current || dragStateRef.current) return
    const targetScroll = playheadTime * timelineZoom
    if (Math.abs(el.scrollLeft - targetScroll) > 1.5) {
      isProgrammaticScrollRef.current = true
      el.scrollLeft = targetScroll
      window.requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false
      })
    }
  }, [playheadTime, timelineZoom])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el || isProgrammaticScrollRef.current || dragStateRef.current) return

    isUserScrubbingScrollRef.current = true
    if (isPlaying) {
      setIsPlaying(false)
    }

    const rawTime = Math.max(0, el.scrollLeft / timelineZoom)
    setPlayhead(rawTime, true)

    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      isUserScrubbingScrollRef.current = false
    }, 120)
  }, [isPlaying, setIsPlaying, setPlayhead, timelineZoom])

  // 2-Finger Pinch-to-Zoom on the timeline scroll container
  const handleTouchStartContainer = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchStartDistRef.current = Math.hypot(dx, dy)
      pinchStartZoomRef.current = timelineZoom
    }
  }

  const handleTouchMoveContainer = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const scale = dist / Math.max(10, pinchStartDistRef.current)
      setTimelineZoom(pinchStartZoomRef.current * scale)
    }
  }

  const handleTouchEndContainer = () => {
    pinchStartDistRef.current = null
  }

  // Pointer drag handlers for clip moving, trimming, and ruler scrubbing
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragStateRef.current
      if (!drag) return

      if (drag.mode === 'ruler-scrub') {
        const el = scrollContainerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const clickXInTrack =
          e.clientX - rect.left + el.scrollLeft - viewportHalfWidth
        const newTime = Math.max(0, clickXInTrack / timelineZoom)
        setPlayhead(newTime, true)
        return
      }

      if (drag.mode === 'move') {
        const deltaSec = (e.clientX - drag.startX) / timelineZoom
        moveClipOnTimeline(
          drag.clipId,
          Math.max(0, drag.initialStartTime + deltaSec),
          false
        )
      } else if (drag.mode === 'trim-start') {
        const stepSec = (e.clientX - drag.lastX) / timelineZoom
        drag.lastX = e.clientX
        trimClipOnTimeline(drag.clipId, 'start', stepSec, false)
      } else if (drag.mode === 'trim-end') {
        const stepSec = (e.clientX - drag.lastX) / timelineZoom
        drag.lastX = e.clientX
        trimClipOnTimeline(drag.clipId, 'end', stepSec, false)
      }
    }

    const handlePointerUp = () => {
      dragStateRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [moveClipOnTimeline, setPlayhead, timelineZoom, trimClipOnTimeline, viewportHalfWidth])

  const startClipMoveDrag = (
    e: React.PointerEvent,
    clip: TimelineClip,
    locked: boolean
  ) => {
    e.stopPropagation()
    selectClip(clip.id)
    if (locked) return
    pushHistory()
    dragStateRef.current = {
      mode: 'move',
      clipId: clip.id,
      startX: e.clientX,
      initialStartTime: clip.startTime,
      lastX: e.clientX,
    }
  }

  const startClipTrimDrag = (
    e: React.PointerEvent,
    clip: TimelineClip,
    edge: 'start' | 'end',
    locked: boolean
  ) => {
    e.stopPropagation()
    selectClip(clip.id)
    if (locked) return
    pushHistory()
    dragStateRef.current = {
      mode: edge === 'start' ? 'trim-start' : 'trim-end',
      clipId: clip.id,
      startX: e.clientX,
      initialStartTime: clip.startTime,
      lastX: e.clientX,
    }
  }

  const handleRulerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current
    if (!el) return
    if (isPlaying) setIsPlaying(false)
    const rect = el.getBoundingClientRect()
    const clickXInTrack =
      e.clientX - rect.left + el.scrollLeft - viewportHalfWidth
    const newTime = Math.max(0, clickXInTrack / timelineZoom)
    setPlayhead(newTime, true)
    dragStateRef.current = {
      mode: 'ruler-scrub',
      clipId: '',
      startX: e.clientX,
      initialStartTime: newTime,
      lastX: e.clientX,
    }
  }

  // Generate ruler tick marks based on zoom level
  const tickStepSec =
    timelineZoom >= 140 ? 0.5 : timelineZoom >= 60 ? 1 : timelineZoom >= 30 ? 2 : 5
  const ticks: number[] = []
  for (let t = 0; t <= timelineDuration; t += tickStepSec) {
    ticks.push(Number(t.toFixed(2)))
  }

  const renderTrackIcon = (type: TrackType) => {
    switch (type) {
      case 'adjustment':
        return <Sparkles className="h-3 w-3 text-purple-400" />
      case 'text':
        return <Type className="h-3 w-3 text-orange-400" />
      case 'pip':
        return <Layers className="h-3 w-3 text-indigo-400" />
      case 'video':
        return <Film className="h-3.5 w-3.5 text-[#00E5FF]" />
      case 'audio':
        return <Music className="h-3 w-3 text-emerald-400" />
    }
  }

  const isBeatSnapped = snapGuides.snapTimelineBeatTime !== null

  // Sort main video clips to place Transition ('||') buttons between adjacent clips
  const sortedVideoClips = clips
    .filter((c) => c.trackType === 'video')
    .sort((a, b) => a.startTime - b.startTime)

  return (
    <section
      className="capcut-timeline-surface relative flex h-[32%] min-h-[178px] w-full shrink-0 flex-col border-t border-[#1F1F23] select-none"
      onClick={() => selectClip(null)}
    >
      {/* Top Timeline Ruler Header + One-Handed Zoom Controls */}
      <div
        className="flex h-6 shrink-0 items-center justify-between border-b border-[#1F1F23] bg-[#0E0E11] px-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#A1A1AA]">
          <span>PISTAS ({clips.length})</span>
          {isBeatSnapped && (
            <span className="animate-pulse rounded bg-[#FACC15]/20 px-1.5 py-0.2 text-[9px] font-extrabold text-[#FACC15]">
              ⚡ SNAP BEAT
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTimelineZoom(timelineZoom * 0.8)}
            title="Alejar línea de tiempo"
            className="flex h-5 w-5 items-center justify-center rounded bg-[#1F1F23] text-[#A1A1AA] hover:text-white active:scale-90"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <span className="w-12 text-center font-mono text-[9px] font-semibold text-[#A1A1AA]">
            {Math.round(timelineZoom)}px/s
          </span>
          <button
            type="button"
            onClick={() => setTimelineZoom(timelineZoom * 1.25)}
            title="Acercar línea de tiempo"
            className="flex h-5 w-5 items-center justify-center rounded bg-[#1F1F23] text-[#A1A1AA] hover:text-white active:scale-90"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Main Timeline Body: Left Fixed Track Headers + Right Scrollable Tracks */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Fixed Track Headers */}
        <div
          style={{ width: TRACK_HEADER_WIDTH }}
          className="z-20 flex shrink-0 flex-col border-r border-[#1F1F23] bg-[#111114]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ruler corner spacer */}
          <div className="flex h-5 shrink-0 items-center justify-center border-b border-[#1F1F23] text-[8px] font-bold text-[#A1A1AA]">
            TC 60FPS
          </div>

          {/* 5 Track Headers */}
          <div className="flex flex-1 flex-col justify-around py-0.5">
            {tracks.map((track: TimelineTrack) => {
              const rowH = TRACK_HEIGHTS[track.type]
              return (
                <div
                  key={track.id}
                  style={{ height: rowH }}
                  className="flex items-center justify-between border-b border-white/[0.04] px-1.5"
                >
                  <div className="flex items-center gap-1 truncate">
                    {renderTrackIcon(track.type)}
                    <span className="truncate text-[8px] font-extrabold tracking-tighter text-[#D4D4D8]">
                      {track.shortLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {(track.type === 'audio' ||
                      track.type === 'video' ||
                      track.type === 'pip') && (
                      <button
                        type="button"
                        onClick={() => toggleTrackMute(track.id)}
                        title={
                          track.muted ? 'Activar audio de pista' : 'Silenciar pista'
                        }
                        className={`rounded p-0.5 ${
                          track.muted
                            ? 'text-[#FE2C55]'
                            : 'text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        {track.muted ? (
                          <VolumeX className="h-2.5 w-2.5" />
                        ) : (
                          <Volume2 className="h-2.5 w-2.5" />
                        )}
                      </button>
                    )}
                    {track.type !== 'audio' && (
                      <button
                        type="button"
                        onClick={() => toggleTrackVisibility(track.id)}
                        title={
                          track.visible ? 'Ocultar pista' : 'Mostrar pista'
                        }
                        className={`rounded p-0.5 ${
                          !track.visible
                            ? 'text-amber-400'
                            : 'text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        {track.visible ? (
                          <Eye className="h-2.5 w-2.5" />
                        ) : (
                          <EyeOff className="h-2.5 w-2.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Scrollable Multi-Track Area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Fixed Center Playhead Line */}
          <div
            style={{ left: viewportHalfWidth }}
            className="pointer-events-none absolute inset-y-0 z-30 -translate-x-1/2"
          >
            {/* Top Playhead Diamond Handle */}
            <div
              className={`mx-auto h-3 w-3 rotate-45 rounded-[2px] border transition-colors ${
                isBeatSnapped
                  ? 'border-white bg-[#FACC15] shadow-[0_0_12px_#FACC15]'
                  : 'border-[#09090B] bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]'
              }`}
            />
            {/* Vertical White/Yellow Playhead Bar */}
            <div
              className={`mx-auto h-full w-[2px] transition-colors ${
                isBeatSnapped
                  ? 'bg-[#FACC15] shadow-[0_0_12px_#FACC15]'
                  : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
              }`}
            />
          </div>

          {/* Horizontal Scroll Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStartContainer}
            onTouchMove={handleTouchMoveContainer}
            onTouchEnd={handleTouchEndContainer}
            className="no-scrollbar h-full w-full overflow-x-auto overflow-y-hidden"
          >
            <div
              style={{
                width: timelineWidthPx + viewportHalfWidth * 2,
                paddingLeft: viewportHalfWidth,
                paddingRight: viewportHalfWidth,
              }}
              className="relative flex h-full flex-col"
            >
              {/* Time Ruler Row */}
              <div
                onPointerDown={handleRulerPointerDown}
                className="relative h-5 shrink-0 cursor-ew-resize border-b border-[#1F1F23] bg-[#101014]"
              >
                {ticks.map((t) => {
                  const leftPx = t * timelineZoom
                  const isMajor =
                    Math.abs(t % (tickStepSec * 2)) < 0.001 || tickStepSec >= 2
                  return (
                    <div
                      key={t}
                      style={{ left: leftPx }}
                      className="absolute top-0 bottom-0 flex flex-col justify-end"
                    >
                      {isMajor ? (
                        <span className="-translate-x-1/2 pb-0.5 font-mono text-[8px] font-medium text-[#A1A1AA]">
                          {formatRulerTime(t)}
                        </span>
                      ) : (
                        <div className="mb-1 h-1 w-1 -translate-x-1/2 rounded-full bg-white/25" />
                      )}
                      <div
                        className={`w-px ${
                          isMajor ? 'h-1.5 bg-white/40' : 'h-1 bg-white/15'
                        }`}
                      />
                    </div>
                  )
                })}
              </div>

              {/* 5 Dedicated Track Rows */}
              <div className="relative flex flex-1 flex-col justify-around py-0.5">
                {tracks.map((track) => {
                  const rowH = TRACK_HEIGHTS[track.type]
                  const trackClips = clips.filter((c) => c.trackId === track.id)

                  return (
                    <div
                      key={track.id}
                      style={{ height: rowH }}
                      className={`relative w-full border-b border-white/[0.03] ${
                        !track.visible || track.muted ? 'opacity-45' : ''
                      }`}
                    >
                      {/* Render Clips in this Track */}
                      {trackClips.map((clip) => {
                        const leftPx = clip.startTime * timelineZoom
                        const widthPx = Math.max(18, clip.duration * timelineZoom)
                        const isSelected = clip.id === selectedClipId
                        const hasSpeedChange =
                          clip.speed.mode === 'curve' ||
                          Math.abs(clip.speed.normalSpeed - 1) > 0.02

                        return (
                          <div
                            key={clip.id}
                            style={{
                              left: leftPx,
                              width: widthPx,
                              height: rowH - 3,
                              top: 1.5,
                              ...getClipGradientStyle(clip),
                            }}
                            onPointerDown={(e) =>
                              startClipMoveDrag(e, clip, track.locked)
                            }
                            onClick={(e) => {
                              e.stopPropagation()
                              selectClip(clip.id)
                            }}
                            className={`group absolute cursor-grab overflow-visible rounded-md border transition-shadow active:cursor-grabbing ${
                              isSelected
                                ? 'z-20 border-white ring-2 ring-white shadow-[0_0_14px_rgba(255,255,255,0.45)]'
                                : 'z-10 border-white/20 hover:border-white/50'
                            }`}
                          >
                            {/* Clip Inner Content */}
                            <div className="relative h-full w-full overflow-hidden rounded-[5px]">
                              {/* Filmstrip vertical dividers for Video & PIP tracks */}
                              {(clip.trackType === 'video' ||
                                clip.trackType === 'pip') && (
                                <div
                                  className="pointer-events-none absolute inset-0 opacity-25"
                                  style={{
                                    backgroundImage:
                                      'repeating-linear-gradient(90deg, transparent, transparent 34px, rgba(255,255,255,0.22) 34px, rgba(255,255,255,0.22) 35px)',
                                  }}
                                />
                              )}

                              {/* Audio Waveform Bars (for Audio Track & Video Track subtle bottom wave) */}
                              {clip.waveform.length > 0 &&
                                (clip.trackType === 'audio' ||
                                  clip.trackType === 'video') && (
                                  <div
                                    className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-[1px] px-1 ${
                                      clip.trackType === 'audio'
                                        ? 'top-1 opacity-85'
                                        : 'h-3.5 opacity-30'
                                    }`}
                                  >
                                    {clip.waveform.map((peak, idx) => (
                                      <div
                                        key={idx}
                                        style={{
                                          height: `${Math.max(12, Math.round(peak * 92))}%`,
                                        }}
                                        className={`flex-1 rounded-t-[1px] ${
                                          clip.trackType === 'audio'
                                            ? 'bg-[#00E5FF]'
                                            : 'bg-white'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}

                              {/* Clip Title + Badges */}
                              <div className="pointer-events-none relative z-10 flex items-center gap-1 px-2 pt-0.5">
                                {clip.isFrozen && (
                                  <span className="flex items-center gap-0.5 rounded bg-cyan-500/30 px-1 text-[8px] font-bold text-cyan-200">
                                    <Snowflake className="h-2.5 w-2.5" />
                                  </span>
                                )}
                                <span className="truncate text-[9px] font-bold text-white drop-shadow">
                                  {clip.textStyle
                                    ? clip.textStyle.text
                                    : clip.name}
                                </span>
                                {hasSpeedChange && (
                                  <span className="flex shrink-0 items-center gap-0.5 rounded bg-black/50 px-1 text-[8px] font-bold text-[#00E5FF]">
                                    <Gauge className="h-2 w-2" />
                                    {clip.speed.mode === 'curve'
                                      ? 'Curva'
                                      : `${clip.speed.normalSpeed.toFixed(1)}x`}
                                  </span>
                                )}
                              </div>

                              {/* Keyframe Red Diamonds (♦) along the clip */}
                              {clip.keyframes.map((kf) => {
                                const kfLeftPx = kf.timeOffset * timelineZoom
                                if (kfLeftPx < 0 || kfLeftPx > widthPx) return null
                                return (
                                  <button
                                    key={kf.id}
                                    type="button"
                                    title={`Keyframe ♦ (${kf.timeOffset.toFixed(2)}s)`}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      selectClip(clip.id)
                                      setPlayhead(
                                        clip.startTime + kf.timeOffset,
                                        false
                                      )
                                    }}
                                    style={{ left: kfLeftPx }}
                                    className="pointer-events-auto absolute bottom-1 z-20 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[1px] border border-white bg-[#FE2C55] shadow-[0_0_6px_#FE2C55] transition-transform hover:scale-125"
                                  />
                                )
                              })}

                              {/* Glowing Yellow Beat Dots (#FACC15) along the bottom of Audio clips */}
                              {clip.trackType === 'audio' &&
                                clip.audioFX.beatMarkers.map((bm, idx) => {
                                  const localBeatSec =
                                    bm - clip.sourceStartOffset
                                  if (
                                    localBeatSec < 0 ||
                                    localBeatSec > clip.duration
                                  ) {
                                    return null
                                  }
                                  const beatLeftPx = localBeatSec * timelineZoom
                                  const absBeatTime =
                                    clip.startTime + localBeatSec

                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      title={`Beat ${idx + 1} (${absBeatTime.toFixed(2)}s) — Pulsa para alinear cabezal`}
                                      onPointerDown={(e) => e.stopPropagation()}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPlayhead(absBeatTime, false)
                                      }}
                                      style={{ left: beatLeftPx }}
                                      className="pointer-events-auto absolute bottom-0.5 z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-black/60 bg-[#FACC15] shadow-[0_0_8px_#FACC15] transition-transform hover:scale-150"
                                    />
                                  )
                                })}
                            </div>

                            {/* Thick White CapCut Trim Handles ([ and ]) when selected */}
                            {isSelected && (
                              <>
                                {/* Left Trim Handle [ */}
                                <div
                                  onPointerDown={(e) =>
                                    startClipTrimDrag(
                                      e,
                                      clip,
                                      'start',
                                      track.locked
                                    )
                                  }
                                  title="Arrastrar inicio del clip"
                                  className="absolute -top-0.5 -bottom-0.5 -left-2 z-30 flex w-3.5 cursor-ew-resize items-center justify-center rounded-l-md bg-white text-[#09090B] shadow-md"
                                >
                                  <div className="h-3 w-0.5 rounded-full bg-[#09090B]" />
                                </div>

                                {/* Right Trim Handle ] */}
                                <div
                                  onPointerDown={(e) =>
                                    startClipTrimDrag(
                                      e,
                                      clip,
                                      'end',
                                      track.locked
                                    )
                                  }
                                  title="Arrastrar fin del clip"
                                  className="absolute -top-0.5 -right-2 -bottom-0.5 z-30 flex w-3.5 cursor-ew-resize items-center justify-center rounded-r-md bg-white text-[#09090B] shadow-md"
                                >
                                  <div className="h-3 w-0.5 rounded-full bg-[#09090B]" />
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}

                      {/* Interactive Transition Buttons (||) between adjacent Video clips */}
                      {track.type === 'video' &&
                        sortedVideoClips.slice(1).map((rightClip) => {
                          const leftPx = rightClip.startTime * timelineZoom
                          const hasActiveTransition =
                            rightClip.transitionIn.type !== 'none'
                          return (
                            <button
                              key={`trans_${rightClip.id}`}
                              type="button"
                              style={{ left: leftPx }}
                              title={`Transición: ${rightClip.transitionIn.type} (${rightClip.transitionIn.duration}s)`}
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                selectClip(rightClip.id)
                                setActiveDrawer('transition')
                              }}
                              className={` absolute top-1/2 z-30 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border text-[9px] font-extrabold shadow-lg transition-transform hover:scale-110 active:scale-95 ${
                                hasActiveTransition
                                  ? 'border-white bg-[#00E5FF] text-[#09090B] shadow-[0_0_10px_rgba(0,229,255,0.6)]'
                                  : 'border-white/40 bg-[#1F1F23] text-white hover:border-[#00E5FF]'
                              }`}
                            >
                              ||
                            </button>
                          )
                        })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
