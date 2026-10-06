import React from 'react';
import { X, Volume2, VolumeX, Smartphone, Check, Palette } from 'lucide-react';
import type { UserProfile, TableTheme, CardBackTheme, PersonalityType } from '../../types/casino';
import { CardBack } from '../common/CardView';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const tableThemes: { id: TableTheme; name: string; bgClass: string }[] = [
    { id: 'emerald', name: 'Verde Esmeralda', bgClass: 'bg-emerald-800' },
    { id: 'royal_blue', name: 'Azul Montecarlo', bgClass: 'bg-blue-800' },
    { id: 'crimson', name: 'Rojo Carmesí', bgClass: 'bg-red-800' },
    { id: 'obsidian', name: 'Obsidiana VIP', bgClass: 'bg-neutral-800' },
  ];

  const cardBacks: { id: CardBackTheme; name: string }[] = [
    { id: 'dragon_gold', name: 'Dragón Imperial' },
    { id: 'aztec_royal', name: 'Azteca Dorado' },
    { id: 'cyberpunk', name: 'Cyberpunk Neón' },
    { id: 'classic_red', name: 'Vegas Clásico' },
  ];

  const personalities: { id: PersonalityType; name: string; desc: string; icon: string }[] = [
    { id: 'burlona', name: 'Burlón & Sarcástico', desc: 'Se mofa de tus malas jugadas y apuestas bajas.', icon: '😏' },
    { id: 'desafiante', name: 'Desafiante VIP', desc: 'Te reta a apostar el doble y duda de tu valor.', icon: '😈' },
    { id: 'amigable', name: 'Amigable & Socio', desc: 'Te apoya, anima y celebra cada triunfo.', icon: '🤝' },
    { id: 'neutral', name: 'Crupier Profesional', desc: 'Serio, formal y metódico como en Montecarlo.', icon: '🎩' },
  ];

  const handleSelectTable = (theme: TableTheme) => {
    sound.playChip();
    triggerHaptic('light');
    onUpdateProfile({ tableTheme: theme });
  };

  const handleSelectCardBack = (theme: CardBackTheme) => {
    sound.playCardFlip();
    triggerHaptic('light');
    onUpdateProfile({ cardBackTheme: theme });
  };

  const handleSelectPersonality = (p: PersonalityType) => {
    sound.playDealerVoice();
    triggerHaptic('medium');
    onUpdateProfile({ crupierPersonality: p });
  };

  const handleToggleSound = () => {
    const next = !profile.soundEnabled;
    sound.setEnabled(next);
    if (next) sound.playChip();
    triggerHaptic('light');
    onUpdateProfile({ soundEnabled: next });
  };

  const handleToggleHaptics = () => {
    const next = !profile.hapticsEnabled;
    triggerHaptic('medium');
    onUpdateProfile({ hapticsEnabled: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-neutral-900 border border-neutral-700 shadow-2xl p-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold">Personalización & Ajustes</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Crupier Personality */}
        <div className="my-4">
          <h4 className="text-xs uppercase font-bold text-neutral-400 mb-2.5">
            Personalidad del Crupier
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {personalities.map(p => {
              const active = profile.crupierPersonality === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersonality(p.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-amber-500/15 border-amber-400 text-white'
                      : 'bg-neutral-800/60 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-amber-300">{p.name}</div>
                    <div className="text-[11px] text-neutral-400 leading-tight">{p.desc}</div>
                  </div>
                  {active && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Table Felt Color */}
        <div className="my-4">
          <h4 className="text-xs uppercase font-bold text-neutral-400 mb-2.5">
            Tapiz de la Mesa
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {tableThemes.map(t => {
              const active = profile.tableTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTable(t.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-amber-400 bg-neutral-800 ring-2 ring-amber-400/40'
                      : 'border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border border-white/30 ${t.bgClass}`} />
                  <span className="text-xs font-medium">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Card Back Designs */}
        <div className="my-4">
          <h4 className="text-xs uppercase font-bold text-neutral-400 mb-2.5">
            Dorso de las Cartas
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {cardBacks.map(c => {
              const active = profile.cardBackTheme === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCardBack(c.id)}
                  className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all ${
                    active
                      ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40'
                      : 'border-neutral-700 bg-neutral-800/40 hover:bg-neutral-800'
                  }`}
                >
                  <div className="w-12 h-16">
                    <CardBack theme={c.id} />
                  </div>
                  <span className="text-[10px] text-center font-medium line-clamp-1">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Audio & Haptics */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-around">
          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-all ${
              profile.soundEnabled
                ? 'bg-neutral-800 border-amber-400 text-amber-300'
                : 'bg-neutral-800/50 border-neutral-700 text-neutral-400'
            }`}
          >
            {profile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {profile.soundEnabled ? 'Sonido Activado' : 'Silencio'}
          </button>

          <button
            onClick={handleToggleHaptics}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-all ${
              profile.hapticsEnabled
                ? 'bg-neutral-800 border-amber-400 text-amber-300'
                : 'bg-neutral-800/50 border-neutral-700 text-neutral-400'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            {profile.hapticsEnabled ? 'Vibración Activa' : 'Sin Vibración'}
          </button>
        </div>
      </div>
    </div>
  );
};
