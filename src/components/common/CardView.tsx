import React from 'react';
import type { StandardCard, SpanishCard, CardBackTheme } from '../../types/casino';

interface CardBackProps {
  theme: CardBackTheme;
}

export const CardBack: React.FC<CardBackProps> = ({ theme }) => {
  const getThemeStyles = () => {
    switch (theme) {
      case 'dragon_gold':
        return {
          bg: 'bg-gradient-to-br from-amber-900 via-amber-700 to-amber-950 border-amber-400',
          pattern: '🐉',
          inner: 'border-amber-300/40 bg-amber-950/50',
        };
      case 'aztec_royal':
        return {
          bg: 'bg-gradient-to-br from-teal-900 via-cyan-800 to-teal-950 border-cyan-400',
          pattern: '☀️',
          inner: 'border-cyan-300/40 bg-teal-950/50',
        };
      case 'cyberpunk':
        return {
          bg: 'bg-gradient-to-br from-purple-900 via-pink-900 to-neutral-950 border-pink-500',
          pattern: '⚡',
          inner: 'border-pink-400/40 bg-purple-950/50',
        };
      case 'classic_red':
      default:
        return {
          bg: 'bg-gradient-to-br from-red-800 via-red-700 to-red-950 border-red-300',
          pattern: '♠️',
          inner: 'border-white/30 bg-red-950/40',
        };
    }
  };

  const style = getThemeStyles();

  return (
    <div
      className={`w-full h-full rounded-lg border-2 ${style.bg} p-1.5 shadow-md flex items-center justify-center relative overflow-hidden`}
    >
      <div className={`w-full h-full rounded border-2 border-dashed ${style.inner} flex items-center justify-center`}>
        <span className="text-xl opacity-70 filter drop-shadow">{style.pattern}</span>
      </div>
    </div>
  );
};

// Standard 52-card component
export const StandardCardView: React.FC<{
  card: StandardCard;
  backTheme?: CardBackTheme;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
}> = ({ card, backTheme = 'dragon_gold', onClick, className = '', selected = false }) => {
  if (card.faceUp === false) {
    return (
      <div
        onClick={onClick}
        className={`w-14 h-20 sm:w-16 sm:h-24 transition-transform active:scale-95 cursor-pointer ${
          selected ? '-translate-y-2 ring-2 ring-amber-400' : ''
        } ${className}`}
      >
        <CardBack theme={backTheme} />
      </div>
    );
  }

  const getSuitSymbol = () => {
    switch (card.suit) {
      case 'hearts':
        return '♥️';
      case 'diamonds':
        return '♦️';
      case 'spades':
        return '♠️';
      case 'clubs':
        return '♣️';
    }
  };

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <div
      onClick={onClick}
      className={`w-14 h-20 sm:w-16 sm:h-24 bg-white rounded-lg border-2 border-neutral-300 shadow-md p-1 
        flex flex-col justify-between transition-transform active:scale-95 cursor-pointer 
        ${selected ? '-translate-y-2 ring-2 ring-amber-400 shadow-amber-400/40' : ''} ${className}`}
    >
      {/* Top Left */}
      <div className={`leading-none flex flex-col items-center self-start ${isRed ? 'text-red-600' : 'text-neutral-900'}`}>
        <span className="text-xs font-black">{card.rank}</span>
        <span className="text-[10px] leading-none">{getSuitSymbol()}</span>
      </div>

      {/* Center Icon */}
      <div className={`text-center text-lg sm:text-xl font-bold ${isRed ? 'text-red-600' : 'text-neutral-900'}`}>
        {getSuitSymbol()}
      </div>

      {/* Bottom Right (Rotated) */}
      <div className={`leading-none flex flex-col items-center self-end rotate-180 ${isRed ? 'text-red-600' : 'text-neutral-900'}`}>
        <span className="text-xs font-black">{card.rank}</span>
        <span className="text-[10px] leading-none">{getSuitSymbol()}</span>
      </div>
    </div>
  );
};

// Spanish 40-card Baraja component for Conquian
export const SpanishCardView: React.FC<{
  card: SpanishCard;
  backTheme?: CardBackTheme;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
  highlighted?: boolean;
}> = ({ card, backTheme = 'dragon_gold', onClick, className = '', selected = false, highlighted = false }) => {
  if (card.faceUp === false) {
    return (
      <div
        onClick={onClick}
        className={`w-14 h-20 sm:w-16 sm:h-24 transition-transform active:scale-95 cursor-pointer ${
          selected ? '-translate-y-3 ring-2 ring-amber-400' : ''
        } ${className}`}
      >
        <CardBack theme={backTheme} />
      </div>
    );
  }

  const getSuitIcon = () => {
    switch (card.suit) {
      case 'oros':
        return '🟡';
      case 'copas':
        return '🍷';
      case 'espadas':
        return '⚔️';
      case 'bastos':
        return '🪵';
    }
  };

  const getSuitColor = () => {
    switch (card.suit) {
      case 'oros':
        return 'text-amber-500';
      case 'copas':
        return 'text-red-500';
      case 'espadas':
        return 'text-sky-500';
      case 'bastos':
        return 'text-emerald-500';
    }
  };

  const getRankDisplay = () => {
    if (card.rank === '10') return 'Sota';
    if (card.rank === '11') return 'Cab';
    if (card.rank === '12') return 'Rey';
    return card.rank;
  };

  return (
    <div
      onClick={onClick}
      className={`w-14 h-20 sm:w-16 sm:h-24 bg-gradient-to-b from-amber-50 to-neutral-100 rounded-lg 
        border-2 ${highlighted ? 'border-emerald-400 ring-2 ring-emerald-400' : 'border-neutral-300'} 
        shadow-md p-1 flex flex-col justify-between transition-transform active:scale-95 cursor-pointer 
        ${selected ? '-translate-y-3 ring-2 ring-amber-400 shadow-amber-400/50 scale-105' : ''} ${className}`}
    >
      {/* Top Left */}
      <div className={`leading-none flex flex-col items-center self-start ${getSuitColor()}`}>
        <span className="text-[11px] font-black">{getRankDisplay()}</span>
        <span className="text-[10px]">{getSuitIcon()}</span>
      </div>

      {/* Center Illustration */}
      <div className="flex flex-col items-center justify-center my-auto">
        <span className="text-base sm:text-lg">{getSuitIcon()}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${getSuitColor()}`}>
          {card.suit}
        </span>
      </div>

      {/* Bottom Right */}
      <div className={`leading-none flex flex-col items-center self-end rotate-180 ${getSuitColor()}`}>
        <span className="text-[11px] font-black">{getRankDisplay()}</span>
        <span className="text-[10px]">{getSuitIcon()}</span>
      </div>
    </div>
  );
};
