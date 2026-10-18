import React, { useState, useEffect, useMemo } from 'react';
import {
  FORMATIONS,
  FC27_PLAYERS_DB,
  TACTICAL_ACTIONS,
  getBrotherDefaultLineup,
  calculateTeamChemistry,
  calculateActionSuccessChance,
  resolveTacticalTurnDuel,
  simulateStatisticalMinuteTick,
  type FutPlayerCard,
  type FormationType,
  type FormationSlot,
  type TacticalAction,
  type MatchEventLog,
  type TeamTacticsConfig,
  type PlayerPosition,
  type CardTier,
} from '../../utils/futdraftLogic';
import { FutCardShield } from './FutCardShield';
import { FC27_FULL_PLAYERS_DB, FC27_CLUBS } from '../../utils/fc27Database';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { multiplayer, type MultiplayerStatus } from '../../utils/multiplayer';
import type { UserProfile } from '../../types/casino';
import {
  Trophy,
  Users,
  Wifi,
  Sparkles,
  Swords,
  Cpu,
  Sliders,
  Search,
  Check,
  Copy,
  Radio,
  ArrowLeft,
  RotateCcw,
  Zap,
  ChevronRight,
  Dice5,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';

export interface FutDraftGameProps {
  profile?: UserProfile;
  userProfile?: UserProfile;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
  onBackToLobby?: () => void;
}

type ScreenPhase =
  | 'central_hub'      // Menú Central Móvil (4 opciones claras)
  | 'formation_pick'   // Paso 1 del Draft: Elegir 1 de las 4 formaciones
  | 'draft_pitch'      // Paso 2 del Draft: Campo con los 11 huecos (tocar cada hueco abre Player Pick de 5 cartas)
  | 'multiplayer_room' // Sala 2P en Vivo para crear/unirse con tu hermano
  | 'match_auto'       // Modo A: Simulación Estadística Auto-Battler (90 min)
  | 'match_tactical'   // Modo B: Batalla Táctica por Turnos (RPG / Top Trumps)
  | 'fc27_catalog';    // Explorador completo de la Base de Datos EA SPORTS FC 27

interface ChatMessage {
  id: string;
  sender: 'me' | 'bro' | 'coach';
  senderName: string;
  text: string;
  time: string;
}

// Merge and deduplicate FC27_FULL_PLAYERS_DB (188+ players across all major leagues) with FC27_PLAYERS_DB
const ALL_FC27_PLAYERS: FutPlayerCard[] = (() => {
  const seen = new Set<string>();
  const merged: FutPlayerCard[] = [];
  for (const p of [...FC27_FULL_PLAYERS_DB, ...FC27_PLAYERS_DB]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      merged.push(p);
    }
  }
  return merged;
})();

const CLUB_TO_LEAGUE_LOOKUP: Record<string, string> = Object.fromEntries(
  FC27_CLUBS.map((c) => [c.name, c.league])
);

function getPlayerLeague(club: string): string {
  const mapped = CLUB_TO_LEAGUE_LOOKUP[club];
  if (mapped) {
    if (mapped.includes('Serie A')) return 'Serie A';
    if (mapped.includes('Ligue 1')) return 'Ligue 1';
    return mapped;
  }
  if (club.includes('Inter') || club.includes('Milan') || club.includes('Juve') || club.includes('Napoli') || club.includes('Roma') || club.includes('Atalanta')) return 'Serie A';
  if (club.includes('Leverkusen') || club.includes('Bayern') || club.includes('Dortmund') || club.includes('Leipzig')) return 'Bundesliga';
  if (club.includes('Paris') || club.includes('Monaco') || club.includes('Marsella')) return 'Ligue 1';
  if (club.includes('Madrid') || club.includes('Barcelona') || club.includes('Athletic') || club.includes('Sociedad')) return 'LaLiga EA Sports';
  return 'Premier League';
}

/**
 * Generates 5 random candidate players for a specific formation slot (Authentic FUT Draft 1-of-5 Pick)
 */
function generateFiveRandomCandidatesForSlot(
  slot: FormationSlot,
  alreadyDraftedIds: Set<string>
): FutPlayerCard[] {
  // 1. Primary matches (exact position match)
  const exactPool = ALL_FC27_PLAYERS.filter(
    (p) => !alreadyDraftedIds.has(p.id) && p.position === slot.label
  );
  // 2. Secondary matches (acceptedPositions in that slot)
  const compatiblePool = ALL_FC27_PLAYERS.filter(
    (p) =>
      !alreadyDraftedIds.has(p.id) &&
      p.position !== slot.label &&
      slot.acceptedPositions.includes(p.position)
  );
  // 3. Same zone fallback
  const zonePool = ALL_FC27_PLAYERS.filter(
    (p) =>
      !alreadyDraftedIds.has(p.id) &&
      p.zone === slot.zone &&
      !exactPool.includes(p) &&
      !compatiblePool.includes(p)
  );

  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const combined = [
    ...shuffle(exactPool),
    ...shuffle(compatiblePool),
    ...shuffle(zonePool),
  ];

  // Ensure 5 unique candidates
  const picked: FutPlayerCard[] = [];
  const usedIds = new Set<string>();
  for (const candidate of combined) {
    if (!usedIds.has(candidate.id)) {
      usedIds.add(candidate.id);
      picked.push(candidate);
      if (picked.length === 5) break;
    }
  }

  // Fallback if still < 5
  if (picked.length < 5) {
    for (const extra of shuffle(ALL_FC27_PLAYERS)) {
      if (!alreadyDraftedIds.has(extra.id) && !usedIds.has(extra.id)) {
        usedIds.add(extra.id);
        picked.push(extra);
        if (picked.length === 5) break;
      }
    }
  }

  return picked;
}

/**
 * Custom SVG Empty Shield Slot on the Pitch before drafting a card
 */
