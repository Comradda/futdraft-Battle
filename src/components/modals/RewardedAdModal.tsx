import React, { useState, useEffect } from 'react';
import { Play, Sparkles, X, CheckCircle2, ShieldCheck, Film } from 'lucide-react';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (amount: number) => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isPlaying && secondsLeft > 0) {
      timer = setTimeout(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isPlaying && secondsLeft === 0) {
      setIsCompleted(true);
      setIsPlaying(false);
      sound.playWin();
      triggerHaptic('success');
    }
    return () => clearTimeout(timer);
  }, [isPlaying, secondsLeft]);

  if (!isOpen) return null;

  const handleStartAd = () => {
    setIsPlaying(true);
    setSecondsLeft(5);
    setIsCompleted(false);
    triggerHaptic('medium');
  };

  const handleClaim = () => {
    onRewardClaimed(500); // 500 pesos de recompensa
    triggerHaptic('success');
    onClose();
    // Reset state
    setIsCompleted(false);
    setIsPlaying(false);
    setSecondsLeft(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-amber-500/30 shadow-2xl p-5 overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button (only available if not currently watching mandatory ad) */}
        {!isPlaying && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {!isPlaying && !isCompleted && (
          <div className="text-center py-3">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-inner">
              💰
            </div>
            <h3 className="text-xl font-bold text-white mb-1">¿Te quedaste sin fichas?</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Mira un breve anuncio patrocinado de 5 segundos para recargar tu banca al instante y continuar jugando.
            </p>

            <div className="p-3 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-semibold text-neutral-300">Bolsa de Recarga:</span>
              </div>
              <span className="text-sm font-extrabold text-amber-400">+$500 MXN</span>
            </div>

            <button
              onClick={handleStartAd}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 font-bold text-neutral-950 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Ver Anuncio y Ganar Fichas
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="text-center py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 flex items-center gap-1">
                <Film className="w-3 h-3" /> Patrocinador Oficial
              </span>
              <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                0:0{secondsLeft}
              </span>
            </div>

            {/* Simulated Mobile Video Ad Frame */}
            <div className="w-full h-44 rounded-xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 border border-purple-500/40 p-4 flex flex-col justify-between relative overflow-hidden shadow-inner mb-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
              
              <div className="text-left">
                <span className="text-[10px] font-bold text-purple-300">DISPONIBLE EN WEB & MOVIL</span>
                <h4 className="text-lg font-black text-white leading-tight">VEGAS ROYALE APP</h4>
              </div>

              <div className="text-center animate-pulse">
                <span className="text-4xl">🎰 💎 ⚡</span>
                <p className="text-xs font-bold text-amber-300 mt-1">¡Gana Premios Reales!</p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${((5 - secondsLeft) / 5) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              La recompensa se liberará al terminar la reproducción
            </p>
          </div>
        )}

        {isCompleted && (
          <div className="text-center py-4 animate-scaleUp">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-3xl">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">¡Anuncio Completado!</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Tu recompensa de $500 pesos ha sido verificada y acreditada a tu cuenta.
            </p>

            <button
              onClick={handleClaim}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-bold text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer text-sm"
            >
              Reclamar $500 MXN y Seguir Jugando
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
