import React from 'react';
import type { PersonalityType } from '../../types/casino';
import { PERSONALITY_LIST, PERSONALITY_CONFIGS } from '../../utils/crupierAI';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { X, Check, Volume2, Sparkles } from 'lucide-react';

interface DealerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPersonality: PersonalityType;
  onSelectPersonality: (p: PersonalityType) => void;
}

export const DealerSelectModal: React.FC<DealerSelectModalProps> = ({
  isOpen,
  onClose,
  selectedPersonality,
  onSelectPersonality,
}) => {
  if (!isOpen) return null;

  const handlePreviewVoice = (p: PersonalityType, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const cfg = PERSONALITY_CONFIGS[p];
    if (cfg) {
      sound.speakDealer(cfg.sampleLine, p);
    }
  };

  const handleSelect = (p: PersonalityType) => {
    triggerHaptic('medium');
    onSelectPersonality(p);
    const cfg = PERSONALITY_CONFIGS[p];
    if (cfg) {
      sound.speakDealer(cfg.sampleLine, p);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-neutral-950/95 border border-amber-500/40 shadow-2xl p-4 sm:p-5 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Crupiers de México en Vivo
              </h2>
              <p className="text-[11px] text-neutral-400 font-medium">
                Elige tu crupier con acento y personalidad regional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 active:scale-95 transition-all"
            aria-label="Cerrar selector de crupier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dealer Cards List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {PERSONALITY_LIST.map((dealer) => {
            const isSelected = dealer.id === selectedPersonality;

            return (
              <div
                key={dealer.id}
                onClick={() => handleSelect(dealer.id)}
                className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                    : 'bg-neutral-900/70 border-white/10 hover:border-amber-400/50 hover:bg-neutral-900'
                }`}
              >
                {/* Dealer Portrait Image */}
                <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg shrink-0 bg-neutral-950">
                  <img
                    src={dealer.image}
                    alt={dealer.name}
                    className="w-full h-full object-cover object-top filter brightness-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-1 inset-x-0 text-center text-[9px] font-black text-amber-300 drop-shadow">
                    {dealer.badge.split(' ')[0]}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-sm sm:text-base font-black text-white tracking-tight">
                      {dealer.name}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                        <Check className="w-3 h-3 stroke-[3]" /> Activa
                      </span>
                    )}
                  </div>

                  <span className="inline-block text-[11px] font-bold text-amber-300/90 leading-tight">
                    {dealer.region}
                  </span>

                  <p className="text-[11px] text-neutral-300 leading-snug mt-1 line-clamp-2">
                    {dealer.description}
                  </p>

                  {/* Voice Preview Button */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handlePreviewVoice(dealer.id, e)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-amber-500/20 text-neutral-200 hover:text-amber-300 text-[10px] font-bold flex items-center gap-1.5 transition-all border border-white/10 active:scale-95"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      Probar Acento
                    </button>
                    {!isSelected && (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        Toca para elegir
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2.5 border-t border-white/10 text-center">
          <p className="text-[11px] text-neutral-400 font-medium">
            Cada crupier habla con modismos, tono y cadencia de su región.
          </p>
        </div>
      </div>
    </div>
  );
};
