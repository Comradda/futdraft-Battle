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
  Wifi,
  Music,
  Glasses,
} from 'lucide-react';
import type { UserProfile, StandardCard, CrupierMood } from '../../types/casino';
import { CrupierAvatar } from '../crupier/CrupierAvatar';
import { DealerSelectModal } from '../modals/DealerSelectModal';
import { TouchChipTray } from '../common/TouchChipTray';
import {
  PERSONALITY_CONFIGS,
  getCrupierDialogue,
  type CrupierContext,
} from '../../utils/crupierAI';
import { StandardCardView } from '../common/CardView';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { formatMoney } from '../../utils/storage';
import { multiplayer } from '../../utils/multiplayer';
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

  // Single-player Hands state
  const [playerHands, setPlayerHands] = useState<BlackjackHand[]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState<number>(0);

  // Dealer cards
  const [dealerCards, setDealerCards] = useState<StandardCard[]>([]);
  const [dealerRevealed, setDealerRevealed] = useState<boolean>(false);

  // Local betting
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [previousBet, setPreviousBet] = useState<number>(0);

  // Banner & Outcome
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<'win' | 'lose' | 'push' | 'blackjack' | null>(null);

  // Crupier dialogue event & context
  const [_crupierEvent, setCrupierEvent] = useState<string>('game_start');
  const [crupierContext, setCrupierContext] = useState<CrupierContext>({
    betAmount: 0,
    bankroll: userProfile.bankroll,
  });

  // Table Crupier Live State
  const [dealerSpeech, setDealerSpeech] = useState<string>('');
  const [isDealerSpeaking, setIsDealerSpeaking] = useState<boolean>(false);
  const [showDealerModal, setShowDealerModal] = useState<boolean>(false);
  const [showSunglasses, setShowSunglasses] = useState<boolean>(false);
  const [isMusicActive, setIsMusicActive] = useState<boolean>(() => sound.isMusicPlaying());
  const dealerSpeechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rules modal
  const [showRules, setShowRules] = useState<boolean>(false);

  // ========================================================
  // MULTIPLAYER LIVE P2P STATE (2 PLAYERS AT SAME TABLE)
  // ========================================================
  const [isP2P, setIsP2P] = useState<boolean>(multiplayer.getStatus() === 'connected');
  const isHost = multiplayer.getIsHost();
  const remotePlayer = multiplayer.getRemotePlayer();

  // Seat 1 = Host, Seat 2 = Guest
  const [seat1Bet, setSeat1Bet] = useState<number>(0);
  const [seat2Bet, setSeat2Bet] = useState<number>(0);
  const [seat1Cards, setSeat1Cards] = useState<StandardCard[]>([]);
  const [seat2Cards, setSeat2Cards] = useState<StandardCard[]>([]);
  const [activeSeatTurn, setActiveSeatTurn] = useState<'seat1' | 'seat2' | 'dealer' | 'none'>('none');
  const [seat1Status, setSeat1Status] = useState<string>('betting');
  const [seat2Status, setSeat2Status] = useState<string>('betting');
  const [seat1Payout, setSeat1Payout] = useState<number>(0);
  const [seat2Payout, setSeat2Payout] = useState<number>(0);

  // Refs to access latest state inside async callbacks & listeners
  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;
  const seat1CardsRef = useRef(seat1Cards);
  seat1CardsRef.current = seat1Cards;
  const seat2CardsRef = useRef(seat2Cards);
  seat2CardsRef.current = seat2Cards;
  const seat1BetRef = useRef(seat1Bet);
  seat1BetRef.current = seat1Bet;
  const seat2BetRef = useRef(seat2Bet);
  seat2BetRef.current = seat2Bet;
  const dealerCardsRef = useRef(dealerCards);
  dealerCardsRef.current = dealerCards;
  const seat1StatusRef = useRef(seat1Status);
  seat1StatusRef.current = seat1Status;
  const seat2StatusRef = useRef(seat2Status);
  seat2StatusRef.current = seat2Status;

  // Initialize shoe
  useEffect(() => {
    if (shoeRef.current.length < 52) {
      shoeRef.current = createShoe(6);
    }
  }, []);

  const triggerCrupierEvent = (eventName: string, context?: CrupierContext) => {
    setCrupierEvent(eventName);
    const effectiveContext = context || crupierContext;
    if (context) setCrupierContext(context);

    const dialogue = getCrupierDialogue('blackjack', eventName, effectiveContext, userProfile.crupierPersonality);
    setDealerSpeech(dialogue.text);
    setIsDealerSpeaking(true);

    if (dealerSpeechTimeoutRef.current) clearTimeout(dealerSpeechTimeoutRef.current);
    dealerSpeechTimeoutRef.current = setTimeout(() => {
      setIsDealerSpeaking(false);
    }, 4500);

    if (userProfile.soundEnabled) {
      sound.speakDealer(dialogue.text, userProfile.crupierPersonality);

      const isLossEvent =
        dialogue.mood === 'laughing' ||
        (userProfile.crupierPersonality === 'burlona' && dialogue.mood === 'smirk') ||
        eventName.includes('loss') ||
        eventName.includes('bust') ||
        eventName === 'bj_dealer_blackjack';

      const isWinEvent =
        eventName === 'player_win' ||
        eventName === 'bj_player_blackjack';

      if (isLossEvent) {
        const isFemale = PERSONALITY_CONFIGS[userProfile.crupierPersonality]?.gender !== 'male';
        setTimeout(() => {
          sound.playDealerLaugh(isFemale);
        }, 350);
      } else if (isWinEvent) {
        sound.playCashRegister();
      }
    }
  };

  // Welcome line on mount / dealer change
  useEffect(() => {
    const welcome = getCrupierDialogue('blackjack', 'game_start', crupierContext, userProfile.crupierPersonality);
    setDealerSpeech(welcome.text);
    setIsDealerSpeaking(true);
    if (userProfile.soundEnabled) {
      sound.speakDealer(welcome.text, userProfile.crupierPersonality);
    }
    const t = setTimeout(() => setIsDealerSpeaking(false), 3500);
    return () => clearTimeout(t);
  }, [userProfile.crupierPersonality]);

  // Draw card from shoe with auto-reshuffle
  const drawCard = (faceUp = true): StandardCard => {
    if (shoeRef.current.length < 52) {
      shoeRef.current = createShoe(6);
    }
    const card = shoeRef.current.pop()!;
    return { ...card, faceUp };
  };

  // ========================================================
  // MULTIPLAYER MESSAGE DISPATCHER & LISTENER
  // ========================================================
  useEffect(() => {
    const unsubStatus = multiplayer.onStatusChange((s) => {
      setIsP2P(s === 'connected');
    });

    const unsubMsg = multiplayer.onMessage((msg) => {
      if (msg.type !== 'GAME_ACTION' || !msg.payload) return;
      const { action } = msg.payload;

      if (action === 'BJ_BET') {
        const { seat, betAmount } = msg.payload;
        if (seat === 1) setSeat1Bet(betAmount);
        if (seat === 2) setSeat2Bet(betAmount);
        sound.playChip();
        triggerHaptic('light');
      } else if (action === 'BJ_START_DEAL') {
        const { seat2Bet: s2B } = msg.payload;
        if (s2B > 0) {
          onUpdateProfile({ bankroll: userProfileRef.current.bankroll - s2B });
          setPreviousBet(s2B);
        }
        setPhase('dealing');
        setBannerMessage(null);
        setBannerType(null);
        setDealerRevealed(false);
      } else if (action === 'BJ_DEAL_RESULT') {
        const {
          seat1Cards: s1,
          seat2Cards: s2,
          dealerCards: d,
          seat1Status: st1,
          seat2Status: st2,
          activeSeatTurn: turn,
        } = msg.payload;
        setSeat1Cards(s1);
        setSeat2Cards(s2);
        setDealerCards(d);
        setSeat1Status(st1);
        setSeat2Status(st2);
        setActiveSeatTurn(turn);
        setPhase(turn === 'dealer' ? 'dealer_turn' : 'player_turn');
        sound.playCardDeal();
      } else if (action === 'BJ_UPDATE_SEAT') {
        const { seat, cards, status, newBet, activeSeatTurn: nextTurn } = msg.payload;
        if (seat === 1) {
          setSeat1Cards(cards);
          setSeat1Status(status);
          if (newBet) setSeat1Bet(newBet);
        } else {
          setSeat2Cards(cards);
          setSeat2Status(status);
          if (newBet) setSeat2Bet(newBet);
        }
        setActiveSeatTurn(nextTurn);
        if (nextTurn === 'dealer') setPhase('dealer_turn');
        sound.playCardDeal();
      } else if (action === 'BJ_GUEST_ACTION_REQ' && isHost) {
        handleHostProcessGuestAction(msg.payload.subAction);
      } else if (action === 'BJ_DEALER_REVEAL') {
        setDealerCards(msg.payload.dealerCards);
        setDealerRevealed(true);
        sound.playCardFlip();
      } else if (action === 'BJ_DEALER_HIT') {
        setDealerCards(msg.payload.dealerCards);
        sound.playCardDeal();
      } else if (action === 'BJ_ROUND_FINISH') {
        const { seat1Eval: s1Res, seat2Eval: s2Res, finalDealerCards: finalD } = msg.payload;
        setDealerCards(finalD);
        setDealerRevealed(true);
        setSeat1Status(s1Res.outcome);
        setSeat1Payout(s1Res.payout);
        if (s2Res) {
          setSeat2Status(s2Res.outcome);
          setSeat2Payout(s2Res.payout);
          // Apply result for local guest
          applyP2PResult(s2Res);
        }
        setPhase('round_over');
      } else if (action === 'BJ_RESET') {
        setSeat1Cards([]);
        setSeat2Cards([]);
        setDealerCards([]);
        setDealerRevealed(false);
        setBannerMessage(null);
        setBannerType(null);
        setSeat1Status('betting');
        setSeat2Status('betting');
        setActiveSeatTurn('none');
        setPhase('betting');
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, [isHost, userProfile.bankroll]);

  // Host evaluates and processes guest action requests
  const handleHostProcessGuestAction = (subAction: 'hit' | 'stand' | 'double') => {
    const currentS2Cards = seat2CardsRef.current;
    const currentS2Bet = seat2BetRef.current;
    const currentS1Cards = seat1CardsRef.current;
    const currentDealer = dealerCardsRef.current;
    const currentS1St = seat1StatusRef.current;

    if (subAction === 'hit') {
      const nextCard = drawCard(true);
      const updatedCards = [...currentS2Cards, nextCard];
      const val = calculateHandValue(updatedCards);
      setSeat2Cards(updatedCards);

      let nextTurn: 'seat2' | 'dealer' = 'seat2';
      let nextStatus = 'playing';

      if (val.isBust) {
        nextStatus = 'bust';
        nextTurn = 'dealer';
      } else if (val.total === 21) {
        nextStatus = 'standing';
        nextTurn = 'dealer';
      }

      setSeat2Status(nextStatus);
      setActiveSeatTurn(nextTurn);
      if (nextTurn === 'dealer') setPhase('dealer_turn');

      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: userProfile.id,
        senderName: userProfile.name,
        payload: {
          action: 'BJ_UPDATE_SEAT',
          seat: 2,
          cards: updatedCards,
          status: nextStatus,
          activeSeatTurn: nextTurn,
        },
        timestamp: Date.now(),
      });

      if (nextTurn === 'dealer') {
        setTimeout(() => {
          startP2PDealerTurn(currentS1Cards, updatedCards, currentDealer, currentS1St, nextStatus);
        }, 800);
      }
    } else if (subAction === 'stand') {
      setSeat2Status('standing');
      setActiveSeatTurn('dealer');
      setPhase('dealer_turn');

      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: userProfile.id,
        senderName: userProfile.name,
        payload: {
          action: 'BJ_UPDATE_SEAT',
          seat: 2,
          cards: currentS2Cards,
          status: 'standing',
          activeSeatTurn: 'dealer',
        },
        timestamp: Date.now(),
      });

      setTimeout(() => {
        startP2PDealerTurn(currentS1Cards, currentS2Cards, currentDealer, currentS1St, 'standing');
      }, 800);
    } else if (subAction === 'double') {
      const doubledBet = currentS2Bet * 2;
      setSeat2Bet(doubledBet);
      const nextCard = drawCard(true);
      const updatedCards = [...currentS2Cards, nextCard];
      const val = calculateHandValue(updatedCards);
      setSeat2Cards(updatedCards);
      const nextStatus = val.isBust ? 'bust' : 'standing';
      setSeat2Status(nextStatus);
      setActiveSeatTurn('dealer');
      setPhase('dealer_turn');

      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: userProfile.id,
        senderName: userProfile.name,
        payload: {
          action: 'BJ_UPDATE_SEAT',
          seat: 2,
          cards: updatedCards,
          status: nextStatus,
          newBet: doubledBet,
          activeSeatTurn: 'dealer',
        },
        timestamp: Date.now(),
      });

      setTimeout(() => {
        startP2PDealerTurn(currentS1Cards, updatedCards, currentDealer, currentS1St, nextStatus);
      }, 800);
    }
  };

  // ========================================================
  // BETTING CONTROLS
  // ========================================================
  const handleAddChip = (amount: number) => {
    if (phase !== 'betting') return;
    const availableBankroll = userProfileRef.current.bankroll;
    setCurrentBet((prevBet) => {
      if (availableBankroll < prevBet + amount) {
        triggerHaptic('warning');
        return prevBet;
      }
      const nextBet = prevBet + amount;
      triggerHaptic('light');

      if (isP2P) {
        if (isHost) {
          setSeat1Bet(nextBet);
        } else {
          setSeat2Bet(nextBet);
        }
        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: { action: 'BJ_BET', seat: isHost ? 1 : 2, betAmount: nextBet },
          timestamp: Date.now(),
        });
      }
      return nextBet;
    });
  };

  const handleClearBet = () => {
    if (phase !== 'betting') return;
    setCurrentBet(0);
    triggerHaptic('light');

    if (isP2P) {
      if (isHost) {
        setSeat1Bet(0);
      } else {
        setSeat2Bet(0);
      }
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: userProfile.id,
        senderName: userProfile.name,
        payload: { action: 'BJ_BET', seat: isHost ? 1 : 2, betAmount: 0 },
        timestamp: Date.now(),
      });
    }
  };

  const handleRepeatBet = () => {
    if (phase !== 'betting') return;
    if (previousBet > 0 && userProfile.bankroll >= previousBet) {
      setCurrentBet(previousBet);
      triggerHaptic('medium');
      sound.playChip();

      if (isP2P) {
        if (isHost) {
          setSeat1Bet(previousBet);
        } else {
          setSeat2Bet(previousBet);
        }
        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: { action: 'BJ_BET', seat: isHost ? 1 : 2, betAmount: previousBet },
          timestamp: Date.now(),
        });
      }
    }
  };

  const handleAllIn = () => {
    if (phase !== 'betting') return;
    if (userProfile.bankroll > 0) {
      const allInAmt = userProfile.bankroll;
      setCurrentBet(allInAmt);
      triggerHaptic('heavy');
      sound.playChip();

      if (isP2P) {
        if (isHost) {
          setSeat1Bet(allInAmt);
        } else {
          setSeat2Bet(allInAmt);
        }
        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: { action: 'BJ_BET', seat: isHost ? 1 : 2, betAmount: allInAmt },
          timestamp: Date.now(),
        });
      }
    }
  };

  // ========================================================
  // DEALING (SINGLE-PLAYER & MULTIPLAYER)
  // ========================================================
  const handleDeal = async () => {
    if (phase !== 'betting') return;

    if (isP2P) {
      // Multiplayer Deal: Host is the dealer authority
      if (!isHost) return;
      if (seat1Bet <= 0) return;
      if (userProfile.bankroll < seat1Bet) {
        if (onOpenRechargeModal) onOpenRechargeModal();
        return;
      }

      // Deduct Host bet
      const newBankroll = userProfile.bankroll - seat1Bet;
      onUpdateProfile({ bankroll: newBankroll });
      setPreviousBet(seat1Bet);

      setBannerMessage(null);
      setBannerType(null);
      setDealerRevealed(false);
      setPhase('dealing');

      // Command Guest to deduct their bet & enter dealing phase
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: userProfile.id,
        senderName: userProfile.name,
        payload: { action: 'BJ_START_DEAL', seat1Bet, seat2Bet },
        timestamp: Date.now(),
      });

      triggerCrupierEvent('bj_deal', {
        betAmount: seat1Bet,
        bankroll: newBankroll,
        isHighBet: seat1Bet >= 100,
        isLowBet: seat1Bet <= 10,
      });

      sound.playCardDeal();
      triggerHaptic('medium');

      // Deal cards sequentially: Seat 1, Seat 2, Dealer
      const s1c1 = drawCard(true);
      const s2c1 = seat2Bet > 0 ? drawCard(true) : null;
      const dc1 = drawCard(true);
      const s1c2 = drawCard(true);
      const s2c2 = seat2Bet > 0 ? drawCard(true) : null;
      const dc2 = drawCard(false);

      setSeat1Cards([s1c1]);
      if (s2c1) setSeat2Cards([s2c1]);
      setDealerCards([dc1]);

      setTimeout(() => {
        sound.playCardDeal();
        const finalS1 = [s1c1, s1c2];
        const finalS2 = s2c1 && s2c2 ? [s2c1, s2c2] : [];
        const finalD = [dc1, dc2];

        setSeat1Cards(finalS1);
        setSeat2Cards(finalS2);
        setDealerCards(finalD);

        const s1Val = calculateHandValue(finalS1);
        const s2Val = finalS2.length > 0 ? calculateHandValue(finalS2) : null;
        const dVal = calculateHandValue([dc1, { ...dc2, faceUp: true }]);

        if (dVal.isBlackjack) {
          setTimeout(() => {
            handleP2PDealerBlackjack(finalS1, finalS2, finalD);
          }, 800);
          return;
        }

        let initialS1Status = 'playing';
        let initialS2Status = finalS2.length > 0 ? 'playing' : 'empty';

        if (s1Val.isBlackjack) initialS1Status = 'blackjack';
        if (s2Val?.isBlackjack) initialS2Status = 'blackjack';

        setSeat1Status(initialS1Status);
        setSeat2Status(initialS2Status);

        let firstTurn: 'seat1' | 'seat2' | 'dealer' = 'dealer';
        if (initialS1Status === 'playing') {
          firstTurn = 'seat1';
        } else if (initialS2Status === 'playing') {
          firstTurn = 'seat2';
        }

        setActiveSeatTurn(firstTurn);
        setPhase(firstTurn === 'dealer' ? 'dealer_turn' : 'player_turn');

        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: {
            action: 'BJ_DEAL_RESULT',
            seat1Cards: finalS1,
            seat2Cards: finalS2,
            dealerCards: finalD,
            seat1Status: initialS1Status,
            seat2Status: initialS2Status,
            activeSeatTurn: firstTurn,
          },
          timestamp: Date.now(),
        });

        if (firstTurn === 'dealer') {
          setTimeout(() => {
            startP2PDealerTurn(finalS1, finalS2, finalD, initialS1Status, initialS2Status);
          }, 800);
        }
      }, 600);
    } else {
      // Single-player Deal
      if (currentBet <= 0) return;
      if (userProfile.bankroll < currentBet) {
        if (onOpenRechargeModal) onOpenRechargeModal();
        return;
      }

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

      sound.playCardDeal();
      triggerHaptic('medium');

      const pCard1 = drawCard(true);
      const dCard1 = drawCard(true);
      const pCard2 = drawCard(true);
      const dCard2 = drawCard(false);

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
    }
  };

  // Immediate showdown for natural Blackjack in single player
  const handleImmediateShowdown = (
    playerCards: StandardCard[],
    dealerHandCards: StandardCard[],
    bet: number
  ) => {
    sound.playCardFlip();
    const revealedDealer = dealerHandCards.map((c) => ({ ...c, faceUp: true }));
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
      result.outcome === 'won'
        ? 'win'
        : result.outcome === 'blackjack'
        ? 'blackjack'
        : result.outcome === 'push'
        ? 'push'
        : 'lose';
    setBannerType(mappedType);

    const updatedHand = { ...initialHand, status: result.outcome, payout: result.payout };
    setPlayerHands([updatedHand]);

    handleFinishRound([updatedHand], revealedDealer);
  };

  // Immediate showdown for dealer Blackjack in multiplayer
  const handleP2PDealerBlackjack = (s1: StandardCard[], s2: StandardCard[], d: StandardCard[]) => {
    sound.playCardFlip();
    const revealedDealer = d.map((c) => ({ ...c, faceUp: true }));
    setDealerCards(revealedDealer);
    setDealerRevealed(true);

    const s1Hand: BlackjackHand = {
      id: 's1',
      cards: s1,
      bet: seat1Bet,
      isDoubled: false,
      isStood: true,
      isBust: false,
      isFromSplit: false,
      status: 'playing',
      payout: 0,
    };
    const s1Eval = evaluateOutcome(s1Hand, revealedDealer);

    let s2Eval = null;
    if (s2.length > 0 && seat2Bet > 0) {
      const s2Hand: BlackjackHand = {
        id: 's2',
        cards: s2,
        bet: seat2Bet,
        isDoubled: false,
        isStood: true,
        isBust: false,
        isFromSplit: false,
        status: 'playing',
        payout: 0,
      };
      s2Eval = evaluateOutcome(s2Hand, revealedDealer);
    }

    setSeat1Status(s1Eval.outcome);
    setSeat1Payout(s1Eval.payout);
    if (s2Eval) {
      setSeat2Status(s2Eval.outcome);
      setSeat2Payout(s2Eval.payout);
    }
    setPhase('round_over');

    applyP2PResult(s1Eval);

    multiplayer.send({
      type: 'GAME_ACTION',
      senderId: userProfile.id,
      senderName: userProfile.name,
      payload: {
        action: 'BJ_ROUND_FINISH',
        seat1Eval: s1Eval,
        seat2Eval: s2Eval,
        finalDealerCards: revealedDealer,
      },
      timestamp: Date.now(),
    });
  };

  // ========================================================
  // PLAYER ACTIONS (PEDIR, PLANTARSE, DOBLAR)
  // ========================================================
  const handleHit = () => {
    if (phase !== 'player_turn') return;

    if (isP2P) {
      if (isHost && activeSeatTurn === 'seat1') {
        const nextCard = drawCard(true);
        const updatedCards = [...seat1Cards, nextCard];
        const val = calculateHandValue(updatedCards);
        setSeat1Cards(updatedCards);
        sound.playCardDeal();

        let nextTurn: 'seat1' | 'seat2' | 'dealer' = 'seat1';
        let nextStatus = 'playing';

        if (val.isBust) {
          nextStatus = 'bust';
          sound.playLose();
          sound.playDealerLaugh(userProfile.crupierPersonality !== 'desafiante');
          triggerHaptic('warning');
          nextTurn = seat2Cards.length > 0 && seat2Status === 'playing' ? 'seat2' : 'dealer';
        } else if (val.total === 21) {
          nextStatus = 'standing';
          nextTurn = seat2Cards.length > 0 && seat2Status === 'playing' ? 'seat2' : 'dealer';
        }

        setSeat1Status(nextStatus);
        setActiveSeatTurn(nextTurn);
        if (nextTurn === 'dealer') setPhase('dealer_turn');

        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: {
            action: 'BJ_UPDATE_SEAT',
            seat: 1,
            cards: updatedCards,
            status: nextStatus,
            activeSeatTurn: nextTurn,
          },
          timestamp: Date.now(),
        });

        if (nextTurn === 'dealer') {
          setTimeout(() => {
            startP2PDealerTurn(updatedCards, seat2Cards, dealerCards, nextStatus, seat2Status);
          }, 800);
        }
      } else if (!isHost && activeSeatTurn === 'seat2') {
        sound.playChip();
        triggerHaptic('light');
        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: { action: 'BJ_GUEST_ACTION_REQ', subAction: 'hit' },
          timestamp: Date.now(),
        });
      }
    } else {
      // Single-player HIT
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
        sound.playDealerLaugh(userProfile.crupierPersonality !== 'desafiante');
        triggerHaptic('warning');
        triggerCrupierEvent('bj_bust', { playerScore: val.total });
        advanceToNextHandOrDealer(newHands, activeHandIndex);
      } else if (val.total === 21) {
        advanceToNextHandOrDealer(newHands, activeHandIndex);
      } else if (val.total >= 16) {
        triggerCrupierEvent('bj_hit_risky', { playerScore: val.total });
      }
    }
  };

  const handleStand = () => {
    if (phase !== 'player_turn') return;

    if (isP2P) {
      if (isHost && activeSeatTurn === 'seat1') {
        const nextTurn = seat2Cards.length > 0 && seat2Status === 'playing' ? 'seat2' : 'dealer';
        setSeat1Status('standing');
        setActiveSeatTurn(nextTurn);
        if (nextTurn === 'dealer') setPhase('dealer_turn');

        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: {
            action: 'BJ_UPDATE_SEAT',
            seat: 1,
            cards: seat1Cards,
            status: 'standing',
            activeSeatTurn: nextTurn,
          },
          timestamp: Date.now(),
        });

        if (nextTurn === 'dealer') {
          setTimeout(() => {
            startP2PDealerTurn(seat1Cards, seat2Cards, dealerCards, 'standing', seat2Status);
          }, 800);
        }
      } else if (!isHost && activeSeatTurn === 'seat2') {
        triggerHaptic('medium');
        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: { action: 'BJ_GUEST_ACTION_REQ', subAction: 'stand' },
          timestamp: Date.now(),
        });
      }
    } else {
      // Single-player STAND
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
    }
  };

  const handleDoubleDown = () => {
    if (phase !== 'player_turn') return;

    if (isP2P) {
      if (isHost && activeSeatTurn === 'seat1') {
        if (userProfile.bankroll < seat1Bet) return;
        const newBankroll = userProfile.bankroll - seat1Bet;
        onUpdateProfile({ bankroll: newBankroll });
        const doubledBet = seat1Bet * 2;
        setSeat1Bet(doubledBet);

        sound.playChip();
        triggerHaptic('heavy');
        const nextCard = drawCard(true);
        const updatedCards = [...seat1Cards, nextCard];
        const val = calculateHandValue(updatedCards);
        setSeat1Cards(updatedCards);
        const nextStatus = val.isBust ? 'bust' : 'standing';
        setSeat1Status(nextStatus);

        const nextTurn = seat2Cards.length > 0 && seat2Status === 'playing' ? 'seat2' : 'dealer';
        setActiveSeatTurn(nextTurn);
        if (nextTurn === 'dealer') setPhase('dealer_turn');

        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: {
            action: 'BJ_UPDATE_SEAT',
            seat: 1,
            cards: updatedCards,
            status: nextStatus,
            newBet: doubledBet,
            activeSeatTurn: nextTurn,
          },
          timestamp: Date.now(),
        });

        if (nextTurn === 'dealer') {
          setTimeout(() => {
            startP2PDealerTurn(updatedCards, seat2Cards, dealerCards, nextStatus, seat2Status);
          }, 800);
        }
      } else if (!isHost && activeSeatTurn === 'seat2') {
        if (userProfile.bankroll < seat2Bet) return;
        const newBankroll = userProfile.bankroll - seat2Bet;
        onUpdateProfile({ bankroll: newBankroll });
        sound.playChip();
        triggerHaptic('heavy');
        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: userProfile.id,
          senderName: userProfile.name,
          payload: { action: 'BJ_GUEST_ACTION_REQ', subAction: 'double' },
          timestamp: Date.now(),
        });
      }
    } else {
      // Single-player DOUBLE
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
    }
  };

  const handleSplit = () => {
    if (phase !== 'player_turn' || isP2P) return;
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

  // Transition between multiple hands or dealer turn in single-player
  const advanceToNextHandOrDealer = (hands: BlackjackHand[], currentIdx: number) => {
    if (currentIdx + 1 < hands.length) {
      setActiveHandIndex(currentIdx + 1);
    } else {
      const allBusted = hands.every((h) => h.isBust);
      if (allBusted) {
        sound.playCardFlip();
        const revealed = dealerCards.map((c) => ({ ...c, faceUp: true }));
        setDealerCards(revealed);
        setDealerRevealed(true);
        handleFinishRound(hands, revealed);
      } else {
        startDealerTurn(hands);
      }
    }
  };

  // Dealer Turn with Realistic Soft 17 logic (Single Player)
  const startDealerTurn = (hands: BlackjackHand[]) => {
    setPhase('dealer_turn');
    sound.playCardFlip();
    triggerHaptic('light');

    let currentDealerCards: StandardCard[] = dealerCards.map((c) => ({ ...c, faceUp: true }));
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

  // Dealer Turn in Multiplayer (Host Authority)
  const startP2PDealerTurn = (
    s1Cards: StandardCard[],
    s2Cards: StandardCard[],
    currentDealer: StandardCard[],
    s1St: string,
    s2St: string
  ) => {
    setPhase('dealer_turn');
    setActiveSeatTurn('dealer');
    sound.playCardFlip();
    triggerHaptic('light');

    let revealed: StandardCard[] = currentDealer.map((c) => ({ ...c, faceUp: true }));
    setDealerCards(revealed);
    setDealerRevealed(true);

    multiplayer.send({
      type: 'GAME_ACTION',
      senderId: userProfile.id,
      senderName: userProfile.name,
      payload: { action: 'BJ_DEALER_REVEAL', dealerCards: revealed },
      timestamp: Date.now(),
    });

    const s1Bust = s1St === 'bust';
    const s2Bust = s2Cards.length === 0 || s2St === 'bust';

    // If both busted, dealer does not hit!
    if (s1Bust && s2Bust) {
      setTimeout(() => {
        finalizeP2PRound(s1Cards, s2Cards, revealed, s1St, s2St);
      }, 800);
      return;
    }

    // Dealer hit loop
    const runDealerHits = () => {
      if (shouldDealerHit(revealed)) {
        setTimeout(() => {
          sound.playCardDeal();
          triggerHaptic('light');
          const newCard = drawCard(true);
          revealed = [...revealed, newCard];
          setDealerCards(revealed);

          multiplayer.send({
            type: 'GAME_ACTION',
            senderId: userProfile.id,
            senderName: userProfile.name,
            payload: { action: 'BJ_DEALER_HIT', dealerCards: revealed },
            timestamp: Date.now(),
          });

          runDealerHits();
        }, 700);
      } else {
        setTimeout(() => {
          finalizeP2PRound(s1Cards, s2Cards, revealed, s1St, s2St);
        }, 600);
      }
    };

    setTimeout(() => {
      runDealerHits();
    }, 600);
  };

  // Finalize round in Multiplayer
  const finalizeP2PRound = (
    s1Cards: StandardCard[],
    s2Cards: StandardCard[],
    finalDealer: StandardCard[],
    s1St: string,
    s2St: string
  ) => {
    const currentS1Bet = seat1BetRef.current;
    const currentS2Bet = seat2BetRef.current;

    const s1Hand: BlackjackHand = {
      id: 's1',
      cards: s1Cards,
      bet: currentS1Bet,
      isDoubled: false,
      isStood: true,
      isBust: s1St === 'bust',
      isFromSplit: false,
      status: s1St === 'blackjack' ? 'blackjack' : 'standing',
      payout: 0,
    };
    const s1Eval = evaluateOutcome(s1Hand, finalDealer);

    let s2Eval = null;
    if (s2Cards.length > 0 && currentS2Bet > 0) {
      const s2Hand: BlackjackHand = {
        id: 's2',
        cards: s2Cards,
        bet: currentS2Bet,
        isDoubled: false,
        isStood: true,
        isBust: s2St === 'bust',
        isFromSplit: false,
        status: s2St === 'blackjack' ? 'blackjack' : 'standing',
        payout: 0,
      };
      s2Eval = evaluateOutcome(s2Hand, finalDealer);
    }

    setSeat1Status(s1Eval.outcome);
    setSeat1Payout(s1Eval.payout);
    if (s2Eval) {
      setSeat2Status(s2Eval.outcome);
      setSeat2Payout(s2Eval.payout);
    }
    setPhase('round_over');

    applyP2PResult(s1Eval);

    multiplayer.send({
      type: 'GAME_ACTION',
      senderId: userProfile.id,
      senderName: userProfile.name,
      payload: {
        action: 'BJ_ROUND_FINISH',
        seat1Eval: s1Eval,
        seat2Eval: s2Eval,
        finalDealerCards: finalDealer,
      },
      timestamp: Date.now(),
    });
  };

  // Award P2P payout & stats
  const applyP2PResult = (result: any) => {
    if (!result) return;
    const currentProfile = userProfileRef.current;
    const newBankroll = currentProfile.bankroll + result.payout;
    const profit = result.profit;

    const bjStats = { ...currentProfile.stats.blackjack };
    bjStats.gamesPlayed += 1;
    if (profit > 0) bjStats.gamesWon += 1;
    bjStats.totalProfit += profit;
    if (profit > bjStats.bestWin) bjStats.bestWin = profit;

    const newWeeklyScore = Math.max(0, currentProfile.weeklyScore + (profit > 0 ? profit * 2 : 0));

    onUpdateProfile({
      bankroll: newBankroll,
      weeklyScore: newWeeklyScore,
      stats: {
        ...currentProfile.stats,
        blackjack: bjStats,
      },
    });

    if (result.outcome === 'blackjack') {
      sound.playWin();
      sound.playCashRegister();
      triggerHaptic('success');
      setBannerMessage('¡¡BLACKJACK!! Pago 3 a 2');
      setBannerType('blackjack');
      triggerCrupierEvent('bj_player_blackjack', { playerScore: 21 });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#f59e0b', '#10b981', '#ffffff'] });
    } else if (result.outcome === 'won') {
      sound.playWin();
      sound.playCashRegister();
      triggerHaptic('success');
      setBannerMessage(`¡Mano Ganadora! +${formatMoney(profit)}`);
      setBannerType('win');
      triggerCrupierEvent('player_win');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } else if (result.outcome === 'push') {
      sound.playCardFlip();
      triggerHaptic('light');
      setBannerMessage('Empate - Apuesta recuperada');
      setBannerType('push');
      triggerCrupierEvent('bj_push');
    } else {
      sound.playLose();
      sound.playDealerLaugh(userProfile.crupierPersonality !== 'desafiante');
      triggerHaptic('warning');
      setBannerMessage('La Casa gana');
      setBannerType('lose');
      triggerCrupierEvent('player_loss');
    }
  };

  // Single-player finish round
  const handleFinishRound = (hands: BlackjackHand[], finalDealerCards: StandardCard[]) => {
    let totalReturn = 0;
    let netProfit = 0;
    let anyBlackjack = false;
    let anyWin = false;
    let anyPush = false;
    let anyDealerBust = false;

    const evaluatedHands = hands.map((hand) => {
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
      sound.playCashRegister();
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
      sound.playDealerLaugh(userProfile.crupierPersonality !== 'desafiante');
      triggerHaptic('warning');
      setBannerMessage('Blackjack de la Casa');
      setBannerType('lose');
      triggerCrupierEvent('bj_dealer_blackjack', { dealerScore: 21 });
    } else if (anyWin) {
      sound.playWin();
      sound.playCashRegister();
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
      sound.playDealerLaugh(userProfile.crupierPersonality !== 'desafiante');
      triggerHaptic('warning');
      setBannerMessage('La Casa Gana esta ronda');
      setBannerType('lose');
      triggerCrupierEvent('player_loss', { playerScore: pVal.total, dealerScore: dVal.total });
    }
  };

  const handleNewRound = () => {
    if (isP2P) {
      setSeat1Cards([]);
      setSeat2Cards([]);
      setDealerCards([]);
      setDealerRevealed(false);
      setBannerMessage(null);
      setBannerType(null);
      setSeat1Status('betting');
      setSeat2Status('betting');
      setActiveSeatTurn('none');
      setPhase('betting');

      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: userProfile.id,
        senderName: userProfile.name,
        payload: { action: 'BJ_RESET' },
        timestamp: Date.now(),
      });
    } else {
      setPlayerHands([]);
      setDealerCards([]);
      setDealerRevealed(false);
      setBannerMessage(null);
      setBannerType(null);
      setActiveHandIndex(0);
      setPhase('betting');
    }
  };

  // Values calculation
  const activeHand = playerHands[activeHandIndex];
  const dealerVal = calculateHandValue(dealerRevealed ? dealerCards : dealerCards.slice(0, 1));
  const isSplitAvailable = !isP2P && activeHand && canSplitHand(activeHand, userProfile.bankroll) && playerHands.length === 1;

  // Double down availability
  const isDoubleAvailable = isP2P
    ? (isHost && activeSeatTurn === 'seat1' && seat1Cards.length === 2 && userProfile.bankroll >= seat1Bet) ||
      (!isHost && activeSeatTurn === 'seat2' && seat2Cards.length === 2 && userProfile.bankroll >= seat2Bet)
    : activeHand && canDoubleDown(activeHand, userProfile.bankroll);

  // Turn checks for UI
  const isMyTurn = isP2P
    ? (isHost && activeSeatTurn === 'seat1') || (!isHost && activeSeatTurn === 'seat2')
    : phase === 'player_turn';

  const s1Val = calculateHandValue(seat1Cards);
  const s2Val = calculateHandValue(seat2Cards);

  const activeDealerConfig = PERSONALITY_CONFIGS[userProfile.crupierPersonality] || PERSONALITY_CONFIGS.burlona;
  const dealerMood: CrupierMood =
    bannerType === 'lose'
      ? (userProfile.crupierPersonality === 'burlona' ? 'laughing' : 'smirk')
      : bannerType === 'win' || bannerType === 'blackjack'
      ? 'impressed'
      : phase === 'player_turn'
      ? 'challenging'
      : 'neutral';

  return (
    <div
      className={`relative w-full max-w-full h-full flex flex-col justify-between overflow-hidden overflow-x-hidden table-felt-${userProfile.tableTheme} safe-top safe-bottom text-white select-none`}
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
              {isP2P ? (
                <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                  <Wifi className="w-2.5 h-2.5 animate-pulse" /> Mesa 2 Jugadores
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  6 Barajas
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400">
              {isP2P ? `Conectado con ${remotePlayer?.name || 'tu Hermano'}` : 'Paga 3:2 • Crupier pide con 17 suave'}
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

          {/* Casino Jazz Lounge Music toggle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              const next = sound.toggleCasinoMusic();
              setIsMusicActive(next);
            }}
            className={`p-1.5 rounded-full border transition-all active:scale-95 ${
              isMusicActive
                ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-white/10 hover:bg-white/20 text-neutral-300 border-transparent'
            }`}
            title={isMusicActive ? 'Pausar música Jazz Casino Lounge' : 'Activar música Jazz Casino'}
          >
            <Music className={`w-4 h-4 ${isMusicActive ? 'animate-pulse' : ''}`} />
          </button>

          <button
            onClick={() => {
              const next = !userProfile.soundEnabled;
              sound.setEnabled(next);
              onUpdateProfile({ soundEnabled: next });
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 active:scale-95"
            title={userProfile.soundEnabled ? 'Silenciar efectos' : 'Activar efectos'}
          >
            {userProfile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 active:scale-95"
            title="Reglas del juego"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Playing Felt Arena */}
      <div className="flex-1 flex flex-col justify-around px-2 sm:px-4 py-1 relative overflow-y-auto overflow-x-hidden w-full max-w-full">
        {/* Dealer Section Directly on the Table Felt */}
        <div className="flex flex-col items-center my-1 relative z-10">
          {/* Croupier on Table Banner */}
          <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 rounded-2xl bg-neutral-950/80 backdrop-blur-md border border-amber-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] mb-2">
            <div
              className="relative cursor-pointer group shrink-0"
              onClick={() => {
                triggerHaptic('light');
                setShowDealerModal(true);
              }}
              title="Toca para cambiar de crupier"
            >
              <CrupierAvatar
                size={58}
                mood={dealerMood}
                isSpeaking={isDealerSpeaking}
                personality={userProfile.crupierPersonality}
                showSunglasses={showSunglasses}
                className="hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-neutral-950 text-[8px] font-black px-1.5 py-0.2 rounded-full border border-black shadow">
                CAMBIAR
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-amber-200 tracking-tight">
                  {activeDealerConfig.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowDealerModal(true);
                  }}
                  className="text-[9px] font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 hover:bg-amber-500/40 active:scale-95 transition-all"
                >
                  {activeDealerConfig.badge}
                </button>
              </div>
              <span className="text-[10px] text-neutral-400 font-medium truncate">
                {activeDealerConfig.region} • Crupier en Vivo
              </span>
            </div>

            {/* Crupier Voice / Accent Preview */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                if (dealerSpeech) {
                  sound.speakDealer(dealerSpeech, userProfile.crupierPersonality);
                } else {
                  const idle = getCrupierDialogue('blackjack', 'idle', crupierContext, userProfile.crupierPersonality);
                  setDealerSpeech(idle.text);
                  setIsDealerSpeaking(true);
                  sound.speakDealer(idle.text, userProfile.crupierPersonality);
                  setTimeout(() => setIsDealerSpeaking(false), 3000);
                }
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-300 border border-white/10 active:scale-90 transition-all shrink-0"
              title="Escuchar voz de la crupier"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Crupier Sunglasses Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowSunglasses((prev) => !prev);
              }}
              className={`p-1.5 rounded-xl border transition-all active:scale-90 shrink-0 ${
                showSunglasses
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-400 border-white/10'
              }`}
              title={showSunglasses ? 'Quitar gafas de sol al crupier' : 'Poner gafas de sol al crupier'}
            >
              <Glasses className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speech Bubble on the Felt */}
          {dealerSpeech && (
            <div
              onClick={() => {
                triggerHaptic('light');
                sound.speakDealer(dealerSpeech, userProfile.crupierPersonality);
              }}
              className="relative max-w-xs sm:max-w-md px-3.5 py-1.5 rounded-xl bg-neutral-900/90 backdrop-blur-md border border-amber-500/35 shadow-lg text-center mb-2.5 cursor-pointer active:scale-98 transition-all animate-in fade-in"
              title="Toca para repetir la voz"
            >
              <p className="text-[11px] sm:text-xs text-amber-200 font-medium leading-snug">
                &ldquo;{dealerSpeech}&rdquo;
              </p>
            </div>
          )}

          {/* Dealer Cards Header & Cards */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
              Banca
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
            {dealerCards.map((card) => (
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

        {/* ========================================================
            PLAYER SEATS SECTION (MULTIPLAYER 2 SEATS VS SINGLE-PLAYER)
            ======================================================== */}
        {isP2P ? (
          <div className="w-full max-w-lg mx-auto grid grid-cols-2 gap-1.5 sm:gap-3 px-1 min-w-0 overflow-hidden">
            {/* ASIENTO 1 (HOST) */}
            <div
              onDragOver={(e) => {
                if (isHost && phase === 'betting') {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }
              }}
              onDrop={(e) => {
                if (isHost && phase === 'betting') {
                  e.preventDefault();
                  const val = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (!isNaN(val) && val > 0) {
                    sound.playChipDrop();
                    handleAddChip(val);
                  }
                }
              }}
              data-drop-zone={isHost && phase === 'betting' ? 'bet' : undefined}
              className={`flex flex-col items-center p-2 rounded-2xl transition-all border min-w-0 overflow-hidden ${
                activeSeatTurn === 'seat1'
                  ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 shadow-lg shadow-amber-400/25 scale-[1.01]'
                  : 'bg-black/35 border-white/10'
              }`}
            >
              {/* Header with Photo */}
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap justify-center text-center max-w-full">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-amber-500/30 flex items-center justify-center shrink-0 border border-amber-400/50">
                  {(isHost ? userProfile.photoUrl : remotePlayer?.photoUrl) ? (
                    <img
                      src={isHost ? userProfile.photoUrl : remotePlayer?.photoUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[9px] font-black text-amber-300">
                      {(isHost ? userProfile.name : remotePlayer?.name || 'A').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-500/40 truncate max-w-[85px]">
                  {isHost ? 'Tú (Host)' : (remotePlayer?.name || 'Anfitrión')}
                </span>
                {seat1Cards.length > 0 && (
                  <span
                    className={`text-[11px] font-black px-1.5 py-0.5 rounded-full font-mono shadow border shrink-0 ${
                      s1Val.isBust
                        ? 'bg-red-900/80 text-red-300 border-red-500'
                        : s1Val.isBlackjack
                        ? 'bg-amber-500 text-neutral-950 border-amber-300'
                        : 'bg-neutral-800/90 text-amber-300 border-amber-400'
                    }`}
                  >
                    {s1Val.isBust ? 'Busto' : s1Val.isBlackjack ? 'BJ 21' : s1Val.total}
                  </span>
                )}
                <span className="text-[11px] font-bold text-amber-400 font-mono shrink-0">
                  ${seat1Bet}
                </span>
              </div>

              {/* Cards */}
              <div className="flex items-center justify-center -space-x-5 min-h-[96px] w-full overflow-hidden px-0.5">
                {seat1Cards.map((card) => (
                  <StandardCardView
                    key={card.id}
                    card={card}
                    backTheme={userProfile.cardBackTheme}
                    className="shadow-xl"
                  />
                ))}
                {seat1Cards.length === 0 && (
                  <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg border-2 border-dashed border-amber-400/30 flex flex-col items-center justify-center text-neutral-400 text-[10px] text-center p-1">
                    <span>{isHost ? 'Tu Lugar' : (remotePlayer?.name || 'Anfitrión')}</span>
                  </div>
                )}
              </div>

              {/* Result Status */}
              {phase === 'round_over' && (
                <div className="mt-1 text-[11px] font-black uppercase tracking-wider">
                  {seat1Status === 'won' && <span className="text-emerald-400">+${seat1Payout}</span>}
                  {seat1Status === 'blackjack' && <span className="text-amber-400">BJ +${seat1Payout}</span>}
                  {seat1Status === 'push' && <span className="text-neutral-300">Empate</span>}
                  {seat1Status === 'lost' && <span className="text-red-400">Pierde</span>}
                  {seat1Status === 'bust' && <span className="text-red-400">Busto</span>}
                </div>
              )}
            </div>

            {/* ASIENTO 2 (GUEST) */}
            <div
              onDragOver={(e) => {
                if (!isHost && phase === 'betting') {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }
              }}
              onDrop={(e) => {
                if (!isHost && phase === 'betting') {
                  e.preventDefault();
                  const val = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (!isNaN(val) && val > 0) {
                    sound.playChipDrop();
                    handleAddChip(val);
                  }
                }
              }}
              data-drop-zone={!isHost && phase === 'betting' ? 'bet' : undefined}
              className={`flex flex-col items-center p-2 rounded-2xl transition-all border min-w-0 overflow-hidden ${
                activeSeatTurn === 'seat2'
                  ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400 shadow-lg shadow-emerald-400/25 scale-[1.01]'
                  : 'bg-black/35 border-white/10'
              }`}
            >
              {/* Header with Photo */}
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap justify-center text-center max-w-full">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-emerald-500/30 flex items-center justify-center shrink-0 border border-emerald-400/50">
                  {(!isHost ? userProfile.photoUrl : remotePlayer?.photoUrl) ? (
                    <img
                      src={!isHost ? userProfile.photoUrl : remotePlayer?.photoUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[9px] font-black text-emerald-300">
                      {(!isHost ? userProfile.name : remotePlayer?.name || 'H').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-300 bg-emerald-500/25 px-2 py-0.5 rounded-full border border-emerald-500/40 truncate max-w-[85px]">
                  {!isHost ? 'Tú (Invitado)' : (remotePlayer?.name || 'Tu Hermano')}
                </span>
                {seat2Cards.length > 0 && (
                  <span
                    className={`text-[11px] font-black px-1.5 py-0.5 rounded-full font-mono shadow border shrink-0 ${
                      s2Val.isBust
                        ? 'bg-red-900/80 text-red-300 border-red-500'
                        : s2Val.isBlackjack
                        ? 'bg-amber-500 text-neutral-950 border-amber-300'
                        : 'bg-neutral-800/90 text-amber-300 border-amber-400'
                    }`}
                  >
                    {s2Val.isBust ? 'Busto' : s2Val.isBlackjack ? 'BJ 21' : s2Val.total}
                  </span>
                )}
                <span className="text-[11px] font-bold text-emerald-400 font-mono shrink-0">
                  ${seat2Bet}
                </span>
              </div>

              {/* Cards */}
              <div className="flex items-center justify-center -space-x-5 min-h-[96px] w-full overflow-hidden px-0.5">
                {seat2Cards.map((card) => (
                  <StandardCardView
                    key={card.id}
                    card={card}
                    backTheme={userProfile.cardBackTheme}
                    className="shadow-xl"
                  />
                ))}
                {seat2Cards.length === 0 && (
                  <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg border-2 border-dashed border-emerald-400/30 flex flex-col items-center justify-center text-neutral-400 text-[10px] text-center p-1">
                    <span>{!isHost ? 'Tu Lugar' : (remotePlayer?.name || 'Tu Hermano')}</span>
                  </div>
                )}
              </div>

              {/* Result Status */}
              {phase === 'round_over' && (
                <div className="mt-1 text-[11px] font-black uppercase tracking-wider">
                  {seat2Status === 'won' && <span className="text-emerald-400">+${seat2Payout}</span>}
                  {seat2Status === 'blackjack' && <span className="text-amber-400">BJ +${seat2Payout}</span>}
                  {seat2Status === 'push' && <span className="text-neutral-300">Empate</span>}
                  {seat2Status === 'lost' && <span className="text-red-400">Pierde</span>}
                  {seat2Status === 'bust' && <span className="text-red-400">Busto</span>}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Single Player Hands Section (Supports Splitting) */
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
                      {hand.cards.map((card) => (
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
                <div
                  onDragOver={(e) => {
                    if (phase === 'betting') {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }
                  }}
                  onDrop={(e) => {
                    if (phase === 'betting') {
                      e.preventDefault();
                      const val = parseInt(e.dataTransfer.getData('text/plain'), 10);
                      if (!isNaN(val) && val > 0) {
                        sound.playChipDrop();
                        handleAddChip(val);
                      }
                    }
                  }}
                  onClick={() => handleAddChip(25)}
                  data-drop-zone={phase === 'betting' ? 'bet' : undefined}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-dashed border-amber-400/50 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center my-2 shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:border-amber-300 hover:scale-105 transition-all group cursor-pointer"
                  title="Arrastra fichas aquí para apostar o toca"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-amber-400/60 flex items-center justify-center text-amber-300 font-black text-sm mb-1 bg-amber-500/15 group-hover:scale-110 transition-transform shadow-inner">
                    {currentBet > 0 ? `$${currentBet}` : '$'}
                  </div>
                  <span className="text-[11px] font-bold text-amber-300">
                    {currentBet > 0 ? `Apuesta: $${currentBet}` : 'Arrastra tus Fichas'}
                  </span>
                  <span className="text-[9px] text-neutral-400 mt-0.5">
                    o toca las fichas abajo
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          BOTTOM CONTROL BAR
          ======================================================== */}
      <footer className="w-full bg-neutral-950/85 border-t border-white/10 backdrop-blur-xl p-2.5 z-30">
        {phase === 'betting' && (
          <div className="flex flex-col gap-2 max-w-lg mx-auto">
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 font-medium">Tu Apuesta:</span>
                <span className="font-extrabold text-amber-400 font-mono text-sm">
                  ${currentBet.toLocaleString('es-MX')}
                </span>
                {isP2P && (
                  <span className="text-[10px] text-neutral-400 ml-1">
                    ({isHost ? `Hermano: $${seat2Bet}` : `Anfitrión: $${seat1Bet}`})
                  </span>
                )}
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

            {/* High-Performance Visual Drag & Drop Chip Tray */}
            <TouchChipTray onAddChip={handleAddChip} />

            {/* Deal or Wait Button */}
            {isP2P ? (
              isHost ? (
                <button
                  onClick={handleDeal}
                  disabled={seat1Bet <= 0}
                  className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                    seat1Bet > 0
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-neutral-950 active:scale-95 shadow-amber-500/30'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Flame className="w-4 h-4 fill-current" />
                  Repartir Mesa {seat2Bet > 0 ? `(Tú: $${seat1Bet} • Hermano: $${seat2Bet})` : `($${seat1Bet})`}
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-neutral-900 border border-amber-500/30 text-center text-xs font-bold text-amber-300 animate-pulse flex items-center justify-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400 animate-spin" />
                  {seat2Bet > 0
                    ? `Apuesta Lista ($${seat2Bet}) • Esperando que el Anfitrión reparta...`
                    : 'Coloca tus fichas en tu asiento para jugar esta mano'}
                </div>
              )
            ) : (
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
            )}
          </div>
        )}

        {phase === 'player_turn' && (
          isMyTurn ? (
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
          ) : (
            <div className="py-3 text-center text-xs font-bold text-amber-300 animate-pulse flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              Turno de {activeSeatTurn === 'seat1' ? (remotePlayer?.name || 'el Anfitrión') : (remotePlayer?.name || 'tu Hermano')}... observando cartas
            </div>
          )
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
              <li>
                • <strong>Objetivo:</strong> Vencer al crupier sumando lo más cercano a 21 sin pasarse.
              </li>
              <li>
                • <strong>Valores:</strong> Cartas numéricas su valor nominal, figuras (J, Q, K) valen 10, y el As vale 11 o 1.
              </li>
              <li>
                • <strong>Blackjack Natural:</strong> Un As y un 10 en las dos primeras cartas paga <strong>3 a 2</strong>.
              </li>
              <li>
                • <strong>Regla del Crupier:</strong> El crupier pide obligatoriamente con 16 o menos y con{' '}
                <strong>17 Suave</strong> (Ace contando como 11). Se planta con 17 Duro y 18+.
              </li>
              <li>
                • <strong>Doblar:</strong> Duplica tu apuesta y recibe exactamente una carta adicional.
              </li>
              <li>
                • <strong>Multijugador:</strong> Dos jugadores en la misma mesa comparten la misma zapata y juegan juntos contra la banca.
              </li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 font-bold text-amber-300 border border-amber-400/40 text-xs active:scale-95 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Regional Dealer Selection Modal */}
      <DealerSelectModal
        isOpen={showDealerModal}
        onClose={() => setShowDealerModal(false)}
        selectedPersonality={userProfile.crupierPersonality}
        onSelectPersonality={(newP) => {
          onUpdateProfile({ crupierPersonality: newP });
          const intro = getCrupierDialogue('blackjack', 'game_start', crupierContext, newP);
          setDealerSpeech(intro.text);
          setIsDealerSpeaking(true);
          sound.speakDealer(intro.text, newP);
          setTimeout(() => setIsDealerSpeaking(false), 3500);
        }}
      />
    </div>
  );
};
