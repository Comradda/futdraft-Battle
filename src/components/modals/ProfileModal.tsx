import React, { useState } from 'react';
import { X, User, Save, Check } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');

  if (!isOpen) return null;

  const availableAvatars = ['VIP', 'ACE', 'PRO', 'REY', 'ORO', 'FOX', 'LION', 'TITAN'];

  const handleSave = () => {
    sound.playChip();
    triggerHaptic('success');
    onSaveProfile({
      name: name.trim() || 'Jugador VIP',
      avatar: selectedAvatar,
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
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs uppercase font-bold text-neutral-400 mb-2">
                  Insignia del Jugador
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableAvatars.map(av => (
                    <button
                      key={av}
                      onClick={() => {
                        setSelectedAvatar(av);
                        triggerHaptic('light');
                      }}
                      className={`h-11 rounded-xl flex items-center justify-center text-xs font-black tracking-wider border transition-all ${
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
                  <span className="text-neutral-400">Puntaje Semanal:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {formatMoney(profile.weeklyScore)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Estado de Sincronización:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Guardado en Dispositivo
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { title: 'Conquián Clásico', data: profile.stats.conquian },
                { title: 'Blackjack 21', data: profile.stats.blackjack },
                { title: 'Ruleta Europea', data: profile.stats.roulette },
                { title: 'Texas Hold\'em Poker', data: profile.stats.poker },
              ].map(stat => (
                <div
                  key={stat.title}
                  className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50"
                >
                  <div className="text-xs font-bold text-amber-300 mb-2">{stat.title}</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 rounded-lg bg-neutral-900/60">
                      <div className="text-[10px] text-neutral-400">Jugadas</div>
                      <div className="text-xs font-bold font-mono">{stat.data.gamesPlayed}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-neutral-900/60">
                      <div className="text-[10px] text-neutral-400">Victorias</div>
                      <div className="text-xs font-bold font-mono text-emerald-400">
                        {stat.data.gamesWon}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-neutral-900/60">
                      <div className="text-[10px] text-neutral-400">Mejor Premio</div>
                      <div className="text-xs font-bold font-mono text-amber-400">
                        ${stat.data.bestWin}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
