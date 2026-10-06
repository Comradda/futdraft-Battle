import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface TouchChipTrayProps {
  onAddChip: (val: number) => void;
  disabled?: boolean;
}

interface DragState {
  value: number;
  x: number;
  y: number;
  isDragging: boolean;
  startX: number;
  startY: number;
}

export const TouchChipTray: React.FC<TouchChipTrayProps> = ({ onAddChip, disabled = false }) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  dragStateRef.current = dragState;

  const chipColors: Record<number, { bg: string; border: string; text: string }> = {
    10: { bg: 'from-blue-600 to-blue-900', border: 'border-blue-400', text: 'text-white' },
    25: { bg: 'from-emerald-600 to-emerald-900', border: 'border-emerald-400', text: 'text-white' },
    50: { bg: 'from-red-600 to-red-900', border: 'border-red-400', text: 'text-white' },
    100: { bg: 'from-neutral-900 to-black', border: 'border-amber-400', text: 'text-amber-300' },
    500: { bg: 'from-purple-800 to-purple-950', border: 'border-purple-300', text: 'text-white' },
  };

  const chips = [10, 25, 50, 100, 500];

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

    const dist = Math.hypot(clientX - current.startX, clientY - current.startY);

    // If it was just a tap (< 8px movement), trigger instant add
    if (dist < 8 && !current.isDragging) {
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
        e.preventDefault();
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
    sound.playChip(val);
    triggerHaptic('light');
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
    <>
      {/* Chip Selection Tray */}
      <div className="flex items-center justify-around py-1 w-full max-w-md mx-auto touch-none select-none">
        {chips.map((val) => {
          const color = chipColors[val] || chipColors[10];

          return (
            <div
              key={val}
              onTouchStart={(e) => {
                const t = e.touches[0];
                handleStart(val, t.clientX, t.clientY);
              }}
              onMouseDown={(e) => {
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
                  <span className="tracking-tight">${val}</span>
                </div>
              </div>
              <span className="text-[10px] text-neutral-400 font-bold mt-1">
                ${val}
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
              <span className="tracking-tight drop-shadow">${dragState.value}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
