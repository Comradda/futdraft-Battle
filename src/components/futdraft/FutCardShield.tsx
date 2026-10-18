import React from 'react';
import type { FutPlayerCard } from '../../utils/futdraftLogic';

interface FutCardShieldProps {
  player: FutPlayerCard;
  size?: 'pitch' | 'hand' | 'modal';
  selected?: boolean;
  highlighted?: boolean;
  badgeText?: string;
  onClick?: () => void;
}

/**
 * Renders the country flag as crisp vector SVG (No external copyright assets needed)
 */
const NationFlagSVG: React.FC<{ code: string }> = ({ code }) => {
  switch (code) {
    case 'EG': // Egypt
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px] shadow-xs">
          <rect width="24" height="5.33" fill="#CE1126" />
          <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
          <rect y="10.66" width="24" height="5.34" fill="#000000" />
          <circle cx="12" cy="8" r="1.5" fill="#C09300" />
        </svg>
      );
    case 'NO': // Norway
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="24" height="16" fill="#BA0C2F" />
          <rect x="6" width="4" height="16" fill="#FFFFFF" />
          <rect y="6" width="24" height="4" fill="#FFFFFF" />
          <rect x="7" width="2" height="16" fill="#00205B" />
          <rect y="7" width="24" height="2" fill="#00205B" />
        </svg>
      );
    case 'BE': // Belgium
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="8" height="16" fill="#000000" />
          <rect x="8" width="8" height="16" fill="#FDDA24" />
          <rect x="16" width="8" height="16" fill="#EF3340" />
        </svg>
      );
    case 'AR': // Argentina
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="24" height="5.33" fill="#74ACDF" />
          <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
          <rect y="10.66" width="24" height="5.34" fill="#74ACDF" />
          <circle cx="12" cy="8" r="1.8" fill="#F6B40E" />
        </svg>
      );
    case 'NL': // Netherlands
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="24" height="5.33" fill="#AE1C28" />
          <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
          <rect y="10.66" width="24" height="5.34" fill="#21468B" />
        </svg>
      );
    case 'FR': // France
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="8" height="16" fill="#002395" />
          <rect x="8" width="8" height="16" fill="#FFFFFF" />
          <rect x="16" width="8" height="16" fill="#ED2939" />
        </svg>
      );
    case 'BR': // Brazil
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="24" height="16" fill="#009739" />
          <polygon points="12,2 22,8 12,14 2,8" fill="#FEDD00" />
          <circle cx="12" cy="8" r="3.2" fill="#012169" />
        </svg>
      );
    case 'ES': // Spain
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="24" height="4" fill="#AA151B" />
          <rect y="4" width="24" height="8" fill="#F1BF00" />
          <rect y="12" width="24" height="4" fill="#AA151B" />
        </svg>
      );
    case 'EN': // England
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="24" height="16" fill="#FFFFFF" />
          <rect x="10" width="4" height="16" fill="#CE1124" />
          <rect y="6" width="24" height="4" fill="#CE1124" />
        </svg>
      );
    case 'DE': // Germany
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="24" height="5.33" fill="#000000" />
          <rect y="5.33" width="24" height="5.33" fill="#DD0000" />
          <rect y="10.66" width="24" height="5.34" fill="#FFCE00" />
        </svg>
      );
    case 'PT': // Portugal
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="9" height="16" fill="#006600" />
          <rect x="9" width="15" height="16" fill="#FF0000" />
          <circle cx="9" cy="8" r="2.5" fill="#FFCC00" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 16" className="w-full h-full rounded-[1px]">
          <rect width="24" height="5.33" fill="#0038A8" />
          <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
          <rect y="10.66" width="24" height="5.34" fill="#0038A8" />
        </svg>
      );
  }
};

/**
 * Vector Silhouette Portrait without facial features (Copyright-safe artistic shadow)
 * Retains characteristic hair, beard, neck, and club kit colors.
 */
