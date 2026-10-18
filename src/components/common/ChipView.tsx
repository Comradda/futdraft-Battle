import React from 'react';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface ChipViewProps {
  value: number;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export const ChipView: React.FC<ChipViewProps> = ({
  value,
  isSelected = false,
  onClick,
  size = 'md',
  count,
  draggable = true,
  onDragStart,
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
      case 1000:
        return {
          bg: 'from-amber-500 via-yellow-500 to-amber-800',
          border: 'border-amber-200',
          accent: 'bg-yellow-200',
          text: 'text-neutral-950',
        };
      case 5000:
        return {
          bg: 'from-rose-600 via-red-600 to-rose-950',
          border: 'border-rose-300',
          accent: 'bg-rose-200',
          text: 'text-white',
        };
      case 25000:
        return {
          bg: 'from-cyan-600 via-blue-600 to-cyan-950',
          border: 'border-cyan-300',
          accent: 'bg-cyan-200',
          text: 'text-white',
        };
      case 100000:
        return {
          bg: 'from-emerald-500 via-green-600 to-teal-950',
          border: 'border-emerald-300',
          accent: 'bg-emerald-200',
          text: 'text-white',
        };
      case 500000:
        return {
          bg: 'from-fuchsia-600 via-purple-600 to-purple-950',
          border: 'border-fuchsia-300',
          accent: 'bg-fuchsia-200',
          text: 'text-white',
        };
      case 1000000:
        return {
          bg: 'from-yellow-300 via-amber-400 to-yellow-600',
          border: 'border-yellow-100',
          accent: 'bg-white',
          text: 'text-neutral-950',
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

  const formatChipText = (val: number) => {
    if (val >= 1000000) return `$${val / 1000000}M`;
    if (val >= 1000) return `$${val / 1000}K`;
    return `$${val}`;
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-11 h-11 text-xs',
    lg: 'w-14 h-14 text-sm',
  }[size];

  const handleClick = () => {
    sound.playChip(value);
    triggerHaptic('light');
    if (onClick) onClick();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', value.toString());
    sound.playChip(value);
    triggerHaptic('medium');
    if (onDragStart) onDragStart(e);
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        draggable={draggable}
        onDragStart={handleDragStart}
        onClick={handleClick}
        className={`relative ${sizeClasses} rounded-full bg-gradient-to-br ${colors.bg} 
          border-2 border-dashed ${colors.border} chip-3d-token flex items-center justify-center 
          transition-transform active:scale-95 cursor-grab active:cursor-grabbing font-bold ${colors.text}
          ${isSelected ? 'ring-3 ring-[#00e701] -translate-y-2 scale-110 shadow-[#00e701]/40' : 'hover:scale-105'}`}
      >
        {/* Outer dash pattern */}
        <div className="absolute inset-1 rounded-full border border-white/25 flex items-center justify-center pointer-events-none">
          {/* Inner ring */}
          <div className="w-[72%] h-[72%] rounded-full bg-black/45 border border-white/30 flex items-center justify-center shadow-inner">
            <span className="font-extrabold tracking-tight">{formatChipText(value)}</span>
          </div>
        </div>
      </button>
      {count && count > 1 && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow pointer-events-none">
          x{count}
        </span>
      )}
    </div>
  );
};
