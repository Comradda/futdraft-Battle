import React from 'react';
import { Gift, Sparkles, X, Check, Flame, Trophy, Calendar } from 'lucide-react';
import type { UserProfile } from '../../types/casino';
import {
  DAILY_REWARD_TIERS,
  canClaimDailyReward,
  claimDailyReward,
  formatMoney,
} from '../../utils/storage';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import confetti from 'canvas-confetti';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const isAvailable = canClaimDailyReward(profile);
  const currentStreak = profile.dailyStreak || 0;
  // If available, next streak to claim is either streak + 1 or 1
  const nextStreak = currentStreak >= 7 ? 1 : currentStreak + 1;

  const handleClaim = () => {
    if (!isAvailable) return;

    triggerHaptic('heavy');
    const result = claimDailyReward(profile);

    sound.playWin();
    sound.playCashRegister();

    confetti({
      particleCount: result.isJackpot ? 150 : 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#ffffff', '#eab308'],
    });

    onUpdateProfile(result.updatedProfile);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-neutral-950/95 border border-amber-500/40 shadow-2xl p-4 sm:p-5 flex flex-col max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-1.5">
                Recompensa Diaria VIP
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
              </h2>
              <p className="text-[11px] text-neutral-400 font-medium">
                Conéctate diario para multiplicar tus fichas de cortesía
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak Status Card */}
        <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Tu Racha Actual</span>
              <span className="text-sm font-black text-amber-300 font-mono">
                {currentStreak} {currentStreak === 1 ? 'Día Consecutivo' : 'Días Consecutivos'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
            {isAvailable ? '¡Listo para Cobrar!' : 'Vuelve Mañana'}
          </span>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-4 gap-2 my-2">
          {DAILY_REWARD_TIERS.map((amount, idx) => {
            const dayNum = idx + 1;
            const isClaimed = !isAvailable ? dayNum <= currentStreak : dayNum < nextStreak;
            const isToday = isAvailable && dayNum === nextStreak;
            const isDay7 = dayNum === 7;

            return (
              <div
                key={dayNum}
                className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between border transition-all text-center ${
                  isDay7 ? 'col-span-2' : 'col-span-1'
                } ${
                  isClaimed
                    ? 'bg-neutral-900/40 border-emerald-500/30 text-emerald-400/80'
                    : isToday
                    ? 'bg-gradient-to-b from-amber-500/25 to-yellow-600/20 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-400/20 scale-[1.03]'
                    : 'bg-neutral-900/60 border-white/10 text-neutral-400'
                }`}
              >
                {/* Day Badge */}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                    Día {dayNum}
                  </span>
                  {isClaimed && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  {isToday && <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />}
                </div>

                {/* Icon */}
                <div className="my-1">
                  {isDay7 ? (
                    <span className="text-2xl">👑</span>
                  ) : dayNum >= 5 ? (
                    <span className="text-xl">💰</span>
                  ) : (
                    <span className="text-lg">🪙</span>
                  )}
                </div>

                {/* Amount */}
                <span className={`text-[11px] font-black font-mono ${isToday ? 'text-amber-300' : 'text-neutral-200'}`}>
                  ${amount.toLocaleString('es-MX')}
                </span>

                {isDay7 && (
                  <span className="text-[8px] font-black uppercase text-amber-400 tracking-tight mt-0.5">
                    Gran Cofre VIP
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-white/10 shrink-0">
          {isAvailable ? (
            <button
              onClick={handleClaim}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 font-black text-neutral-950 uppercase tracking-wider text-xs shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gift className="w-4 h-4 fill-current" />
              Reclamar Recompensa de Hoy ({formatMoney(DAILY_REWARD_TIERS[nextStreak - 1] || 500)})
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-neutral-900 border border-white/10 text-center text-xs font-bold text-neutral-400 flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              ¡Ya reclamaste tu premio de hoy! Vuelve mañana para continuar la racha.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