const PlayerSilhouetteSVG: React.FC<{ player: FutPlayerCard }> = ({ player }) => {
  const [kitPrimary, kitSecondary] = player.clubColors;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.65)]">
      <defs>
        <linearGradient id={`skin_${player.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={player.skinTone} />
          <stop offset="55%" stopColor="#2a1c14" />
          <stop offset="100%" stopColor="#120c08" />
        </linearGradient>
        <linearGradient id={`kit_${player.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={kitPrimary} />
          <stop offset="100%" stopColor="#0a0e17" />
        </linearGradient>
      </defs>

      {/* Athletic Shoulders & Jersey Kit */}
      <path
        d="M12,98 C14,76 28,68 50,68 C72,68 86,76 88,98 Z"
        fill={`url(#kit_${player.id})`}
        stroke={kitSecondary}
        strokeWidth="1.5"
      />
      {/* Jersey Stripes / Trim */}
      <path
        d="M35,70 L39,98 M65,70 L61,98"
        stroke={kitSecondary}
        strokeWidth="3.5"
        strokeOpacity="0.65"
      />
      {/* V-Neck Collar */}
      <path
        d="M38,68 L50,81 L62,68"
        fill="none"
        stroke={kitSecondary}
        strokeWidth="2.5"
      />

      {/* Muscular Neck Shadow */}
      <path d="M41,54 L40,71 L50,76 L60,71 L59,54 Z" fill="#1b120c" />

      {/* Head Silhouette (Face in Dramatic Shadow - No Copyright Facial Details) */}
      <path
        d="M34,34 C34,21 66,21 66,34 C67,47 61,58 50,60 C39,58 33,47 34,34 Z"
        fill={`url(#skin_${player.id})`}
      />
      {/* Rim Light on Jawline */}
      <path
        d="M35,36 C35,49 41,57 50,59 C59,57 65,49 65,36"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.2"
      />

      {/* Characteristic Hairstyles & Silhouette Contours */}
      {player.silhouette === 'afro_beard' && (
        <>
          {/* Curly Afro Halo (Salah style) */}
          <path
            d="M28,37 C24,25 32,13 50,13 C68,13 76,25 72,37 C70,30 64,23 50,23 C36,23 30,30 28,37 Z"
            fill={player.hairColor}
          />
          <circle cx="33" cy="24" r="6" fill={player.hairColor} />
          <circle cx="50" cy="18" r="7" fill={player.hairColor} />
          <circle cx="67" cy="24" r="6" fill={player.hairColor} />
          {/* Full Beard Silhouette */}
          <path
            d="M35,43 C36,54 42,61 50,61 C58,61 64,54 65,43 C62,50 56,55 50,55 C44,55 38,50 35,43 Z"
            fill="#111111"
          />
        </>
      )}

      {player.silhouette === 'tall_bun' && (
        <>
          {/* Viking Man-Bun / Swept Blonde Locks (Haaland style) */}
          <circle cx="50" cy="14" r="6.5" fill={player.hairColor} />
          <path
            d="M33,34 C33,19 42,15 50,15 C58,15 67,19 67,34 C65,24 58,21 50,21 C42,21 35,24 33,34 Z"
            fill={player.hairColor}
          />
        </>
      )}

      {player.silhouette === 'short_swept' && (
        <>
          {/* Textured Crest / Swept Part (De Bruyne / Bellingham) */}
          <path
            d="M33,33 C33,18 44,15 53,16 C63,17 68,23 66,33 C63,24 55,22 46,23 C38,24 35,28 33,33 Z"
            fill={player.hairColor}
          />
        </>
      )}

      {player.silhouette === 'messi_beard' && (
        <>
          {/* Classic Tapered Cut + Trimmed Beard (Messi style) */}
          <path
            d="M33,33 C34,19 45,16 52,16 C61,16 67,22 66,33 C62,24 56,22 49,22 C41,22 36,26 33,33 Z"
            fill={player.hairColor}
          />
          <path
            d="M36,45 C37,54 43,60 50,60 C57,60 63,54 64,45 C61,51 56,55 50,55 C44,55 39,51 36,45 Z"
            fill="#231710"
            opacity="0.85"
          />
        </>
      )}

      {player.silhouette === 'high_fade' && (
        <>
          {/* High Top / Pony / Fade (Van Dijk / Rudiger) */}
          <circle cx="50" cy="15" r="4.5" fill={player.hairColor} />
          <path
            d="M34,31 C35,19 42,17 50,17 C58,17 65,19 66,31 C62,24 56,22 50,22 C44,22 38,24 34,31 Z"
            fill={player.hairColor}
          />
          <path
            d="M37,47 C39,55 44,59 50,59 C56,59 61,55 63,47 C59,52 55,55 50,55 C45,55 41,52 37,47 Z"
            fill="#141414"
          />
        </>
      )}

      {(player.silhouette === 'buzz_cut' || player.silhouette === 'keeper_gloves') && (
        <>
          {/* Tight Athletic Buzz Cut (Mbappe / Vinicius / Saliba) */}
          <path
            d="M34,32 C35,20 43,18 50,18 C57,18 65,20 66,32 C62,24 56,22 50,22 C44,22 38,24 34,32 Z"
            fill={player.hairColor}
          />
        </>
      )}

      {player.silhouette === 'curly_locks' && (
        <>
          {/* Modern Curly Top (Yamal / Musiala) */}
          <path
            d="M31,33 C29,21 39,14 50,14 C61,14 71,21 69,33 C65,24 58,21 50,21 C42,21 35,24 31,33 Z"
            fill={player.hairColor}
          />
          <circle cx="42" cy="19" r="5" fill={player.hairColor} />
          <circle cx="54" cy="18" r="5.5" fill={player.hairColor} />
          <circle cx="62" cy="23" r="4.5" fill={player.hairColor} />
        </>
      )}
    </svg>
  );
};

