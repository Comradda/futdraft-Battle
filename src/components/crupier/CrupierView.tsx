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
import { Volume2, VolumeX, ChevronDown, Check, Sparkles, Glasses, Music } from 'lucide-react';

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
  const [isMusicActive, setIsMusicActive] = useState(() => sound.isMusicPlaying());

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
  const prevEventRef = useRef<string | undefined>(undefined);

  // Sync personality if prop changes
  useEffect(() => {
    if (initialPersonality) {
      setPersonality(initialPersonality);
    }
  }, [initialPersonality]);

  // Execute a spoken dialogue with natural TTS voice and effects
  const triggerSpeech = useCallback(
    (dialogue: CrupierDialogueResult, explicitEvent?: string) => {
      // Clear any previous timers
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);

      setSpeech(dialogue);
      setIsSpeaking(true);
      setIsBubbleVisible(true);

      const activeConfig = PERSONALITY_CONFIGS[personality] || PERSONALITY_CONFIGS.neutral;
      const isFemale = activeConfig.gender === 'female';

      if (!isMuted) {
        // 1. Spoken seductive / charismatic vocalization
        sound.speakDealer(dialogue.text, personality);

        // 2. Genuine mocking laughter when player loses
        const evt = explicitEvent || event;
        const isLossEvent =
          dialogue.mood === 'laughing' ||
          (personality === 'burlona' && dialogue.mood === 'smirk') ||
          evt?.includes('loss') ||
          evt?.includes('bust') ||
          evt === 'crupier_won' ||
          evt === 'bj_dealer_blackjack' ||
          evt === 'roulette_loss_color' ||
          evt === 'roulette_zero';

        const isWinEvent =
          evt === 'player_win' ||
          evt === 'bj_player_blackjack' ||
          evt === 'roulette_win_number' ||
          evt === 'conquian_win_9_cards' ||
          evt === 'poker_win';

        if (isLossEvent) {
          // Play resonant mocking laughter after short speech onset
          setTimeout(() => {
            sound.playDealerLaugh(isFemale);
          }, 350);
        } else if (isWinEvent) {
          sound.playCashRegister();
        }
      }

      // Stop mouth / aura movement after duration
      const speakingDuration = Math.min(3200, (dialogue.durationMs || 4000) * 0.65);
      speakTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, speakingDuration);

      // Auto-hide bubble after reading duration (default 6.5s)
      const totalDuration = dialogue.durationMs || 6500;
      bubbleTimeoutRef.current = setTimeout(() => {
        setIsBubbleVisible(false);
      }, totalDuration);
    },
    [isMuted, personality, event]
  );

  // React to game event changes
  useEffect(() => {
    if (!event) return;
    if (event === prevEventRef.current && !context) return;
    prevEventRef.current = event;

    const dialogue = getCrupierDialogue(game, event, context, personality);
    triggerSpeech(dialogue, event);
  }, [event, context, game, personality, triggerSpeech]);

  // React to explicit external message overrides
  useEffect(() => {
    if (externalMessage) {
      triggerSpeech(
        {
          text: externalMessage,
          mood: externalMood || PERSONALITY_CONFIGS[personality].avatarMood,
          soundPitch: PERSONALITY_CONFIGS[personality].basePitch,
          durationMs: 5000,
        },
        event
      );
    }
  }, [externalMessage, externalMood, personality, triggerSpeech, event]);

  // Initial welcome greeting on first mount if no event was provided
  useEffect(() => {
    if (!event && !externalMessage) {
      const intro = getCrupierDialogue(game, 'game_start', context, personality);
      triggerSpeech(intro, 'game_start');
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
    triggerSpeech(introDialogue, 'game_start');
  };

  // Avatar click: playful poke interaction
  const handleAvatarClick = () => {
    triggerHaptic('light');
    const idleDialogue = getCrupierDialogue(game, 'idle', context, personality);
    triggerSpeech(idleDialogue, 'idle');
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
            rounded-2xl bg-neutral-950/85 backdrop-blur-xl border border-white/10 
            shadow-[0_8px_32px_0_rgba(0,0,0,0.55)]"
        >
          {/* LEFT: Crupier Avatar + Speaking Aura (Large & Prominent) */}
          <div className="relative flex items-center gap-2.5 shrink-0">
            <div className="relative group">
              <CrupierAvatar
                size={compact ? 66 : 82}
                mood={activeMood}
                isSpeaking={isSpeaking}
                personality={personality}
                showSunglasses={showSunglasses}
                onClick={handleAvatarClick}
                className="hover:scale-105"
              />
            </div>

            {/* Crupier Identity & Role */}
            <div className="hidden min-[380px]:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-neutral-100 tracking-tight leading-tight">
                  {currentConfig.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {currentConfig.title}
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-medium leading-none mt-0.5">
                Casino Royale • Crupier en Vivo
              </span>
            </div>
          </div>

          {/* CENTER: Dynamic Speech Bubble */}
          <div className="relative flex-1 min-w-0 mx-1 sm:mx-3">
            {isBubbleVisible && speech.text ? (
              <div
                onClick={() => {
                  triggerHaptic('light');
                  if (!isMuted) sound.speakDealer(speech.text, personality);
                }}
                role="status"
                aria-live="polite"
                className="relative cursor-pointer transition-all duration-300 ease-out transform animate-in fade-in zoom-in-95"
                title="Toca para escuchar la voz de nuevo"
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
                    border border-amber-500/35 shadow-[0_4px_20px_rgba(0,0,0,0.6)] 
                    hover:border-amber-400/60 transition-colors"
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
                  <Sparkles className="w-3 h-3 text-amber-400/80" />
                  Mesa en juego • Apuestas abiertas
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: Personality Switcher & Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* VIP Casino Lounge Music Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                const active = sound.toggleCasinoMusic();
                setIsMusicActive(active);
              }}
              className={`p-1.5 rounded-lg border transition-all active:scale-90 flex items-center gap-1 ${
                isMusicActive
                  ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200'
              }`}
              title={isMusicActive ? 'Pausar música de casino lounge' : 'Música VIP Lounge (Rainbet/Caliente style)'}
              aria-label="Toggle Casino Lounge Music"
            >
              <Music className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isMusicActive ? 'animate-pulse' : ''}`} />
            </button>

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
                  title="Cambiar crupier"
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
                      className="absolute right-0 top-full mt-2 w-72 p-2 rounded-2xl 
                        bg-neutral-900/95 backdrop-blur-2xl border border-amber-500/40 
                        shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="px-2.5 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                          Seleccionar Crupier VIP
                        </span>
                        <span className="text-[10px] text-neutral-400">En Vivo</span>
                      </div>

                      <div className="space-y-1.5">
                        {PERSONALITY_LIST.map((p) => {
                          const isSelected = p.id === personality;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPersonality(p.id)}
                              className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                                isSelected
                                  ? 'bg-amber-500/20 border border-amber-400/50 text-white shadow-md'
                                  : 'hover:bg-white/5 border border-transparent text-neutral-300'
                              }`}
                            >
                              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-amber-400/40 shrink-0">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black leading-tight text-neutral-100">
                                    {p.name}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                </div>
                                <span className="text-[10px] text-amber-300/90 font-medium block">
                                  {p.title}
                                </span>
                                <p className="text-[9px] text-neutral-400 leading-tight mt-0.5 line-clamp-1">
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
