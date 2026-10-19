import React, { useMemo } from 'react'
import { Activity, X } from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'

function buildSmoothAreaPath(bins: number[], width: number, height: number): string {
  if (!bins || bins.length === 0) return ''
  const n = bins.length
  const stepX = width / Math.max(1, n - 1)
  const points = bins.map((v, idx) => {
    const x = idx * stepX
    const clamped = Math.max(0, Math.min(1, v))
    const y = height - clamped * (height - 4) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`
}

function buildSmoothLinePath(bins: number[], width: number, height: number): string {
  if (!bins || bins.length === 0) return ''
  const n = bins.length
  const stepX = width / Math.max(1, n - 1)
  const points = bins.map((v, idx) => {
    const x = idx * stepX
    const clamped = Math.max(0, Math.min(1, v))
    const y = height - clamped * (height - 4) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M ${points.join(' L ')}`
}

export const LiveHistogram: React.FC = () => {
  const showHistogram = useEditorStore((s) => s.showHistogram)
  const setShowHistogram = useEditorStore((s) => s.setShowHistogram)
  const histogramData = useEditorStore((s) => s.histogramData)

  const width = 168
  const height = 58

  const paths = useMemo(() => {
    return {
      rArea: buildSmoothAreaPath(histogramData.r, width, height),
      gArea: buildSmoothAreaPath(histogramData.g, width, height),
      bArea: buildSmoothAreaPath(histogramData.b, width, height),
      lumaLine: buildSmoothLinePath(histogramData.luma, width, height),
    }
  }, [histogramData, width, height])

  if (!showHistogram) {
    return null
  }

  const { avgIRE, shadowsClippedPct, highlightsClippedPct } = histogramData

  // Determine OLED Broadcast status badge
  let statusLabel = 'OLED ÓPTIMO'
  let statusColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40'
  if (highlightsClippedPct > 6.5 || avgIRE > 84) {
    statusLabel = 'ALTAS LUCES CLIP'
    statusColor = 'text-[#FE2C55] bg-[#FE2C55]/20 border-[#FE2C55]/50'
  } else if (shadowsClippedPct > 12 || avgIRE < 18) {
    statusLabel = 'SUBEXPUESTO'
    statusColor = 'text-amber-300 bg-amber-500/20 border-amber-400/50'
  }

  return (
    <div className="pointer-events-auto absolute top-2 left-2 z-30 w-[184px] rounded-xl border border-white/15 bg-[#09090B]/90 p-2 shadow-2xl backdrop-blur-md select-none">
      {/* Scope Header */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-[#00E5FF]" />
          <span className="text-[9px] font-extrabold tracking-wider text-[#F4F4F6] uppercase">
            RGB / IRE Scope
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`rounded border px-1 py-0.2 text-[8px] font-bold ${statusColor}`}
          >
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={() => setShowHistogram(false)}
            title="Cerrar Histograma"
            className="flex h-4 w-4 items-center justify-center rounded text-[#A1A1AA] hover:bg-white/10 hover:text-white"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {/* SVG 64-Bin Waveform / Histogram Graph */}
      <div className="relative h-[58px] w-[168px] overflow-hidden rounded-lg border border-white/10 bg-[#050507]">
        {/* IRE Reference Grid Lines (25%, 50%, 75%) */}
        <div className="pointer-events-none absolute inset-0 flex justify-between px-[25%]">
          <div className="h-full w-px border-l border-dashed border-white/10" />
          <div className="h-full w-px border-l border-dashed border-white/15" />
          <div className="h-full w-px border-l border-dashed border-white/10" />
        </div>

        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block h-full w-full"
        >
          {/* Red Channel */}
          <path
            d={paths.rArea}
            fill="rgba(254, 44, 85, 0.36)"
            stroke="rgba(254, 44, 85, 0.85)"
            strokeWidth="1"
             style={{ mixBlendMode: 'screen' }}
          />
          {/* Green Channel */}
          <path
            d={paths.gArea}
            fill="rgba(34, 197, 94, 0.34)"
            stroke="rgba(74, 222, 128, 0.85)"
            strokeWidth="1"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Blue Channel */}
          <path
            d={paths.bArea}
            fill="rgba(0, 229, 255, 0.36)"
            stroke="rgba(0, 229, 255, 0.9)"
            strokeWidth="1"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Luma Curve (White master trace) */}
          <path
            d={paths.lumaLine}
            fill="none"
            stroke="rgba(255, 255, 255, 0.92)"
            strokeWidth="1.25"
          />
        </svg>

        <div className="pointer-events-none absolute inset-x-1.5 bottom-0.5 flex justify-between text-[7px] font-semibold text-white/45">
          <span>0 IRE</span>
          <span>50</span>
          <span>100 IRE</span>
        </div>
      </div>

      {/* Broadcast Telemetry Readout */}
      <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
        <div className="rounded bg-[#141417] px-1 py-0.5">
          <div className="text-[7px] text-[#A1A1AA]">IRE PROM</div>
          <div className="font-mono text-[9px] font-bold text-[#00E5FF]">
            {avgIRE.toFixed(0)}%
          </div>
        </div>
        <div className="rounded bg-[#141417] px-1 py-0.5">
          <div className="text-[7px] text-[#A1A1AA]">SOMBRAS</div>
          <div
            className={`font-mono text-[9px] font-bold ${
              shadowsClippedPct > 10 ? 'text-amber-400' : 'text-[#F4F4F6]'
            }`}
          >
            {shadowsClippedPct.toFixed(1)}%
          </div>
        </div>
        <div className="rounded bg-[#141417] px-1 py-0.5">
          <div className="text-[7px] text-[#A1A1AA]">ALTAS</div>
          <div
            className={`font-mono text-[9px] font-bold ${
              highlightsClippedPct > 5 ? 'text-[#FE2C55]' : 'text-[#F4F4F6]'
            }`}
          >
            {highlightsClippedPct.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}