export const FutCardShield: React.FC<FutCardShieldProps> = ({
  player,
  size = 'pitch',
  selected = false,
  highlighted = false,
  badgeText,
  onClick,
}) => {
  // Card Palette by Tier (Gold, Silver, Bronze) matching image_4.png
  const tierStyles = {
    gold: {
      bg: 'from-[#f8e38b] via-[#d5ac46] to-[#936c18]',
      border: 'border-[#fbe89c]',
      text: 'text-[#231903]',
      subText: 'text-[#3d2c05]',
      statBg: 'bg-[#e8c86b]/90',
      glow: 'shadow-[0_4px_15px_rgba(234,179,8,0.45)]',
    },
    silver: {
      bg: 'from-[#f1f5f9] via-[#cbd5e1] to-[#64748b]',
      border: 'border-[#e2e8f0]',
      text: 'text-[#0f172a]',
      subText: 'text-[#1e293b]',
      statBg: 'bg-[#cbd5e1]/90',
      glow: 'shadow-[0_4px_15px_rgba(148,163,184,0.35)]',
    },
    bronze: {
      bg: 'from-[#e6b38a] via-[#b87343] to-[#6e3b19]',
      border: 'border-[#ebbf9b]',
      text: 'text-[#210f04]',
      subText: 'text-[#381906]',
      statBg: 'bg-[#d09163]/90',
      glow: 'shadow-[0_4px_15px_rgba(180,83,9,0.4)]',
    },
    icon: {
      bg: 'from-[#fef9c3] via-[#facc15] to-[#a16207]',
      border: 'border-white',
      text: 'text-neutral-950',
      subText: 'text-neutral-800',
      statBg: 'bg-amber-200/90',
      glow: 'shadow-[0_0_20px_rgba(250,204,21,0.65)]',
    },
    toty: {
      bg: 'from-[#38bdf8] via-[#1d4ed8] to-[#1e1b4b]',
      border: 'border-amber-300',
      text: 'text-amber-300',
      subText: 'text-sky-200',
      statBg: 'bg-blue-950/90',
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.65)]',
    },
  }[player.tier];

  // 1. PITCH VERSION (Compact UT Shield positioned on the field with bottom position pill)
  if (size === 'pitch') {
    return (
      <div
        onClick={onClick}
        className={`group relative flex flex-col items-center select-none cursor-pointer transition-all duration-200 ${
          selected
            ? 'scale-110 z-30 drop-shadow-[0_0_14px_rgba(74,222,128,0.95)]'
            : highlighted
            ? 'scale-105 z-20 drop-shadow-[0_0_10px_rgba(250,204,21,0.85)]'
            : 'hover:scale-105 z-10'
        }`}
      >
        {/* UT Shield Container */}
        <div
          className={`relative w-[54px] h-[68px] sm:w-[66px] sm:h-[82px] bg-gradient-to-b ${tierStyles.bg} ${tierStyles.border} border-[1.5px] ${tierStyles.glow} overflow-hidden flex flex-col justify-between`}
          style={{
            clipPath:
              'polygon(14% 0%, 86% 0%, 100% 12%, 100% 80%, 50% 100%, 0% 80%, 0% 12%)',
          }}
        >
          {/* Metallic Diagonal Sheen */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.35)_0%,transparent_45%,rgba(0,0,0,0.25)_100%)] pointer-events-none" />

          {/* Left Column: Rating, Position, Flag, Club Crest */}
          <div className="relative z-10 flex flex-col items-center w-[22px] sm:w-[25px] pt-1 pl-1 leading-none">
            <span className={`text-[11px] sm:text-[13px] font-black tracking-tighter ${tierStyles.text}`}>
              {player.rating}
            </span>
            <span className={`text-[6.5px] sm:text-[7.5px] font-extrabold uppercase ${tierStyles.subText}`}>
              {player.position}
            </span>
            <div className="w-3 h-2 sm:w-3.5 sm:h-2.5 my-0.5 border border-black/25">
              <NationFlagSVG code={player.nationCode} />
            </div>
            {/* Stylized Club Crest */}
            <div
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-white/60 shadow-2xs flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${player.clubColors[0]} 50%, ${player.clubColors[1]} 50%)`,
              }}
            >
              <div className="w-1 h-1 rounded-full bg-white/80" />
            </div>
          </div>

          {/* Right/Center Vector Silhouette */}
          <div className="absolute right-[-3px] top-[5px] w-[42px] h-[46px] sm:w-[50px] sm:h-[54px] pointer-events-none">
            <PlayerSilhouetteSVG player={player} />
          </div>

          {/* Name Banner at Bottom of Shield */}
          <div className="relative z-10 mt-auto pb-2.5 sm:pb-3 pt-0.5 bg-gradient-to-t from-black/45 via-white/45 to-transparent text-center">
            <div
              className={`text-[6.5px] sm:text-[7.5px] font-black uppercase tracking-tighter truncate px-1 ${tierStyles.text} bg-white/65 mx-1 rounded-[2px]`}
            >
              {player.shortName}
            </div>
          </div>
        </div>

        {/* Bottom Dark Tactical Position Pill (DC / MC / DFC) */}
        <div
          className={`-mt-1.5 px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider border shadow-md z-20 ${
            selected
              ? 'bg-[#22c55e] text-neutral-950 border-white'
              : 'bg-[#111827]/95 text-slate-200 border-slate-600/80'
          }`}
        >
          {badgeText || player.position}
        </div>
      </div>
    );
  }

  // 2. HAND CARD VERSION (Larger Card in Bottom Right Hand Dock with 6 Stats: PAC, SHO, PAS, DRI, DEF, PHY)
  return (
    <div
      onClick={onClick}
      className={`group relative select-none cursor-pointer transition-all duration-200 ${
        selected
          ? '-translate-y-2 scale-105 z-30 drop-shadow-[0_0_16px_rgba(74,222,128,0.85)]'
          : 'hover:-translate-y-1 opacity-90 hover:opacity-100 z-10'
      }`}
    >
      <div
        className={`relative w-[86px] h-[122px] sm:w-[94px] sm:h-[132px] bg-gradient-to-b ${tierStyles.bg} ${
          selected ? 'border-[#4ade80] ring-2 ring-[#4ade80]/70' : tierStyles.border
        } border-2 overflow-hidden flex flex-col justify-between p-1`}
        style={{
          clipPath:
            'polygon(12% 0%, 88% 0%, 100% 10%, 100% 86%, 50% 100%, 0% 86%, 0% 10%)',
        }}
      >
        {/* Top Section: Rating + Silhouette */}
        <div className="relative flex justify-between h-[60px] sm:h-[66px]">
          <div className="relative z-10 flex flex-col items-center w-[26px] pt-0.5 pl-0.5 leading-none">
            <span className={`text-[14px] sm:text-[15px] font-black tracking-tighter ${tierStyles.text}`}>
              {player.rating}
            </span>
            <span className={`text-[7.5px] font-extrabold uppercase ${tierStyles.subText}`}>
              {player.position}
            </span>
            <div className="w-3.5 h-2.5 my-0.5 border border-black/25">
              <NationFlagSVG code={player.nationCode} />
            </div>
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/70 shadow-2xs"
              style={{
                background: `linear-gradient(135deg, ${player.clubColors[0]} 50%, ${player.clubColors[1]} 50%)`,
              }}
            />
          </div>

          {/* Silhouette */}
          <div className="absolute right-[-2px] top-[2px] w-[58px] h-[62px] pointer-events-none">
            <PlayerSilhouetteSVG player={player} />
          </div>
        </div>

        {/* Player Name Bar */}
        <div className="relative z-10 bg-white/75 border-y border-black/20 py-[1px] text-center">
          <div className={`text-[8px] sm:text-[8.5px] font-black uppercase tracking-tight truncate px-1 ${tierStyles.text}`}>
            {player.shortName}
          </div>
        </div>

        {/* 6 Key Attributes Grid (PAC, DRI / SHO, DEF / PAS, PHY) */}
        <div className={`relative z-10 grid grid-cols-2 gap-x-1.5 gap-y-0 px-1.5 pb-2 pt-0.5 text-[7px] sm:text-[7.5px] font-mono leading-tight ${tierStyles.text}`}>
          <div className="flex justify-between">
            <span className="font-black">{player.stats.pac}</span>
            <span className="font-bold opacity-80">PAC</span>
          </div>
          <div className="flex justify-between">
            <span className="font-black">{player.stats.dri}</span>
            <span className="font-bold opacity-80">DRI</span>
          </div>
          <div className="flex justify-between">
            <span className="font-black">{player.stats.sho}</span>
            <span className="font-bold opacity-80">SHO</span>
          </div>
          <div className="flex justify-between">
            <span className="font-black">{player.stats.def}</span>
            <span className="font-bold opacity-80">DEF</span>
          </div>
          <div className="flex justify-between">
            <span className="font-black">{player.stats.pas}</span>
            <span className="font-bold opacity-80">PAS</span>
          </div>
          <div className="flex justify-between">
            <span className="font-black">{player.stats.phy}</span>
            <span className="font-bold opacity-80">PHY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
