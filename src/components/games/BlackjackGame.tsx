import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  PlusCircle,
  HelpCircle,
  ShieldAlert,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import type { UserProfile, StandardCard } from '../../types/casino';
import { CrupierView } from '../crupier/CrupierView';
import type { CrupierContext } from '../../utils/crupierAI';
import { StandardCardView } from '../common/CardView';
import { ChipView } from '../common/ChipView';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { formatMoney } from '../../utils/storage';
import type { BlackjackHand } from '../../utils/blackjackLogic';
import {
  createShoe,
  calculateHandValue,
  shouldDealerHit,
  canSplitHand,
  canDoubleDown,
  evaluateOutcome,
} from '../../utils/blackjackLogic';

interface BlackjackGameProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBackToLobby?: () => void;
  onOpenRechargeModal?: () => void;
}

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  userProfile,
  onUpdateProfile,
  onBackToLobby,
  onOpenRechargeModal,
}) => {
  // Shoe state (6 decks, 312 cards)
  const shoeRef = useRef<StandardCard[]>([]);

  // Game phase
  const [phase, setPhase] = useState<'betting' | 'dealing' | 'player_turn' | 'dealer_turn' | 'round_over'>('betting');

  // Hands
  const [playerHands, setPlayerHands] = useState<BlackjackHand[]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState<number>(0);
  const [dealerCards, setDealerCards] = useState<StandardCard[]>([]);
  const [dealerRevealed, setDealerRevealed] = useState<boolean>(false);

  // Betting
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [previousBet, setPreviousBet] = useState<number>(0);

  // Banner & Outcome
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<'win' | 'lose' | 'push' | 'blackjack' | null>(null);

  // Crupier dialogue event & context
  const [crupierEvent, setCrupierEvent] = useState<string>('game_start');
  const [crupierContext, setCrupierContext] = useState<CrupierContext>({
    betAmount: 0,
    bankroll: userProfile.bankroll,
  });

  // Rules modal
  const [showRules, setShowRules] = useState<boolean>(false);

  // Initialize shoe
  useEffect(() => {
    if (shoeRef.current.length < 52) {
      shoeRef.current = createShoe(6);
    }
  }, []);

  const triggerCrupierEvent = (eventName: string, context?: CrupierContext) => {
    setCrupierEvent(eventName);
    if (context) setCrupierContext(context);
  };

  // Draw card from shoe with auto-reshuffle
  const drawCard = (faceUp = true): StandardCard => {
    if (shoeRef.current.length < 52) {
      shoeRef.current = createShoe(6);
    }
    const card = shoeRef.current.pop()!;
    return { ...card, faceUp };
  };

  // Handle adding chip
  const handleAddChip = (amount: number) => {
    if (phase !== 'betting') return;
    if (userProfile.bankroll < currentBet + amount) {
      triggerHaptic('warning');
      return;
    }
    setCurrentBet(prev => prev + amount);
    triggerHaptic('light');
  };

  const handleClearBet = () => {
    if (phase !== 'betting') return;
    setCurrentBet(0);
    triggerHaptic('light');
  };

  const handleRepeatBet = () => {
    if (phase !== 'betting') return;
    if (previousBet > 0 && userProfile.bankroll >= previousBet) {
      setCurrentBet(previousBet);
      triggerHaptic('medium');
      sound.playChip();
    }
  };

  const handleAllIn = () => {
    if (phase !== 'betting') return;
    if (userProfile.bankroll > 0) {
      setCurrentBet(userProfile.bankroll);
      triggerHaptic('heavy');
      sound.playChip();
    }
  };

  // Start Deal
  const handleDeal = async () => {
    if (phase !== 'betting' || currentBet <= 0) return;
    if (userProfile.bankroll < currentBet) {
      if (onOpenRechargeModal) onOpenRechargeModal();
      return;
    }

    // Deduct bet from bankroll
    const newBankroll = userProfile.bankroll - currentBet;
    onUpdateProfile({ bankroll: newBankroll });
    setPreviousBet(currentBet);

    setBannerMessage(null);
    setBannerType(null);
    setDealerRevealed(false);
    setPhase('dealing');

    triggerCrupierEvent('bj_deal', {
      betAmount: currentBet,
      bankroll: newBankroll,
      isHighBet: currentBet >= 100,
      isLowBet: currentBet <= 10,
    });

    // Create cards with timing
    sound.playCardDeal();
    triggerHaptic('medium');

    const pCard1 = drawCard(true);
    const dCard1 = drawCard(true);
    const pCard2 = drawCard(true);
    const dCard2 = drawCard(false); // Hole card facedown

    // Step-by-step card deal
    setPlayerHands([
      {
        id: 'hand_0',
        cards: [pCard1],
        bet: currentBet,
        isDoubled: false,
        isStood: false,
        isBust: false,
        isFromSplit: false,
        status: 'playing',
        payout: 0,
      },
    ]);
    setDealerCards([dCard1]);

    setTimeout(() => {
      sound.playCardDeal();
      setPlayerHands([
        {
          id: 'hand_0',
          cards: [pCard1, pCard2],
          bet: currentBet,
          isDoubled: false,
          isStood: false,
          isBust: false,
          isFromSplit: false,
          status: 'playing',
          payout: 0,
        },
      ]);
      setDealerCards([dCard1, dCard2]);

      // Check immediate Natural Blackjack
      const pVal = calculateHandValue([pCard1, pCard2]);
      const dVal = calculateHandValue([dCard1, { ...dCard2, faceUp: true }]);

      if (pVal.isBlackjack || dVal.isBlackjack) {
        setTimeout(() => {
          handleImmediateShowdown([pCard1, pCard2], [dCard1, dCard2], currentBet);
        }, 800);
      } else {
        setPhase('player_turn');
        setActiveHandIndex(0);
      }
    }, 600);
  };

  // Immediate showdown when natural Blackjack occurs on initial deal
  const handleImmediateShowdown = (
    playerCards: StandardCard[],
    dealerHandCards: StandardCard[],
    bet: number
  ) => {
    sound.playCardFlip();
    const revealedDealer = dealerHandCards.map(c => ({ ...c, faceUp: true }));
    setDealerCards(revealedDealer);
    setDealerRevealed(true);

    const initialHand: BlackjackHand = {
      id: 'hand_0',
      cards: playerCards,
      bet,
      isDoubled: false,
      isStood: true,
      isBust: false,
      isFromSplit: false,
      status: 'playing',
      payout: 0,
    };

    const result = evaluateOutcome(initialHand, revealedDealer);

    setBannerMessage(result.message);
    const mappedType: 'win' | 'lose' | 'push' | 'blackjack' =
      result.outcome === 'won' ? 'win' : result.outcome === 'blackjack' ? 'blackjack' : result.outcome === 'push' ? 'push' : 'lose';
    setBannerType(mappedType);

    const updatedHand = { ...initialHand, status: result.outcome, payout: result.payout };
    setPlayerHands([updatedHand]);

    handleFinishRound([updatedHand], revealedDealer);
  };

  // Player action: HIT (Pedir)
  const handleHit = () => {
    if (phase !== 'player_turn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand || currentHand.isStood || currentHand.isBust) return;

    sound.playCardDeal();
    triggerHaptic('light');

    const nextCard = drawCard(true);
    const updatedCards = [...currentHand.cards, nextCard];
    const val = calculateHandValue(updatedCards);

    const updatedHand: BlackjackHand = {
      ...currentHand,
      cards: updatedCards,
      isBust: val.isBust,
      status: val.isBust ? 'bust' : val.total === 21 ? 'standing' : 'playing',
      isStood: val.total === 21,
    };

    const newHands = [...playerHands];
    newHands[activeHandIndex] = updatedHand;
    setPlayerHands(newHands);

    if (val.isBust) {
      sound.playLose();
      triggerHaptic('warning');
      triggerCrupierEvent('bj_bust', { playerScore: val.total });
      advanceToNextHandOrDealer(newHands, activeHandIndex);
    } else if (val.total === 21) {
      advanceToNextHandOrDealer(newHands, activeHandIndex);
    } else if (val.total >= 16) {
      triggerCrupierEvent('bj_hit_risky', { playerScore: val.total });
    }
  };

  // Player action: STAND (Plantarse)
  const handleStand = () => {
    if (phase !== 'player_turn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand) return;

    triggerHaptic('medium');
    const updatedHand: BlackjackHand = {
      ...currentHand,
      isStood: true,
      status: 'standing',
    };

    const newHands = [...playerHands];
    newHands[activeHandIndex] = updatedHand;
    setPlayerHands(newHands);

    const val = calculateHandValue(currentHand.cards);
    triggerCrupierEvent('bj_stand', { playerScore: val.total });

    advanceToNextHandOrDealer(newHands, activeHandIndex);
  };

  // Player action: DOUBLE DOWN (Doblar)
  const handleDoubleDown = () => {
    if (phase !== 'player_turn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand || !canDoubleDown(currentHand, userProfile.bankroll)) return;

    const newBankroll = userProfile.bankroll - currentHand.bet;
    onUpdateProfile({ bankroll: newBankroll });

    sound.playChip();
    triggerHaptic('heavy');
    triggerCrupierEvent('bj_double', { betAmount: currentHand.bet * 2 });

    sound.playCardDeal();
    const nextCard = drawCard(true);
    const updatedCards = [...currentHand.cards, nextCard];
    const val = calculateHandValue(updatedCards);

    const updatedHand: BlackjackHand = {
      ...currentHand,
      bet: currentHand.bet * 2,
      cards: updatedCards,
      isDoubled: true,
      isStood: true,
      isBust: val.isBust,
      status: val.isBust ? 'bust' : 'standing',
    };

    const newHands = [...playerHands];
    newHands[activeHandIndex] = updatedHand;
    setPlayerHands(newHands);

    if (val.isBust) {
      sound.playLose();
      triggerCrupierEvent('bj_bust', { playerScore: val.total });
    }

    setTimeout(() => {
      advanceToNextHandOrDealer(newHands, activeHandIndex);
    }, 600);
  };

  // Player action: SPLIT (Dividir)
  const handleSplit = () => {
    if (phase !== 'player_turn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand || !canSplitHand(currentHand, userProfile.bankroll)) return;

    const newBankroll = userProfile.bankroll - currentHand.bet;
    onUpdateProfile({ bankroll: newBankroll });

    sound.playChip();
    triggerHaptic('medium');
    triggerCrupierEvent('bj_split', { betAmount: currentHand.bet });

    const [card1, card2] = currentHand.cards;
    const newCardForHand1 = drawCard(true);
    const newCardForHand2 = drawCard(true);

    const hand1: BlackjackHand = {
      id: `hand_split_1_${Date.now()}`,
      cards: [card1, newCardForHand1],
      bet: currentHand.bet,
      isDoubled: false,
      isStood: false,
      isBust: false,
      isFromSplit: true,
      status: 'playing',
      payout: 0,
    };

    const hand2: BlackjackHand = {
      id: `hand_split_2_${Date.now()}`,
      cards: [card2, newCardForHand2],
      bet: currentHand.bet,
      isDoubled: false,
      isStood: false,
      isBust: false,
      isFromSplit: true,
      status: 'playing',
      payout: 0,
    };

    setPlayerHands([hand1, hand2]);
    setActiveHandIndex(0);
    sound.playCardDeal();
  };

  // Transition between multiple hands or dealer turn
  const advanceToNextHandOrDealer = (hands: BlackjackHand[], currentIdx: number) => {
    if (currentIdx + 1 < hands.length) {
      setActiveHandIndex(currentIdx + 1);
    } else {
      const allBusted = hands.every(h => h.isBust);
      if (allBusted) {
        sound.playCardFlip();
        const revealed = dealerCards.map(c => ({ ...c, faceUp: true }));
        setDealerCards(revealed);
        setDealerRevealed(true);
        handleFinishRound(hands, revealed);
      } else {
        startDealerTurn(hands);
      }
    }
  };

  // Dealer Turn with Realistic Soft 17 logic and delays
  const startDealerTurn = (hands: BlackjackHand[]) => {
    setPhase('dealer_turn');

    sound.playCardFlip();
    triggerHaptic('light');

    let currentDealerCards: StandardCard[] = dealerCards.map(c => ({ ...c, faceUp: true }));
    setDealerCards(currentDealerCards);
    setDealerRevealed(true);

    const runDealerCycle = () => {
      if (shouldDealerHit(currentDealerCards)) {
        setTimeout(() => {
          sound.playCardDeal();
          triggerHaptic('light');
          const newCard: StandardCard = drawCard(true);
          currentDealerCards = [...currentDealerCards, newCard];
          setDealerCards(currentDealerCards);
          runDealerCycle();
        }, 700);
      } else {
        setTimeout(() => {
          handleFinishRound(hands, currentDealerCards);
        }, 600);
      }
    };

    setTimeout(() => {
      runDealerCycle();
    }, 600);
  };

  // Finalize round, evaluate payouts, fire confetti and crupier
  const handleFinishRound = (hands: BlackjackHand[], finalDealerCards: StandardCard[]) => {
    let totalReturn = 0;
    let netProfit = 0;
    let anyBlackjack = false;
    let anyWin = false;
    let anyPush = false;
    let anyDealerBust = false;

    const evaluatedHands = hands.map(hand => {
      const evalRes = evaluateOutcome(hand, finalDealerCards);
      totalReturn += evalRes.payout;
      netProfit += evalRes.profit;

      if (evalRes.outcome === 'blackjack') anyBlackjack = true;
      if (evalRes.outcome === 'won' || evalRes.outcome === 'blackjack') anyWin = true;
      if (evalRes.outcome === 'push') anyPush = true;
      if (finalDealerCards.length > 2 && calculateHandValue(finalDealerCards).isBust) {
        anyDealerBust = true;
      }

      return {
        ...hand,
        status: evalRes.outcome,
        payout: evalRes.payout,
      };
    });

    setPlayerHands(evaluatedHands);
    setPhase('round_over');

    // Update user stats and bankroll
    const newBankroll = userProfile.bankroll + totalReturn;
    const bjStats = { ...userProfile.stats.blackjack };
    bjStats.gamesPlayed += 1;
    if (netProfit > 0) bjStats.gamesWon += 1;
    bjStats.totalProfit += netProfit;
    if (netProfit > bjStats.bestWin) bjStats.bestWin = netProfit;

    const newWeeklyScore = Math.max(0, userProfile.weeklyScore + (netProfit > 0 ? netProfit * 2 : 0));

    onUpdateProfile({
      bankroll: newBankroll,
      weeklyScore: newWeeklyScore,
      stats: {
        ...userProfile.stats,
        blackjack: bjStats,
      },
    });

    const dVal = calculateHandValue(finalDealerCards);
    const pVal = calculateHandValue(hands[0].cards);

    if (anyBlackjack) {
      sound.playWin();
      triggerHaptic('success');
      setBannerMessage('¡¡BLACKJACK!! Pago 3 a 2');
      setBannerType('blackjack');
      triggerCrupierEvent('bj_player_blackjack', { playerScore: 21, dealerScore: dVal.total });
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#ffffff'],
      });
    } else if (dVal.isBlackjack) {
      sound.playLose();
      triggerHaptic('warning');
      setBannerMessage('Blackjack de la Casa');
      setBannerType('lose');
      triggerCrupierEvent('bj_dealer_blackjack', { dealerScore: 21 });
    } else if (anyWin) {
      sound.playWin();
      triggerHaptic('success');
      if (anyDealerBust) {
        setBannerMessage('¡El Crupier se pasó de 21! Ganaste');
        triggerCrupierEvent('bj_dealer_bust', { dealerScore: dVal.total });
      } else {
        setBannerMessage(`¡Mano Ganadora! +${formatMoney(netProfit)}`);
        triggerCrupierEvent('player_win', { playerScore: pVal.total, dealerScore: dVal.total });
      }
      setBannerType('win');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } else if (anyPush) {
      triggerHaptic('light');
      setBannerMessage('Empate - Apuesta recuperada');
      setBannerType('push');
      triggerCrupierEvent('bj_push', { playerScore: pVal.total, dealerScore: dVal.total });
    } else {
      sound.playLose();
      triggerHaptic('warning');
      setBannerMessage('La Casa Gana esta ronda');
      setBannerType('lose');
      triggerCrupierEvent('player_loss', { playerScore: pVal.total, dealerScore: dVal.total });
    }
  };

  const handleNewRound = () => {
    setPlayerHands([]);
    setDealerCards([]);
    setDealerRevealed(false);
    setBannerMessage(null);
    setBannerType(null);
    setActiveHandIndex(0);
    setPhase('betting');
  };

  const activeHand = playerHands[activeHandIndex];
  const dealerVal = calculateHandValue(dealerRevealed ? dealerCards : dealerCards.slice(0, 1));
  const isSplitAvailable = activeHand && canSplitHand(activeHand, userProfile.bankroll) && playerHands.length === 1;
  const isDoubleAvailable = activeHand && canDoubleDown(activeHand, userProfile.bankroll);

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden table-felt-${userProfile.tableTheme} safe-top safe-bottom text-white select-none`}
    >
      {/* Top Bar Header */}
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
              <span className="text-sm font-black tracking-wide text-amber-400">BLACKJACK 21</span>
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                6 Barajas
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Paga 3:2 • Crupier pide con 17 suave</p>
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
            onClick={() => setShowRules(true)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 active:scale-95"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Crupier Animated Interactive Header Bar */}
      <CrupierView
        game="blackjack"
        event={crupierEvent}
        context={crupierContext}
        personality={userProfile.crupierPersonality}
        onPersonalityChange={(newP) => onUpdateProfile({ crupierPersonality: newP })}
        compact={true}
      />

      {/* Main Playing Felt Arena */}
      <div className="flex-1 flex flex-col justify-around px-2 sm:px-4 py-1 relative overflow-y-auto">
        {/* Dealer Section */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
              Crupier
            </span>
            {dealerCards.length > 0 && (
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-neutral-800/90 border border-amber-400 text-amber-300 font-mono shadow">
                {dealerRevealed ? (
                  dealerVal.isBust ? '¡Se pasó!' : dealerVal.isSoft ? `${dealerVal.total} (Suave)` : dealerVal.total
                ) : (
                  `${dealerVal.total} + ?`
                )}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-h-[96px]">
            {dealerCards.map(card => (
              <StandardCardView
                key={card.id}
                card={card}
                backTheme={userProfile.cardBackTheme}
                className="transition-all transform hover:-translate-y-1 shadow-xl"
              />
            ))}
            {dealerCards.length === 0 && (
              <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-neutral-400 text-[10px] text-center p-1">
                Lugar de la Banca
              </div>
            )}
          </div>
        </div>

        {/* Center Table Status / Result Notification Banner */}
        <div className="my-1 flex flex-col items-center justify-center min-h-[36px]">
          {bannerMessage && (
            <div
              className={`px-4 py-1.5 rounded-full font-black text-xs sm:text-sm tracking-wide shadow-2xl animate-bounce flex items-center gap-1.5 border ${
                bannerType === 'blackjack'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 border-amber-300'
                  : bannerType === 'win'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white border-emerald-300'
                  : bannerType === 'push'
                  ? 'bg-neutral-800 text-neutral-200 border-neutral-600'
                  : 'bg-red-900/90 text-red-200 border-red-500'
              }`}
            >
              {bannerType === 'blackjack' && <Sparkles className="w-4 h-4" />}
              {bannerType === 'win' && <Award className="w-4 h-4" />}
              {bannerType === 'lose' && <ShieldAlert className="w-4 h-4" />}
              {bannerMessage}
            </div>
          )}
        </div>

        {/* Player Hands Section (Supports Splitting into 2 hands) */}
        <div className="flex flex-col items-center">
          <div className="w-full flex items-center justify-center gap-4">
            {playerHands.map((hand, idx) => {
              const isActive = phase === 'player_turn' && activeHandIndex === idx;
              const hVal = calculateHandValue(hand.cards);

              return (
                <div
                  key={hand.id}
                  className={`flex flex-col items-center p-2 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-amber-500/15 ring-2 ring-amber-400 shadow-lg shadow-amber-400/20'
                      : playerHands.length > 1
                      ? 'opacity-75 bg-black/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                      {playerHands.length > 1 ? `Mano ${idx + 1}` : 'Tu Mano'}
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full font-mono shadow border ${
                        hVal.isBust
                          ? 'bg-red-900/80 text-red-300 border-red-500'
                          : hVal.isBlackjack
                          ? 'bg-amber-500 text-neutral-950 border-amber-300'
                          : 'bg-neutral-800/90 text-amber-300 border-amber-400'
                      }`}
                    >
                      {hVal.isBust ? '¡Te pasaste!' : hVal.isSoft ? `${hVal.total} (Suave)` : hVal.total}
                    </span>
                    <span className="text-[11px] font-bold text-amber-400 font-mono">
                      ${hand.bet}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-h-[96px]">
                    {hand.cards.map(card => (
                      <StandardCardView
                        key={card.id}
                        card={card}
                        backTheme={userProfile.cardBackTheme}
                        className="shadow-xl"
                      />
                    ))}
                  </div>

                  {hand.status !== 'playing' && hand.status !== 'standing' && hand.status !== 'betting' && (
                    <div className="mt-1 text-[11px] font-black uppercase tracking-wider">
                      {hand.status === 'won' && <span className="text-emerald-400">+${hand.payout}</span>}
                      {hand.status === 'blackjack' && <span className="text-amber-400">BJ +${hand.payout}</span>}
                      {hand.status === 'push' && <span className="text-neutral-300">Empate</span>}
                      {hand.status === 'lost' && <span className="text-red-400">Pierde</span>}
                      {hand.status === 'bust' && <span className="text-red-400">Busto</span>}
                    </div>
                  )}
                </div>
              );
            })}

            {playerHands.length === 0 && (
              <div className="flex flex-col items-center">
                <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-neutral-400 text-[10px] text-center p-1">
                  Tu Lugar
                </div>
                <span className="text-[11px] text-neutral-400 mt-2">Coloca tus fichas abajo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <footer className="w-full bg-neutral-950/85 border-t border-white/10 backdrop-blur-xl p-2.5 z-30">
        {phase === 'betting' && (
          <div className="flex flex-col gap-2 max-w-lg mx-auto">
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 font-medium">Apuesta Actual:</span>
                <span className="font-extrabold text-amber-400 font-mono text-sm">
                  ${currentBet.toLocaleString('es-MX')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearBet}
                  disabled={currentBet === 0}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 text-[11px] font-medium text-neutral-300"
                >
                  Limpiar
                </button>
                {previousBet > 0 && (
                  <button
                    onClick={handleRepeatBet}
                    className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[11px] font-bold text-amber-300"
                  >
                    Repetir (${previousBet})
                  </button>
                )}
                <button
                  onClick={handleAllIn}
                  className="px-2 py-0.5 rounded bg-red-600/30 border border-red-500/40 text-[11px] font-bold text-red-300"
                >
                  All-In
                </button>
              </div>
            </div>

            <div className="flex items-center justify-around py-1">
              {[10, 25, 50, 100, 500].map(val => (
                <div key={val} className="flex flex-col items-center">
                  <ChipView
                    value={val}
                    onClick={() => handleAddChip(val)}
                    size="md"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleDeal}
              disabled={currentBet <= 0}
              className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                currentBet > 0
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-neutral-950 active:scale-95 shadow-amber-500/30'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              Repartir Mano (${currentBet})
            </button>
          </div>
        )}

        {phase === 'player_turn' && activeHand && (
          <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
            <button
              onClick={handleHit}
              className="py-3.5 px-1 rounded-2xl bg-gradient-to-b from-emerald-500 to-green-700 hover:from-emerald-400 hover:to-green-600 font-black text-xs uppercase tracking-tight flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-700/40 active:scale-95 transition-transform cursor-pointer"
            >
              <span className="text-base leading-none">➕</span>
              <span>Pedir</span>
            </button>

            <button
              onClick={handleStand}
              className="py-3.5 px-1 rounded-2xl bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 font-black text-xs uppercase tracking-tight flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-700/40 active:scale-95 transition-transform cursor-pointer"
            >
              <span className="text-base leading-none">🛑</span>
              <span>Plantarse</span>
            </button>

            <button
              onClick={handleDoubleDown}
              disabled={!isDoubleAvailable}
              className={`py-3.5 px-1 rounded-2xl font-black text-xs uppercase tracking-tight flex flex-col items-center justify-center gap-1 shadow-lg transition-transform cursor-pointer ${
                isDoubleAvailable
                  ? 'bg-gradient-to-b from-amber-500 to-yellow-700 text-neutral-950 active:scale-95 shadow-amber-500/30'
                  : 'bg-neutral-800/80 text-neutral-500 border border-neutral-700/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-base leading-none">⚡</span>
              <span>Doblar</span>
            </button>

            <button
              onClick={handleSplit}
              disabled={!isSplitAvailable}
              className={`py-3.5 px-1 rounded-2xl font-black text-xs uppercase tracking-tight flex flex-col items-center justify-center gap-1 shadow-lg transition-transform cursor-pointer ${
                isSplitAvailable
                  ? 'bg-gradient-to-b from-purple-600 to-indigo-800 text-white active:scale-95 shadow-purple-600/30 ring-2 ring-purple-400'
                  : 'bg-neutral-800/80 text-neutral-500 border border-neutral-700/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-base leading-none">✂️</span>
              <span>Dividir</span>
            </button>
          </div>
        )}

        {phase === 'dealer_turn' && (
          <div className="py-3 text-center text-xs font-bold text-amber-300 animate-pulse flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            Turno del Crupier... evaluando mesa
          </div>
        )}

        {phase === 'round_over' && (
          <div className="flex gap-2 max-w-md mx-auto">
            <button
              onClick={handleNewRound}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 font-black text-neutral-950 uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Siguiente Mano
            </button>
          </div>
        )}
      </footer>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-5 max-w-sm w-full text-white shadow-2xl">
            <h3 className="text-base font-bold text-amber-400 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" /> Reglas de Blackjack 21
            </h3>
            <ul className="text-xs text-neutral-300 space-y-2 mb-4 leading-relaxed">
              <li>• <strong>Objetivo:</strong> Vencer al crupier sumando lo más cercano a 21 sin pasarse.</li>
              <li>• <strong>Valores:</strong> Cartas numéricas su valor nominal, figuras (J, Q, K) valen 10, y el As vale 11 o 1.</li>
              <li>• <strong>Blackjack Natural:</strong> Un As y un 10 en las dos primeras cartas paga <strong>3 a 2</strong>.</li>
              <li>• <strong>Regla del Crupier:</strong> El crupier pide obligatoriamente con 16 o menos y con <strong>17 Suave</strong> (Ace contando como 11). Se planta con 17 Duro y 18+.</li>
              <li>• <strong>Doblar:</strong> Duplica tu apuesta y recibe exactamente una carta adicional.</li>
              <li>• <strong>Dividir:</strong> Si tienes dos cartas iguales, puedes dividirlas en dos manos independientes.</li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 font-bold text-amber-300 border border-amber-400/40 text-xs active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
