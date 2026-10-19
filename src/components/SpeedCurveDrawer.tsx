import React, { useRef, useState } from 'react'
import {
  Check,
  Gauge,
  Music,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import {
  evaluateSpeedAtNormalizedTime,
  useEditorStore,
} from '../store/useEditorStore'
import type { SpeedCurvePoint, SpeedCurvePresetId } from '../types/editor'

const QUICK_SPEED_PILLS = [0.2, 0.5, 1.0, 1.5, 2.0, 5.0, 10.0]

const CURVE_PRESET_ORDER: {
  id: SpeedCurvePresetId
  label: string
  badge: string
}[] = [
  { id: 'normal', label: 'Normal', badge: '1.0x' },
  { id: 'montaje', label: 'Montaje', badge: 'Rampa' },
  { id: 'heroe', label: 'Héroe', badge: 'SlowMo' },
  { id: 'bala', label: 'Bala', badge: 'Bullet' },
  { id: 'salto', label: 'Salto / Jump Cut', badge: '6.0x' },
  { id: 'flash_in', label: 'Flash In', badge: 'Entrada' },
  { id: 'flash_out', label: 'Flash Out', badge: 'Salida' },
  { id: 'personalizado', label: 'Personalizado', badge: 'Custom' },
]

function speedToY(speed: number, height: number): number {
  const pad = 16
  const usable = height - pad * 2
  // Non-linear mapping so 1.0x sits comfortably near the middle (55% down)
  if (speed <= 1.0) {
    const norm = (speed - 0.1) / 0.9 // 0..1
    return height - pad - norm * (usable * 0.45)
  }
  const norm = (speed - 1.0) / 9.0 // 0..1 for 1x..10x
  return height - pad - usable * 0.45 - norm * (usable * 0.55)
}

function yToSpeed(y: number, height: number): number {
  const pad = 16
  const usable = height - pad * 2
  const fromBottom = Math.max(0, Math.min(usable, height - pad - y))
  const midSplit = usable * 0.45
  if (fromBottom <= midSplit) {
    const norm = fromBottom / midSplit
    return Number((0.1 + norm * 0.9).toFixed(2))
  }
  const norm = (fromBottom - midSplit) / (usable * 0.55)
  return Number(Math.min(10, Math.max(0.1, 1.0 + norm * 9.0)).toFixed(2))
}

export const SpeedCurveDrawer: React.FC = () => {
  const activeDrawer = useEditorStore((s) => s.activeDrawer)
  const clips = useEditorStore((s) => s.clips)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const playheadTime = useEditorStore((s) => s.playheadTime)
  const setActiveDrawer = useEditorStore((s) => s.setActiveDrawer)
  const updateClipSpeed = useEditorStore((s) => s.updateClipSpeed)
  const applySpeedPreset = useEditorStore((s) => s.applySpeedPreset)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const [selectedPointIdx, setSelectedPointIdx] = useState<number>(1)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  if (activeDrawer !== 'speed') return null

  const targetClip =
    clips.find((c) => c.id === selectedClipId) ??
    clips.find((c) => c.trackType === 'video') ??
    clips[0]

  if (!targetClip) return null

  const { speed } = targetClip
  const svgW = 340
  const svgH = 148

  const localNormalizedT =
    targetClip.duration > 0
      ? Math.max(
          0,
          Math.min(1, (playheadTime - targetClip.startTime) / targetClip.duration)
        )
      : 0

  const instantaneousSpeed = evaluateSpeedAtNormalizedTime(
    speed,
    localNormalizedT
  )

  const handlePointerDownPoint = (
    e: React.PointerEvent<SVGCircleElement>,
    idx: number
  ) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    pushHistory()
    setSelectedPointIdx(idx)
    setDraggingIdx(idx)
  }

  const handlePointerMoveSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingIdx === null || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * svgW
    const relY = ((e.clientY - rect.top) / rect.height) * svgH

    const pts = [...speed.curvePoints]
    const currentPt = pts[draggingIdx]
    if (!currentPt) return

    const newSpeed = yToSpeed(relY, svgH)
    let newT = currentPt.t

    // Endpoints stay locked at t=0 and t=1, interior points can move horizontally
    if (draggingIdx > 0 && draggingIdx < pts.length - 1) {
      const minT = pts[draggingIdx - 1].t + 0.04
      const maxT = pts[draggingIdx + 1].t - 0.04
      const rawT = (relX - 16) / (svgW - 32)
      newT = Number(Math.max(minT, Math.min(maxT, rawT)).toFixed(3))
    }

    pts[draggingIdx] = { t: newT, speed: newSpeed }
    updateClipSpeed(targetClip.id, {
      mode: 'curve',
      curvePreset: 'personalizado',
      curvePoints: pts,
    })
  }

  const handlePointerUpSvg = () => {
    if (draggingIdx !== null) {
      setDraggingIdx(null)
    }
  }

  const handleAddCurvePoint = () => {
    const pts = [...speed.curvePoints].sort((a, b) => a.t - b.t)
    const candidateT = Number(
      Math.max(0.08, Math.min(0.92, localNormalizedT || 0.5)).toFixed(2)
    )
    const exists = pts.some((p) => Math.abs(p.t - candidateT) < 0.05)
    const insertT = exists ? 0.52 : candidateT
    const interpSpeed = Number(
      evaluateSpeedAtNormalizedTime(speed, insertT).toFixed(2)
    )
    const nextPts: SpeedCurvePoint[] = [
      ...pts,
      { t: insertT, speed: interpSpeed },
    ].sort((a, b) => a.t - b.t)

    pushHistory()
    updateClipSpeed(targetClip.id, {
      mode: 'curve',
      curvePreset: 'personalizado',
      curvePoints: nextPts,
    })
    const newIndex = nextPts.findIndex((p) => p.t === insertT)
    if (newIndex !== -1) setSelectedPointIdx(newIndex)
  }

  const handleDeleteCurvePoint = () => {
    if (speed.curvePoints.length <= 2) return
    if (
      selectedPointIdx <= 0 ||
      selectedPointIdx >= speed.curvePoints.length - 1
    ) {
      return
    }
    pushHistory()
    const nextPts = speed.curvePoints.filter((_, idx) => idx !== selectedPointIdx)
    updateClipSpeed(targetClip.id, {
      mode: 'curve',
      curvePreset: 'personalizado',
      curvePoints: nextPts,
    })
    setSelectedPointIdx(Math.max(1, selectedPointIdx - 1))
  }

  // Generate smooth SVG cubic path across curvePoints
  const buildSmoothCurvePath = (points: SpeedCurvePoint[]): string => {
    if (points.length === 0) return ''
    const coords = points.map((p) => ({
      x: 16 + p.t * (svgW - 32),
      y: speedToY(p.speed, svgH),
    }))
    let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i]
      const p1 = coords[i + 1]
      const midX = (p0.x + p1.x) / 2
      d += ` C ${midX.toFixed(1)} ${p0.y.toFixed(1)}, ${midX.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`
    }
    return d
  }

  const curvePathD = buildSmoothCurvePath(speed.curvePoints)
  const areaPathD = curvePathD
    ? `${curvePathD} L ${svgW - 16} ${svgH - 16} L 16 ${svgH - 16} Z`
    : ''

  return (
    <div className="bg-[#18181B]/98 border-t border-white/10 px-3 py-2.5 text-[#F4F4F6] shadow-2xl backdrop-blur-xl select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#00E5FF]" />
          <span className="text-xs font-semibold tracking-wide uppercase text-white">
            Velocidad Pro
          </span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#00E5FF]">
            {instantaneousSpeed.toFixed(2)}x
          </span>
          <span className="text-[11px] text-[#8E8E98] truncate max-w-[130px]">
            {targetClip.name}
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#09090B] p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => updateClipSpeed(targetClip.id, { mode: 'normal' })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
              speed.mode === 'normal'
                ? 'bg-[#00E5FF] text-black font-semibold'
                : 'text-[#8E8E98] hover:text-white'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => updateClipSpeed(targetClip.id, { mode: 'curve' })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
              speed.mode === 'curve'
                ? 'bg-[#00E5FF] text-black font-semibold'
                : 'text-[#8E8E98] hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Curva Bézier
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveDrawer('none')}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white"
          title="Cerrar panel de velocidad"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {speed.mode === 'normal' ? (
        <div className="pt-2.5 space-y-2.5">
          {/* Speed Slider 0.1x to 10.0x */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#8E8E98] w-16">Velocidad</span>
            <input
              type="range"
              min={0.1}
              max={10.0}
              step={0.05}
              value={speed.normalSpeed}
              onMouseDown={() => pushHistory()}
              onTouchStart={() => pushHistory()}
              onChange={(e) =>
                updateClipSpeed(targetClip.id, {
                  mode: 'normal',
                  normalSpeed: Number(e.target.value),
                })
              }
              className="flex-1 accent-[#00E5FF] h-1.5 bg-white/15 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono font-semibold text-[#00E5FF] w-12 text-right">
              {speed.normalSpeed.toFixed(2)}x
            </span>
          </div>

          {/* Quick Speed Pills */}
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
            {QUICK_SPEED_PILLS.map((val) => {
              const active = Math.abs(speed.normalSpeed - val) < 0.03
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    pushHistory()
                    updateClipSpeed(targetClip.id, {
                      mode: 'normal',
                      normalSpeed: val,
                    })
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition shrink-0 ${
                    active
                      ? 'bg-[#00E5FF] text-black font-bold shadow-sm'
                      : 'bg-white/5 text-[#F4F4F6] hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {val}x
                </button>
              )
            })}
          </div>

          {/* Keep Pitch Toggle & Reset */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() =>
                updateClipSpeed(targetClip.id, { keepPitch: !speed.keepPitch })
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition ${
                speed.keepPitch
                  ? 'bg-[#00E5FF]/15 border-[#00E5FF]/50 text-[#00E5FF]'
                  : 'bg-white/5 border-white/10 text-[#8E8E98]'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Mantener Tono de Voz (Pitch Lock)</span>
              {speed.keepPitch && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                pushHistory()
                updateClipSpeed(targetClip.id, {
                  mode: 'normal',
                  normalSpeed: 1.0,
                })
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-[#8E8E98] hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>1.0x</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2 space-y-2">
          {/* Preset Selector Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CURVE_PRESET_ORDER.map((preset) => {
              const isSelected = speed.curvePreset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applySpeedPreset(targetClip.id, preset.id)}
                  className={`flex flex-col items-start px-2.5 py-1 rounded-lg border text-left shrink-0 transition ${
                    isSelected
                      ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-white'
                      : 'bg-[#09090B] border-white/10 text-[#8E8E98] hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-semibold">{preset.label}</span>
                  <span className="text-[9px] font-mono text-[#00E5FF]">
                    {preset.badge}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Interactive Multi-Point Bézier SVG Graph */}
          <div className="relative bg-[#09090B] rounded-xl border border-white/10 p-1.5">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-32 touch-none select-none cursor-crosshair"
              onPointerMove={handlePointerMoveSvg}
              onPointerUp={handlePointerUpSvg}
              onPointerLeave={handlePointerUpSvg}
            >
              <defs>
                <linearGradient id="speedCurveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#FE2C55" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              {/* Reference Horizontal Speed Lines (10x, 2x, 1x, 0.2x) */}
              {[10, 5, 1, 0.2].map((refSpeed) => {
                const y = speedToY(refSpeed, svgH)
                return (
                  <g key={refSpeed}>
                    <line
                      x1={16}
                      y1={y}
                      x2={svgW - 16}
                      y2={y}
                      stroke={
                        refSpeed === 1
                          ? 'rgba(0, 229, 255, 0.35)'
                          : 'rgba(255,255,255,0.08)'
                      }
                      strokeDasharray={refSpeed === 1 ? '3 3' : '2 4'}
                      strokeWidth={1}
                    />
                    <text
                      x={svgW - 14}
                      y={y + 3}
                      fontSize="8"
                      fill="#8E8E98"
                      textAnchor="end"
                    >
                      {refSpeed}x
                    </text>
                  </g>
                )
              })}

              {/* Playhead Position Vertical Indicator */}
              <line
                x1={16 + localNormalizedT * (svgW - 32)}
                y1={8}
                x2={16 + localNormalizedT * (svgW - 32)}
                y2={svgH - 8}
                stroke="#FACC15"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />

              {/* Shaded Area + Smooth Bézier Curve */}
              {areaPathD && <path d={areaPathD} fill="url(#speedCurveFill)" />}
              {curvePathD && (
                <path
                  d={curvePathD}
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              )}

              {/* Draggable Control Points */}
              {speed.curvePoints.map((pt, idx) => {
                const cx = 16 + pt.t * (svgW - 32)
                const cy = speedToY(pt.speed, svgH)
                const active = idx === selectedPointIdx
                return (
                  <g key={idx}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={active ? 8 : 6}
                      fill={active ? '#FE2C55' : '#09090B'}
                      stroke="#00E5FF"
                      strokeWidth={2.5}
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => handlePointerDownPoint(e, idx)}
                    />
                    <text
                      x={cx}
                      y={Math.max(11, cy - 10)}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fill={active ? '#FFFFFF' : '#00E5FF'}
                      textAnchor="middle"
                    >
                      {pt.speed.toFixed(1)}x
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Curve Controls Footer */}
            <div className="flex items-center justify-between px-2 pt-1 border-t border-white/10 text-[11px]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddCurvePoint}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#00E5FF]/15 text-[#00E5FF] hover:bg-[#00E5FF]/25 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir ritmo</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCurvePoint}
                  disabled={
                    speed.curvePoints.length <= 2 ||
                    selectedPointIdx === 0 ||
                    selectedPointIdx === speed.curvePoints.length - 1
                  }
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-[#8E8E98] hover:text-red-400 disabled:opacity-35"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar punto</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  applySpeedPreset(targetClip.id, speed.curvePreset || 'montaje')
                }
                className="flex items-center gap-1 text-[#8E8E98] hover:text-white"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer curva</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
