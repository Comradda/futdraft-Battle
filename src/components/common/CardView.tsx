import React from 'react';
import type { StandardCard, SpanishCard, CardBackTheme } from '../../types/casino';

// ==========================================
// ULTRA-REALISTIC VECTOR SUIT ICONS
// ==========================================

export const SpadeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50 5 C38 25 15 45 15 62 C15 76 26 84 38 84 C44 84 48 81 50 78 C52 81 56 84 62 84 C74 84 85 76 85 62 C85 45 62 25 50 5 Z" />
    <path d="M47 70 L43 95 L57 95 L53 70 Z" />
  </svg>
);

export const HeartIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50 88 C46 84 15 58 15 36 C15 20 27 12 40 12 C46 12 50 15 50 18 C50 15 54 12 60 12 C73 12 85 20 85 36 C85 58 54 84 50 88 Z" />
  </svg>
);

export const DiamondIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50 5 L85 50 L50 95 L15 50 Z" />
  </svg>
);

export const ClubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <circle cx="50" cy="32" r="22" />
    <circle cx="30" cy="58" r="22" />
    <circle cx="70" cy="58" r="22" />
    <path d="M46 55 L42 95 L58 95 L54 55 Z" />
  </svg>
);

// ==========================================
// REALISTIC BARAJA ESPAÑOLA (FOURNIER STYLE)
// ==========================================

export const OroIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    {/* Outer gold rim */}
    <circle cx="50" cy="50" r="46" fill="#D4AF37" stroke="#996515" strokeWidth="4" />
    <circle cx="50" cy="50" r="41" fill="none" stroke="#FDE047" strokeWidth="2" strokeDasharray="3,3" />
    <circle cx="50" cy="50" r="36" fill="#B8860B" stroke="#78350F" strokeWidth="2" />
    {/* Inner Sunburst / Spanish Doubloon Crest */}
    <circle cx="50" cy="50" r="22" fill="#EAB308" stroke="#854D0E" strokeWidth="2" />
    {/* Sun rays */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <line
        key={deg}
        x1="50"
        y1="16"
        x2="50"
        y2="26"
        transform={`rotate(${deg} 50 50)`}
        stroke="#FEF08A"
        strokeWidth="3"
        strokeLinecap="round"
      />
    ))}
    {/* Center royal star */}
    <polygon points="50,38 53,46 62,46 55,51 58,60 50,54 42,60 45,51 38,46 47,46" fill="#FEF08A" stroke="#854D0E" strokeWidth="1" />
  </svg>
);

export const CopaIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    {/* Chalice Bowl */}
    <path d="M22 18 C22 55 38 65 47 68 L47 82 L34 88 L34 94 L66 94 L66 88 L53 82 L53 68 C62 65 78 55 78 18 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="3" />
    <path d="M28 20 Q50 30 72 20 L76 25 Q50 38 24 25 Z" fill="#D4AF37" stroke="#78350F" strokeWidth="1.5" />
    {/* Gold ornamental trims */}
    <ellipse cx="50" cy="18" rx="28" ry="8" fill="#B91C1C" stroke="#D4AF37" strokeWidth="3" />
    <ellipse cx="50" cy="18" rx="22" ry="5" fill="#EF4444" />
    {/* Center medallion */}
    <circle cx="50" cy="42" r="8" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />
    <circle cx="50" cy="42" r="3.5" fill="#991B1B" />
    {/* Stem & Base */}
    <rect x="47" y="68" width="6" height="15" fill="#D4AF37" stroke="#78350F" strokeWidth="1.5" />
    <path d="M30 92 L70 92 L64 85 L36 85 Z" fill="#D4AF37" stroke="#78350F" strokeWidth="2" />
  </svg>
);

