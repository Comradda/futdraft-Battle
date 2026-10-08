import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface TouchChipTrayProps {
  onAddChip: (val: number) => void;
  disabled?: boolean;
  userBankroll?: number;
}

interface DragState {
  value: number;
  x: number;
  y: number;
  isDragging: boolean;
  startX: number;
  startY: number;
}

export const formatChipLabel = (val: number): string => {
  if (val >= 1000000) return `$${val / 1000000}M`;
  if (val >= 1000) return `$${val / 1000}k`;
  return `$${val}`;
};

export const TouchChipTray: React.FC<TouchChipTrayProps> = ({ onAddChip, disabled = false, userBankroll = 0 }) => {
  const [tier, setTier] = useState<'standard' | 'high_roller'>(() => (userBankroll >= 50000 ? 'high_roller' : 'standard'));
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  dragStateRef.current = dragState;

  // Timestamps to prevent mobile touch/mouse ghost event duplication
  const lastTouchTimeRef = useRef<number>(0);
  const lastAddRef = useRef<number>(0);

  const chipColors: Record<number, { bg: string; border: string; text: string }> = {
    10: { bg: 'from-blue-600 to-blue-900', border: 'border-blue-400', text: 'text-white' },
    25: { bg: 'from-emerald-600 to-emerald-900', border: 'border-emerald-400', text: 'text-white' },
    50: { bg: 'from-red-600 to-red-900', border: 'border-red-400', text: 'text-white' },
    100: { bg: 'from-neutral-900 to-black', border: 'border-amber-400', text: 'text-amber-300' },
    500: { bg: 'from-purple-800 to-purple-950', border: 'border-purple-300', text: 'text-white' },
    1000: { bg: 'from-amber-600 via-amber-500 to-yellow-700', border: 'border-amber-300', text: 'text-neutral-950' },
    5000: { bg: 'from-rose-600 via-red-500 to-rose-900', border: 'border-rose-300', text: 'text-white' },
    25000: { bg: 'from-cyan-600 via-blue-500 to-cyan-900', border: 'border-cyan-300', text: 'text-white' },
    100000: { bg: 'from-emerald-500 via-green-600 to-teal-900', border: 'border-emerald-300', text: 'text-white' },
    500000: { bg: 'from-purple-600 via-fuchsia-600 to-purple-950', border: 'border-fuchsia-300', text: 'text-white' },
    1000000: { bg: 'from-yellow-300 via-amber-400 to-yellow-600', border: 'border-yellow-100', text: 'text-neutral-950' },
  };

  const standardChips = [25, 50, 100, 500, 1000];
  const highRollerChips = [5000, 25000, 100000, 500000, 1000000];
  const chips = tier === 'high_roller' ? highRollerChips : standardChips;

  // Global move and release handlers
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStateRef.current) return;

    const current = dragStateRef.current;
    const dist = Math.hypot(clientX - current.startX, clientY - current.startY);

    // If moved more than 8px, consider it an active visual drag
    setDragState({
      ...current,
      x: clientX,
      y: clientY,
      isDragging: dist > 8 || current.isDragging,
    });
  }, []);

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    const current = dragStateRef.current;
    if (!current) return;

    // Prevent duplicate firing within 300ms
    const now = Date.now();
    if (now - lastAddRef.current < 300) {
      setDragState(null);
      return;
    }

    const dist = Math.hypot(clientX - current.startX, clientY - current.startY);

    // If it was just a tap (< 8px movement), trigger single add
    if (dist < 8 && !current.isDragging) {
      lastAddRef.current = now;
      sound.playChip(current.value);
      triggerHaptic('light');
      onAddChip(current.value);
      setDragState(null);
      return;
    }

    // Check if dropped over a betting zone
    const target = document.elementFromPoint(clientX, clientY);
    const dropZone = target?.closest('[data-drop-zone="bet"]');

    if (dropZone) {
      lastAddRef.current = now;
      sound.playChipDrop();
      sound.playChip(current.value);
      triggerHaptic('medium');
      onAddChip(current.value);
    }

    setDragState(null);
  }, [onAddChip]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (dragStateRef.current) {
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (dragStateRef.current) {
        const touch = e.changedTouches[0];
        handleEnd(touch.clientX, touch.clientY);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (dragStateRef.current) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (dragStateRef.current) {
        handleEnd(e.clientX, e.clientY);
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleMove, handleEnd]);

  const handleStart = (val: number, clientX: number, clientY: number) => {
    if (disabled) return;
    setDragState({
      value: val,
      x: clientX,
      y: clientY,
      startX: clientX,
      startY: clientY,
      isDragging: false,
    });
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-md mx-auto touch-none select-none">
      {/* Tier Switcher & Quick Bet Bar */}
      <div className="flex items-center justify-between px-1">
        {/* Tier Toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-black/60 border border-white/10 text-[10px]">
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              triggerHaptic('light');
              setTier('standard');
            }}
            className={`px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
              tier === 'standard'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Fichas Clásicas
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playChip(1000);
              triggerHaptic('medium');
              setTier('high_roller');
            }}
            className={`px-2 py-0.5 rounded-full font-black transition-all cursor-pointer flex items-center gap-1 ${
              tier === 'high_roller'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>👑 High Roller</span>
            <span className="text-[8px] bg-black/40 px-1 rounded text-white font-mono">$1M</span>
          </button>
        </div>

        {/* Quick Multipliers for High Roller */}
        {tier === 'high_roller' && (
          <div className="flex items-center gap-1 text-[10px] overflow-x-auto max-w-[210px] no-scrollbar">
            {[10000, 50000, 100000, 500000, 1000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  sound.playChip(amt);
                  triggerHaptic('medium');
                  onAddChip(amt);
                }}
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-amber-400 hover:text-black font-black font-mono text-amber-300 border border-amber-500/30 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                +{formatChipLabel(amt)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chip Selection Tray */}
      <div className="flex items-center justify-around py-1 w-full">
        {chips.map((val) => {
          const color = chipColors[val] || chipColors[100];
          const label = formatChipLabel(val);

          return (
            <div
              key={val}
              onTouchStart={(e) => {
                lastTouchTimeRef.current = Date.now();
                const t = e.touches[0];
                handleStart(val, t.clientX, t.clientY);
              }}
              onMouseDown={(e) => {
                // Ignore synthetic mouse events right after touch
                if (Date.now() - lastTouchTimeRef.current < 700) return;
                handleStart(val, e.clientX, e.clientY);
              }}
              className="relative flex flex-col items-center cursor-grab active:cursor-grabbing transform transition-transform active:scale-95"
            >
              <div
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br ${color.bg} 
                  border-2 border-dashed ${color.border} shadow-[0_4px_12px_rgba(0,0,0,0.5)] 
                  flex items-center justify-center font-black ${color.text} text-xs sm:text-sm hover:scale-105`}
              >
                {/* Inner Ring */}
                <div className="w-[74%] h-[74%] rounded-full bg-black/40 border border-white/20 flex items-center justify-center shadow-inner">
                  <span className="tracking-tight font-black">{label}</span>
                </div>
              </div>
              <span className="text-[10px] text-neutral-300 font-bold mt-1 font-mono">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Floating Animated Dragged Chip Overlay (Visible 100% on touch & mouse) */}
      {dragState && dragState.isDragging && (
        <div
          style={{
            position: 'fixed',
            left: `${dragState.x}px`,
            top: `${dragState.y}px`,
            transform: 'translate(-50%, -50%) scale(1.22)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="animate-in zoom-in-90 duration-75"
        >
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-br ${
              chipColors[dragState.value]?.bg || 'from-amber-600 to-amber-900'
            } border-2 border-dashed ${
              chipColors[dragState.value]?.border || 'border-amber-400'
            } shadow-[0_15px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center font-black ${
              chipColors[dragState.value]?.text || 'text-white'
            } text-sm`}
          >
            <div className="w-[74%] h-[74%] rounded-full bg-black/50 border border-white/30 flex items-center justify-center shadow-inner">
              <span className="tracking-tight drop-shadow font-black">{formatChipLabel(dragState.value)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
