import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { UserProfile, StandardCard } from '../../types/casino';
import { CrupierView } from '../crupier/CrupierView';
import type { CrupierContext } from '../../utils/crupierAI';
import { StandardCardView } from '../common/CardView';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { formatMoney } from '../../utils/storage';
import type { PokerPhase, HandEvaluation } from '../../utils/pokerLogic';
import {
  createPokerDeck,
  evaluateBestPokerHand,
  compareHandScores,
  getAIDecision,
} from '../../utils/pokerLogic';

interface PokerGameProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBackToLobby?: () => void;
  onOpenRechargeModal?: () => void;
}

const SMALL_BLIND = 10;
const BIG_BLIND = 20;

export const PokerGame: React.FC<PokerGameProps> = ({
  userProfile,
  onUpdateProfile,
  onBackToLobby,
  onOpenRechargeModal,
}) => {
  // Game States
  const [phase, setPhase] = useState<PokerPhase>('preflop');
  const [deck, setDeck] = useState<StandardCard[]>([]);

  // Cards
  const [playerHoleCards, setPlayerHoleCards] = useState<StandardCard[]>([]);
  const [aiHoleCards, setAiHoleCards] = useState<StandardCard[]>([]);
  const [communityCards, setCommunityCards] = useState<StandardCard[]>([]);
  const [aiCardsRevealed, setAiCardsRevealed] = useState<boolean>(false);

  // Bankrolls & Bets
  const [aiBankroll, setAiBankroll] = useState<number>(1000);
  const [pot, setPot] = useState<number>(0);
  const [currentRoundHighestBet, setCurrentRoundHighestBet] = useState<number>(0);
  const [playerRoundBet, setPlayerRoundBet] = useState<number>(0);
  const [aiRoundBet, setAiRoundBet] = useState<number>(0);

  // Dealer button position: true = player is dealer (SB), false = AI is dealer (SB)
  const [isPlayerDealer, setIsPlayerDealer] = useState<boolean>(true);

  // Turn management
  const [currentTurn, setCurrentTurn] = useState<'player' | 'ai' | 'none'>('none');
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');

  // Raise / Bet customizer UI
  const [showRaiseSlider, setShowRaiseSlider] = useState<boolean>(false);
  const [customRaiseAmount, setCustomRaiseAmount] = useState<number>(BIG_BLIND);

  // Crupier dialogue event & context
  const [crupierEvent, setCrupierEvent] = useState<string>('game_start');
  const [crupierContext, setCrupierContext] = useState<CrupierContext>({
    betAmount: 0,
    bankroll: userProfile.bankroll,
  });

  // End of round banners
  const [winnerNotice, setWinnerNotice] = useState<{
    text: string;
    subtext: string;
    type: 'win' | 'lose' | 'split';
  } | null>(null);

  // Help modal
  const [showRankings, setShowRankings] = useState<boolean>(false);

  const triggerCrupierEvent = (eventName: string, context?: CrupierContext) => {
    setCrupierEvent(eventName);
    if (context) setCrupierContext(context);
  };

  // Start initial hand on mount
  useEffect(() => {
    startNewHand();
  }, []);

  // Current hand evaluation for player
  const playerEvaluation: HandEvaluation | null =
    playerHoleCards.length === 2
      ? evaluateBestPokerHand([...playerHoleCards, ...communityCards])
      : null;

  // AI hand evaluation (used for showdown and logging)
  const aiEvaluation: HandEvaluation | null =
    aiHoleCards.length === 2
      ? evaluateBestPokerHand([...aiHoleCards, ...communityCards])
      : null;

  // Amount player needs to call
  const callAmount = Math.max(0, currentRoundHighestBet - playerRoundBet);

  // Starts a completely new heads-up hand
  const startNewHand = () => {
    if (userProfile.bankroll < BIG_BLIND) {
      if (onOpenRechargeModal) onOpenRechargeModal();
      return;
    }

    if (aiBankroll < BIG_BLIND) {
      setAiBankroll(1000);
    }

    const freshDeck = createPokerDeck();

    const p1 = freshDeck.pop()!;
    const a1 = freshDeck.pop()!;
    const p2 = freshDeck.pop()!;
    const a2 = freshDeck.pop()!;

    setPlayerHoleCards([p1, p2]);
    setAiHoleCards([a1, a2]);
    setCommunityCards([]);
    setAiCardsRevealed(false);
    setDeck(freshDeck);
    setWinnerNotice(null);
    setShowRaiseSlider(false);
    setAiStatusMessage('');

    const nextPlayerIsDealer = !isPlayerDealer;
    setIsPlayerDealer(nextPlayerIsDealer);

    let pBet = 0;
    let aBet = 0;

    if (nextPlayerIsDealer) {
      pBet = Math.min(userProfile.bankroll, SMALL_BLIND);
      aBet = Math.min(aiBankroll, BIG_BLIND);
    } else {
      aBet = Math.min(aiBankroll, SMALL_BLIND);
      pBet = Math.min(userProfile.bankroll, BIG_BLIND);
    }

    const startingPot = pBet + aBet;
    const highest = Math.max(pBet, aBet);

    onUpdateProfile({ bankroll: userProfile.bankroll - pBet });
    setAiBankroll(prev => prev - aBet);
    setPot(startingPot);
    setPlayerRoundBet(pBet);
    setAiRoundBet(aBet);
    setCurrentRoundHighestBet(highest);
    setPhase('preflop');

    sound.playCardDeal();
    triggerHaptic('medium');
    triggerCrupierEvent('game_start', { betAmount: startingPot });

    if (nextPlayerIsDealer) {
      setCurrentTurn('player');
    } else {
      setCurrentTurn('ai');
      triggerAITurn({
        phase: 'preflop',
        aiHole: [a1, a2],
        community: [],
        currentPot: startingPot,
        aiBet: aBet,
        playerBet: pBet,
        highestBet: highest,
        currentAiBankroll: aiBankroll - aBet,
      });
    }
  };

  // Trigger AI decision with natural delay
  const triggerAITurn = (context: {
    phase: PokerPhase;
    aiHole: StandardCard[];
    community: StandardCard[];
    currentPot: number;
    aiBet: number;
    playerBet: number;
    highestBet: number;
    currentAiBankroll: number;
  }) => {
    setAiThinking(true);
    setAiStatusMessage('Pensando...');

    setTimeout(() => {
      const neededToCall = Math.max(0, context.highestBet - context.aiBet);

      const decision = getAIDecision({
        phase: context.phase,
        aiHoleCards: context.aiHole,
        communityCards: context.community,
        pot: context.currentPot,
        currentBetToCall: neededToCall,
        aiBankroll: context.currentAiBankroll,
        playerBankroll: userProfile.bankroll,
        bigBlind: BIG_BLIND,
      });

      setAiThinking(false);
      executeAIAction(decision.action, decision.amount, decision.reason);
    }, 900);
  };

  // Execute AI action result
  const executeAIAction = (
    action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin',
    amount: number,
    _reason?: string
  ) => {
    const toCall = Math.max(0, currentRoundHighestBet - aiRoundBet);

    if (action === 'fold') {
      setAiStatusMessage('No va (Fold)');
      triggerHaptic('light');
      handleAIFold();
      return;
    }

    if (action === 'check') {
      setAiStatusMessage('Pasa');
      sound.playChip();
      triggerHaptic('light');

      if (playerRoundBet === currentRoundHighestBet && isPlayerDealer) {
        advanceStreet();
      } else {
        setCurrentTurn('player');
      }
      return;
    }

    if (action === 'call') {
      const callVal = Math.min(aiBankroll, toCall);
      setAiStatusMessage(`Iguala $${callVal}`);
      setAiBankroll(prev => prev - callVal);
      setPot(prev => prev + callVal);
      const newAiBet = aiRoundBet + callVal;
      setAiRoundBet(newAiBet);
      sound.playChip();
      triggerHaptic('medium');

      advanceStreet();
      return;
    }

    if (action === 'bet' || action === 'raise' || action === 'allin') {
      const totalRaiseAmount = Math.min(aiBankroll, Math.max(amount, toCall + BIG_BLIND));
      const addedChips = totalRaiseAmount;

      setAiStatusMessage(action === 'allin' ? `¡ALL-IN! $${addedChips}` : `¡Sube a $${addedChips}!`);
      setAiBankroll(prev => prev - addedChips);
      setPot(prev => prev + addedChips);

      const newAiBet = aiRoundBet + addedChips;
      setAiRoundBet(newAiBet);
      setCurrentRoundHighestBet(newAiBet);

      sound.playChip();
      triggerHaptic('heavy');
      triggerCrupierEvent('poker_preflop_raise', { betAmount: addedChips });

      setCurrentTurn('player');
    }
  };

  // Player action: FOLD (No ir)
  const handlePlayerFold = () => {
    if (currentTurn !== 'player') return;
    triggerHaptic('medium');
    setCurrentTurn('none');
    triggerCrupierEvent('poker_fold');

    setAiBankroll(prev => prev + pot);
    setWinnerNotice({
      text: 'Te has retirado de la mano',
      subtext: `El Crupier se lleva el pozo de ${formatMoney(pot)}.`,
      type: 'lose',
    });
    setPhase('ended');

    recordGameStats(-playerRoundBet);
  };

  // AI folds
  const handleAIFold = () => {
    setCurrentTurn('none');
    triggerCrupierEvent('poker_win', { handName: playerEvaluation?.descr });

    const winnings = pot;
    const profit = winnings - playerRoundBet;
    const newBankroll = userProfile.bankroll + winnings;
    onUpdateProfile({ bankroll: newBankroll });

    sound.playWin();
    triggerHaptic('success');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    setWinnerNotice({
      text: '¡El Crupier se retira!',
      subtext: `Ganas el pozo completo de ${formatMoney(winnings)} (+${formatMoney(profit)} de beneficio).`,
      type: 'win',
    });
    setPhase('ended');

    recordGameStats(profit);
  };

  // Player action: CHECK (Pasar)
  const handlePlayerCheck = () => {
    if (currentTurn !== 'player' || callAmount > 0) return;
    sound.playChip();
    triggerHaptic('light');

    if (aiRoundBet === currentRoundHighestBet && !isPlayerDealer) {
      advanceStreet();
    } else {
      setCurrentTurn('ai');
      triggerAITurn({
        phase,
        aiHole: aiHoleCards,
        community: communityCards,
        currentPot: pot,
        aiBet: aiRoundBet,
        playerBet: playerRoundBet,
        highestBet: currentRoundHighestBet,
        currentAiBankroll: aiBankroll,
      });
    }
  };

  // Player action: CALL (Igualar)
  const handlePlayerCall = () => {
    if (currentTurn !== 'player' || callAmount <= 0) return;
    const toPay = Math.min(userProfile.bankroll, callAmount);

    onUpdateProfile({ bankroll: userProfile.bankroll - toPay });
    setPot(prev => prev + toPay);
    const newPlayerBet = playerRoundBet + toPay;
    setPlayerRoundBet(newPlayerBet);

    sound.playChip();
    triggerHaptic('medium');

    advanceStreet();
  };

  // Player action: BET / RAISE
  const handlePlayerRaise = (raiseTotal: number) => {
    if (currentTurn !== 'player') return;
    const additionalChips = raiseTotal - playerRoundBet;
    if (additionalChips <= 0 || userProfile.bankroll < additionalChips) return;

    onUpdateProfile({ bankroll: userProfile.bankroll - additionalChips });
    setPot(prev => prev + additionalChips);
    setPlayerRoundBet(raiseTotal);
    setCurrentRoundHighestBet(raiseTotal);
    setShowRaiseSlider(false);

    sound.playChip();
    triggerHaptic('heavy');
    if (phase === 'river') {
      triggerCrupierEvent('poker_river_bluff', { betAmount: raiseTotal });
    } else {
      triggerCrupierEvent('poker_preflop_raise', { betAmount: raiseTotal });
    }

    setCurrentTurn('ai');
    triggerAITurn({
      phase,
      aiHole: aiHoleCards,
      community: communityCards,
      currentPot: pot + additionalChips,
      aiBet: aiRoundBet,
      playerBet: raiseTotal,
      highestBet: raiseTotal,
      currentAiBankroll: aiBankroll,
    });
  };

  // Advance to next street: Preflop -> Flop -> Turn -> River -> Showdown
  const advanceStreet = () => {
    setPlayerRoundBet(0);
    setAiRoundBet(0);
    setCurrentRoundHighestBet(0);
    setAiStatusMessage('');

    if (phase === 'preflop') {
      sound.playCardDeal();
      triggerHaptic('medium');
      const c1 = deck.pop()!;
      const c2 = deck.pop()!;
      const c3 = deck.pop()!;
      setCommunityCards([c1, c2, c3]);
      setPhase('flop');
      triggerCrupierEvent('poker_flop');
      startStreetTurn('flop', [c1, c2, c3]);
    } else if (phase === 'flop') {
      sound.playCardDeal();
      triggerHaptic('medium');
      const c4 = deck.pop()!;
      const newComms = [...communityCards, c4];
      setCommunityCards(newComms);
      setPhase('turn');
      triggerCrupierEvent('poker_turn');
      startStreetTurn('turn', newComms);
    } else if (phase === 'turn') {
      sound.playCardDeal();
      triggerHaptic('medium');
      const c5 = deck.pop()!;
      const newComms = [...communityCards, c5];
      setCommunityCards(newComms);
      setPhase('river');
      triggerCrupierEvent('poker_river_bluff');
      startStreetTurn('river', newComms);
    } else if (phase === 'river') {
      handleShowdown();
    }
  };

  const startStreetTurn = (nextPhase: PokerPhase, comms: StandardCard[]) => {
    if (!isPlayerDealer) {
      setCurrentTurn('player');
    } else {
      setCurrentTurn('ai');
      triggerAITurn({
        phase: nextPhase,
        aiHole: aiHoleCards,
        community: comms,
        currentPot: pot,
        aiBet: 0,
        playerBet: 0,
        highestBet: 0,
        currentAiBankroll: aiBankroll,
      });
    }
  };

  // Showdown: Reveal cards, calculate hands, determine winner
  const handleShowdown = () => {
    setPhase('showdown');
    setCurrentTurn('none');
    setAiCardsRevealed(true);
    sound.playCardFlip();
    triggerHaptic('medium');

    const pEval = evaluateBestPokerHand([...playerHoleCards, ...communityCards]);
    const aEval = evaluateBestPokerHand([...aiHoleCards, ...communityCards]);

    const comp = compareHandScores(pEval.score, aEval.score);

    if (comp > 0) {
      const winnings = pot;
      const profit = winnings;
      const newBankroll = userProfile.bankroll + winnings;
      onUpdateProfile({ bankroll: newBankroll });

      sound.playWin();
      triggerHaptic('success');
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
      });

      setWinnerNotice({
        text: '¡Ganaste el Showdown!',
        subtext: `Tu ${pEval.descr} vence a ${aEval.descr}. Te llevas ${formatMoney(winnings)}.`,
        type: 'win',
      });
      triggerCrupierEvent('poker_win', { handName: pEval.descr });
      recordGameStats(profit);
    } else if (comp < 0) {
      setAiBankroll(prev => prev + pot);
      sound.playLose();
      triggerHaptic('warning');

      setWinnerNotice({
        text: 'La Banca Gana la Mano',
        subtext: `${aEval.descr} del Crupier supera tu ${pEval.descr}.`,
        type: 'lose',
      });
      triggerCrupierEvent('poker_bad_beat', { handName: aEval.descr });
      recordGameStats(-pot / 2);
    } else {
      const half = Math.floor(pot / 2);
      onUpdateProfile({ bankroll: userProfile.bankroll + half });
      setAiBankroll(prev => prev + (pot - half));

      setWinnerNotice({
        text: '¡Empate! Pozo Dividido',
        subtext: `Ambos tienen ${pEval.descr}. Se reparten ${formatMoney(half)} cada uno.`,
        type: 'split',
      });
      triggerCrupierEvent('game_start');
      recordGameStats(0);
    }
  };

  const recordGameStats = (netProfit: number) => {
    const pStats = { ...userProfile.stats.poker };
    pStats.gamesPlayed += 1;
    if (netProfit > 0) pStats.gamesWon += 1;
    pStats.totalProfit += netProfit;
    if (netProfit > pStats.bestWin) pStats.bestWin = netProfit;

    const newScore = Math.max(0, userProfile.weeklyScore + (netProfit > 0 ? netProfit * 2 : 0));

    onUpdateProfile({
      weeklyScore: newScore,
      stats: {
        ...userProfile.stats,
        poker: pStats,
      },
    });
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden table-felt-${userProfile.tableTheme} safe-top safe-bottom text-white select-none`}
    >
      {/* Top Header */}
      <header className="px-3 py-2 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          {onBackToLobby && (
            <button
              onClick={onBackToLobby}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-neutral-300"
              title="Volver al Lobby"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-wide text-amber-400">TEXAS HOLD'EM</span>
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                Mano a Mano
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              Ciegas: ${SMALL_BLIND} / ${BIG_BLIND} • {isPlayerDealer ? 'Tú eres Dealer (D)' : 'Crupier es Dealer (D)'}
            </p>
          </div>
        </div>

        {/* Bankroll & Settings */}
        <div className="flex items-center gap-2">
          <div
            onClick={onOpenRechargeModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-amber-500/40 cursor-pointer active:scale-95 transition-all shadow-inner"
          >
            <span className="text-amber-400 text-xs">🪙</span>
            <span className="text-xs font-bold text-amber-300 font-mono">
              ${userProfile.bankroll.toLocaleString('es-MX')}
            </span>
            <PlusCircle className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          </div>

          <button
            onClick={() => {
              const next = !userProfile.soundEnabled;
              sound.setEnabled(next);
              onUpdateProfile({ soundEnabled: next });
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 active:scale-95"
          >
            {userProfile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowRankings(true)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 active:scale-95"
            title="Jerarquía de Manos"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Crupier Animated Interactive Header Bar */}
      <CrupierView
        game="poker"
        event={crupierEvent}
        context={crupierContext}
        personality={userProfile.crupierPersonality}
        onPersonalityChange={(newP) => onUpdateProfile({ crupierPersonality: newP })}
        compact={true}
      />

      {/* Main Poker Arena */}
      <div className="flex-1 flex flex-col justify-between px-3 py-1 relative overflow-y-auto">
        {/* OPPONENT (AI) ROW */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900/80 border border-white/10 text-xs">
              <span>🦈</span>
              <span className="font-bold text-neutral-200 text-[11px]">Tiburón VIP</span>
              <span className="font-mono text-amber-300 text-[11px]">${aiBankroll}</span>
              {!isPlayerDealer && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center shadow">
                  D
                </span>
              )}
            </div>

            {aiStatusMessage && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold animate-pulse">
                {aiStatusMessage}
              </span>
            )}
            {aiRoundBet > 0 && (
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                Apuesta: ${aiRoundBet}
              </span>
            )}
          </div>

          {/* AI Hole Cards (Facedown or Showdown) */}
          <div className="flex items-center gap-2">
            {aiHoleCards.map((card, idx) => (
              <StandardCardView
                key={card.id || `ai_card_${idx}`}
                card={{ ...card, faceUp: aiCardsRevealed }}
                backTheme={userProfile.cardBackTheme}
                className="scale-90"
              />
            ))}
          </div>

          {aiCardsRevealed && aiEvaluation && (
            <div className="mt-1 px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-neutral-300 border border-white/10">
              {aiEvaluation.descr}
            </div>
          )}
        </div>

        {/* CENTER FELT: COMMUNITY CARDS & POT */}
        <div className="flex flex-col items-center my-auto py-2">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-950/80 via-neutral-900/90 to-amber-950/80 border border-amber-400/40 shadow-xl mb-2.5">
            <span className="text-amber-400 text-xs">💰</span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
              BOTE TOTAL:
            </span>
            <span className="text-sm font-black font-mono text-amber-400">
              ${pot.toLocaleString('es-MX')}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
              {phase.toUpperCase()}
            </span>
          </div>

          {/* 5 Community Cards */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-h-[96px]">
            {communityCards.map(card => (
              <StandardCardView
                key={card.id}
                card={card}
                backTheme={userProfile.cardBackTheme}
                className="shadow-2xl transition-all"
              />
            ))}

            {Array.from({ length: 5 - communityCards.length }).map((_, idx) => (
              <div
                key={`empty_comm_${idx}`}
                className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg border-2 border-dashed border-white/15 bg-black/20 flex items-center justify-center text-white/20 text-xs font-mono"
              >
                🂠
              </div>
            ))}
          </div>

          {/* Winner Notification Banner */}
          {winnerNotice && (
            <div
              className={`mt-2 px-4 py-1.5 rounded-2xl border text-center shadow-2xl animate-bounce flex flex-col items-center ${
                winnerNotice.type === 'win'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 border-emerald-300 text-white'
                  : winnerNotice.type === 'split'
                  ? 'bg-neutral-800 border-neutral-600 text-neutral-200'
                  : 'bg-red-900 border-red-500 text-red-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-black">
                {winnerNotice.type === 'win' && <Trophy className="w-4 h-4 text-amber-300" />}
                <span>{winnerNotice.text}</span>
              </div>
              <span className="text-[10px] opacity-90">{winnerNotice.subtext}</span>
            </div>
          )}
        </div>

        {/* PLAYER ROW */}
        <div className="flex flex-col items-center">
          {playerEvaluation && (
            <div className="mb-1.5 flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-amber-400 text-xs shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-neutral-300 text-[11px]">Tienes:</span>
              <span className="font-extrabold text-amber-300 text-[11px]">{playerEvaluation.descr}</span>
            </div>
          )}

          {/* Player Hole Cards */}
          <div className="flex items-center gap-2">
            {playerHoleCards.map((card, idx) => (
              <StandardCardView
                key={card.id || `p_card_${idx}`}
                card={card}
                backTheme={userProfile.cardBackTheme}
                className="shadow-2xl scale-105"
              />
            ))}
          </div>

          {/* Player Bet & Dealer Indicator */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-bold text-neutral-300">Tú</span>
            {isPlayerDealer && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center shadow">
                D
              </span>
            )}
            {playerRoundBet > 0 && (
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                Tu Apuesta: ${playerRoundBet}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Raise Customizer Slider Sheet */}
      {showRaiseSlider && (
        <div className="px-4 py-3 bg-neutral-900/95 border-t border-amber-500/30 backdrop-blur-xl z-40">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-300">Ajustar Subida:</span>
              <span className="text-base font-black font-mono text-amber-400">
                ${customRaiseAmount}
              </span>
            </div>

            <input
              type="range"
              min={currentRoundHighestBet + BIG_BLIND}
              max={userProfile.bankroll + playerRoundBet}
              step={BIG_BLIND}
              value={customRaiseAmount}
              onChange={e => setCustomRaiseAmount(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 h-2 bg-neutral-700 rounded-lg cursor-pointer mb-3"
            />

            <div className="grid grid-cols-4 gap-2 mb-3">
              <button
                onClick={() => setCustomRaiseAmount(currentRoundHighestBet + BIG_BLIND)}
                className="py-1 px-2 rounded-lg bg-neutral-800 text-[11px] font-bold text-neutral-300 hover:text-white"
              >
                Mínimo
              </button>
              <button
                onClick={() =>
                  setCustomRaiseAmount(
                    Math.min(userProfile.bankroll + playerRoundBet, Math.max(currentRoundHighestBet + BIG_BLIND, Math.round(pot / 2)))
                  )
                }
                className="py-1 px-2 rounded-lg bg-neutral-800 text-[11px] font-bold text-neutral-300 hover:text-white"
              >
                1/2 Bote
              </button>
              <button
                onClick={() =>
                  setCustomRaiseAmount(
                    Math.min(userProfile.bankroll + playerRoundBet, Math.max(currentRoundHighestBet + BIG_BLIND, pot))
                  )
                }
                className="py-1 px-2 rounded-lg bg-neutral-800 text-[11px] font-bold text-neutral-300 hover:text-white"
              >
                Bote
              </button>
              <button
                onClick={() => setCustomRaiseAmount(userProfile.bankroll + playerRoundBet)}
                className="py-1 px-2 rounded-lg bg-red-900/50 border border-red-500/40 text-[11px] font-bold text-red-300"
              >
                All-In
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRaiseSlider(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-400 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePlayerRaise(customRaiseAmount)}
                className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 font-black text-neutral-950 text-xs uppercase tracking-wider active:scale-95 shadow-lg shadow-amber-500/30"
              >
                Confirmar Subida (${customRaiseAmount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Betting Action Bar */}
      <footer className="w-full bg-neutral-950/90 border-t border-white/10 backdrop-blur-xl p-2.5 z-30">
        {phase !== 'ended' && phase !== 'showdown' ? (
          <div className="max-w-md mx-auto">
            {aiThinking ? (
              <div className="py-3 text-center text-xs font-bold text-amber-300 animate-pulse flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                El Crupier está evaluando la jugada...
              </div>
            ) : currentTurn === 'player' ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handlePlayerFold}
                  className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-300 font-black text-xs uppercase tracking-tight flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  <span className="text-base leading-none">🏳️</span>
                  <span>No Ir (Fold)</span>
                </button>

                {callAmount === 0 ? (
                  <button
                    onClick={handlePlayerCheck}
                    className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-sky-600 to-blue-800 hover:from-sky-500 hover:to-blue-700 font-black text-xs uppercase tracking-tight flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-lg shadow-blue-700/30"
                  >
                    <span className="text-base leading-none">✋</span>
                    <span>Pasar (Check)</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePlayerCall}
                    className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-emerald-600 to-green-800 hover:from-emerald-500 hover:to-green-700 font-black text-xs uppercase tracking-tight flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-700/30"
                  >
                    <span className="text-base leading-none">🟢</span>
                    <span>Igualar (${callAmount})</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const minRaise = currentRoundHighestBet + BIG_BLIND;
                    setCustomRaiseAmount(Math.min(userProfile.bankroll + playerRoundBet, minRaise));
                    setShowRaiseSlider(true);
                  }}
                  className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-amber-500 to-yellow-700 hover:from-amber-400 hover:to-yellow-600 text-neutral-950 font-black text-xs uppercase tracking-tight flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/30"
                >
                  <span className="text-base leading-none">🔥</span>
                  <span>{currentRoundHighestBet === 0 ? 'Apostar' : 'Subir'}</span>
                </button>
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-neutral-400">
                Esperando respuesta de la mesa...
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <button
              onClick={startNewHand}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 font-black text-neutral-950 uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Siguiente Mano
            </button>
          </div>
        )}
      </footer>

      {/* Hand Hierarchy Rules Modal */}
      {showRankings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-5 max-w-sm w-full text-white shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Jerarquía de Manos de Póker
              </h3>
              <button
                onClick={() => setShowRankings(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-400/30">
                <div className="font-bold text-amber-300">1. Escalera Real</div>
                <div className="text-[11px] text-neutral-400">A, K, Q, J, 10 del mismo palo. La jugada invencible.</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700">
                <div className="font-bold text-white">2. Escalera de Color</div>
                <div className="text-[11px] text-neutral-400">Cinco cartas correlativas del mismo palo (ej. 9-8-7-6-5 de picas).</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700">
                <div className="font-bold text-white">3. Póker</div>
                <div className="text-[11px] text-neutral-400">Cuatro cartas del mismo valor (ej. cuatro Ases o cuatro Reyes).</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700">
                <div className="font-bold text-white">4. Full House</div>
                <div className="text-[11px] text-neutral-400">Un trío y una pareja combinados (ej. tres 10 y dos Jotas).</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700">
                <div className="font-bold text-white">5. Color (Flush)</div>
                <div className="text-[11px] text-neutral-400">Cinco cartas de igual palo, sin orden consecutivo.</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700">
                <div className="font-bold text-white">6. Escalera</div>
                <div className="text-[11px] text-neutral-400">Cinco cartas en orden numérico de palos variados.</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700">
                <div className="font-bold text-white">7. Trío</div>
                <div className="text-[11px] text-neutral-400">Tres cartas con el mismo valor numérico.</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700">
                <div className="font-bold text-white">8. Doble Pareja</div>
                <div className="text-[11px] text-neutral-400">Dos parejas independientes de cartas iguales.</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700">
                <div className="font-bold text-white">9. Pareja</div>
                <div className="text-[11px] text-neutral-400">Dos cartas del mismo valor.</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/60 border border-neutral-700">
                <div className="font-bold text-white">10. Carta Alta</div>
                <div className="text-[11px] text-neutral-400">La carta de mayor rango cuando no hay combinación.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
