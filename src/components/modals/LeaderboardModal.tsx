import React from 'react';
import { X, Trophy, Medal, Clock, Crown, Flame } from 'lucide-react';
import type { UserProfile } from '../../types/casino';
import { getWeeklyLeaderboard, formatMoney } from '../../utils/storage';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  if (!isOpen) return null;

  const players = getWeeklyLeaderboard(currentUser);
  const myRank = players.find(p => p.isCurrentUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-neutral-900 border border-amber-500/30 shadow-2xl overflow-hidden text-white">
        {/* Top Header */}
        <div className="p-5 pb-4 bg-gradient-to-b from-[#1f1505] to-transparent border-b border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
                <Trophy className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white">Mini-Torneo Semanal</h3>
                <span className="text-[11px] text-amber-300 font-medium">Bolsa Acumulada: $100,000 MXN</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Countdown & Status */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/50 border border-amber-500/20 text-xs text-neutral-300">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Cierre de Torneo:</span>
            </div>
            <span className="font-mono font-bold text-amber-400">Domingo 23:59 CST</span>
          </div>
        </div>

        {/* Current User Quick Rank Card */}
        {myRank && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/60 to-neutral-850 border border-amber-500/40 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-neutral-950 font-black flex items-center justify-center text-xs shadow">
                #{myRank.rank}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{currentUser.name}</span>
                </div>
                <div className="text-[11px] text-amber-300 font-semibold font-mono">
                  {formatMoney(currentUser.weeklyScore)}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
              Tu Posición
            </span>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {players.map(player => {
            const isTop3 = player.rank <= 3;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  player.isCurrentUser
                    ? 'bg-amber-500/20 border-amber-400/70 shadow-md ring-1 ring-amber-400/40'
                    : isTop3
                    ? 'bg-neutral-800/80 border-amber-500/30'
                    : 'bg-neutral-800/40 border-neutral-700/60'
                }`}
              >
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center font-black text-sm">
                    {player.rank === 1 && <Crown className="w-4 h-4 text-yellow-400 mx-auto" />}
                    {player.rank === 2 && <Medal className="w-4 h-4 text-slate-300 mx-auto" />}
                    {player.rank === 3 && <Medal className="w-4 h-4 text-amber-600 mx-auto" />}
                    {player.rank > 3 && (
                      <span className="text-neutral-500 font-mono text-xs">#{player.rank}</span>
                    )}
                  </div>

                  <div className="w-7 h-7 rounded-full bg-neutral-700 border border-white/20 flex items-center justify-center text-[10px] font-black text-amber-300">
                    {player.avatar}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold leading-tight ${
                          player.isCurrentUser ? 'text-amber-300' : 'text-neutral-100'
                        }`}
                      >
                        {player.name}
                      </span>
                      {player.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-300 font-medium">
                          {player.badge}
                        </span>
                      )}
                    </div>
                    {player.rank === 1 && (
                      <span className="text-[10px] text-yellow-400 font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-current" /> Líder de la Semana
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Score */}
                <div className="text-right">
                  <div className="text-xs font-black font-mono text-amber-400">
                    {formatMoney(player.weeklyScore)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Prizes */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-around text-[11px] text-neutral-400 font-medium">
          <span className="text-yellow-400 font-bold">1° $50,000</span>
          <span className="text-slate-300 font-bold">2° $25,000</span>
          <span className="text-amber-600 font-bold">3° $10,000</span>
        </div>
      </div>
    </div>
  );
};