export const EspadaIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    {/* Curved Toledo Steel Blade */}
    <path d="M49 8 Q56 35 53 65 L47 65 Q44 35 49 8 Z" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
    <path d="M49 8 L51 65" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Guard / Crossguard */}
    <path d="M25 65 Q50 68 75 65 C78 65 80 69 76 72 Q50 75 24 72 C20 69 22 65 25 65 Z" fill="#D4AF37" stroke="#78350F" strokeWidth="2" />
    {/* Hilt and Pommel */}
    <rect x="47" y="73" width="6" height="15" rx="2" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
    <circle cx="50" cy="91" r="5" fill="#D4AF37" stroke="#78350F" strokeWidth="2" />
  </svg>
);

export const BastoIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    {/* Heavy Wooden Club */}
    <path d="M45 10 C42 10 38 18 36 30 C34 45 42 75 46 90 L54 90 C58 75 66 45 64 30 C62 18 58 10 55 10 Z" fill="#15803D" stroke="#14532D" strokeWidth="2.5" />
    {/* Knots and bark details */}
    <ellipse cx="44" cy="28" rx="5" ry="3" fill="#166534" />
    <ellipse cx="56" cy="48" rx="6" ry="3.5" fill="#166534" />
    <ellipse cx="45" cy="68" rx="4" ry="2.5" fill="#166534" />
    {/* Leaves sprouting */}
    <path d="M35 30 Q22 28 26 22 Q34 26 35 30 Z" fill="#4ADE80" stroke="#166534" strokeWidth="1" />
    <path d="M64 42 Q78 38 74 32 Q65 38 64 42 Z" fill="#4ADE80" stroke="#166534" strokeWidth="1" />
    <path d="M37 60 Q24 62 26 56 Q35 57 37 60 Z" fill="#4ADE80" stroke="#166534" strokeWidth="1" />
  </svg>
);

// ==========================================
// REALISTIC CARD BACK (FOURNIER / BICYCLE)
// ==========================================

export const CardBack: React.FC<{ theme?: CardBackTheme; className?: string }> = ({
  theme = 'dragon_gold',
  className = '',
}) => {
  const getThemePalette = () => {
    switch (theme) {
      case 'aztec_royal':
        return { bg: 'bg-[#0a2f35]', border: 'border-[#14b8a6]', primary: '#14b8a6', secondary: '#0f766e' };
      case 'cyberpunk':
        return { bg: 'bg-[#1e1035]', border: 'border-[#ec4899]', primary: '#ec4899', secondary: '#8b5cf6' };
      case 'classic_red':
        return { bg: 'bg-[#5b0e17]', border: 'border-[#dc2626]', primary: '#ef4444', secondary: '#991b1b' };
      case 'dragon_gold':
      default:
        return { bg: 'bg-[#1c1810]', border: 'border-[#d4af37]', primary: '#d4af37', secondary: '#78350f' };
    }
  };

  const p = getThemePalette();

  return (
    <div
      className={`w-full h-full rounded-lg border-2 ${p.border} ${p.bg} shadow-md relative overflow-hidden flex items-center justify-center p-1 select-none ${className}`}
    >
      {/* Outer border margin */}
      <div className="w-full h-full rounded border border-white/20 p-1 flex items-center justify-center relative overflow-hidden">
        {/* Intricate Casino Guilloche Pattern */}
        <svg className="w-full h-full opacity-60" viewBox="0 0 100 140" fill="none">
          <pattern id="cardPattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M8 0 L16 8 L8 16 L0 8 Z" stroke={p.primary} strokeWidth="0.8" fill="none" />
            <circle cx="8" cy="8" r="2.5" fill={p.primary} opacity="0.7" />
          </pattern>
          <rect width="100" height="140" fill="url(#cardPattern)" />
          {/* Ornate corner rosettes */}
          <circle cx="15" cy="15" r="8" stroke={p.primary} strokeWidth="1.2" fill={p.secondary} />
          <circle cx="85" cy="15" r="8" stroke={p.primary} strokeWidth="1.2" fill={p.secondary} />
          <circle cx="15" cy="125" r="8" stroke={p.primary} strokeWidth="1.2" fill={p.secondary} />
          <circle cx="85" cy="125" r="8" stroke={p.primary} strokeWidth="1.2" fill={p.secondary} />
          {/* Center Royal Medallion */}
          <circle cx="50" cy="70" r="18" fill={p.secondary} stroke={p.primary} strokeWidth="2" />
          <circle cx="50" cy="70" r="14" fill="none" stroke={p.primary} strokeWidth="1" strokeDasharray="2,2" />
          <polygon points="50,60 53,67 60,67 55,71 57,78 50,74 43,78 45,71 40,67 47,67" fill={p.primary} />
        </svg>
      </div>
    </div>
  );
};

