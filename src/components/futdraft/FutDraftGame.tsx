import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FORMATIONS,
  FC27_PLAYERS_DB,
  TACTICAL_ACTIONS,
  getInitialPrototypeLineup,
  getBrotherDefaultLineup,
  calculateTeamChemistry,
  calculateActionSuccessChance,
  resolveTacticalTurnDuel,
  simulateStatisticalMinuteTick,
  type FutPlayerCard,
  type FormationType,
  type TacticalAction,
  type MatchEventLog,
  type TeamTacticsConfig,
  type PlayerPosition,
  type CardTier,
} from '../../utils/futdraftLogic';
import { FutCardShield } from './FutCardShield';
import {
  FC27_FULL_PLAYERS_DB,
  FC27_CLUBS,
} from '../../utils/fc27Database';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { multiplayer } from '../../utils/multiplayer';
import type { UserProfile } from '../../types/casino';

export interface FutDraftGameProps {
  profile?: UserProfile;
  userProfile?: UserProfile;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
  onBackToLobby?: () => void;
}

type MainTab = 'alineacion' | 'tacticas' | 'cartas' | 'historial';

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
 * Custom SVG Jersey Icon (Blue for MY DRAFT, Red for BROTHER'S DRAFT)
 */
const JerseySVG: React.FC<{ primary: string; secondary: string; number?: string }> = ({
  primary,
  secondary,
  number = '10',
}) => (
  <svg viewBox="0 0 44 42" className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] shrink-0">
    <path
      d="M12,4 L17,4 C18.5,7.5 25.5,7.5 27,4 L32,4 L41,12 L36,20 L31,16 L31,38 L13,38 L13,16 L8,20 L3,12 Z"
      fill={primary}
      stroke={secondary}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M16,4 L22,10 L28,4" fill="none" stroke={secondary} strokeWidth="1.5" />
    <text
      x="22"
      y="27"
      textAnchor="middle"
      fill={secondary}
      fontSize="11"
      fontWeight="900"
      fontFamily="monospace"
    >
      {number}
    </text>
  </svg>
);

/**
 * Custom Shield Crest for Scoreboard Header
 */
const CrestBadgeSVG: React.FC<{ primary: string; accent: string; label: string }> = ({
  primary,
  accent,
  label,
}) => (
  <svg viewBox="0 0 36 40" className="w-6 h-7 sm:w-7 sm:h-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] shrink-0">
    <path
      d="M4,5 L18,2 L32,5 L32,21 C32,30 18,37 18,37 C18,37 4,30 4,21 Z"
      fill={primary}
      stroke={accent}
      strokeWidth="2.2"
    />
    <path
      d="M18,4 L18,35 C18,35 30,28.5 30,20.5 L30,6.5 Z"
      fill="rgba(0,0,0,0.22)"
    />
    <text
      x="18"
      y="23"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="10"
      fontWeight="900"
      letterSpacing="-0.5"
    >
      {label}
    </text>
  </svg>
);

/**
 * Tactical Action SVG Icons matching image_4.png
 */
const TacticalIconSVG: React.FC<{ iconName: TacticalAction['iconName']; active: boolean }> = ({
  iconName,
  active,
}) => {
  const color = active ? '#4ade80' : '#facc15';
  switch (iconName) {
    case 'press':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
          <circle cx="16" cy="16" r="11" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
          <path d="M16,4 L16,11 M16,28 L16,21 M4,16 L11,16 M28,16 L21,16" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="16" cy="16" r="3.5" fill={color} />
        </svg>
      );
    case 'long_pass':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
          <path d="M5,24 Q15,6 26,11" fill="none" stroke={color} strokeWidth="2.4" strokeDasharray="3 2" />
          <polygon points="28,12 22,7 23,15" fill={color} />
          <circle cx="6" cy="24" r="3" fill="#ffffff" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case 'shoot':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
          <circle cx="18" cy="14" r="7" fill="#ffffff" stroke={color} strokeWidth="2" />
          <path d="M4,27 L13,19 M4,22 L10,17 M9,28 L15,22" stroke="#f97316" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="18,10 20,13 18,16 15,14" fill="#0f172a" />
        </svg>
      );
    case 'hard_tackle':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
          <path d="M6,22 L22,10 L26,15 L12,26 Z" fill={color} />
          <path d="M15,7 L19,13 M22,5 L20,11 M27,9 L22,13" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'counter':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
          <polygon points="18,3 7,17 16,17 13,29 25,14 16,14" fill={color} />
        </svg>
      );
  }
};

