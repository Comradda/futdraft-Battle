import React from 'react';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface ChipViewProps {
  value: number;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
}

export const ChipView: React.FC<ChipViewProps> = ({
  value,
  isSelected = false,
  onClick,
  size = 'md',
  count,
}) => {
  const getColors = () => {
    switch (value) {
      case 10:
        return {
          bg: 'from-blue-600 to-blue-800',
          border: 'border-blue-400',
          accent: 'bg-blue-300',
          text: 'text-white',
        };
      case 25:
        return {
          bg: 'from-emerald-600 to-emerald-800',
          border: 'border-emerald-400',
          accent: 'bg-emerald-300',
          text: 'text-white',
        };
      case 50:
        return {
          bg: 'from-red-600 to-red-800',
          border: 'border-red-400',
          accent: 'bg-red-300',
          text: 'text-white',
        };
      case 100:
        return {
          bg: 'from-neutral-800 to-black',
          border: 'border-amber-400',
          accent: 'bg-amber-300',
          text: 'text-amber-400',
        };
      case 500:
        return {
          bg: 'from-purple-700 to-purple-950',
          border: 'border-purple-300',
          accent: 'bg-pink-300',
          text: 'text-white',
        };
      default:
        return {
          bg: 'from-amber-600 to-amber-800',
          border: 'border-amber-300',
          accent: 'bg-amber-200',
          text: 'text-white',
        };
    }
  };

  const colors = getColors();

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-11 h-11 text-xs',
    lg: 'w-14 h-14 text-sm',
  }[size];

  const handleClick = () => {
    sound.playChip();
    triggerHaptic('light');
    if (onClick) onClick();
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        className={`relative ${sizeClasses} rounded-full bg-gradient-to-br ${colors.bg} 
          border-2 border-dashed ${colors.border} shadow-lg flex items-center justify-center 
          transition-transform active:scale-95 cursor-pointer font-bold ${colors.text}
          ${isSelected ? 'ring-3 ring-amber-400 -translate-y-2 scale-110 shadow-amber-500/50' : 'hover:scale-105'}`}
      >
        {/* Outer dash pattern */}
        <div className="absolute inset-1 rounded-full border border-white/20 flex items-center justify-center">
          {/* Inner ring */}
          <div className="w-[70%] h-[70%] rounded-full bg-black/40 border border-white/30 flex items-center justify-center">
            <span className="font-extrabold tracking-tight">${value}</span>
          </div>
        </div>
      </button>
      {count && count > 1 && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
          x{count}
        </span>
      )}
    </div>
  );
};