// ==========================================
// STANDARD 52-CARD VIEW (BLACKJACK & POKER)
// ==========================================

export const StandardCardView: React.FC<{
  card: StandardCard;
  backTheme?: CardBackTheme;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
  highlighted?: boolean;
}> = ({ card, backTheme = 'dragon_gold', onClick, className = '', selected = false, highlighted = false }) => {
  if (!card) return null;

  if (card.faceUp === false) {
    return (
      <div
        onClick={onClick}
        className={`w-14 h-20 sm:w-16 sm:h-24 transition-transform active:scale-95 cursor-pointer card-3d-physical rounded-lg ${
          selected ? '-translate-y-2.5 ring-2 ring-amber-400' : ''
        } ${className}`}
      >
        <CardBack theme={backTheme} />
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const colorClass = isRed ? 'text-[#c41e3a]' : 'text-[#141619]';

  const renderSuitIcon = (size = 'w-3 h-3 sm:w-3.5 sm:h-3.5') => {
    switch (card.suit) {
      case 'hearts':
        return <HeartIcon className={size} />;
      case 'diamonds':
        return <DiamondIcon className={size} />;
      case 'spades':
        return <SpadeIcon className={size} />;
      case 'clubs':
        return <ClubIcon className={size} />;
    }
  };

  const isCourtCard = ['J', 'Q', 'K'].includes(card.rank);

  return (
    <div
      onClick={onClick}
      className={`w-14 h-20 sm:w-16 sm:h-24 rounded-lg bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-[#eef2f6] border border-neutral-300/90 p-1.5 
        flex flex-col justify-between cursor-pointer select-none relative overflow-hidden card-3d-physical
        ${highlighted ? 'ring-2 ring-emerald-400 border-emerald-400' : ''}
        ${selected ? '-translate-y-3 ring-2 ring-amber-400 scale-105' : ''} ${className}`}
    >
      {/* 3D Specular Gloss Reflection Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Top Left Index */}
      <div className={`leading-none flex flex-col items-center self-start z-10 ${colorClass}`}>
        <span className="text-xs sm:text-sm font-black tracking-tight">{card.rank}</span>
        <div className="mt-0.5">{renderSuitIcon('w-2.5 h-2.5 sm:w-3 sm:h-3')}</div>
      </div>

      {/* Center Artwork / Pip */}
      <div className={`flex flex-col items-center justify-center my-auto z-10 ${colorClass}`}>
        {isCourtCard ? (
          <div className="flex flex-col items-center">
            {renderSuitIcon('w-5 h-5 sm:w-6 sm:h-6')}
            <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 px-1 rounded bg-black/5">
              {card.rank === 'K' ? 'REY' : card.rank === 'Q' ? 'REINA' : 'JOTA'}
            </span>
          </div>
        ) : card.rank === 'A' ? (
          <div className="flex flex-col items-center scale-125 drop-shadow-sm">
            {renderSuitIcon('w-6 h-6 sm:w-7 sm:h-7')}
          </div>
        ) : (
          renderSuitIcon('w-5 h-5 sm:w-6 sm:h-6')
        )}
      </div>

      {/* Bottom Right Index (Rotated) */}
      <div className={`leading-none flex flex-col items-center self-end rotate-180 z-10 ${colorClass}`}>
        <span className="text-xs sm:text-sm font-black tracking-tight">{card.rank}</span>
        <div className="mt-0.5">{renderSuitIcon('w-2.5 h-2.5 sm:w-3 sm:h-3')}</div>
      </div>
    </div>
  );
};

// ==========================================
// REALISTIC SPANISH BARAJA (CONQUIÁN 40 CARDS)
// ==========================================

export const SpanishCardView: React.FC<{
  card: SpanishCard;
  backTheme?: CardBackTheme;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
  highlighted?: boolean;
}> = ({ card, backTheme = 'dragon_gold', onClick, className = '', selected = false, highlighted = false }) => {
  if (!card) return null;

  if (card.faceUp === false) {
    return (
      <div
        onClick={onClick}
        className={`w-14 h-20 sm:w-16 sm:h-24 transition-transform active:scale-95 cursor-pointer card-3d-physical rounded-lg ${
          selected ? '-translate-y-3 ring-2 ring-amber-400' : ''
        } ${className}`}
      >
        <CardBack theme={backTheme} />
      </div>
    );
  }

  const renderSpanishSuit = (classNameStr = 'w-5 h-5') => {
    switch (card.suit) {
      case 'oros':
        return <OroIcon className={classNameStr} />;
      case 'copas':
        return <CopaIcon className={classNameStr} />;
      case 'espadas':
        return <EspadaIcon className={classNameStr} />;
      case 'bastos':
        return <BastoIcon className={classNameStr} />;
    }
  };

  const getSuitTheme = () => {
    switch (card.suit) {
      case 'oros':
        return { text: 'text-[#92400e]', border: 'border-[#fef08a]', name: 'OROS' };
      case 'copas':
        return { text: 'text-[#991b1b]', border: 'border-[#fecaca]', name: 'COPAS' };
      case 'espadas':
        return { text: 'text-[#1e3a8a]', border: 'border-[#bfdbfe]', name: 'ESPADAS' };
      case 'bastos':
        return { text: 'text-[#14532d]', border: 'border-[#bbf7d0]', name: 'BASTOS' };
    }
  };

  const theme = getSuitTheme();

  const getRankName = () => {
    if (card.rank === '10') return 'SOTA';
    if (card.rank === '11') return 'CABALLO';
    if (card.rank === '12') return 'REY';
    return card.rank;
  };

  return (
    <div
      onClick={onClick}
      className={`w-14 h-20 sm:w-16 sm:h-24 rounded-lg bg-gradient-to-b from-[#fffdfa] via-[#faf6ee] to-[#f3ece0] border-2 p-1.5 
        flex flex-col justify-between cursor-pointer select-none relative overflow-hidden card-3d-physical
        ${highlighted ? 'ring-2 ring-emerald-400 border-emerald-400' : 'border-neutral-300'}
        ${selected ? '-translate-y-3 ring-2 ring-amber-400 scale-105' : ''} ${className}`}
    >
      {/* 3D Specular Gloss Reflection */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent pointer-events-none" />

      {/* Inner Spanish border frame */}
      <div className="absolute inset-1 rounded border border-amber-900/20 pointer-events-none" />

      {/* Top Left Corner */}
      <div className={`leading-none flex flex-col items-center self-start ${theme.text} z-10`}>
        <span className="text-[11px] sm:text-xs font-black">{card.rank}</span>
        <div className="mt-0.5 scale-75">{renderSpanishSuit('w-4 h-4')}</div>
      </div>

      {/* Center Artwork */}
      <div className="flex flex-col items-center justify-center my-auto z-10">
        <div className="scale-110 sm:scale-125 filter drop-shadow-sm">
          {renderSpanishSuit('w-6 h-6 sm:w-7 sm:h-7')}
        </div>
        <span className={`text-[8px] font-black tracking-wider uppercase mt-1 ${theme.text}`}>
          {getRankName()}
        </span>
      </div>

      {/* Bottom Right Corner (Rotated) */}
      <div className={`leading-none flex flex-col items-center self-end rotate-180 ${theme.text} z-10`}>
        <span className="text-[11px] sm:text-xs font-black">{card.rank}</span>
        <div className="mt-0.5 scale-75">{renderSpanishSuit('w-4 h-4')}</div>
      </div>
    </div>
  );
};