export const FutDraftGame: React.FC<FutDraftGameProps> = ({
  profile,
  userProfile,
  onUpdateProfile,
  onBackToLobby,
}) => {
  const activeProfile = profile || userProfile;

  // Navigation & UI Tabs
  const [activeTab, setActiveTab] = useState<MainTab>('alineacion');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [slotModalTarget, setSlotModalTarget] = useState<string | null>(null);

  // Team Lineups & Formations
  const [myFormation, setMyFormation] = useState<FormationType>('4-3-3');
  const [broFormation] = useState<FormationType>('4-4-2');
  const [myLineup, setMyLineup] = useState<Record<string, FutPlayerCard>>(() =>
    getInitialPrototypeLineup()
  );
  const [broLineup] = useState<Record<string, FutPlayerCard>>(() =>
    getBrotherDefaultLineup()
  );

  // Tactics Configuration
  const [myTactics, setMyTactics] = useState<TeamTacticsConfig>({
    mentality: 'attacking',
    pressingStyle: 'high_press',
    passingStyle: 'direct_counter',
    tempo: 78,
    width: 68,
  });

  // Match Live Clock & Scoreboard (Initialized to Prototype Screenshot: Minuto 65 | 2 - 1 | 54%/46% | 8/5 shots)
  const [matchMinute, setMatchMinute] = useState<number>(65);
  const [isClockPlaying, setIsClockPlaying] = useState<boolean>(false);
  const [clockSpeed, setClockSpeed] = useState<1 | 2>(1);
  const [myScore, setMyScore] = useState<number>(2);
  const [broScore, setBroScore] = useState<number>(1);
  const [myPossession, setMyPossession] = useState<number>(54);
  const [myShots, setMyShots] = useState<number>(8);
  const [broShots, setBroShots] = useState<number>(5);
  const [myXG, setMyXG] = useState<number>(2.34);
  const [broXG, setBroXG] = useState<number>(1.18);

  // Match Event Ticker & History
  const [events, setEvents] = useState<MatchEventLog[]>([
    {
      id: 'init_58',
      minute: 58,
      type: 'goal',
      team: 'my',
      text: 'Min 58: ¡GOL de Haaland tras pase de De Bruyne!',
      highlight: true,
      duelDetails: {
        attackerName: 'E. HAALAND',
        defenderName: 'A. RÜDIGER',
        actionName: 'Disparar',
        successChance: 86,
        roll: 24,
        won: true,
      },
    },
    {
      id: 'init_41',
      minute: 41,
      type: 'goal',
      team: 'bro',
      text: 'Min 41: ¡GOL RIVAL! K. MBAPPÉ define al palo largo en transición rápida.',
      highlight: true,
    },
    {
      id: 'init_19',
      minute: 19,
      type: 'goal',
      team: 'my',
      text: 'Min 19: ¡GOLAZO de M. SALAH con rosca al ángulo tras asistencia de L. MESSI!',
      highlight: true,
    },
  ]);

  // Hand Cards (Bottom Right Dock matching Screenshot: M. SALAH 91, E. HAALAND 91, L. MESSI 89)
  const [handCards, setHandCards] = useState<FutPlayerCard[]>(() => {
    const salah = FC27_PLAYERS_DB.find((p) => p.id === 'salah_91') || FC27_PLAYERS_DB[2];
    const haaland = FC27_PLAYERS_DB.find((p) => p.id === 'haaland_91') || FC27_PLAYERS_DB[0];
    const messi = FC27_PLAYERS_DB.find((p) => p.id === 'messi_89') || FC27_PLAYERS_DB[3];
    const debruyne = FC27_PLAYERS_DB.find((p) => p.id === 'debruyne_90') || FC27_PLAYERS_DB[4];
    const mbappe = FC27_PLAYERS_DB.find((p) => p.id === 'mbappe_92') || FC27_PLAYERS_DB[1];
    const vinicius = FC27_PLAYERS_DB.find((p) => p.id === 'vinicius_91') || FC27_PLAYERS_DB[6];
    return [salah, haaland, messi, debruyne, mbappe, vinicius];
  });
  const [handOffset, setHandOffset] = useState<number>(0);
  const [selectedCardId, setSelectedCardId] = useState<string>('haaland_91');
  const [selectedPitchSlot, setSelectedPitchSlot] = useState<string>('atk_2');
  const [selectedActionId, setSelectedActionId] = useState<string>('shoot');

  // Turn Duel Resolution Animation State
  const [duelBanner, setDuelBanner] = useState<{
    roll: number;
    chance: number;
    won: boolean;
    isGoal: boolean;
    text: string;
  } | null>(null);

  // Database Filters (Tab CARTAS)
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<string>('TODAS');
  const [posFilter, setPosFilter] = useState<PlayerPosition | 'TODAS'>('TODAS');
  const [tierFilter, setTierFilter] = useState<CardTier | 'TODAS'>('TODAS');

  // Voice / Text Tactical Chat State
  const [isMicActive, setIsMicActive] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'c1',
      sender: 'coach',
      senderName: 'AI Coach FC27',
      text: 'De Bruyne y Haaland tienen enlace fuerte (Manchester City). Usa Pase Largo o Disparar para aprovechar su 88% de éxito.',
      time: 'Min 58',
    },
    {
      id: 'c2',
      sender: 'bro',
      senderName: multiplayer.getRemotePlayer()?.name || "Brother's Draft",
      text: '¡Buen gol con Haaland! Voy a cerrar líneas con Rüdiger y Saliba en 4-4-2.',
      time: 'Min 60',
    },
  ]);

  const duelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate Team Chemistry & Active Pitch Links
  const chemistryData = useMemo(
    () => calculateTeamChemistry(myLineup, myFormation),
    [myLineup, myFormation]
  );

  // Currently selected card for the tactical duel
  const activeHandCard = useMemo(() => {
    const inHand = handCards.find((c) => c.id === selectedCardId);
    if (inHand) return inHand;
    const inPitch = myLineup[selectedPitchSlot];
    return inPitch || handCards[0] || FC27_PLAYERS_DB[0];
  }, [handCards, selectedCardId, myLineup, selectedPitchSlot]);

  const activeAction = useMemo(
    () => TACTICAL_ACTIONS.find((a) => a.id === selectedActionId) || TACTICAL_ACTIONS[2],
    [selectedActionId]
  );

  // Calculate live success probabilities for all 5 tactical actions
  const actionChances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const act of TACTICAL_ACTIONS) {
      map[act.id] = calculateActionSuccessChance(
        activeHandCard,
        act,
        broLineup,
        chemistryData.totalChemistry,
        myTactics
      );
    }
    return map;
  }, [activeHandCard, broLineup, chemistryData.totalChemistry, myTactics]);

  // Listen to P2P Multiplayer events from Brother
  useEffect(() => {
    const unsub = multiplayer.onMessage((msg) => {
      if (msg.type === 'CHAT' && msg.payload?.text) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `p2p_${Date.now()}`,
            sender: 'bro',
            senderName: msg.senderName || "Brother's Draft",
            text: msg.payload.text,
            time: `Min ${matchMinute}`,
          },
        ]);
        sound.playChip(25);
      } else if (msg.type === 'GAME_ACTION' && msg.payload?.futdraftEvent) {
        const evt = msg.payload.futdraftEvent as MatchEventLog;
        setEvents((prev) => [evt, ...prev]);
        if (evt.type === 'goal') {
          setBroScore((s) => s + 1);
          sound.playLose();
        }
      }
    });
    return () => unsub();
  }, [matchMinute]);

  // Live Auto-Battler Statistical Clock (Modalidad A)
  useEffect(() => {
    if (!isClockPlaying) return;
    const intervalMs = clockSpeed === 2 ? 950 : 1800;
    const timer = setInterval(() => {
      setMatchMinute((prevMin) => {
        if (prevMin >= 90) {
          setIsClockPlaying(false);
          return 90;
        }
        const nextMin = prevMin + 1;
        const tick = simulateStatisticalMinuteTick(nextMin, myLineup, broLineup, myTactics);

        setMyPossession((pos) =>
          Math.max(32, Math.min(72, Math.round(pos + tick.possessionDelta)))
        );

        if (tick.myShotAdded) {
          setMyShots((s) => s + 1);
          setMyXG((x) => Number((x + 0.14).toFixed(2)));
        }
        if (tick.broShotAdded) {
          setBroShots((s) => s + 1);
          setBroXG((x) => Number((x + 0.12).toFixed(2)));
        }
        if (tick.myGoalAdded) {
          setMyScore((s) => s + 1);
          sound.playWin();
          triggerHaptic('success');
        }
        if (tick.broGoalAdded) {
          setBroScore((s) => s + 1);
          sound.playLose();
          triggerHaptic('warning');
        }
        if (tick.event) {
          setEvents((prev) => [tick.event!, ...prev]);
        }

        return nextMin;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isClockPlaying, clockSpeed, myLineup, broLineup, myTactics]);

  // Cleanup duel banner timeout
  useEffect(() => {
    return () => {
      if (duelTimeoutRef.current) clearTimeout(duelTimeoutRef.current);
    };
  }, []);

  // Formation Change Handler
  const handleSelectFormation = (fmt: FormationType) => {
    sound.playCardFlip();
    triggerHaptic('light');
    const newSlots = FORMATIONS[fmt];
    const currentPlayers = Object.values(myLineup);
    const updatedLineup: Record<string, FutPlayerCard> = {};

    newSlots.forEach((slot, idx) => {
      updatedLineup[slot.slotId] =
        myLineup[slot.slotId] || currentPlayers[idx % currentPlayers.length] || FC27_PLAYERS_DB[idx % FC27_PLAYERS_DB.length];
    });

    setMyFormation(fmt);
    setMyLineup(updatedLineup);
  };

  // Auto-Build Optimal FC 27 Draft 11
  const handleAutoDraft11 = () => {
    sound.playWin();
    triggerHaptic('success');
    const slots = FORMATIONS[myFormation];
    const usedIds = new Set<string>();
    const nextLineup: Record<string, FutPlayerCard> = {};

    for (const slot of slots) {
      const candidates = ALL_FC27_PLAYERS.filter(
        (p) => !usedIds.has(p.id) && (slot.acceptedPositions.includes(p.position) || p.zone === slot.zone)
      ).sort((a, b) => b.rating - a.rating);

      const chosen =
        candidates[0] ||
        ALL_FC27_PLAYERS.find((p) => !usedIds.has(p.id)) ||
        FC27_PLAYERS_DB[0];

      usedIds.add(chosen.id);
      nextLineup[slot.slotId] = { ...chosen, position: slot.label as PlayerPosition };
    }

    setMyLineup(nextLineup);
  };

  // Swap player into a pitch slot
  const handleAssignPlayerToSlot = (slotId: string, player: FutPlayerCard) => {
    sound.playCardDeal();
    triggerHaptic('medium');
    const slotObj = FORMATIONS[myFormation].find((s) => s.slotId === slotId);
    setMyLineup((prev) => ({
      ...prev,
      [slotId]: {
        ...player,
        position: (slotObj?.label as PlayerPosition) || player.position,
      },
    }));
    // Also ensure the player is available in the hand cards
    setHandCards((prev) => {
      if (prev.some((p) => p.id === player.id)) return prev;
      return [player, ...prev.slice(0, 5)];
    });
    setSelectedCardId(player.id);
    setSlotModalTarget(null);
  };

  // Execute Turn-Based Tactical Action ("ENVIAR TÁCTICA / CONFIRMAR JUGADA")
  const handleConfirmTacticalPlay = () => {
    sound.playChip(100);
    triggerHaptic('heavy');

    const broCards = Object.values(broLineup);
    const randomOppCard = broCards[Math.floor(Math.random() * broCards.length)] || FC27_PLAYERS_DB[5];
    const randomOppAction =
      TACTICAL_ACTIONS[Math.floor(Math.random() * TACTICAL_ACTIONS.length)] || TACTICAL_ACTIONS[3];

    const nextMinute = matchMinute < 90 ? matchMinute + 1 : 90;
    setMatchMinute(nextMinute);

    const result = resolveTacticalTurnDuel(
      activeHandCard,
      activeAction,
      randomOppCard,
      randomOppAction,
      chemistryData.totalChemistry,
      myTactics,
      nextMinute
    );

    if (result.isShot) {
      setMyShots((s) => s + 1);
      setMyXG((x) => Number((x + (result.isGoal ? 0.42 : 0.18)).toFixed(2)));
    }
    if (result.won) {
      setMyPossession((p) => Math.min(70, p + 1));
    } else {
      setMyPossession((p) => Math.max(35, p - 1));
    }

    if (result.isGoal && result.won) {
      setMyScore((s) => s + 1);
      sound.playWin();
      triggerHaptic('success');
      if (activeProfile && onUpdateProfile) {
        onUpdateProfile({
          bankroll: activeProfile.bankroll + 50,
          weeklyScore: activeProfile.weeklyScore + 120,
        });
      }
    } else if (result.isGoal && !result.won) {
      setBroScore((s) => s + 1);
      sound.playLose();
      triggerHaptic('warning');
    } else if (result.won) {
      sound.playCardDeal();
    } else {
      sound.playCardFlip();
    }

    setEvents((prev) => [result.eventLog, ...prev]);

    setDuelBanner({
      roll: result.diceRoll,
      chance: result.successChance,
      won: result.won,
      isGoal: result.isGoal,
      text: result.eventLog.text,
    });

    if (duelTimeoutRef.current) clearTimeout(duelTimeoutRef.current);
    duelTimeoutRef.current = setTimeout(() => {
      setDuelBanner(null);
    }, 4500);

    // Sync via P2P Multiplayer if connected
    if (multiplayer.getStatus() === 'connected') {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: activeProfile?.id || 'my_draft',
        senderName: activeProfile?.name || 'MY DRAFT',
        payload: {
          futdraftEvent: result.eventLog,
        },
        timestamp: Date.now(),
      });
    }
  };

  // Send Tactical Chat Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    sound.playChip(25);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `me_${Date.now()}`,
        sender: 'me',
        senderName: activeProfile?.name || 'MY DRAFT',
        text,
        time: `Min ${matchMinute}`,
      },
    ]);

    if (multiplayer.getStatus() === 'connected') {
      multiplayer.send({
        type: 'CHAT',
        senderId: activeProfile?.id || 'me',
        senderName: activeProfile?.name || 'MY DRAFT',
        payload: { text },
        timestamp: Date.now(),
      });
    } else {
      // AI Coach Tactical Response
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `coach_${Date.now()}`,
            sender: 'coach',
            senderName: 'AI Coach FC27',
            text: `Recibido. Con ${activeHandCard.shortName} (${activeHandCard.rating}) recomiendo ejecutar "${activeAction.name}" (${actionChances[activeAction.id]}% de probabilidad de éxito).`,
            time: `Min ${matchMinute}`,
          },
        ]);
      }, 650);
    }
  };

  // Filtered FC 27 Players for Tab CARTAS
  const filteredDatabase = useMemo(() => {
    return ALL_FC27_PLAYERS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.club.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLeague =
        leagueFilter === 'TODAS' || getPlayerLeague(p.club) === leagueFilter;
      const matchesPos = posFilter === 'TODAS' || p.position === posFilter;
      const matchesTier = tierFilter === 'TODAS' || p.tier === tierFilter;
      return matchesSearch && matchesLeague && matchesPos && matchesTier;
    });
  }, [searchQuery, leagueFilter, posFilter, tierFilter]);

  const currentSlots = FORMATIONS[myFormation];
  const visibleHandCards = handCards.slice(handOffset, handOffset + 3);
  const latestHighlightEvent = events[0] || {
    minute: 58,
    text: 'Min 58: ¡GOL de Haaland tras pase de De Bruyne!',
  };

  const topRowActions = TACTICAL_ACTIONS.slice(0, 3); // Presión Alta, Pase Largo, Disparar
  const bottomRowActions = TACTICAL_ACTIONS.slice(3, 5); // Entrada Fuerte, Contraataque

  const peerName = multiplayer.getRemotePlayer()?.name
    ? `${multiplayer.getRemotePlayer()!.name.toUpperCase()}'S DRAFT`
    : "BROTHER'S DRAFT";

  return (
    <div className="relative w-full h-screen h-[100dvh] bg-[#070b14] text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Subtle Stadium Floodlight Ambient Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(30,64,175,0.22)_0%,rgba(6,10,19,0.96)_65%,#050811_100%)] z-0" />

      {/* =====================================================================
          1. TOP NAVIGATION & SCOREBOARD HUD (Matches image_4.png)
      ===================================================================== */}
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-2 px-2.5 sm:px-4 py-2 bg-[#0c1322]/95 border-b border-slate-800/90 shadow-[0_4px_20px_rgba(0,0,0,0.65)]">
        {/* Left Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
          {onBackToLobby && (
            <button
              onClick={() => {
                sound.playChip(25);
                triggerHaptic('light');
                onBackToLobby();
              }}
              className="px-2.5 py-1.5 rounded-md bg-slate-900/90 hover:bg-red-950/70 border border-slate-700/80 hover:border-red-500/60 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-300 hover:text-red-200 transition-all flex items-center gap-1 mr-1 cursor-pointer"
              title="Volver al Lobby"
            >
              <span>←</span>
              <span className="hidden sm:inline">SALIR</span>
            </button>
          )}

          {(
            [
              { id: 'alineacion', label: 'ALINEACIÓN' },
              { id: 'tacticas', label: 'TÁCTICAS' },
              { id: 'cartas', label: 'CARTAS' },
              { id: 'historial', label: 'HISTORIAL' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playCardFlip();
                  triggerHaptic('light');
                  setActiveTab(tab.id);
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#122b23] text-white border-2 border-[#4ade80] shadow-[0_0_14px_rgba(74,222,128,0.45)]'
                    : 'bg-[#131c2e]/90 text-slate-300 border border-slate-700/80 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <button
            onClick={handleAutoDraft11}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ml-1"
            title="Autocompletar mejor Draft 11 de EA SPORTS FC 27"
          >
            <span>⚡</span>
            <span>DRAFT 11 FC27</span>
          </button>
        </div>

        {/* Center/Right Voice & Text Chat Button */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <button
            onClick={() => {
              sound.playChip(25);
              setIsChatOpen((v) => !v);
            }}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-md border text-[10px] sm:text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              isChatOpen || isMicActive
                ? 'bg-emerald-950/90 border-[#4ade80] text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.35)]'
                : 'bg-[#151f32] border-slate-600/80 text-slate-200 hover:border-slate-400'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-amber-400">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
            <span className="hidden sm:inline">CHAT DE VOZ/TEXTO</span>
            <span className="sm:hidden">CHAT</span>
          </button>

          {/* Match Scoreboard Pill (MINUTO 65 | MY DRAFT 2 - 1 BRO'S DRAFT) */}
          <div className="flex items-center gap-2 sm:gap-3 bg-[#101829] border border-slate-700/90 rounded-lg px-2.5 sm:px-3.5 py-1 shadow-inner">
            <CrestBadgeSVG primary="#1d4ed8" accent="#60a5fa" label="MY" />

            <div className="flex flex-col items-center leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-400">
                  MINUTO {matchMinute}
                </span>
                <button
                  onClick={() => setIsClockPlaying((p) => !p)}
                  className="px-1.5 py-0.2 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-emerald-400 border border-slate-600 cursor-pointer"
                  title={isClockPlaying ? 'Pausar Simulación' : 'Reanudar Simulación'}
                >
                  {isClockPlaying ? '❚❚' : '▶'}
                </button>
                <button
                  onClick={() => setClockSpeed((s) => (s === 1 ? 2 : 1))}
                  className="hidden sm:inline-block px-1 py-0.2 rounded bg-slate-800 hover:bg-slate-700 text-[8px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                  title="Velocidad de reloj"
                >
                  {clockSpeed}x
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-black tracking-tight text-white">
                <span className="text-sky-100">MY DRAFT</span>
                <span className="text-amber-300 text-sm sm:text-lg font-black px-1">
                  {myScore} - {broScore}
                </span>
                <span className="text-rose-100">BRO&apos;S DRAFT</span>
              </div>
            </div>

            <CrestBadgeSVG primary="#dc2626" accent="#f87171" label="BRO" />
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. MAIN SPLIT WORKSPACE (LEFT: PITCH / TACTICS / DB | RIGHT: SIM & HAND)
      ===================================================================== */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 p-2 sm:p-3 overflow-y-auto lg:overflow-hidden min-h-0">
        {/* -------------------------------------------------------------------
            LEFT AREA (7 Columns on Desktop): Dynamic by Active Tab
        ------------------------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col bg-[#0d1526]/95 border border-slate-800/90 rounded-xl overflow-hidden shadow-2xl min-h-[450px] lg:min-h-0">
          {/* Sub-Header Bar: MY DRAFT 4-3-3 (Blue Jersey) vs BROTHER'S DRAFT 4-4-2 (Red Jersey) */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#111b30] border-b border-slate-800">
            {/* Left Team Info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                    MY DRAFT
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-black text-emerald-300">
                    QUÍM {chemistryData.totalChemistry}/33
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'] as FormationType[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleSelectFormation(fmt)}
                      className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold transition-all cursor-pointer ${
                        myFormation === fmt
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-800/90 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              <JerseySVG primary="#1d4ed8" secondary="#93c5fd" number="9" />
            </div>

            {/* Center VS Divider */}
            <div className="hidden sm:flex flex-col items-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <span>EA SPORTS FC 27</span>
              <span className="text-emerald-400 font-black">MOTOR HÍBRIDO</span>
            </div>

            {/* Right Opponent Team Info */}
            <div className="flex items-center gap-2 sm:gap-3 text-right">
              <JerseySVG primary="#dc2626" secondary="#fca5a5" number="7" />
              <div className="flex flex-col items-end">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  {peerName}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-300">{broFormation}</span>
              </div>
            </div>
          </div>

          {/* =================================================================
              TAB 1: ALINEACIÓN (3D Perspective Pitch with Chemistry & Arrows)
          ================================================================= */}
          {activeTab === 'alineacion' && (
            <div className="relative flex-1 w-full h-full flex items-center justify-center p-2 sm:p-3 overflow-hidden bg-gradient-to-b from-[#08121e] via-[#0c211c] to-[#071510]">
              {/* Stadium Crowd & Upper Lights */}
              <div className="absolute inset-x-0 top-0 h-14 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.18)_0%,transparent_75%)] pointer-events-none" />

              {/* Perspective Pitch Container */}
              <div className="relative w-full h-full max-w-[680px] min-h-[390px] rounded-xl overflow-hidden border border-emerald-500/30 shadow-[inset_0_0_50px_rgba(0,0,0,0.75)]">
                {/* SVG Pitch Turf, Lines, Chemistry Links & Tactical Arrows */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full"
                >
                  <defs>
                    {/* Striped Grass Pattern */}
                    <pattern id="futTurfStripes" width="100" height="12.5" patternUnits="userSpaceOnUse">
                      <rect width="100" height="6.25" fill="#155e37" />
                      <rect y="6.25" width="100" height="6.25" fill="#114b2b" />
                    </pattern>

                    {/* Tactical Yellow Arrowhead Marker */}
                    <marker
                      id="tacticalArrowHead"
                      markerWidth="5"
                      markerHeight="5"
                      refX="3.6"
                      refY="2.5"
                      orient="auto"
                    >
                      <polygon points="0,0 5,2.5 0,5" fill="#facc15" />
                    </marker>

                    {/* Active Attack Neon Green Arrowhead */}
                    <marker
                      id="activeAttackArrow"
                      markerWidth="5"
                      markerHeight="5"
                      refX="3.6"
                      refY="2.5"
                      orient="auto"
                    >
                      <polygon points="0,0 5,2.5 0,5" fill="#4ade80" />
                    </marker>
                  </defs>

                  {/* Base Turf Background */}
                  <rect width="100" height="100" fill="url(#futTurfStripes)" />

                  {/* Perspective Pitch Boundary Trapezoid */}
                  <polygon
                    points="12,6 88,6 97,95 3,95"
                    fill="none"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="0.6"
                  />

                  {/* Top Penalty Box */}
                  <polygon
                    points="29,6 71,6 73,21 27,21"
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="0.5"
                  />
                  <polygon
                    points="38,6 62,6 63,12 37,12"
                    fill="none"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="0.45"
                  />

                  {/* Halfway Line & Center Circle */}
                  <line
                    x1="7.5"
                    y1="50"
                    x2="92.5"
                    y2="50"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="0.55"
                  />
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="13"
                    ry="7.5"
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="0.55"
                  />
                  <circle cx="50" cy="50" r="0.9" fill="rgba(255,255,255,0.75)" />

                  {/* Bottom Penalty Box */}
                  <polygon
                    points="24,78 76,78 80,95 20,95"
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="0.5"
                  />
                  <polygon
                    points="35,87 65,87 67,95 33,95"
                    fill="none"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="0.45"
                  />

                  {/* Team Chemistry Connection Lines (Neon Green & Gold) */}
                  {chemistryData.activeLinks.map((link) => {
                    const sFrom = currentSlots.find((s) => s.slotId === link.from);
                    const sTo = currentSlots.find((s) => s.slotId === link.to);
                    if (!sFrom || !sTo) return null;
                    const strokeColor =
                      link.strength === 'strong'
                        ? '#4ade80'
                        : link.strength === 'normal'
                        ? '#facc15'
                        : '#94a3b8';
                    return (
                      <line
                        key={`${link.from}-${link.to}`}
                        x1={sFrom.x}
                        y1={sFrom.y}
                        x2={sTo.x}
                        y2={sTo.y}
                        stroke={strokeColor}
                        strokeWidth={link.strength === 'strong' ? '0.85' : '0.6'}
                        strokeOpacity="0.8"
                      />
                    );
                  })}

                  {/* Tactical Movement & Passing Arrows (Matching image_4.png) */}
                  <line
                    x1="21"
                    y1="24"
                    x2="21"
                    y2="12"
                    stroke="#facc15"
                    strokeWidth="1.05"
                    markerEnd="url(#tacticalArrowHead)"
                  />
                  <line
                    x1="43"
                    y1="45"
                    x2="48"
                    y2="27"
                    stroke="#facc15"
                    strokeWidth="1.05"
                    markerEnd="url(#tacticalArrowHead)"
                  />
                  <line
                    x1="33"
                    y1="68"
                    x2="38"
                    y2="56"
                    stroke="#facc15"
                    strokeWidth="1.05"
                    markerEnd="url(#tacticalArrowHead)"
                  />
                  <line
                    x1="43.5"
                    y1="82"
                    x2="43.5"
                    y2="66"
                    stroke="#4ade80"
                    strokeWidth="1.1"
                    strokeDasharray="2 1"
                    markerEnd="url(#activeAttackArrow)"
                  />
                </svg>

                {/* Positioned UT Shield Cards on the Pitch */}
                {currentSlots.map((slot) => {
                  const player = myLineup[slot.slotId] || FC27_PLAYERS_DB[0];
                  const isSelected =
                    selectedPitchSlot === slot.slotId || selectedCardId === player.id;
                  return (
                    <div
                      key={slot.slotId}
                      style={{
                        left: `${slot.x}%`,
                        top: `${slot.y}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                    >
                      <FutCardShield
                        player={player}
                        size="pitch"
                        badgeText={slot.label}
                        selected={isSelected}
                        onClick={() => {
                          sound.playCardFlip();
                          triggerHaptic('light');
                          setSelectedPitchSlot(slot.slotId);
                          setSelectedCardId(player.id);
                          // Ensure clicked pitch player is in hand or selectable
                          setHandCards((prev) => {
                            if (prev.some((c) => c.id === player.id)) return prev;
                            return [player, ...prev.slice(0, 5)];
                          });
                        }}
                      />
                      {/* Mini Swap Button on Hover/Selection */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playChip(25);
                          setSlotModalTarget(slot.slotId);
                        }}
                        className="absolute -top-1.5 -right-1.5 z-40 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-900/95 hover:bg-emerald-500 text-white hover:text-neutral-950 border border-slate-500 text-[9px] font-black flex items-center justify-center shadow-md cursor-pointer transition-colors"
                        title="Cambiar jugador de esta posición"
                      >
                        ⇄
                      </button>
                    </div>
                  );
                })}

                {/* Live Duel Roll Overlay Banner when a Tactical Action is Executed */}
                {duelBanner && (
                  <div className="absolute inset-x-3 bottom-3 z-40 bg-slate-950/95 border-2 border-[#4ade80] rounded-xl px-4 py-2.5 shadow-[0_0_25px_rgba(0,0,0,0.9)] flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center font-black border ${
                          duelBanner.won
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-rose-500/20 border-rose-400 text-rose-300'
                        }`}
                      >
                        <span className="text-[8px] uppercase">DADO</span>
                        <span className="text-sm">{duelBanner.roll}</span>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                          {duelBanner.isGoal
                            ? '⚽ ¡GOL EN DUELO TÁCTICO!'
                            : duelBanner.won
                            ? `✔ JUGADA EXITOSA (${duelBanner.chance}% PROB)`
                            : `✖ INTERCEPTADO POR EL RIVAL (${duelBanner.chance}% PROB)`}
                        </div>
                        <p className="text-xs font-bold text-white leading-snug">
                          {duelBanner.text}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDuelBanner(null)}
                      className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: TÁCTICAS (Interactive Strategy & Synergy Board)
          ================================================================= */}
          {activeTab === 'tacticas' && (
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#0a101d]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#4ade80]">
                    PIZARRA TÁCTICA & QUÍMICA EA SPORTS FC 27
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tus ajustes modifican en tiempo real el % de éxito de los duelos y la posesión del Auto-Battler.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-xs font-black text-emerald-300">
                  Química Total: {chemistryData.totalChemistry} / {chemistryData.maxChemistry} ⚡
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Mentality */}
                <div className="bg-[#111a2e] border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-black uppercase text-amber-400">
                    1. Mentalidad del Equipo
                  </div>
                  {(
                    [
                      { id: 'defensive', label: 'Defensiva (+5% DEF)' },
                      { id: 'balanced', label: 'Equilibrada (Balance)' },
                      { id: 'attacking', label: 'Ofensiva (+3% ATQ)' },
                      { id: 'ultra_attacking', label: 'Ultraofensiva (+5% ATQ)' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        sound.playChip(25);
                        setMyTactics((t) => ({ ...t, mentality: opt.id }));
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        myTactics.mentality === opt.id
                          ? 'bg-emerald-950/80 border-[#4ade80] text-white'
                          : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Pressing Style */}
                <div className="bg-[#111a2e] border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-black uppercase text-amber-400">
                    2. Estilo de Presión
                  </div>
                  {(
                    [
                      { id: 'low_block', label: 'Bloque Bajo' },
                      { id: 'balanced', label: 'Presión Equilibrada' },
                      { id: 'high_press', label: 'Presión Alta (+Posesión)' },
                      { id: 'gegenpress', label: 'Gegenpressing Total' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        sound.playChip(25);
                        setMyTactics((t) => ({ ...t, pressingStyle: opt.id }));
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        myTactics.pressingStyle === opt.id
                          ? 'bg-emerald-950/80 border-[#4ade80] text-white'
                          : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Passing Style */}
                <div className="bg-[#111a2e] border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-black uppercase text-amber-400">
                    3. Creación de Juego
                  </div>
                  {(
                    [
                      { id: 'short_tiki_taka', label: 'Tiki-Taka Corto' },
                      { id: 'mixed', label: 'Pase Mixto Asociativo' },
                      { id: 'direct_counter', label: 'Directo / Contraataque' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        sound.playChip(25);
                        setMyTactics((t) => ({ ...t, passingStyle: opt.id }));
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        myTactics.passingStyle === opt.id
                          ? 'bg-emerald-950/80 border-[#4ade80] text-white'
                          : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempo & Width Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111a2e] border border-slate-800 rounded-xl p-4">
                <div>
                  <div className="flex justify-between text-xs font-black uppercase mb-1">
                    <span className="text-slate-300">Ritmo de Circulación (Tempo)</span>
                    <span className="text-[#4ade80]">{myTactics.tempo}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={myTactics.tempo}
                    onChange={(e) =>
                      setMyTactics((t) => ({ ...t, tempo: Number(e.target.value) }))
                    }
                    className="w-full accent-[#4ade80] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-black uppercase mb-1">
                    <span className="text-slate-300">Amplitud de Bandas</span>
                    <span className="text-amber-400">{myTactics.width}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={myTactics.width}
                    onChange={(e) =>
                      setMyTactics((t) => ({ ...t, width: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 3: CARTAS (EA SPORTS FC 27 Player Database & Draft Builder)
          ================================================================= */}
          {activeTab === 'cartas' && (
            <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden bg-[#0a101d]">
              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar jugador, club o país (ej. Haaland, Real Madrid)..."
                  className="flex-1 min-w-[180px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#4ade80]"
                />
                <select
                  value={leagueFilter}
                  onChange={(e) => setLeagueFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200"
                >
                  <option value="TODAS">Todas las Ligas ({ALL_FC27_PLAYERS.length} Jugadores FC 27)</option>
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
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200"
                >
                  <option value="TODAS">Todas las Posiciones</option>
                  <option value="DC">DC (Delantero)</option>
                  <option value="EI">EI (Extremo Izq)</option>
                  <option value="ED">ED (Extremo Der)</option>
                  <option value="MCO">MCO (Mediapunta)</option>
                  <option value="MC">MC (Mediocentro)</option>
                  <option value="MCD">MCD (Pivote)</option>
                  <option value="DFC">DFC (Central)</option>
                  <option value="LI">LI (Lateral Izq)</option>
                  <option value="LD">LD (Lateral Der)</option>
                  <option value="PO">PO (Portero)</option>
                </select>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as CardTier | 'TODAS')}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200"
                >
                  <option value="TODAS">Todas las Rarezas</option>
                  <option value="gold">Oro Único</option>
                  <option value="silver">Plata</option>
                  <option value="bronze">Bronce</option>
                  <option value="toty">TOTY</option>
                </select>
              </div>

              {/* Cards Grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-1">
                {filteredDatabase.map((player) => (
                  <div
                    key={player.id}
                    className="bg-[#111b30] border border-slate-800 hover:border-[#4ade80] rounded-xl p-2.5 flex flex-col items-center justify-between gap-2 transition-all"
                  >
                    <FutCardShield
                      player={player}
                      size="hand"
                      selected={selectedCardId === player.id}
                      onClick={() => {
                        sound.playCardFlip();
                        setSelectedCardId(player.id);
                      }}
                    />
                    <div className="text-center w-full">
                      <div className="text-[11px] font-black text-white truncate">{player.name}</div>
                      <div className="text-[9px] font-bold text-slate-400 truncate">
                        {player.club} • {getPlayerLeague(player.club)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignPlayerToSlot(selectedPitchSlot, player)}
                      className="w-full py-1 rounded bg-emerald-500/20 hover:bg-[#4ade80] text-emerald-300 hover:text-neutral-950 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Alinear en {selectedPitchSlot.toUpperCase()}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 4: HISTORIAL (Full Match Timeline, xG & D100 Logs)
          ================================================================= */}
          {activeTab === 'historial' && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 bg-[#0a101d]">
              {/* Analytical Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#111b30] border border-slate-800 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Goles Esperados (xG)</div>
                  <div className="text-sm sm:text-base font-black text-[#4ade80]">
                    {myXG} <span className="text-slate-500">vs</span>{' '}
                    <span className="text-rose-400">{broXG}</span>
                  </div>
                </div>
                <div className="bg-[#111b30] border border-slate-800 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Posesión Media</div>
                  <div className="text-sm sm:text-base font-black text-white">
                    {myPossession}% / {100 - myPossession}%
                  </div>
                </div>
                <div className="bg-[#111b30] border border-slate-800 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tiros a Puerta</div>
                  <div className="text-sm sm:text-base font-black text-amber-400">
                    {myShots} - {broShots}
                  </div>
                </div>
                <div className="bg-[#111b30] border border-slate-800 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Química Activa</div>
                  <div className="text-sm sm:text-base font-black text-sky-400">
                    {chemistryData.totalChemistry} / 33
                  </div>
                </div>
              </div>

              {/* Chronological Event Feed */}
              <div className="space-y-2">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      ev.highlight
                        ? 'bg-emerald-950/40 border-[#4ade80]/70 text-white'
                        : 'bg-[#111b30]/80 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-black text-amber-400">
                        {ev.minute}&apos;
                      </span>
                      <span className="text-xs font-bold">{ev.text}</span>
                    </div>
                    {ev.duelDetails && (
                      <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                        D100: {ev.duelDetails.roll} / {ev.duelDetails.successChance}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* -------------------------------------------------------------------
            RIGHT CONTROL PANEL (5 Columns on Desktop):
            1. SIMULACIÓN ESTADÍSTICA (AUTO-BATTLER)
            2. BATALLA TÁCTICA POR TURNOS (5 Action Buttons)
            3. BARRA DE CARTAS ACTIVAS (MANO DE CARTAS + ENVIAR TÁCTICA)
        ------------------------------------------------------------------- */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
          {/* SECTION 1: SIMULACIÓN ESTADÍSTICA (AUTO-BATTLER) */}
          <section className="bg-[#111827]/95 border border-slate-700/80 rounded-xl p-3 shadow-xl">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-center text-slate-200 mb-2">
              SIMULACIÓN ESTADÍSTICA (AUTO-BATTLER)
            </h3>

            {/* Dual Bar 1: Posesión 54% vs 46% */}
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[11px] font-extrabold">
                <span className="text-slate-200">
                  Posesión: <strong className="text-[#4ade80]">{myPossession}%</strong>
                </span>
                <span className="text-rose-400 font-black">{100 - myPossession}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-rose-600 overflow-hidden flex p-[1px] border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] rounded-l-full transition-all duration-500"
                  style={{ width: `${myPossession}%` }}
                />
              </div>
            </div>

            {/* Dual Bar 2: Tiros 8 vs 5 */}
            <div className="space-y-1 mb-2.5">
              <div className="flex justify-between text-[11px] font-extrabold">
                <span className="text-slate-200">
                  Tiros: <strong className="text-[#4ade80]">{myShots}</strong>
                </span>
                <span className="text-rose-400 font-black">{broShots}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-rose-600 overflow-hidden flex p-[1px] border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] rounded-l-full transition-all duration-500"
                  style={{
                    width: `${Math.round((myShots / Math.max(1, myShots + broShots)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Highlighted Live Ticker Box: "Min 58: ¡GOL de Haaland tras pase de De Bruyne!" */}
            <div className="bg-[#182235] border-2 border-[#4ade80]/80 rounded-lg px-3 py-2 text-center shadow-[0_0_12px_rgba(74,222,128,0.2)]">
              <p className="text-xs sm:text-[13px] font-extrabold text-white tracking-tight truncate">
                {latestHighlightEvent.text}
              </p>
            </div>
          </section>

          {/* SECTION 2: BATALLA TÁCTICA POR TURNOS (3 Top + 2 Bottom Grid) */}
          <section className="bg-[#111827]/95 border border-slate-700/80 rounded-xl p-3 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-200 mx-auto">
                BATALLA TÁCTICA POR TURNOS
              </h3>
            </div>

            {/* Top Row: Presión Alta, Pase Largo, Disparar */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {topRowActions.map((act) => {
                const isSelected = selectedActionId === act.id;
                const chance = actionChances[act.id] || 75;
                return (
                  <button
                    key={act.id}
                    onClick={() => {
                      sound.playCardFlip();
                      triggerHaptic('light');
                      setSelectedActionId(act.id);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#172e27] border-2 border-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.4)] scale-[1.02]'
                        : 'bg-[#1a2438] border-slate-600/80 hover:border-slate-400'
                    }`}
                  >
                    <TacticalIconSVG iconName={act.iconName} active={isSelected} />
                    <span className="text-[11px] sm:text-xs font-black text-white mt-1 leading-tight">
                      {act.name}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#4ade80] mt-0.5">
                      ({chance}% de éxito)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Row: Entrada Fuerte, Contraataque */}
            <div className="grid grid-cols-2 gap-2 px-4 sm:px-6">
              {bottomRowActions.map((act) => {
                const isSelected = selectedActionId === act.id;
                const chance = actionChances[act.id] || 75;
                return (
                  <button
                    key={act.id}
                    onClick={() => {
                      sound.playCardFlip();
                      triggerHaptic('light');
                      setSelectedActionId(act.id);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#172e27] border-2 border-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.4)] scale-[1.02]'
                        : 'bg-[#1a2438] border-slate-600/80 hover:border-slate-400'
                    }`}
                  >
                    <TacticalIconSVG iconName={act.iconName} active={isSelected} />
                    <span className="text-[11px] sm:text-xs font-black text-white mt-1 leading-tight">
                      {act.name}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#4ade80] mt-0.5">
                      ({chance}% de éxito)
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 3: BARRA DE CARTAS ACTIVAS (MANO DE CARTAS + ENVIAR TÁCTICA) */}
          <section className="flex-1 bg-[#111827]/95 border border-slate-700/80 rounded-xl p-3 shadow-xl flex flex-col justify-between">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-center text-slate-200 mb-1">
              BARRA DE CARTAS ACTIVAS (MANO DE CARTAS)
            </h3>

            {/* Carousel with Left/Right Arrows and 3 Large Hand Cards */}
            <div className="flex items-center justify-between gap-1 my-auto py-1">
              <button
                onClick={() => {
                  sound.playCardFlip();
                  setHandOffset((o) => Math.max(0, o - 1));
                }}
                disabled={handOffset === 0}
                className="w-7 h-12 rounded-lg bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 border border-slate-600 flex items-center justify-center text-slate-200 font-black cursor-pointer"
                aria-label="Anterior carta"
              >
                ‹
              </button>

              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {visibleHandCards.map((card) => (
                  <FutCardShield
                    key={card.id}
                    player={card}
                    size="hand"
                    selected={activeHandCard.id === card.id}
                    onClick={() => {
                      sound.playCardFlip();
                      triggerHaptic('light');
                      setSelectedCardId(card.id);
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  sound.playCardFlip();
                  setHandOffset((o) => Math.min(Math.max(0, handCards.length - 3), o + 1));
                }}
                disabled={handOffset >= handCards.length - 3}
                className="w-7 h-12 rounded-lg bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 border border-slate-600 flex items-center justify-center text-slate-200 font-black cursor-pointer"
                aria-label="Siguiente carta"
              >
                ›
              </button>
            </div>

            {/* Prominent Neon Green Action Button: ENVIAR TÁCTICA / CONFIRMAR JUGADA */}
            <button
              onClick={handleConfirmTacticalPlay}
              className="w-full mt-2 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#16a34a] hover:brightness-110 active:scale-[0.99] text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-emerald-200 shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-all cursor-pointer"
            >
              ENVIAR TÁCTICA / CONFIRMAR JUGADA
            </button>
          </section>
        </div>
      </div>

      {/* =====================================================================
          3. QUICK PLAYER SWAP MODAL (When clicking ⇄ on any Pitch Slot)
      ===================================================================== */}
      {slotModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border-2 border-[#4ade80] rounded-2xl max-w-2xl w-full max-h-[82vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#162238] border-b border-slate-700">
              <div>
                <h3 className="text-sm font-black uppercase text-[#4ade80]">
                  SELECCIONAR JUGADOR FC 27 PARA POSICIÓN ({slotModalTarget.toUpperCase()})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Elige una estrella de tu plantilla para actualizar la química del campo en vivo.
                </p>
              </div>
              <button
                onClick={() => setSlotModalTarget(null)}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {ALL_FC27_PLAYERS.map((player) => (
                <div
                  key={player.id}
                  onClick={() => handleAssignPlayerToSlot(slotModalTarget, player)}
                  className="bg-[#152036] hover:bg-[#1c2d4b] border border-slate-700 hover:border-[#4ade80] rounded-xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all"
                >
                  <FutCardShield player={player} size="hand" />
                  <span className="text-[10px] font-black text-white mt-1">{player.name}</span>
                  <span className="text-[9px] text-emerald-400 font-bold">{player.club}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. VOICE / TEXT TACTICAL CHAT DRAWER
      ===================================================================== */}
      {isChatOpen && (
        <div className="fixed right-3 top-14 z-50 w-80 sm:w-96 bg-[#0f172a]/98 border-2 border-[#4ade80] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#162238] border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                CHAT TÁCTICO P2P & AI COACH
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  sound.playChip(25);
                  setIsMicActive((m) => !m);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                  isMicActive
                    ? 'bg-rose-600 border-rose-300 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
              >
                {isMicActive ? '🎙️ VOZ ACTIVA' : '🎙️ MIC OFF'}
              </button>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="h-60 overflow-y-auto p-3 space-y-2.5 bg-[#0b1120]">
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`p-2.5 rounded-xl text-xs ${
                  m.sender === 'me'
                    ? 'bg-emerald-950/80 border border-emerald-500/50 ml-6 text-white'
                    : m.sender === 'coach'
                    ? 'bg-amber-950/50 border border-amber-500/40 mr-4 text-amber-100'
                    : 'bg-slate-800/90 border border-slate-700 mr-6 text-slate-100'
                }`}
              >
                <div className="flex justify-between text-[9px] font-black uppercase opacity-75 mb-0.5">
                  <span>{m.senderName}</span>
                  <span>{m.time}</span>
                </div>
                <p className="leading-snug">{m.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="p-2.5 bg-[#141f35] border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe a tu hermano o consulta al AI Coach..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#4ade80]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#4ade80] text-neutral-950 font-black text-xs uppercase cursor-pointer"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FutDraftGame;