const EmptyDraftSlotShield: React.FC<{
  slot: FormationSlot;
  isNextRecommended?: boolean;
  onClick: () => void;
}> = ({ slot, isNextRecommended = false, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-center justify-center select-none cursor-pointer transition-all duration-200 active:scale-95 ${
      isNextRecommended ? 'scale-105 z-20' : 'hover:scale-105 z-10'
    }`}
  >
    <div
      className={`relative w-[54px] h-[68px] sm:w-[64px] sm:h-[80px] flex flex-col items-center justify-center border-2 transition-all ${
        isNextRecommended
          ? 'bg-gradient-to-b from-emerald-900/90 via-[#0d231a] to-[#06120e] border-[#4ade80] shadow-[0_0_18px_rgba(74,222,128,0.75)] animate-pulse'
          : 'bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border-amber-400/50 hover:border-[#4ade80] shadow-lg'
      }`}
      style={{
        clipPath:
          'polygon(14% 0%, 86% 0%, 100% 12%, 100% 80%, 50% 100%, 0% 80%, 0% 12%)',
      }}
    >
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 border border-white/25 flex items-center justify-center text-[#4ade80] font-black text-base sm:text-lg group-hover:scale-110 transition-transform">
        +
      </div>
      <span className="mt-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-300">
        ELEGIR
      </span>
    </div>

    <div
      className={`-mt-1.5 px-2 py-0.5 rounded-full text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider border shadow-md z-20 ${
        isNextRecommended
          ? 'bg-[#4ade80] text-neutral-950 border-white'
          : 'bg-[#0f172a] text-amber-300 border-amber-400/50'
      }`}
    >
      {slot.label}
    </div>
  </button>
);

export const FutDraftGame: React.FC<FutDraftGameProps> = ({
  profile,
  userProfile,
  onBackToLobby,
}) => {
  const activeProfile = profile || userProfile;

  // ==========================================================================
  // 1. NAVIGATION & PHASE STATE
  // ==========================================================================
  const [phase, setPhase] = useState<ScreenPhase>('central_hub');

  // Draft State
  const [myFormation, setMyFormation] = useState<FormationType>('4-3-3');
  const [myLineup, setMyLineup] = useState<Record<string, FutPlayerCard>>({});
  const [broLineup, setBroLineup] = useState<Record<string, FutPlayerCard>>(() =>
    getBrotherDefaultLineup()
  );

  // Active 5-Player Pick Modal State
  const [pickingSlot, setPickingSlot] = useState<FormationSlot | null>(null);
  const [slotCandidates, setSlotCandidates] = useState<FutPlayerCard[]>([]);
  const [revealedCards, setRevealedCards] = useState<boolean>(false);

  // Tactics State
  const [myTactics, setMyTactics] = useState<TeamTacticsConfig>({
    mentality: 'attacking',
    pressingStyle: 'high_press',
    passingStyle: 'direct_counter',
    tempo: 78,
    width: 65,
  });
  const [isTacticsDrawerOpen, setIsTacticsDrawerOpen] = useState(false);

  // ==========================================================================
  // 2. MULTIPLAYER 2P (WITH BROTHER) STATE
  // ==========================================================================
  const [mpStatus, setMpStatus] = useState<MultiplayerStatus>(() => multiplayer.getStatus());
  const [mpRoomCode, setMpRoomCode] = useState<string>(() => multiplayer.getRoomCode());
  const [mpJoinCode, setMpJoinCode] = useState<string>('');
  const [mpError, setMpError] = useState<string>('');
  const [mpCopied, setMpCopied] = useState<boolean>(false);
  const [broName, setBroName] = useState<string>(
    () => multiplayer.getRemotePlayer()?.name || 'BROTHER DRAFT'
  );
  const [broDraftCount, setBroDraftCount] = useState<number>(11);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_msg',
      sender: 'coach',
      senderName: 'DT IA FC 27',
      text: '¡Bienvenido a FUTDRAFT FC 27! Arma tu 11 carta por carta o conéctate con tu hermano en la Sala 2P.',
      time: 'Ahora',
    },
  ]);

  // ==========================================================================
  // 3. MATCH ENGINE STATE (MODO A: AUTO-BATTLER & MODO B: TACTICAL DUEL RPG)
  // ==========================================================================
  const [minute, setMinute] = useState<number>(1);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2>(1);
  const [myScore, setMyScore] = useState<number>(0);
  const [broScore, setBroScore] = useState<number>(0);
  const [myPossession, setMyPossession] = useState<number>(52);
  const [myShots, setMyShots] = useState<number>(0);
  const [broShots, setBroShots] = useState<number>(0);
  const [matchEvents, setMatchEvents] = useState<MatchEventLog[]>([]);

  // Modo B: Turn-based Tactical RPG state
  const [turnRound, setTurnRound] = useState<number>(1);
  const maxTurnRounds = 7; // 7 Jugadas clave por partido
  const [selectedHandCardId, setSelectedHandCardId] = useState<string>('');
  const [selectedActionId, setSelectedActionId] = useState<string>('shoot');
  const [waitingForBrotherTurn, setWaitingForBrotherTurn] = useState<boolean>(false);
  const [pendingBrotherMove, setPendingBrotherMove] = useState<{
    card: FutPlayerCard;
    action: TacticalAction;
  } | null>(null);
  const [lastDuelResult, setLastDuelResult] = useState<{
    myCard: FutPlayerCard;
    broCard: FutPlayerCard;
    myAction: TacticalAction;
    broAction: TacticalAction;
    won: boolean;
    isGoal: boolean;
    chance: number;
    roll: number;
    narrative: string;
  } | null>(null);

  // FC 27 Database Explorer Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('TODAS');
  const [posFilter, setPosFilter] = useState<PlayerPosition | 'TODAS'>('TODAS');
  const [tierFilter, setTierFilter] = useState<CardTier | 'TODAS'>('TODAS');

  // ==========================================================================
  // 4. DERIVED SQUAD METRICS (DRAFT PROGRESS, OVR, CHEMISTRY)
  // ==========================================================================
  const currentSlots = useMemo(() => FORMATIONS[myFormation], [myFormation]);

  const draftedCount = useMemo(() => {
    return currentSlots.filter((s) => Boolean(myLineup[s.slotId])).length;
  }, [currentSlots, myLineup]);

  const isDraftComplete = draftedCount === 11;

  const alreadyDraftedIds = useMemo(() => {
    return new Set(Object.values(myLineup).map((p) => p.id));
  }, [myLineup]);

  const teamRating = useMemo(() => {
    const players = Object.values(myLineup);
    if (players.length === 0) return 0;
    const sum = players.reduce((acc, p) => acc + p.rating, 0);
    return Math.round(sum / players.length);
  }, [myLineup]);

  const chemistryData = useMemo(
    () => calculateTeamChemistry(myLineup, myFormation),
    [myLineup, myFormation]
  );

  // Complete lineup fallback if user enters match before finishing all 11 picks
  const effectiveMyLineup = useMemo(() => {
    const copy: Record<string, FutPlayerCard> = { ...myLineup };
    const used = new Set(Object.values(copy).map((p) => p.id));
    for (const slot of currentSlots) {
      if (!copy[slot.slotId]) {
        const replacement =
          ALL_FC27_PLAYERS.find((p) => !used.has(p.id) && p.position === slot.label) ||
          ALL_FC27_PLAYERS.find((p) => !used.has(p.id)) ||
          ALL_FC27_PLAYERS[0];
        copy[slot.slotId] = replacement;
        used.add(replacement.id);
      }
    }
    return copy;
  }, [myLineup, currentSlots]);

  const mySquadList = useMemo(() => Object.values(effectiveMyLineup), [effectiveMyLineup]);

  const activeHandCard = useMemo(() => {
    return (
      mySquadList.find((p) => p.id === selectedHandCardId) ||
      mySquadList.find((p) => p.zone === 'ATK') ||
      mySquadList[0]
    );
  }, [mySquadList, selectedHandCardId]);

  const activeTacticalAction = useMemo(() => {
    return TACTICAL_ACTIONS.find((a) => a.id === selectedActionId) || TACTICAL_ACTIONS[2];
  }, [selectedActionId]);

  // ==========================================================================
  // 5. P2P MULTIPLAYER SYNCHRONIZATION WITH BROTHER
  // ==========================================================================
  useEffect(() => {
    const unsubStatus = multiplayer.onStatusChange((st, details) => {
      setMpStatus(st);
      if (details) setMpError(details);
      if (st === 'connected') {
        const remote = multiplayer.getRemotePlayer();
        if (remote?.name) setBroName(remote.name.toUpperCase());
        sound.playWin();
        triggerHaptic('success');
      }
    });

    const unsubMsg = multiplayer.onMessage((msg) => {
      if (msg.type === 'HANDSHAKE' && msg.payload) {
        if (msg.payload.name) setBroName(String(msg.payload.name).toUpperCase());
      } else if (msg.type === 'CHAT' && msg.payload?.text) {
        sound.playChip();
        setChatMessages((prev) => [
          ...prev,
          {
            id: `chat_${Date.now()}`,
            sender: 'bro',
            senderName: msg.senderName || broName,
            text: msg.payload.text,
            time: 'En vivo',
          },
        ]);
      } else if (msg.type === 'GAME_ACTION' && msg.payload) {
        const p = msg.payload;
        if (p.action === 'FUTDRAFT_SYNC_SQUAD' && p.lineup) {
          setBroLineup(p.lineup);
          setBroDraftCount(Object.keys(p.lineup).length);
        } else if (p.action === 'FUTDRAFT_START_MODE' && p.mode) {
          sound.playWin();
          triggerHaptic('success');
          handleResetMatchStats();
          setPhase(p.mode);
          if (p.mode === 'match_auto') setIsSimRunning(true);
        } else if (p.action === 'FUTDRAFT_TACTICAL_MOVE' && p.card && p.tacticalAction) {
          // Brother submitted his move in Mode B
          setPendingBrotherMove({
            card: p.card,
            action: p.tacticalAction,
          });
        } else if (p.action === 'FUTDRAFT_DUEL_RESOLVED' && p.result) {
          // Host resolved the duel; guest updates scoreboard & duel modal
          const res = p.result;
          setLastDuelResult(res.duelBanner);
          setMyScore(res.guestScore);
          setBroScore(res.hostScore);
          setMyShots(res.guestShots);
          setBroShots(res.hostShots);
          setMinute(res.minute);
          setTurnRound(res.nextRound);
          setMatchEvents((prev) => [res.eventLog, ...prev]);
          setWaitingForBrotherTurn(false);
          setPendingBrotherMove(null);
        }
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, [broName]);

  // Whenever our lineup changes during Draft, broadcast to brother if connected
  useEffect(() => {
    if (mpStatus === 'connected' && Object.keys(myLineup).length > 0) {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: activeProfile?.id || 'me',
        senderName: activeProfile?.name || 'MI DRAFT',
        payload: {
          action: 'FUTDRAFT_SYNC_SQUAD',
          lineup: myLineup,
          formation: myFormation,
        },
        timestamp: Date.now(),
      });
    }
  }, [myLineup, myFormation, mpStatus, activeProfile]);

  // ==========================================================================
  // 6. MODO A: AUTO-BATTLER STATISTICAL SIMULATION TIMER
  // ==========================================================================
  useEffect(() => {
    if (phase !== 'match_auto' || !isSimRunning) return;

    const intervalMs = simSpeed === 2 ? 450 : 900;
    const timer = setInterval(() => {
      setMinute((prevMin) => {
        if (prevMin >= 90) {
          setIsSimRunning(false);
          sound.playWin();
          return 90;
        }
        const nextMin = prevMin + 1;
        const tick = simulateStatisticalMinuteTick(
          nextMin,
          effectiveMyLineup,
          broLineup,
          myTactics
        );

        setMyPossession((pos) =>
          Math.max(32, Math.min(68, Math.round(pos + tick.possessionDelta)))
        );
        if (tick.myShotAdded) setMyShots((s) => s + 1);
        if (tick.broShotAdded) setBroShots((s) => s + 1);
        if (tick.myGoalAdded) {
          setMyScore((g) => g + 1);
          sound.playWin();
          triggerHaptic('success');
        }
        if (tick.broGoalAdded) {
          setBroScore((g) => g + 1);
          triggerHaptic('warning');
        }
        if (tick.event) {
          setMatchEvents((evts) => [tick.event!, ...evts]);
        }
        return nextMin;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [phase, isSimRunning, simSpeed, effectiveMyLineup, broLineup, myTactics]);

  // ==========================================================================
  // 7. CORE INTERACTION HANDLERS (DRAFT, MULTIPLAYER, MATCH MODES)
  // ==========================================================================

  const handleOpenSlotPick = (slot: FormationSlot) => {
    sound.playCardDeal();
    triggerHaptic('medium');
    const candidates = generateFiveRandomCandidatesForSlot(slot, alreadyDraftedIds);
    setPickingSlot(slot);
    setSlotCandidates(candidates);
    setRevealedCards(false);
    setTimeout(() => setRevealedCards(true), 60);
  };

  const handleSelectCandidateForSlot = (player: FutPlayerCard) => {
    if (!pickingSlot) return;
    sound.playChip();
    triggerHaptic('success');
    setMyLineup((prev) => ({
      ...prev,
      [pickingSlot.slotId]: player,
    }));
    setSelectedHandCardId(player.id);
    setPickingSlot(null);
  };

  const handleAutoCompleteRemainingDraft = () => {
    sound.playWin();
    triggerHaptic('success');
    const nextLineup: Record<string, FutPlayerCard> = { ...myLineup };
    const usedIds = new Set(Object.values(nextLineup).map((p) => p.id));

    for (const slot of currentSlots) {
      if (!nextLineup[slot.slotId]) {
        const candidates = generateFiveRandomCandidatesForSlot(slot, usedIds);
        // Pick the highest rated among the 5 random candidates
        const best = [...candidates].sort((a, b) => b.rating - a.rating)[0];
        if (best) {
          nextLineup[slot.slotId] = best;
          usedIds.add(best.id);
        }
      }
    }
    setMyLineup(nextLineup);
  };

  const handleResetDraft = () => {
    sound.playCardDeal();
    triggerHaptic('light');
    setMyLineup({});
  };

  const handleResetMatchStats = () => {
    setMinute(1);
    setMyScore(0);
    setBroScore(0);
    setMyShots(0);
    setBroShots(0);
    setMyPossession(52);
    setTurnRound(1);
    setLastDuelResult(null);
    setWaitingForBrotherTurn(false);
    setPendingBrotherMove(null);
    setMatchEvents([
      {
        id: `kickoff_${Date.now()}`,
        minute: 1,
        type: 'kickoff',
        team: 'my',
        text: 'Min 1: ¡Arranca el encuentro oficial en el Estadio FUTDRAFT FC 27!',
      },
    ]);
  };

  const handleLaunchMatchMode = (targetMode: 'match_auto' | 'match_tactical') => {
    sound.playWin();
    triggerHaptic('success');
    handleResetMatchStats();
    setPhase(targetMode);
    if (targetMode === 'match_auto') {
      setIsSimRunning(true);
    }
    if (mpStatus === 'connected') {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: activeProfile?.id || 'me',
        senderName: activeProfile?.name || 'MI DRAFT',
        payload: {
          action: 'FUTDRAFT_START_MODE',
          mode: targetMode,
        },
        timestamp: Date.now(),
      });
    }
  };

  // Resolve Turn in Mode B (Batalla Táctica por Turnos)
  const executeTurnResolution = (
    myCard: FutPlayerCard,
    myAct: TacticalAction,
    oppCard: FutPlayerCard,
    oppAct: TacticalAction
  ) => {
    const nextMinute = Math.min(90, turnRound * 12 + Math.floor(Math.random() * 5));
    const res = resolveTacticalTurnDuel(
      myCard,
      myAct,
      oppCard,
      oppAct,
      chemistryData.totalChemistry,
      myTactics,
      nextMinute
    );

    const nextMyScore = myScore + (res.won && res.isGoal ? 1 : 0);
    const nextBroScore = broScore + (!res.won && res.isGoal ? 1 : 0);
    const nextMyShots = myShots + (res.won && res.isShot ? 1 : 0);
    const nextBroShots = broShots + (!res.won && res.isShot ? 1 : 0);

    const banner = {
      myCard,
      broCard: oppCard,
      myAction: myAct,
      broAction: oppAct,
      won: res.won,
      isGoal: res.isGoal,
      chance: res.successChance,
      roll: res.diceRoll,
      narrative: res.eventLog.text,
    };

    setMinute(nextMinute);
    setMyScore(nextMyScore);
    setBroScore(nextBroScore);
    setMyShots(nextMyShots);
    setBroShots(nextBroShots);
    setLastDuelResult(banner);
    setMatchEvents((prev) => [res.eventLog, ...prev]);
    setTurnRound((r) => Math.min(maxTurnRounds, r + 1));
    setWaitingForBrotherTurn(false);
    setPendingBrotherMove(null);

    if (res.isGoal) {
      sound.playWin();
      triggerHaptic('success');
    } else {
      sound.playChip();
      triggerHaptic('medium');
    }

    if (mpStatus === 'connected') {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: activeProfile?.id || 'me',
        senderName: activeProfile?.name || 'MI DRAFT',
        payload: {
          action: 'FUTDRAFT_DUEL_RESOLVED',
          result: {
            duelBanner: {
              ...banner,
              myCard: oppCard,
              broCard: myCard,
              myAction: oppAct,
              broAction: myAct,
              won: !res.won,
            },
            hostScore: nextMyScore,
            guestScore: nextBroScore,
            hostShots: nextMyShots,
            guestShots: nextBroShots,
            minute: nextMinute,
            nextRound: Math.min(maxTurnRounds, turnRound + 1),
            eventLog: res.eventLog,
          },
        },
        timestamp: Date.now(),
      });
    }
  };

  const handleConfirmTacticalTurn = () => {
    if (!activeHandCard || !activeTacticalAction) return;

    // If connected 2P with brother:
    if (mpStatus === 'connected') {
      if (pendingBrotherMove) {
        // Brother already sent his move -> resolve immediately!
        executeTurnResolution(
          activeHandCard,
          activeTacticalAction,
          pendingBrotherMove.card,
          pendingBrotherMove.action
        );
      } else {
        // Send our move to brother and wait
        sound.playCardDeal();
        triggerHaptic('medium');
        setWaitingForBrotherTurn(true);
        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: activeProfile?.id || 'me',
          senderName: activeProfile?.name || 'MI DRAFT',
          payload: {
            action: 'FUTDRAFT_TACTICAL_MOVE',
            card: activeHandCard,
            tacticalAction: activeTacticalAction,
          },
          timestamp: Date.now(),
        });
      }
      return;
    }

    // 1P vs Tactical AI: AI picks a realistic counter card and action
    const broCards = Object.values(broLineup);
    const randomBroCard =
      broCards[Math.floor(Math.random() * broCards.length)] || ALL_FC27_PLAYERS[0];
    const randomBroAction =
      TACTICAL_ACTIONS[Math.floor(Math.random() * TACTICAL_ACTIONS.length)];

    executeTurnResolution(activeHandCard, activeTacticalAction, randomBroCard, randomBroAction);
  };

  // If brother's move arrives while we are waiting, resolve automatically
  useEffect(() => {
    if (waitingForBrotherTurn && pendingBrotherMove && activeHandCard && activeTacticalAction) {
      executeTurnResolution(
        activeHandCard,
        activeTacticalAction,
        pendingBrotherMove.card,
        pendingBrotherMove.action
      );
    }
  }, [waitingForBrotherTurn, pendingBrotherMove]);

  // Multiplayer Room Actions
  const handleCreateRoom = async () => {
    sound.playChip();
    triggerHaptic('medium');
    setMpError('');
    try {
      const code = await multiplayer.createRoom({
        id: activeProfile?.id || 'player_host',
        name: activeProfile?.name || 'Anfitrión FC27',
        avatar: activeProfile?.avatar || 'DT',
      });
      setMpRoomCode(code);
    } catch (err) {
      setMpError('Error al crear sala P2P. Intenta de nuevo.');
      console.error(err);
    }
  };

  const handleJoinRoom = async () => {
    if (!mpJoinCode.trim()) return;
    sound.playChip();
    triggerHaptic('medium');
    setMpError('');
    try {
      await multiplayer.joinRoom(mpJoinCode.trim(), {
        id: activeProfile?.id || 'player_guest',
        name: activeProfile?.name || 'Hermano FC27',
        avatar: activeProfile?.avatar || 'BR',
      });
    } catch (err) {
      setMpError('No se encontró la sala. Verifica los 4 dígitos con tu hermano.');
      console.error(err);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [
      ...prev,
      {
        id: `me_${Date.now()}`,
        sender: 'me',
        senderName: activeProfile?.name || 'Tú',
        text,
        time: 'Ahora',
      },
    ]);
    if (mpStatus === 'connected') {
      multiplayer.send({
        type: 'CHAT',
        senderId: activeProfile?.id || 'me',
        senderName: activeProfile?.name || 'Tú',
        payload: { text },
        timestamp: Date.now(),
      });
    }
  };

  // Filtered FC 27 Database Players
  const filteredCatalogPlayers = useMemo(() => {
    return ALL_FC27_PLAYERS.filter((p) => {
      if (posFilter !== 'TODAS' && p.position !== posFilter) return false;
      if (tierFilter !== 'TODAS' && p.tier !== tierFilter) return false;
      if (leagueFilter !== 'TODAS' && getPlayerLeague(p.club) !== leagueFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q) ||
          p.club.toLowerCase().includes(q) ||
          p.nation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [posFilter, tierFilter, leagueFilter, searchQuery]);

  // Next empty slot for guided mobile drafting
  const nextEmptySlot = useMemo(() => {
    return currentSlots.find((s) => !myLineup[s.slotId]) || null;
  }, [currentSlots, myLineup]);

  // ==========================================================================
  // RENDER: TOP PERSISTENT MOBILE HEADER BAR
  // ==========================================================================
  return (
    <div className="w-full h-full flex flex-col bg-[#060b14] text-white select-none overflow-hidden font-sans">
      {/* TOP BAR: Back + Title + Squad Status + 2P Live Badge */}
      <header className="shrink-0 px-3 py-2 bg-[#0a1120]/95 border-b border-slate-800/90 flex items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-2">
          {phase === 'central_hub' ? (
            <button
              onClick={onBackToLobby}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-black flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Casino</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playChip();
                setIsSimRunning(false);
                setPhase('central_hub');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-[#4ade80]/50 text-[#4ade80] text-xs font-black flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Menú FUTDRAFT</span>
            </button>
          )}

          <div className="flex flex-col leading-none">
            <span className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-[#4ade80]" />
              FUTDRAFT FC 27
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {draftedCount}/11 Cartas • OVR {teamRating || '--'} • QUÍM {chemistryData.totalChemistry}/33
            </span>
          </div>
        </div>

        {/* Right: 2P Brother Connection Pill + Chat */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sound.playChip();
              setPhase('multiplayer_room');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border cursor-pointer active:scale-95 transition-all ${
              mpStatus === 'connected'
                ? 'bg-emerald-500/20 border-[#4ade80] text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.3)]'
                : 'bg-amber-500/15 border-amber-400/50 text-amber-300'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>
              {mpStatus === 'connected' ? `2P: ${broName.slice(0, 10)}` : 'Conectar Hermano (2P)'}
            </span>
          </button>

          <button
            onClick={() => setIsChatOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-95 relative"
            title="Chat Táctico"
          >
            <MessageSquare className="w-4 h-4" />
            {mpStatus === 'connected' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
            )}
          </button>
        </div>
      </header>

      {/* ====================================================================
          SCREEN 1: MENÚ CENTRAL MÓVIL (CENTRAL HUB)
      ==================================================================== */}
      {phase === 'central_hub' && (
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 max-w-4xl mx-auto w-full">
          {/* Hero Banner Explaining the Step-by-Step FUT Draft Experience */}
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0d281d] via-[#0b192c] to-[#070d19] border border-[#4ade80]/40 p-4 sm:p-6 shadow-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4ade80]/15 border border-[#4ade80]/40 text-[#4ade80] text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  EA SPORTS FC 27 • {ALL_FC27_PLAYERS.length} JUGADORES REALES
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  FUTDRAFT AI & TACTICS
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  1️⃣ Elige tu alineación táctica. 2️⃣ Toca cada posición del campo para abrir un{' '}
                  <strong className="text-amber-300">Player Pick de 5 cartas aleatorias</strong>. 3️⃣ Conéctate con tu hermano y compite en los 2 modos de partido.
                </p>
              </div>

              {/* Current Draft Progress Card */}
              <div className="shrink-0 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4ade80] to-emerald-700 text-neutral-950 font-black flex flex-col items-center justify-center leading-none shadow-lg">
                  <span className="text-lg">{draftedCount}</span>
                  <span className="text-[8px] uppercase">DE 11</span>
                </div>
                <div>
                  <div className="text-xs font-black text-white uppercase">
                    {isDraftComplete ? '¡Plantilla Lista!' : 'Plantilla en Progreso'}
                  </div>
                  <div className="text-[11px] text-amber-300 font-bold">
                    Formación: {myFormation} • Media: {teamRating || '--'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Química: {chemistryData.totalChemistry}/33
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Big Mobile Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PASO 1: ARMAR FUTDRAFT (1 DE 5 POR POSICIÓN) */}
            <button
              onClick={() => {
                sound.playCardDeal();
                triggerHaptic('medium');
                setPhase(draftedCount === 0 ? 'formation_pick' : 'draft_pitch');
              }}
              className="text-left p-4 rounded-3xl bg-gradient-to-br from-[#122b22] via-[#0e1c26] to-[#0a101d] border-2 border-[#4ade80]/70 hover:border-[#4ade80] shadow-xl flex flex-col justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-[#4ade80]/20 border border-[#4ade80] flex items-center justify-center text-[#4ade80]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#4ade80] text-neutral-950 font-black text-[10px] uppercase tracking-wider">
                  PASO 1 • {draftedCount}/11 ELEGIDOS
                </span>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase">
                  1. Armar Mi FUTDRAFT (Carta x Carta)
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Elige tu formación ({myFormation}) y toca cada una de las 11 posiciones para elegir entre{' '}
                  <strong className="text-[#4ade80]">5 jugadores aleatorios</strong> de esa posición.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-black text-[#4ade80]">
                <span>{draftedCount === 0 ? 'Comenzar Draft Ahora' : 'Continuar Armando mi 11'}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* PASO 2: MULTIJUGADOR CON HERMANO (SALA 2P) */}
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                setPhase('multiplayer_room');
              }}
              className="text-left p-4 rounded-3xl bg-gradient-to-br from-[#2a1908] via-[#19131d] to-[#0a101d] border-2 border-amber-400/60 hover:border-amber-400 shadow-xl flex flex-col justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
                  <Users className="w-6 h-6" />
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                    mpStatus === 'connected'
                      ? 'bg-[#4ade80] text-neutral-950'
                      : 'bg-amber-400 text-neutral-950'
                  }`}
                >
                  {mpStatus === 'connected' ? '🟢 CONECTADO CON HERMANO' : 'PASO 2 • SALA 2 CELULARES'}
                </span>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase">
                  2. Multijugador con mi Hermano (2P)
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Crea un código de 4 dígitos o ingresa el de tu hermano para sincronizar sus plantillas de FUTDRAFT y enfrentarse en vivo.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-black text-amber-300">
                <span>
                  {mpStatus === 'connected'
                    ? `Conectado con ${broName} (Ver Sala)`
                    : 'Crear o Unirse con Código de 4 Dígitos'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* PASO 3: MODO A - SIMULACIÓN ESTADÍSTICA (AUTO-BATTLER) */}
            <button
              onClick={() => handleLaunchMatchMode('match_auto')}
              className="text-left p-4 rounded-3xl bg-gradient-to-br from-[#0e2238] via-[#0d1627] to-[#090d16] border border-sky-400/50 hover:border-sky-400 shadow-xl flex flex-col justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-black text-[10px] uppercase tracking-wider">
                  MODO DE JUEGO 1 • 90 MIN
                </span>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase">
                  3. Modo A: Simulación Auto-Battler
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  El motor matemático simula los 90 minutos enfrentando los atributos de tus cartas, química y tácticas de DT en tiempo real.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-black text-sky-300">
                <span>Iniciar Simulación de 90 Minutos</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* PASO 4: MODO B - BATALLA TÁCTICA POR TURNOS (RPG / CARTAS) */}
            <button
              onClick={() => handleLaunchMatchMode('match_tactical')}
              className="text-left p-4 rounded-3xl bg-gradient-to-br from-[#2b0f26] via-[#191024] to-[#090d16] border border-fuchsia-400/50 hover:border-fuchsia-400 shadow-xl flex flex-col justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400 flex items-center justify-center text-fuchsia-300">
                  <Swords className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 font-black text-[10px] uppercase tracking-wider">
                  MODO DE JUEGO 2 • DUELO POR TURNOS
                </span>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase">
                  4. Modo B: Batalla Táctica por Turnos
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  ¡Duelo interactivo! En cada jugada eliges 1 carta de tu equipo + 1 acción táctica (Disparar, Pase Largo, Presión Alta) con dado D100.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-black text-fuchsia-300">
                <span>Jugar Duelo Táctico por Turnos</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Secondary Bar: Explore Full 188-Player FC 27 Database */}
          <div className="rounded-2xl bg-[#0e1729] border border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#4ade80]" />
              <div>
                <div className="text-xs font-black uppercase text-white">
                  Explorador Oficial Base de Datos EA SPORTS FC 27
                </div>
                <div className="text-[11px] text-slate-400">
                  Consulta los {ALL_FC27_PLAYERS.length} jugadores de LaLiga, Premier League, Serie A, Bundesliga, Ligue 1 e Iconos.
                </div>
              </div>
            </div>
            <button
              onClick={() => setPhase('fc27_catalog')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-black text-white cursor-pointer active:scale-95"
            >
              Ver Base de Datos FC 27
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          SCREEN 2: PASO 1 DEL DRAFT — ELEGIR FORMACIÓN (1 DE 4)
      ==================================================================== */}
      {phase === 'formation_pick' && (
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-3xl mx-auto w-full flex flex-col justify-between">
          <div>
            <div className="text-center mb-4">
              <span className="px-3 py-1 rounded-full bg-[#4ade80]/15 border border-[#4ade80]/40 text-[#4ade80] text-[10px] font-black uppercase tracking-widest">
                PASO 1 DE 2 • ELEGIR ALINEACIÓN
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                Elige la Formación para tu FUTDRAFT
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Después de elegir tu formación, tocarás cada puesto del campo para escoger entre 5 jugadores aleatorios.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    id: '4-3-3',
                    name: '4-3-3 Ofensiva',
                    desc: 'Extremos abiertos (EI / ED), Delantero Centro y 3 mediocampistas.',
                    style: 'Ideal para Contraataque y Bandas',
                  },
                  {
                    id: '4-4-2',
                    name: '4-4-2 Clásica',
                    desc: 'Doble punta (2 DC) respaldados por dos líneas sólidas de cuatro.',
                    style: 'Equilibrio Total Defensa/Ataque',
                  },
                  {
                    id: '4-2-3-1',
                    name: '4-2-3-1 Moderna',
                    desc: 'Doble pivote defensivo (2 MCD) y 3 mediapuntas detrás del 9.',
                    style: 'Máximo Control y Posesión',
                  },
                  {
                    id: '3-5-2',
                    name: '3-5-2 Presión',
                    desc: '3 centrales contundentes, carrileros profundos y doble delantero.',
                    style: 'Superioridad en Mediocampo',
                  },
                ] as const
              ).map((f) => {
                const active = myFormation === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      sound.playChip();
                      triggerHaptic('light');
                      setMyFormation(f.id);
                      setMyLineup({});
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer active:scale-95 flex flex-col justify-between ${
                      active
                        ? 'bg-emerald-950/60 border-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.3)]'
                        : 'bg-[#0e1726] border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-black text-white">{f.id}</span>
                        {active && (
                          <span className="w-6 h-6 rounded-full bg-[#4ade80] text-neutral-950 flex items-center justify-center">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-black text-amber-300 mt-0.5">{f.name}</div>
                      <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">{f.desc}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-bold text-[#4ade80]">
                      ★ {f.style}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              sound.playCardDeal();
              triggerHaptic('success');
              setPhase('draft_pitch');
            }}
            className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#4ade80] to-emerald-500 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Confirmar {myFormation} y Elegir Jugadores (1 de 5)</span>
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      )}

      {/* ====================================================================
          SCREEN 3: PASO 2 DEL DRAFT — CAMPO INTERACTIVO (PICK 1 DE 5 POR PUESTO)
      ==================================================================== */}
      {phase === 'draft_pitch' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Draft Instruction & Controls Bar */}
          <div className="shrink-0 px-3 py-2 bg-[#0d1627] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPhase('formation_pick')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-black text-amber-300 cursor-pointer"
              >
                Formación: {myFormation} ✎
              </button>
              <span className="text-xs text-slate-200 font-bold">
                {isDraftComplete
                  ? '✅ ¡11 Titulares listos! Toca cualquier carta si deseas re-sortearla.'
                  : `👉 Toca el puesto resaltado (${nextEmptySlot?.label}) para abrir sus 5 cartas aleatorias:`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {!isDraftComplete && (
                <button
                  onClick={handleAutoCompleteRemainingDraft}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-black cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>Auto-Completar Restantes</span>
                </button>
              )}
              {draftedCount > 0 && (
                <button
                  onClick={handleResetDraft}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  title="Reiniciar Draft"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Tactical Pitch with 11 Positions */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-4 bg-[#07111e]">
            <div className="relative w-full max-w-3xl h-full max-h-[540px] rounded-3xl border-2 border-emerald-500/40 shadow-[inset_0_0_50px_rgba(0,0,0,0.85)] overflow-hidden bg-[repeating-linear-gradient(0deg,#114227_0px,#114227_28px,#154d2e_28px,#154d2e_56px)]">
              {/* Pitch Lines & Penalty Boxes */}
              <div className="absolute inset-3 border-2 border-white/25 rounded-2xl pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-14 border-b-2 border-x-2 border-white/25" />
                <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-white/25" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/25" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-16 border-t-2 border-x-2 border-white/25" />
              </div>

              {/* SVG Chemistry Links Between Drafted Players */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {currentSlots.map((slot) =>
                  slot.linksTo.map((targetId) => {
                    const target = currentSlots.find((s) => s.slotId === targetId);
                    if (!target || slot.slotId > targetId) return null;
                    const pA = myLineup[slot.slotId];
                    const pB = myLineup[targetId];
                    const bothPicked = Boolean(pA && pB);
                    const strongLink =
                      bothPicked && (pA.club === pB.club || pA.nationCode === pB.nationCode);
                    return (
                      <line
                        key={`${slot.slotId}_${targetId}`}
                        x1={`${slot.x}%`}
                        y1={`${slot.y}%`}
                        x2={`${target.x}%`}
                        y2={`${target.y}%`}
                        stroke={
                          !bothPicked
                            ? 'rgba(255,255,255,0.18)'
                            : strongLink
                            ? '#4ade80'
                            : '#facc15'
                        }
                        strokeWidth={strongLink ? '3' : '2'}
                        strokeDasharray={bothPicked ? undefined : '4 4'}
                      />
                    );
                  })
                )}
              </svg>

              {/* Render the 11 Formation Slots */}
              {currentSlots.map((slot) => {
                const player = myLineup[slot.slotId];
                const isNext = nextEmptySlot?.slotId === slot.slotId;
                return (
                  <div
                    key={slot.slotId}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                  >
                    {player ? (
                      <FutCardShield
                        player={player}
                        size="pitch"
                        badgeText={slot.label}
                        onClick={() => handleOpenSlotPick(slot)}
                      />
                    ) : (
                      <EmptyDraftSlotShield
                        slot={slot}
                        isNextRecommended={isNext}
                        onClick={() => handleOpenSlotPick(slot)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Dock: Ready to Play or Pick Next */}
          <div className="shrink-0 px-3 py-2.5 bg-[#0a1120] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="text-xs font-black text-white">
                Progreso Draft:{' '}
                <span className="text-[#4ade80]">
                  {draftedCount} / 11 Cartas
                </span>
              </div>
              <div className="hidden sm:block text-xs text-slate-400">
                Química de Club/País: <strong className="text-amber-300">{chemistryData.totalChemistry}/33</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isDraftComplete && nextEmptySlot && (
                <button
                  onClick={() => handleOpenSlotPick(nextEmptySlot)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 shadow-md"
                >
                  Elegir {nextEmptySlot.label} (5 Cartas)
                </button>
              )}

              <button
                onClick={() => handleLaunchMatchMode('match_tactical')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4ade80] to-emerald-500 text-neutral-950 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <Swords className="w-4 h-4" />
                <span>Ir a Batalla Táctica</span>
              </button>

              <button
                onClick={() => handleLaunchMatchMode('match_auto')}
                className="px-3.5 py-2 rounded-xl bg-sky-500/20 border border-sky-400/50 text-sky-300 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <Cpu className="w-4 h-4" />
                <span>Auto-Battler</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE PLAYER PICK: 5 JUGADORES ALEATORIOS PARA LA POSICIÓN ELEGIDA
      ==================================================================== */}
      {pickingSlot && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl bg-[#0b1324] border-2 border-[#4ade80] p-4 sm:p-6 shadow-[0_0_50px_rgba(74,222,128,0.25)] flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#4ade80]/20 border border-[#4ade80]/50 text-[#4ade80] text-[10px] font-black uppercase tracking-widest">
                  FUTDRAFT PLAYER PICK • 5 OPCIONES ALEATORIAS
                </span>
                <h3 className="text-base sm:text-xl font-black text-white mt-1">
                  Elige tu jugador para la posición:{' '}
                  <span className="text-amber-300">{pickingSlot.label}</span>
                </h3>
              </div>
              <button
                onClick={() => setPickingSlot(null)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 my-2.5 text-center">
              Toca cualquiera de las 5 cartas sorteadas de la base de datos de{' '}
              <strong className="text-white">EA SPORTS FC 27</strong> para ficharla en tu 11 titular:
            </p>

            {/* Horizontal / Responsive Grid of 5 Candidates */}
            <div className="flex-1 overflow-x-auto overflow-y-auto py-3">
              <div className="flex sm:grid sm:grid-cols-5 items-center justify-start sm:justify-items-center gap-3 min-w-max sm:min-w-0 px-2">
                {slotCandidates.map((candidate, idx) => (
                  <div
                    key={candidate.id}
                    onClick={() => handleSelectCandidateForSlot(candidate)}
                    style={{ transitionDelay: `${idx * 55}ms` }}
                    className={`flex flex-col items-center p-2.5 rounded-2xl bg-slate-900/90 border-2 border-slate-700 hover:border-[#4ade80] cursor-pointer transition-all duration-300 active:scale-95 ${
                      revealedCards
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4'
                    }`}
                  >
                    <FutCardShield player={candidate} size="hand" />
                    <div className="mt-2 text-center">
                      <div className="text-[11px] font-black text-white truncate max-w-[105px]">
                        {candidate.name}
                      </div>
                      <div className="text-[9px] font-bold text-amber-300 truncate max-w-[105px]">
                        {candidate.club}
                      </div>
                      <div className="mt-1.5 px-3 py-1 rounded-lg bg-[#4ade80] text-neutral-950 font-black text-[10px] uppercase tracking-wider">
                        Elegir Carta
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SCREEN 4: SALA MULTIJUGADOR CON TU HERMANO (2 CELULARES P2P)
      ==================================================================== */}
      {phase === 'multiplayer_room' && (
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-xl mx-auto w-full space-y-4">
          <div className="rounded-3xl bg-[#0d1627] border-2 border-amber-400/50 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase">
                  Sala 2 Jugadores (Jugar con mi Hermano)
                </h2>
                <p className="text-xs text-slate-300">
                  Conecta tu celular con el de tu hermano usando un código directo de 4 dígitos.
                </p>
              </div>
            </div>

            {mpStatus !== 'connected' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Columna 1: Crear Sala (Anfitrión) */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      OPCIÓN A • TÚ CREAS LA SALA
                    </span>
                    <h3 className="text-sm font-black text-white mt-1">
                      1. Generar Código de 4 Dígitos
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Presiona el botón y pásale el número de 4 dígitos a tu hermano.
                    </p>
                  </div>

                  {mpStatus === 'waiting' && mpRoomCode ? (
                    <div className="p-3 rounded-xl bg-black border-2 border-[#4ade80] text-center space-y-2">
                      <div className="text-[10px] font-bold text-[#4ade80] uppercase">
                        CÓDIGO PARA TU HERMANO:
                      </div>
                      <div className="text-3xl font-mono font-black tracking-widest text-white">
                        {mpRoomCode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(mpRoomCode);
                          setMpCopied(true);
                          setTimeout(() => setMpCopied(false), 2000);
                        }}
                        className="w-full py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-amber-300 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {mpCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{mpCopied ? 'Copiado' : 'Copiar Código'}</span>
                      </button>
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 animate-pulse">
                        <Radio className="w-3 h-3 text-[#4ade80]" />
                        Esperando a tu hermano...
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleCreateRoom}
                      disabled={mpStatus === 'creating'}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95"
                    >
                      {mpStatus === 'creating' ? 'Generando...' : 'Crear Sala y Obtener Código'}
                    </button>
                  )}
                </div>

                {/* Columna 2: Unirse con Código (Invitado) */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                      OPCIÓN B • TU HERMANO CREÓ LA SALA
                    </span>
                    <h3 className="text-sm font-black text-white mt-1">
                      2. Ingresar Código de mi Hermano
                    </h3>
                    <input
                      type="text"
                      value={mpJoinCode}
                      onChange={(e) => setMpJoinCode(e.target.value.toUpperCase())}
                      placeholder="Ej: 4821"
                      maxLength={6}
                      className="w-full mt-2 text-center text-2xl font-mono font-black tracking-widest py-2.5 rounded-xl bg-black border border-slate-700 text-white focus:outline-none focus:border-[#4ade80]"
                    />
                  </div>

                  <button
                    onClick={handleJoinRoom}
                    disabled={mpStatus === 'joining' || !mpJoinCode.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4ade80] to-emerald-500 text-neutral-950 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-40"
                  >
                    {mpStatus === 'joining' ? 'Conectando...' : 'Conectar con mi Hermano'}
                  </button>
                </div>
              </div>
            ) : (
              /* CONNECTED WITH BROTHER PANEL */
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-950/50 border-2 border-[#4ade80] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-[#4ade80] uppercase">
                      🟢 ¡CONECTADOS EN VIVO P2P!
                    </div>
                    <div className="text-sm font-black text-white mt-0.5">
                      Rival Conectado: {broName} ({broDraftCount}/11 cartas listas)
                    </div>
                  </div>
                  <button
                    onClick={() => multiplayer.disconnect()}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold cursor-pointer"
                  >
                    Desconectar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setPhase('draft_pitch')}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-black text-white hover:border-[#4ade80] cursor-pointer"
                  >
                    1. Terminar Mi Draft ({draftedCount}/11)
                  </button>
                  <button
                    onClick={() => handleLaunchMatchMode('match_tactical')}
                    className="p-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-xs font-black text-white cursor-pointer shadow-lg"
                  >
                    2. Iniciar Batalla Táctica 2P
                  </button>
                  <button
                    onClick={() => handleLaunchMatchMode('match_auto')}
                    className="p-3 rounded-2xl bg-gradient-to-r from-[#4ade80] to-emerald-600 text-neutral-950 text-xs font-black cursor-pointer shadow-lg"
                  >
                    3. Iniciar Auto-Battler 2P
                  </button>
                </div>
              </div>
            )}

            {mpError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-bold">
                {mpError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          SCREEN 5: MODO B — BATALLA TÁCTICA POR TURNOS (EXPLICADA Y MÓVIL)
      ==================================================================== */}
      {phase === 'match_tactical' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#060b14]">
          {/* Match Scoreboard HUD */}
          <div className="shrink-0 px-3 py-2 bg-[#0c1526] border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-300 text-[10px] font-black uppercase">
                JUGADA {turnRound} DE {maxTurnRounds} • MIN {minute}'
              </span>
            </div>

            <div className="flex items-center gap-3 font-black text-sm sm:text-base">
              <span className="text-sky-400">MI DRAFT</span>
              <span className="px-3 py-0.5 rounded-xl bg-black border border-[#4ade80]/60 text-[#4ade80] font-mono text-base sm:text-lg">
                {myScore} - {broScore}
              </span>
              <span className="text-rose-400 truncate max-w-[100px]">{broName}</span>
            </div>

            <button
              onClick={() => handleLaunchMatchMode('match_auto')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-black text-sky-300 cursor-pointer"
            >
              Cambiar a Modo Auto
            </button>
          </div>

          {/* Main Scrollable Turn Arena */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 max-w-4xl mx-auto w-full">
            {/* Step-by-Step Banner Explaining How Mode B Works */}
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-950/70 via-[#131b30] to-slate-900 border border-fuchsia-400/40 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-200">
                <strong className="text-fuchsia-300 uppercase">¿Cómo funciona este turno?</strong>{' '}
                1️⃣ Elige un futbolista de tu plantilla abajo. 2️⃣ Selecciona la orden táctica (con % de éxito real). 3️⃣ Pulsa{' '}
                <strong className="text-[#4ade80]">Confirmar Jugada</strong> para lanzar el dado D100.
              </div>
              <button
                onClick={() => setIsTacticsDrawerOpen(!isTacticsDrawerOpen)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-600 text-[11px] font-bold text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Ajustar Tácticas DT</span>
              </button>
            </div>

            {/* Optional Quick Tactics Drawer */}
            {isTacticsDrawerOpen && (
              <div className="rounded-2xl bg-[#0e1729] border border-amber-400/40 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-black text-amber-300 uppercase">Mentalidad</span>
                  <select
                    value={myTactics.mentality}
                    onChange={(e) =>
                      setMyTactics((t) => ({
                        ...t,
                        mentality: e.target.value as TeamTacticsConfig['mentality'],
                      }))
                    }
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="defensive">Defensiva (+5% Defensa)</option>
                    <option value="balanced">Equilibrada</option>
                    <option value="attacking">Ofensiva (+3% Ataque)</option>
                    <option value="ultra_attacking">Ultraofensiva (+5% Ataque)</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-300 uppercase">Presión</span>
                  <select
                    value={myTactics.pressingStyle}
                    onChange={(e) =>
                      setMyTactics((t) => ({
                        ...t,
                        pressingStyle: e.target.value as TeamTacticsConfig['pressingStyle'],
                      }))
                    }
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="low_block">Bloque Bajo</option>
                    <option value="balanced">Equilibrada</option>
                    <option value="high_press">Presión Alta</option>
                    <option value="gegenpress">Gegenpressing</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-300 uppercase">Estilo de Pase</span>
                  <select
                    value={myTactics.passingStyle}
                    onChange={(e) =>
                      setMyTactics((t) => ({
                        ...t,
                        passingStyle: e.target.value as TeamTacticsConfig['passingStyle'],
                      }))
                    }
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="short_tiki_taka">Tiki-Taka Corto</option>
                    <option value="mixed">Mixto</option>
                    <option value="direct_counter">Contraataque Directo</option>
                  </select>
                </div>
              </div>
            )}

            {/* Last Duel Resolution Banner (Shows D100 Roll vs Success Chance) */}
            {lastDuelResult && (
              <div
                className={`rounded-2xl p-3.5 border-2 transition-all ${
                  lastDuelResult.isGoal
                    ? 'bg-emerald-950/80 border-[#4ade80] shadow-[0_0_25px_rgba(74,222,128,0.35)]'
                    : lastDuelResult.won
                    ? 'bg-sky-950/70 border-sky-400'
                    : 'bg-rose-950/70 border-rose-500'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Dice5 className="w-4 h-4 text-amber-300" />
                    <span>
                      Dado Virtual D100: Salió <strong>{lastDuelResult.roll}</strong> (Necesitabas ≤{' '}
                      {lastDuelResult.chance}%)
                    </span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      lastDuelResult.won
                        ? 'bg-[#4ade80] text-neutral-950'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {lastDuelResult.isGoal
                      ? '⚽ ¡GOL!'
                      : lastDuelResult.won
                      ? '✅ DUELO GANADO'
                      : '❌ INTERCEPTADO'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white">
                  {lastDuelResult.narrative}
                </p>
              </div>
            )}

            {/* STEP 1: CHOOSE ACTIVE PLAYER FROM YOUR 11 SQUAD */}
            <div className="rounded-2xl bg-[#0b1322] border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#4ade80]">
                  PASO 1 • Elige el Jugador que ejecutará la jugada:
                </span>
                <span className="text-[11px] font-bold text-amber-300">
                  Seleccionado: {activeHandCard?.name} ({activeHandCard?.position})
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1">
                {mySquadList.map((card) => {
                  const isSel = activeHandCard?.id === card.id;
                  return (
                    <div key={card.id} className="shrink-0">
                      <FutCardShield
                        player={card}
                        size="hand"
                        selected={isSel}
                        onClick={() => {
                          sound.playChip();
                          triggerHaptic('light');
                          setSelectedHandCardId(card.id);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: CHOOSE 1 OF THE 5 TACTICAL ACTIONS */}
            <div className="rounded-2xl bg-[#0b1322] border border-slate-800 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  PASO 2 • Elige la Acción Táctica (Porcentaje según estadísticas de {activeHandCard?.shortName}):
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TACTICAL_ACTIONS.map((act) => {
                  const chance = activeHandCard
                    ? calculateActionSuccessChance(
                        activeHandCard,
                        act,
                        broLineup,
                        chemistryData.totalChemistry,
                        myTactics
                      )
                    : 50;
                  const active = selectedActionId === act.id;
                  return (
                    <button
                      key={act.id}
                      onClick={() => {
                        sound.playChip();
                        triggerHaptic('light');
                        setSelectedActionId(act.id);
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer active:scale-95 flex flex-col justify-between ${
                        active
                          ? 'bg-emerald-950/80 border-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.3)]'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white uppercase">
                            {act.name}
                          </span>
                          <span className="text-xs font-mono font-black text-[#4ade80]">
                            {chance}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {act.description}
                        </p>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-white/10 text-[9px] font-bold uppercase text-amber-300">
                        Usa: {act.primaryStat.toUpperCase()} + {act.secondaryStat.toUpperCase()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: CONFIRM TACTICAL PLAY BUTTON */}
            <button
              onClick={handleConfirmTacticalTurn}
              disabled={waitingForBrotherTurn}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#4ade80] via-emerald-400 to-green-500 text-neutral-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_25px_rgba(74,222,128,0.4)] cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {waitingForBrotherTurn
                ? `Esperando la jugada de ${broName}...`
                : `⚡ ENVIAR TÁCTICA: ${activeTacticalAction.name.toUpperCase()} CON ${activeHandCard?.shortName}`}
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          SCREEN 6: MODO A — SIMULACIÓN ESTADÍSTICA AUTO-BATTLER (90 MIN)
      ==================================================================== */}
      {phase === 'match_auto' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#060b14]">
          {/* Scoreboard + Controls */}
          <div className="shrink-0 px-3 py-2 bg-[#0c1526] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#4ade80]/15 border border-[#4ade80]/50 text-[#4ade80] font-mono font-black text-xs">
                MINUTO {minute}'
              </span>
              <button
                onClick={() => setIsSimRunning((r) => !r)}
                className="px-3 py-1 rounded-lg bg-amber-400 text-neutral-950 font-black text-xs cursor-pointer"
              >
                {isSimRunning ? '❚❚ Pausar' : '▶ Reanudar'}
              </button>
              <button
                onClick={() => setSimSpeed((s) => (s === 1 ? 2 : 1))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-black text-white cursor-pointer"
              >
                Velocidad {simSpeed}x
              </button>
            </div>

            <div className="flex items-center gap-3 font-black text-base">
              <span className="text-sky-400">MI DRAFT</span>
              <span className="px-3 py-0.5 rounded-xl bg-black border border-[#4ade80] text-[#4ade80] font-mono text-lg">
                {myScore} - {broScore}
              </span>
              <span className="text-rose-400">{broName}</span>
            </div>

            <button
              onClick={() => {
                setIsSimRunning(false);
                setPhase('match_tactical');
              }}
              className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-300 text-xs font-black cursor-pointer"
            >
              Ir a Modo por Turnos
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-6xl mx-auto w-full">
            {/* Left: Pitch Overview */}
            <div className="lg:col-span-7 relative min-h-[340px] rounded-3xl border-2 border-emerald-500/40 bg-[repeating-linear-gradient(0deg,#114227_0px,#114227_28px,#154d2e_28px,#154d2e_56px)] overflow-hidden">
              {currentSlots.map((slot) => {
                const player = effectiveMyLineup[slot.slotId];
                return (
                  <div
                    key={slot.slotId}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <FutCardShield player={player} size="pitch" badgeText={slot.label} />
                  </div>
                );
              })}
            </div>

            {/* Right: Live Auto-Battler Telemetry & Ticker */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="rounded-2xl bg-[#0c1526] border border-slate-800 p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Estadísticas en Tiempo Real (Auto-Battler)
                </h3>

                {/* Possession Bar */}
                <div>
                  <div className="flex justify-between text-xs font-black mb-1">
                    <span className="text-[#4ade80]">{myPossession}%</span>
                    <span className="text-slate-300 uppercase text-[10px]">Posesión del Balón</span>
                    <span className="text-rose-400">{100 - myPossession}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-rose-500/80 overflow-hidden flex">
                    <div
                      style={{ width: `${myPossession}%` }}
                      className="h-full bg-[#4ade80] transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Shots Bar */}
                <div>
                  <div className="flex justify-between text-xs font-black mb-1">
                    <span className="text-[#4ade80]">{myShots}</span>
                    <span className="text-slate-300 uppercase text-[10px]">Tiros a Puerta</span>
                    <span className="text-rose-400">{broShots}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{
                        width: `${
                          myShots + broShots === 0
                            ? 50
                            : Math.round((myShots / (myShots + broShots)) * 100)
                        }%`,
                      }}
                      className="h-full bg-[#4ade80] transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Chronological Match Ticker */}
              <div className="flex-1 rounded-2xl bg-[#0c1526] border border-slate-800 p-3 flex flex-col min-h-[220px]">
                <div className="text-xs font-black uppercase tracking-wider text-[#4ade80] mb-2">
                  Cronología en Vivo del Partido
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[260px]">
                  {matchEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-2.5 rounded-xl border text-xs ${
                        ev.highlight
                          ? 'bg-emerald-950/80 border-[#4ade80] text-white font-black'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      {ev.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SCREEN 7: EXPLORADOR COMPLETO BASE DE DATOS EA SPORTS FC 27
      ==================================================================== */}
      {phase === 'fc27_catalog' && (
        <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden bg-[#0a101d]">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar entre los 188 jugadores reales (ej. Mbappé, Pedri, Real Madrid)..."
              className="flex-1 min-w-[180px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-200"
            >
              <option value="TODAS">Todas las Ligas ({ALL_FC27_PLAYERS.length})</option>
              <option value="LaLiga EA Sports">LaLiga EA Sports</option>
              <option value="Premier League">Premier League</option>
              <option value="Bundesliga">Bundesliga</option>
              <option value="Serie A">Serie A Enilive</option>
              <option value="Ligue 1">Ligue 1 McDonald's</option>
              <option value="MLS / Resto del Mundo">MLS / Resto del Mundo & Icons</option>
            </select>
            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value as PlayerPosition | 'TODAS')}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-200"
            >
              <option value="TODAS">Todas las Posiciones</option>
              <option value="DC">DC</option>
              <option value="EI">EI</option>
              <option value="ED">ED</option>
              <option value="MCO">MCO</option>
              <option value="MC">MC</option>
              <option value="MCD">MCD</option>
              <option value="DFC">DFC</option>
              <option value="LI">LI</option>
              <option value="LD">LD</option>
              <option value="PO">PO</option>
            </select>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as CardTier | 'TODAS')}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-200"
            >
              <option value="TODAS">Todas las Rarezas</option>
              <option value="toty">TOTY</option>
              <option value="icon">Iconos</option>
              <option value="gold">Oro</option>
              <option value="silver">Plata</option>
              <option value="bronze">Bronce</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 gap-2.5 pb-6">
            {filteredCatalogPlayers.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center p-2 rounded-2xl bg-slate-900/70 border border-slate-800"
              >
                <FutCardShield player={player} size="hand" />
                <div className="mt-1 text-[10px] font-black text-white truncate max-w-[95px]">
                  {player.name}
                </div>
                <div className="text-[9px] text-amber-300 truncate max-w-[95px]">
                  {player.club}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE CHAT EN VIVO CON TU HERMANO
      ==================================================================== */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1424] border border-slate-700 p-4 flex flex-col h-[70vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-black uppercase text-white">
                Chat Táctico en Vivo ({mpStatus === 'connected' ? broName : 'Sala Local'})
              </span>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-2xl text-xs max-w-[85%] ${
                    m.sender === 'me'
                      ? 'ml-auto bg-emerald-600 text-white'
                      : m.sender === 'bro'
                      ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="text-[9px] font-black uppercase opacity-75 mb-0.5">
                    {m.senderName} • {m.time}
                  </div>
                  <div>{m.text}</div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Escribe un mensaje a tu hermano..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                onClick={handleSendChat}
                className="px-3.5 py-2 rounded-xl bg-[#4ade80] text-neutral-950 font-black text-xs cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
