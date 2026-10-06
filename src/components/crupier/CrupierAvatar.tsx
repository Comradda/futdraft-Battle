import React, { useState } from 'react';
import type { CrupierMood, PersonalityType } from '../../types/casino';
import { PERSONALITY_CONFIGS } from '../../utils/crupierAI';
import { Glasses } from 'lucide-react';

interface CrupierAvatarProps {
  mood?: CrupierMood;
  isSpeaking?: boolean;
  personality?: PersonalityType;
  showSunglasses?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const CrupierAvatar: React.FC<CrupierAvatarProps> = ({
  mood = 'neutral',
  isSpeaking = false,
  personality = 'neutral',
  showSunglasses = false,
  size = 72,
  className = '',
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const config = PERSONALITY_CONFIGS[personality] || PERSONALITY_CONFIGS.neutral;

  // Personality-specific metallic border & glow colors
  const getThemeStyling = () => {
    switch (personality) {
      case 'burlona': // Valeria - Crimson silk & gold
        return {
          ring: 'border-rose-500 shadow-[0_0_22px_rgba(244,63,94,0.55)]',
          glow: 'rgba(244, 63, 94, 0.4)',
          badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-500/50',
          accent: '#f43f5e',
        };
      case 'desafiante': // Marcus - Sapphire Boss
        return {
          ring: 'border-sky-500 shadow-[0_0_22px_rgba(14,165,233,0.55)]',
          glow: 'rgba(14, 165, 233, 0.4)',
          badgeBg: 'bg-sky-950/90 text-sky-300 border-sky-500/50',
          accent: '#0ea5e9',
        };
      case 'amigable': // Elena - Emerald host
        return {
          ring: 'border-emerald-500 shadow-[0_0_22px_rgba(16,185,129,0.55)]',
          glow: 'rgba(16, 185, 129, 0.4)',
          badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
          accent: '#10b981',
        };
      case 'neutral': // Sarah - Royal VIP Gold
      default:
        return {
          ring: 'border-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.55)]',
          glow: 'rgba(251, 191, 36, 0.4)',
          badgeBg: 'bg-neutral-900/90 text-amber-300 border-amber-400/50',
          accent: '#f59e0b',
        };
    }
  };

  const theme = getThemeStyling();

  // Mood emoji icon
  const getMoodBadge = () => {
    if (mood === 'laughing') return '😂';
    if (mood === 'smirk') return '😏';
    if (mood === 'challenging') return '🔥';
    if (mood === 'celebrating') return '🎉';
    if (mood === 'impressed') return '🤩';
    if (mood === 'thinking') return '🤔';
    return config.badge.split(' ')[0] || '👑';
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`relative inline-block cursor-pointer select-none transition-transform duration-300 active:scale-95 ${className}`}
      style={{ width: size, height: size }}
      title={`${config.name} • ${config.title}`}
    >
      {/* Background Animated Aura Glow */}
      <div
        className="absolute -inset-1.5 rounded-2xl blur-md transition-all duration-500 pointer-events-none"
        style={{
          backgroundColor: theme.glow,
          transform: isSpeaking ? 'scale(1.18)' : 'scale(1.0)',
          opacity: isSpeaking ? 0.95 : 0.5,
        }}
      />

      {/* Main Avatar Container */}
      <div
        className={`relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
          theme.ring
        } ${isSpeaking ? 'scale-105' : 'hover:scale-[1.03]'} bg-neutral-950`}
      >
        {!imageError ? (
          <img
            src={config.image}
            alt={config.name}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover object-top filter brightness-105 contrast-[1.03] transition-transform duration-500 ${
              isSpeaking ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          /* Graceful Fallback */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 p-1">
            <span className="text-xl font-black text-amber-400">
              {config.name.substring(0, 1)}
            </span>
            <span className="text-[9px] font-bold text-neutral-300 truncate max-w-full">
              {config.name}
            </span>
          </div>
        )}

        {/* Glossy Top Glass Shimmer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/15 pointer-events-none" />

        {/* Sunglasses Overlay if enabled */}
        {showSunglasses && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
            <div className="p-1 rounded-full bg-black/80 border border-amber-400/60 shadow-lg text-amber-400 animate-in fade-in zoom-in-75">
              <Glasses className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        )}

        {/* Live Speaking Waves Overlay */}
        {isSpeaking && (
          <div className="absolute bottom-1 inset-x-0 flex items-center justify-center gap-0.5 px-1 py-0.5 bg-black/70 backdrop-blur-sm pointer-events-none">
            <span className="w-0.5 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 h-3 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
            <span className="w-0.5 h-3.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
            <span className="w-0.5 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '360ms' }} />
          </div>
        )}
      </div>

      {/* Floating Status Mood Badge */}
      <div
        className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full border shadow-md flex items-center justify-center text-[10px] pointer-events-none font-bold ${theme.badgeBg}`}
      >
        <span>{getMoodBadge()}</span>
      </div>
    </div>
  );
};
