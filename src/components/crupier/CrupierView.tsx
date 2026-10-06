import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CrupierMood, PersonalityType, GameType } from '../../types/casino';
import type { CrupierContext, CrupierDialogueResult } from '../../utils/crupierAI';
import { 
  getCrupierDialogue, 
  PERSONALITY_CONFIGS, 
  PERSONALITY_LIST 
} from '../../utils/crupierAI';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { CrupierAvatar } from './CrupierAvatar';
import { Volume2, VolumeX, ChevronDown, Check, Sparkles, Glasses } from 'lucide-react';

export interface CrupierViewProps {
  game?: GameType;
  event?: string;
  context?: CrupierContext;
  currentMessage?: string | null;
  currentMood?: CrupierMood;
  personality?: PersonalityType;
  onPersonalityChange?: (newPersonality: PersonalityType) => void;
  showPersonalitySelector?: boolean;
  compact?: boolean;
  className?: string;
}

export const CrupierView: React.FC<CrupierViewProps> = ({
  game = 'blackjack',
  event,
  context,
  currentMessage: externalMessage,
  currentMood: externalMood,
  personality: initialPersonality = 'burlona',
  onPersonalityChange,
  showPersonalitySelector = true,
  compact = false,
  className = '',
}) => {
  // Local state for active personality
  const [personality, setPersonality] = useState<PersonalityType>(initialPersonality);
  const [showSelectorMenu, setShowSelectorMenu] = useState(false);
  const [showSunglasses, setShowSunglasses] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Active speech state
  const [speech, setSpeech] = useState<CrupierDialogueResult>({
    text: '',
    mood: PERSONALITY_CONFIGS[initialPersonality]?.avatarMood || 'neutral',
    soundPitch: PERSONALITY_CONFIGS[initialPersonality]?.basePitch || 440,
    durationMs: 4000,
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);

  // Timers ref for clean unmount & debounce
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevEventRef = useRef<string | undefined>(undefined);

  // Sync personality if prop changes
  useEffect(() => {
    if (initialPersonality) {
      setPersonality(initialPersonality);
    }
  }, [initialPersonality]);

  // Vocalize dealer speech with rhythmic voice chirps
  const vocalize = useCallback((pitch: number) => {
    if (isMuted) return;

    // Sequence of 3 rapid speech pulses for dynamic character voice
    sound.playDealerVoice(pitch);
    const timer1 = setTimeout(() => sound.playDealerVoice(pitch * 1.05), 75);
    const timer2 = setTimeout(() => sound.playDealerVoice(pitch * 0.95), 150);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isMuted]);

  // Execute a spoken dialogue
  const triggerSpeech = useCallback((dialogue: CrupierDialogueResult) => {
    // Clear any previous timers
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    if (audioIntervalRef.current) clearTimeout(audioIntervalRef.current);

    setSpeech(dialogue);
    setIsSpeaking(true);
    setIsBubbleVisible(true);

    // Play vocal audio blip
    vocalize(dialogue.soundPitch);

    // Stop mouth movement after 1.8s - 2.8s
    const speakingDuration = Math.min(2800, (dialogue.durationMs || 4000) * 0.55);
    speakTimeoutRef.current = setTimeout(() => {
      setIsSpeaking(false);
    }, speakingDuration);

    // Auto-hide bubble after reading duration (default 5.5s)
    const totalDuration = dialogue.durationMs || 5500;
    bubbleTimeoutRef.current = setTimeout(() => {
      setIsBubbleVisible(false);
    }, totalDuration);
  }, [vocalize]);

  // React to game event changes
  useEffect(() => {
    if (!event) return;
    if (event === prevEventRef.current && !context) return;
    prevEventRef.current = event;

    const dialogue = getCrupierDialogue(game, event, context, personality);
    triggerSpeech(dialogue);
  }, [event, context, game, personality, triggerSpeech]);

  // React to explicit external message overrides
  useEffect(() => {
    if (externalMessage) {
      triggerSpeech({
        text: externalMessage,
        mood: externalMood || PERSONALITY_CONFIGS[personality].avatarMood,
        soundPitch: PERSONALITY_CONFIGS[personality].basePitch,
        durationMs: 4500,
      });
    }
  }, [externalMessage, externalMood, personality, triggerSpeech]);

  // Initial welcome greeting on first mount if no event was provided
  useEffect(() => {
    if (!event && !externalMessage) {
      const intro = getCrupierDialogue(game, 'game_start', context, personality);
      triggerSpeech(intro);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle personality selection
  const handleSelectPersonality = (newType: PersonalityType) => {
    triggerHaptic('medium');
    setPersonality(newType);
    setShowSelectorMenu(false);

    if (onPersonalityChange) {
      onPersonalityChange(newType);
    }

    // Crupier introduces new personality
    const introDialogue = getCrupierDialogue(game, 'game_start', context, newType);
    triggerSpeech(introDialogue);
  };

  // Avatar click: playful poke interaction
  const handleAvatarClick = () => {
    triggerHaptic('light');
    const idleDialogue = getCrupierDialogue(game, 'idle', context, personality);
    triggerSpeech(idleDialogue);
  };

  const currentConfig = PERSONALITY_CONFIGS[personality] || PERSONALITY_CONFIGS.neutral;
  const activeMood = speech.mood || currentConfig.avatarMood;

  return (
    <header
      className={`relative w-full z-30 transition-all duration-300 ${className}`}
      role="banner"
      aria-label="Crupier Casino Table Header"
    >
      {/* Table Header Glass Container */}
      <div className="relative mx-auto max-w-4xl px-3 py-2 sm:px-4 sm:py-2.5">
        <div
          className="relative flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-2.5 
            rounded-2xl bg-neutral-950/80 backdrop-blur-xl border border-white/10 
            shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
        >
          {/* LEFT: Crupier Avatar + Speaking Aura */}
          <div className="relative flex items-center gap-2.5 shrink-0">
            <div className="relative group">
              <CrupierAvatar
                size={compact ? 54 : 64}
                mood={activeMood}
                isSpeaking={isSpeaking}
                personality={personality}
                showSunglasses={showSunglasses}
                onClick={handleAvatarClick}
                className="hover:scale-105"
              />

              {/* Speaking Equalizer Dots Pill */}
              {isSpeaking && (
                <div
                  className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full 
                    bg-amber-500/90 text-[9px] font-black text-black shadow-md flex items-center gap-0.5 animate-pulse"
                >
                  <span className="w-1 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            {/* Crupier Identity & Role */}
            <div className="hidden min-[380px]:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-neutral-100 tracking-tight leading-tight">
                  {currentConfig.name}
                </span>
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {currentConfig.title}
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-medium leading-none mt-0.5">
                Casino Royale • Crupier VIP
              </span>
            </div>
          </div>

          {/* CENTER: Dynamic Speech Bubble */}
          <div className="relative flex-1 min-w-0 mx-1 sm:mx-3">
            {isBubbleVisible && speech.text ? (
              <div
                onClick={() => {
                  triggerHaptic('light');
                  vocalize(speech.soundPitch);
                }}
                role="status"
                aria-live="polite"
                className="relative cursor-pointer transition-all duration-300 ease-out transform animate-in fade-in zoom-in-95"
              >
                {/* Speech Bubble Tail pointing to avatar */}
                <div
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 
                    bg-neutral-900 border-l border-b border-amber-500/30 
                    rotate-45 hidden min-[480px]:block"
                />

                <div
                  className="relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl 
                    bg-gradient-to-r from-neutral-900/95 via-neutral-900/90 to-neutral-950/95 
                    border border-amber-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] 
                    hover:border-amber-400/50 transition-colors"
                >
                  <p className="text-[11px] sm:text-xs text-neutral-100 font-medium leading-snug line-clamp-2 select-text">
                    &ldquo;{speech.text}&rdquo;
                  </p>
                </div>
              </div>
            ) : (
              /* Idle Table Status Banner */
              <div className="flex items-center justify-center py-1.5 px-3 rounded-xl bg-white/5 border border-white/5 text-neutral-400">
                <span className="text-[11px] sm:text-xs font-medium tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400/70" />
                  Mesa en juego • Apuestas abiertas
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: Personality Switcher & Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Sunglasses Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowSunglasses((prev) => !prev);
              }}
              className={`p-1.5 rounded-lg border transition-all active:scale-90 ${
                showSunglasses
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200'
              }`}
              title={showSunglasses ? 'Quitar gafas de sol' : 'Poner gafas de sol'}
              aria-label="Toggle sunglasses"
            >
              <Glasses className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Audio Voice Mute Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsMuted((prev) => !prev);
              }}
              className={`p-1.5 rounded-lg border transition-all active:scale-90 ${
                isMuted
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200'
              }`}
              title={isMuted ? 'Activar voz del crupier' : 'Silenciar voz del crupier'}
              aria-label="Toggle crupier voice"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>

            {/* Quick Personality Switcher Badge */}
            {showPersonalitySelector && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowSelectorMenu((prev) => !prev);
                  }}
                  className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg 
                    bg-gradient-to-r from-amber-500/15 to-amber-600/15 
                    hover:from-amber-500/25 hover:to-amber-600/25 
                    border border-amber-500/40 text-amber-300 
                    font-bold text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm"
                  aria-expanded={showSelectorMenu}
                  aria-haspopup="listbox"
                  title="Cambiar personalidad del Crupier"
                >
                  <span className="truncate max-w-[70px] sm:max-w-none">{currentConfig.badge}</span>
                  <ChevronDown
                    className={`w-3 h-3 text-amber-400/80 transition-transform duration-200 ${
                      showSelectorMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu Modal */}
                {showSelectorMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSelectorMenu(false)}
                    />

                    {/* Popover Card */}
                    <div
                      role="listbox"
                      className="absolute right-0 top-full mt-2 w-64 p-1.5 rounded-2xl 
                        bg-neutral-900/95 backdrop-blur-2xl border border-amber-500/30 
                        shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                          Personalidad del Crupier
                        </span>
                      </div>

                      <div className="space-y-1">
                        {PERSONALITY_LIST.map((p) => {
                          const isSelected = p.id === personality;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPersonality(p.id)}
                              className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                                isSelected
                                  ? 'bg-amber-500/20 border border-amber-500/40 text-white'
                                  : 'hover:bg-white/5 border border-transparent text-neutral-300'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0 text-base">
                                {p.badge.split(' ')[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold leading-tight">
                                    {p.name}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                </div>
                                <span className="text-[10px] text-amber-300/80 font-medium block">
                                  {p.title}
                                </span>
                                <p className="text-[9px] text-neutral-400 leading-tight mt-0.5 line-clamp-2">
                                  {p.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
