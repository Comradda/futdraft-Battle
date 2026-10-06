import React, { useState, useRef } from 'react';
import { X, User, Save, Check, Camera, Trash2, BarChart2 } from 'lucide-react';
import type { UserProfile } from '../../types/casino';
import { formatMoney } from '../../utils/storage';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(profile.photoUrl);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const availableAvatars = ['VIP', 'ACE', 'PRO', 'REY', 'ORO', 'FOX', 'LION', 'TITAN'];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 180;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Crop square center
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoUrl(compressed);
          triggerHaptic('success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    triggerHaptic('light');
  };

  const handleSave = () => {
    sound.playChip();
    triggerHaptic('success');
    onSaveProfile({
      name: name.trim() || 'Jugador VIP',
      avatar: selectedAvatar,
      photoUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-neutral-900 border border-neutral-700 shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">Perfil del Jugador</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 mx-4 mt-3 rounded-xl bg-neutral-800/80 border border-neutral-700/50">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Datos & Placa
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Estadísticas
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'profile' ? (
            <div className="space-y-4">
              {/* Real User Photo Section */}
              <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-center gap-3.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                
                {/* Photo or Avatar Preview */}
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg shrink-0 bg-neutral-900 flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={name}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <span className="text-xl font-black text-amber-300">
                      {selectedAvatar}
                    </span>
                  )}
                </div>

                {/* Upload Action Buttons */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-white block mb-0.5">
                    Foto de Perfil Real
                  </span>
                  <p className="text-[10px] text-neutral-400 mb-2">
                    Carga tu foto para que tu hermano y las mesas multijugador te vean.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {photoUrl ? 'Cambiar Foto' : 'Cargar Foto'}
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] active:scale-95 transition-all"
                        title="Quitar foto y usar insignia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar Insignia Selector */}
              <div>
                <label className="block text-xs uppercase font-bold text-neutral-400 mb-2">
                  Insignia de Respaldo
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableAvatars.map(av => (
                    <button
                      key={av}
                      onClick={() => {
                        setSelectedAvatar(av);
                        triggerHaptic('light');
                      }}
                      className={`h-10 rounded-xl flex items-center justify-center text-xs font-black tracking-wider border transition-all ${
                        selectedAvatar === av
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/40 shadow-lg'
                          : 'border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs uppercase font-bold text-neutral-400 mb-1.5">
                  Alias en la Mesa
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={18}
                  placeholder="Tu alias en las mesas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Account Overview */}
              <div className="p-3.5 rounded-2xl bg-neutral-800/50 border border-neutral-700/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Fichas Actuales:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {formatMoney(profile.bankroll)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Puntaje Torneo Semanal:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {formatMoney(profile.weeklyScore)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Racha de Recompensa Diaria:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {profile.dailyStreak || 0} Días Consecutivos
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Estado de Sincronización:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Sincronizado en Dispositivo & P2P
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Global Combined Stats Card */}
              {(() => {
                const games = [
                  profile.stats.conquian,
                  profile.stats.blackjack,
                  profile.stats.roulette,
                  profile.stats.poker,
                ];
                const totalPlayed = games.reduce((acc, g) => acc + g.gamesPlayed, 0);
                const totalWon = games.reduce((acc, g) => acc + g.gamesWon, 0);
                const globalRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;
                const totalProfit = games.reduce((acc, g) => acc + g.totalProfit, 0);

                return (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/10 border border-amber-400/40 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4" /> Rendimiento Global
                      </span>
                      <span className="text-[10px] font-bold text-neutral-300">Todas las Mesas</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-[9px] text-neutral-400 uppercase">Partidas</div>
                        <div className="text-sm font-black font-mono text-white">{totalPlayed}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-[9px] text-neutral-400 uppercase">Victorias</div>
                        <div className="text-sm font-black font-mono text-emerald-400">{totalWon}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-[9px] text-neutral-400 uppercase">% Éxito</div>
                        <div className="text-sm font-black font-mono text-amber-300">{globalRate}%</div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-[9px] text-neutral-400 uppercase">Balance</div>
                        <div className={`text-xs font-black font-mono ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {totalProfit >= 0 ? `+$${totalProfit}` : `-$${Math.abs(totalProfit)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Individual Games */}
              {[
                { title: 'Blackjack 21', icon: '🃏', data: profile.stats.blackjack },
                { title: 'Texas Hold\'em Poker', icon: '♠️', data: profile.stats.poker },
                { title: 'Ruleta Europea', icon: '🎡', data: profile.stats.roulette },
                { title: 'Conquián Clásico', icon: '🎴', data: profile.stats.conquian },
              ].map(stat => {
                const winRate = stat.data.gamesPlayed > 0 ? Math.round((stat.data.gamesWon / stat.data.gamesPlayed) * 100) : 0;

                return (
                  <div
                    key={stat.title}
                    className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <span>{stat.icon}</span>
                        <span>{stat.title}</span>
                      </div>
                      <span className="text-[10px] font-black text-neutral-400">
                        {winRate}% victorias
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1.5 rounded-lg bg-neutral-900/60">
                        <div className="text-[9px] text-neutral-400">Jugadas</div>
                        <div className="text-xs font-bold font-mono">{stat.data.gamesPlayed}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-neutral-900/60">
                        <div className="text-[9px] text-neutral-400">Victorias</div>
                        <div className="text-xs font-bold font-mono text-emerald-400">
                          {stat.data.gamesWon}
                        </div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-neutral-900/60">
                        <div className="text-[9px] text-neutral-400">Mejor Bote</div>
                        <div className="text-xs font-bold font-mono text-amber-400">
                          ${stat.data.bestWin}
                        </div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-neutral-900/60">
                        <div className="text-[9px] text-neutral-400">Ganancia</div>
                        <div className={`text-xs font-bold font-mono ${stat.data.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stat.data.totalProfit >= 0 ? `+$${stat.data.totalProfit}` : `-$${Math.abs(stat.data.totalProfit)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'profile' && (
          <div className="p-3 bg-neutral-950 border-t border-neutral-800">
            <button
              onClick={handleSave}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 font-bold text-neutral-950 text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Guardar Perfil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
