import React from 'react'
import { useEditorStore } from '../store/useEditorStore'

export const SocialSafeZoneHUD: React.FC = () => {
  const socialSafeZone = useEditorStore((s) => s.socialSafeZone)

  if (socialSafeZone === 'none') {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none">
      {/* Center Safe Area Frame */}
      <div className="absolute inset-x-[6%] top-[13%] bottom-[23%] rounded-lg border border-dashed border-[#00E5FF]/45">
        <span className="absolute top-1.5 left-2 rounded bg-[#09090B]/80 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-[#00E5FF] uppercase backdrop-blur-xs">
          ✓ Zona Segura Visible
        </span>
      </div>

      {/* INSTAGRAM STORIES */}
      {socialSafeZone === 'ig_stories' && (
        <>
          {/* Top 11% Obstruction */}
          <div
            style={{ height: '11%' }}
            className="absolute inset-x-0 top-0 flex flex-col justify-between border-b border-dashed border-[#FE2C55]/80 bg-[#FE2C55]/18 px-3 py-1.5"
          >
            <div className="flex gap-1">
              <div className="h-0.5 flex-1 rounded-full bg-white/70" />
              <div className="h-0.5 flex-1 rounded-full bg-white/30" />
              <div className="h-0.5 flex-1 rounded-full bg-white/30" />
            </div>
            <div className="flex items-center justify-between text-[9px] font-semibold text-white/90">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-4 w-4 rounded-full border border-white/70 bg-[#FE2C55]/40" />
                <span>tu_historia • 2h</span>
              </div>
              <span className="rounded bg-[#09090B]/70 px-1.5 py-0.5 text-[8px] text-[#FE2C55]">
                IG STORIES TOP (11%) ✕
              </span>
            </div>
          </div>

          {/* Bottom 14% Obstruction */}
          <div
            style={{ height: '14%' }}
            className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-dashed border-[#FE2C55]/80 bg-[#FE2C55]/18 px-3"
          >
            <div className="flex h-6 flex-1 items-center rounded-full border border-white/40 bg-black/30 px-2.5 text-[9px] text-white/80">
              Enviar mensaje...
            </div>
            <div className="ml-2 flex items-center gap-2 text-xs">
              <span>❤️</span>
              <span>✈️</span>
            </div>
            <span className="absolute top-1 right-2 rounded bg-[#09090B]/75 px-1.5 py-0.5 text-[8px] font-bold text-[#FE2C55]">
              NO TEXTO AQUÍ (14%)
            </span>
          </div>
        </>
      )}

      {/* INSTAGRAM REELS */}
      {socialSafeZone === 'ig_reels' && (
        <>
          {/* Top subtle header */}
          <div
            style={{ height: '9%' }}
            className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-dashed border-amber-400/60 bg-amber-500/12 px-3"
          >
            <span className="text-[10px] font-bold text-white/85">Reels</span>
            <span className="rounded bg-[#09090B]/75 px-1.5 py-0.5 text-[8px] font-bold text-amber-300">
              IG REELS HUD
            </span>
          </div>

          {/* Right-side vertical action column (16% width, 45% height) */}
          <div
            style={{ width: '16%', height: '45%', bottom: '8%' }}
            className="absolute right-0 flex flex-col items-center justify-around rounded-tl-xl border-t border-l border-dashed border-[#FE2C55]/85 bg-[#FE2C55]/20 py-2 text-[10px] text-white"
          >
            <span>❤️</span>
            <span>💬</span>
            <span>✈️</span>
            <span>⋯</span>
            <span className="flex h-5 w-5 items-center justify-center rounded border border-white/60 bg-black/40 text-[9px]">
              🎵
            </span>
          </div>

          {/* Bottom-left caption/audio marquee zone (22% height, 78% width) */}
          <div
            style={{ height: '22%', width: '78%' }}
            className="absolute bottom-0 left-0 flex flex-col justify-end rounded-tr-xl border-t border-r border-dashed border-[#FE2C55]/85 bg-[#FE2C55]/20 p-2.5"
          >
            <span className="mb-1 self-start rounded bg-[#09090B]/80 px-1.5 py-0.5 text-[8px] font-bold text-[#FE2C55]">
              ZONA DESCRIPCIÓN + AUDIO REELS (22%)
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/90">
              <span className="h-3.5 w-3.5 rounded-full bg-white/40" />
              <span>@creador_pro • Seguir</span>
            </div>
            <div className="mt-0.5 truncate text-[8px] text-white/75">
              Descripción del Reel y marquee de audio original 🎵
            </div>
          </div>
        </>
      )}

      {/* WHATSAPP STATUS (ESTADOS) */}
      {socialSafeZone === 'whatsapp_status' && (
        <>
          {/* Top 12% Header */}
          <div
            style={{ height: '12%' }}
            className="absolute inset-x-0 top-0 flex flex-col justify-between border-b border-dashed border-emerald-400/85 bg-emerald-500/18 px-3 py-1.5"
          >
            <div className="flex gap-1">
              <div className="h-0.5 flex-1 rounded-full bg-emerald-300/90" />
              <div className="h-0.5 flex-1 rounded-full bg-white/35" />
            </div>
            <div className="flex items-center justify-between text-[9px] font-semibold text-white/90">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-4 w-4 rounded-full border border-emerald-300 bg-emerald-500/40" />
                <span>Mi Estado • Hoy 18:45</span>
              </div>
              <span className="rounded bg-[#09090B]/80 px-1.5 py-0.5 text-[8px] font-bold text-emerald-300">
                WA STATUS TOP (12%)
              </span>
            </div>
          </div>

          {/* Bottom 16% Reply & Caption strip */}
          <div
            style={{ height: '16%' }}
            className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end border-t border-dashed border-emerald-400/85 bg-emerald-500/18 px-3 pb-2"
          >
            <span className="mb-1 rounded bg-[#09090B]/80 px-1.5 py-0.5 text-[8px] font-bold text-emerald-300">
              ZONA COMENTARIO + RESPONDER WHATSAPP (16%)
            </span>
            <div className="flex flex-col items-center text-[9px] font-semibold text-white/90">
              <span className="text-[10px] leading-none">⌃</span>
              <span>Responder</span>
            </div>
          </div>
        </>
      )}

      {/* TIKTOK */}
      {socialSafeZone === 'tiktok' && (
        <>
          {/* Top 10% Siguiendo | Para ti */}
          <div
            style={{ height: '10%' }}
            className="absolute inset-x-0 top-0 flex items-center justify-center border-b border-dashed border-[#00E5FF]/80 bg-[#00E5FF]/16 px-3"
          >
            <div className="flex items-center gap-3 text-[9px] font-bold text-white/90">
              <span className="opacity-65">Siguiendo</span>
              <span className="border-b-2 border-white pb-0.5">Para ti</span>
            </div>
            <span className="absolute right-2 rounded bg-[#09090B]/80 px-1.5 py-0.5 text-[8px] font-bold text-[#00E5FF]">
              TIKTOK TOP (10%)
            </span>
          </div>

          {/* Right 16% column */}
          <div
            style={{ width: '16%', height: '48%', bottom: '12%' }}
            className="absolute right-0 flex flex-col items-center justify-around rounded-tl-xl border-t border-l border-dashed border-[#FE2C55]/85 bg-[#FE2C55]/20 py-2 text-[10px] text-white"
          >
            <span className="h-5 w-5 rounded-full border border-white bg-[#FE2C55]/50 text-center text-[9px] leading-5">
              +
            </span>
            <span>❤️</span>
            <span>💬</span>
            <span>🔖</span>
            <span>↪️</span>
          </div>

          {/* Bottom 22% username/caption/sound */}
          <div
            style={{ height: '22%', width: '84%' }}
            className="absolute bottom-0 left-0 flex flex-col justify-end rounded-tr-xl border-t border-r border-dashed border-[#FE2C55]/85 bg-[#FE2C55]/20 p-2.5"
          >
            <span className="mb-1 self-start rounded bg-[#09090B]/80 px-1.5 py-0.5 text-[8px] font-bold text-[#00E5FF]">
              TIKTOK CAPTION + SONIDO (22%)
            </span>
            <div className="text-[9px] font-bold text-white">@usuario_tiktok</div>
            <div className="truncate text-[8px] text-white/80">
              #parati #capcutpro #viral 🎵 Sonido original - Studio Pro
            </div>
          </div>
        </>
      )}
    </div>
  )
}
