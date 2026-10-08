import React, { useState, useEffect, useRef, useTransition } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Flame,
  CheckCircle2,
  Coins,
  ArrowDown,
  Layers,
  Zap,
  X,
  Wifi,
} from 'lucide-react';
import type { SpanishCard, UserProfile, TableTheme } from '../../types/casino';
import { CardBack, SpanishCardView, OroIcon } from '../common/CardView';
import { CrupierAvatar } from '../crupier/CrupierAvatar';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { formatMoney } from '../../utils/storage';
import { multiplayer } from '../../utils/multiplayer';
import {
  dealConquianHands,
  isValidMeld,
  findPossibleMeldsWithCard,
  canForceCardOnOpponent,
  applyForcedCard,
  countMeldedCards,
  chooseAIDiscard,
  evaluateAICardPlay,
  sortHandByRank,
  sortHandBySuit,
  getCrupierDialogue,
  WINNING_CARD_COUNT,
  type PossiblePlay,
} from '../../utils/conquianLogic';

interface ConquianGameProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBackToLobby: () => void;
}

type GamePhase = 'betting' | 'playing' | 'round_over';
type TurnOwner = 'player' | 'crupier';
type TurnStep = 'choose_draw' | 'action_drawn' | 'must_discard';

export const ConquianGame: React.FC<ConquianGameProps> = ({
  profile,
  onUpdateProfile,
  onBackToLobby,
}) => {
  // Game Status
  const [phase, setPhase] = useState<GamePhase>('betting');
  const [betAmount, setBetAmount] = useState<number>(50);
  const [currentPot, setCurrentPot] = useState<number>(100);

  // Cards & State
  const [remateDeck, setRemateDeck] = useState<SpanishCard[]>([]);
  const [discardPile, setDiscardPile] = useState<SpanishCard[]>([]);
  const [drawnCard, setDrawnCard] = useState<SpanishCard | null>(null);
  const [cardSource, setCardSource] = useState<'remate' | 'discard' | null>(null);

  // Hands & Melds
  const [playerHand, setPlayerHand] = useState<SpanishCard[]>([]);
  const [crupierHand, setCrupierHand] = useState<SpanishCard[]>([]);
  const [playerMelds, setPlayerMelds] = useState<SpanishCard[][]>([]);
  const [crupierMelds, setCrupierMelds] = useState<SpanishCard[][]>([]);

  // Turn Flow
  const [turn, setTurn] = useState<TurnOwner>('player');
  const [turnStep, setTurnStep] = useState<TurnStep>('choose_draw');

  // UI Selection & Feedback
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [roundResult, setRoundResult] = useState<{
    winner: 'player' | 'crupier' | 'draw';
    profit: number;
    message: string;
  } | null>(null);

  // Crupier dialogue
  const [crupierSpeech, setCrupierSpeech] = useState<string>('');
  const [crupierMood, setCrupierMood] = useState<'neutral' | 'talking' | 'taunting' | 'shocked'>('neutral');

  // Multiplayer P2P live state
  const [isP2P, setIsP2P] = useState<boolean>(multiplayer.getStatus() === 'connected');
  const remotePlayer = multiplayer.getRemotePlayer();

  // Audio preference local state (mirrored from profile)
  const [soundOn, setSoundOn] = useState<boolean>(profile.soundEnabled);

  // React 19 transition hook
  const [, startTransition] = useTransition();

  // Reference to prevent double AI turn executions
  const aiTurnTimeoutRef = useRef<any>(null);

  // Sync sound engine
  useEffect(() => {
    sound.setEnabled(soundOn);
  }, [soundOn]);

  // Clean timeouts on unmount and setup P2P listeners
  useEffect(() => {
    const unsubStatus = multiplayer.onStatusChange((s) => {
      setIsP2P(s === 'connected');
    });

    const unsubMsg = multiplayer.onMessage((msg) => {
      if (msg.type === 'GAME_ACTION' && msg.payload) {
        const { action } = msg.payload;
        if (action === 'DEAL') {
          const { guestHand, hostHand, remateDeck: remate, currentPot: pot, betAmount: bet } = msg.payload;
          if (!multiplayer.getIsHost()) {
            onUpdateProfile({ bankroll: profile.bankroll - bet });
            setPlayerHand(guestHand);
            setCrupierHand(hostHand);
            setRemateDeck(remate);
            setDiscardPile([]);
            setDrawnCard(null);
            setPlayerMelds([]);
            setCrupierMelds([]);
            setSelectedCardIds([]);
            setFeedbackMsg('¡Baraja repartida! Espera el turno de tu hermano.');
            setRoundResult(null);
            setCurrentPot(pot);
            setBetAmount(bet);
            setPhase('playing');
            setTurn('crupier');
            setTurnStep('choose_draw');
            sound.playCardDeal();
          }
        } else if (action === 'DRAW_REMATO') {
          const { drawn, nextRemate } = msg.payload;
          setDrawnCard(drawn);
          setRemateDeck(nextRemate);
          setCardSource('remate');
          sound.playCardDeal();
        } else if (action === 'TAKE_DISCARD') {
          const { drawn } = msg.payload;
          setDiscardPile(prev => prev.slice(0, prev.length - 1));
          setDrawnCard(drawn);
          setCardSource('discard');
          sound.playCardDeal();
        } else if (action === 'PASS') {
          const { card } = msg.payload;
          setDiscardPile(prev => [...prev, card]);
          setDrawnCard(null);
          setTurn('player');
          setTurnStep('choose_draw');
          sound.playCardFlip();
        } else if (action === 'FORCE_PLAYER') {
          const { forcedCard } = msg.payload;
          setPlayerMelds(prevMelds => {
            const nextMelds = applyForcedCard(forcedCard, prevMelds);
            return nextMelds || prevMelds;
          });
          setDrawnCard(null);
          setTurn('player');
          setTurnStep('must_discard');
          setFeedbackMsg('¡Te metieron una carta obligatoria! Descarta 1 carta de tu mano.');
          sound.playChip();
          triggerHaptic('warning');
        } else if (action === 'DISCARD') {
          const { card, nextHand, nextMelds } = msg.payload;
          setDiscardPile(prev => [card, ...prev]);
          setDrawnCard(null);
          if (nextHand) setCrupierHand(nextHand);
          if (nextMelds) setCrupierMelds(nextMelds);
          setTurn('player');
          setTurnStep('choose_draw');
          sound.playCardFlip();
        } else if (action === 'MELD_UPDATE') {
          const { melds, hand } = msg.payload;
          setCrupierMelds(melds);
          setCrupierHand(hand);
          sound.playChip();
        } else if (action === 'GAME_OVER') {
          handleGameEnd(msg.payload.winner, msg.payload.reason);
        }
      }
    });

    return () => {
      if (aiTurnTimeoutRef.current) {
        clearTimeout(aiTurnTimeoutRef.current);
      }
      unsubStatus();
      unsubMsg();
    };
  }, []);

  // Update speech with attractive voice and laughter
  const speakCrupier = (text: string, mood: 'neutral' | 'talking' | 'taunting' | 'shocked' = 'talking') => {
    setCrupierSpeech(text);
    setCrupierMood(mood);
    if (mood === 'taunting') {
      setTimeout(() => {
        sound.playDealerLaugh(profile.crupierPersonality !== 'desafiante');
      }, 350);
    }
  };

  // Helper for Table theme styling
  const getTableThemeClasses = (theme: TableTheme) => {
    switch (theme) {
      case 'black_gold':
        return 'table-felt-black_gold border-yellow-500/50';
      case 'royal_blue':
        return 'table-felt-royal_blue border-blue-600/30';
      case 'crimson':
        return 'table-felt-crimson border-rose-600/30';
      case 'obsidian':
        return 'table-felt-obsidian border-neutral-700/30';
      case 'emerald':
      default:
        return 'table-felt-emerald border-emerald-600/30';
    }
  };

  // ========================================================
  // STARTING A NEW ROUND
  // ========================================================
  const startNewGame = (customBet?: number) => {
    const bet = customBet ?? betAmount;
    if (profile.bankroll < bet) {
      speakCrupier('No tienes fichas suficientes para esa apuesta.', 'taunting');
      triggerHaptic('warning');
      return;
    }

    // Deduct bet from bankroll
    const newBankroll = profile.bankroll - bet;
    onUpdateProfile({ bankroll: newBankroll });

    sound.playChip();
    triggerHaptic('medium');

    // Deal cards: 8 to each player, remaining to remate
    const { playerHand: pHand, aiHand: aHand, remate } = dealConquianHands();

    setRemateDeck(remate);
    setDiscardPile([]);
    setDrawnCard(null);
    setCardSource(null);
    setPlayerHand(pHand);
    setCrupierHand(aHand);
    setPlayerMelds([]);
    setCrupierMelds([]);
    setSelectedCardIds([]);
    setFeedbackMsg('');
    setRoundResult(null);
    setCurrentPot(bet * 2);

    // Player goes first in Mexican tradition
    setTurn('player');
    setTurnStep('choose_draw');
    setPhase('playing');

    if (isP2P && multiplayer.getIsHost()) {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: profile.id,
        senderName: profile.name,
        payload: {
          action: 'DEAL',
          hostHand: pHand,
          guestHand: aHand,
          remateDeck: remate,
          currentPot: bet * 2,
          betAmount: bet,
        },
        timestamp: Date.now(),
      });
    }

    const initialSpeech = getCrupierDialogue('start_round', profile.crupierPersonality);
    speakCrupier(initialSpeech, 'talking');
    sound.playCardDeal();
  };

  // ========================================================
  // WIN / DRAW CHECK & RESOLUTION
  // ========================================================
  const handleGameEnd = (winner: 'player' | 'crupier' | 'draw', reasonMsg: string) => {
    setPhase('round_over');
    setTurnStep('choose_draw');
    setDrawnCard(null);

    const oldStats = profile.stats.conquian;

    if (winner === 'player') {
      const payout = currentPot;
      const profit = currentPot - betAmount;
      const newBankroll = profile.bankroll + payout;
      const newWeeklyScore = profile.weeklyScore + profit * 2;

      onUpdateProfile({
        bankroll: newBankroll,
        weeklyScore: newWeeklyScore,
        stats: {
          ...profile.stats,
          conquian: {
            gamesPlayed: oldStats.gamesPlayed + 1,
            gamesWon: oldStats.gamesWon + 1,
            totalProfit: oldStats.totalProfit + profit,
            bestWin: Math.max(oldStats.bestWin, profit),
          },
        },
      });

      sound.playWin();
      sound.playCashRegister();
      triggerHaptic('success');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      const speech = getCrupierDialogue('player_won', profile.crupierPersonality);
      speakCrupier(speech, 'shocked');
      setRoundResult({
        winner: 'player',
        profit,
        message: reasonMsg || '¡Bajaste 9 cartas! Conquián completado.',
      });

      if (isP2P) {
        multiplayer.send({
          type: 'GAME_ACTION',
          senderId: profile.id,
          senderName: profile.name,
          payload: {
            action: 'GAME_OVER',
            winner: 'crupier',
            reason: reasonMsg || '¡Tu hermano bajó 9 cartas y ganó la partida!',
          },
          timestamp: Date.now(),
        });
      }
    } else if (winner === 'crupier') {
      onUpdateProfile({
        stats: {
          ...profile.stats,
          conquian: {
            ...oldStats,
            gamesPlayed: oldStats.gamesPlayed + 1,
            totalProfit: oldStats.totalProfit - betAmount,
          },
        },
      });

      sound.playLose();
      sound.playDealerLaugh(profile.crupierPersonality !== 'desafiante');
      triggerHaptic('heavy');

      const speech = getCrupierDialogue('crupier_won', profile.crupierPersonality);
      speakCrupier(speech, 'taunting');
      setRoundResult({
        winner: 'crupier',
        profit: -betAmount,
        message: reasonMsg || 'El Crupier bajó 9 cartas primero.',
      });
    } else {
      // Tablas / Draw (remate ran out)
      const refundedBankroll = profile.bankroll + betAmount;
      onUpdateProfile({
        bankroll: refundedBankroll,
        stats: {
          ...profile.stats,
          conquian: {
            ...oldStats,
            gamesPlayed: oldStats.gamesPlayed + 1,
          },
        },
      });

      sound.playCardFlip();
      const speech = getCrupierDialogue('draw', profile.crupierPersonality);
      speakCrupier(speech, 'neutral');
      setRoundResult({
        winner: 'draw',
        profit: 0,
        message: '¡Tablas! Se agotaron las cartas del remate. Apuesta devuelta.',
      });
    }
  };

  // ========================================================
  // CRUPIER / AI AUTOMATED TURN ENGINE
  // ========================================================
  useEffect(() => {
    if (phase !== 'playing' || turn !== 'crupier' || isP2P) return;

    setIsAiThinking(true);

    aiTurnTimeoutRef.current = window.setTimeout(() => {
      // Step 1: Crupier decides to draw or take discard
      // Check if discard is usable by Crupier
      const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
      let cardToPlay: SpanishCard | null = null;
      let newDiscardPile = [...discardPile];
      let newRemate = [...remateDeck];

      if (topDiscard) {
        const discardPlays = findPossibleMeldsWithCard(topDiscard, crupierHand, crupierMelds);
        if (discardPlays.length > 0) {
          // Crupier takes discard!
          cardToPlay = topDiscard;
          newDiscardPile.pop();
          setDiscardPile(newDiscardPile);
          sound.playCardDeal();
          triggerHaptic('light');
        }
      }

      // If Crupier did not take discard, draw from remate
      if (!cardToPlay) {
        if (newRemate.length === 0) {
          handleGameEnd('draw', 'El remate se quedó sin cartas.');
          setIsAiThinking(false);
          return;
        }
        cardToPlay = newRemate[0];
        newRemate = newRemate.slice(1);
        setRemateDeck(newRemate);
        sound.playCardFlip();
      }

      setDrawnCard(cardToPlay);

      // Step 2: Crupier evaluates action on cardToPlay
      window.setTimeout(() => {
        if (!cardToPlay) return;

        const aiDecision = evaluateAICardPlay(cardToPlay, crupierHand, crupierMelds, playerMelds);

        if (aiDecision.action === 'meld' && aiDecision.play) {
          // AI Melds
          const play = aiDecision.play;
          const usedIds = new Set(play.handCardsUsed.map((c) => c.id));
          const updatedAiHand = crupierHand.filter((c) => !usedIds.has(c.id));
          const updatedAiMelds = play.resultingMelds;

          setCrupierHand(updatedAiHand);
          setCrupierMelds(updatedAiMelds);
          setDrawnCard(null);
          sound.playCardDeal();

          const meldedCount = countMeldedCards(updatedAiMelds);
          if (meldedCount >= WINNING_CARD_COUNT) {
            handleGameEnd('crupier', '¡El Crupier completó sus 9 cartas!');
            setIsAiThinking(false);
            return;
          }

          if (meldedCount === 8) {
            const speech = getCrupierDialogue('crupier_near_win', profile.crupierPersonality);
            speakCrupier(speech, 'taunting');
          } else {
            const speech = getCrupierDialogue('crupier_melded', profile.crupierPersonality);
            speakCrupier(speech, 'talking');
          }

          // Crupier must now discard 1 card from hand
          window.setTimeout(() => {
            const discardCard = chooseAIDiscard(updatedAiHand, updatedAiMelds, playerMelds);
            const remainingAiHand = updatedAiHand.filter((c) => c.id !== discardCard.id);
            setCrupierHand(remainingAiHand);
            setDiscardPile((prev) => [...prev, discardCard]);
            sound.playCardFlip();

            // Check if remate ran out
            if (newRemate.length === 0) {
              handleGameEnd('draw', 'Se agotó el remate.');
              setIsAiThinking(false);
              return;
            }

            // End Crupier's turn -> Player's turn
            setIsAiThinking(false);
            setTurn('player');
            setTurnStep('choose_draw');
          }, 800);
        } else if (aiDecision.action === 'force') {
          // AI Forces ("Meter") card onto Player!
          const forcedMelds = applyForcedCard(cardToPlay, playerMelds);
          if (forcedMelds) {
            setPlayerMelds(forcedMelds);
            setDrawnCard(null);
            sound.playChip();
            triggerHaptic('warning');

            const speech = getCrupierDialogue('crupier_forced_player', profile.crupierPersonality);
            speakCrupier(speech, 'taunting');
            setFeedbackMsg('¡El Crupier te obligó a meter la carta! Debes descartar una de tu mano.');

            // Check if forcing made player win (9 cards)
            if (countMeldedCards(forcedMelds) >= WINNING_CARD_COUNT) {
              handleGameEnd('player', '¡El castigo completó tus 9 cartas!');
              setIsAiThinking(false);
              return;
            }

            // Player must discard immediately
            setIsAiThinking(false);
            setTurn('player');
            setTurnStep('must_discard');
          } else {
            // Fallback pass
            setDiscardPile((prev) => [...prev, cardToPlay]);
            setDrawnCard(null);
            setIsAiThinking(false);
            setTurn('player');
            setTurnStep('choose_draw');
          }
        } else {
          // AI Passes -> Discards cardToPlay
          setDiscardPile((prev) => [...prev, cardToPlay]);
          setDrawnCard(null);
          sound.playCardFlip();

          const passSpeech = getCrupierDialogue('player_passed', profile.crupierPersonality);
          speakCrupier(passSpeech || 'Paso... tu turno en la mesa.', 'neutral');

          // Check if remate ran out
          if (newRemate.length === 0) {
            handleGameEnd('draw', 'Se agotó el remate.');
            setIsAiThinking(false);
            return;
          }

          setIsAiThinking(false);
          setTurn('player');
          setTurnStep('choose_draw');
        }
      }, 1000);
    }, 1200);
  }, [phase, turn]);

  // ========================================================
  // PLAYER ACTIONS
  // ========================================================

  // Draw card from Remate (deck)
  const handlePlayerDrawFromRemate = () => {
    if (turn !== 'player' || turnStep !== 'choose_draw' || isAiThinking) return;

    if (remateDeck.length === 0) {
      handleGameEnd('draw', 'El remate no tiene más cartas.');
      return;
    }

    sound.playCardDeal();
    triggerHaptic('light');

    const card = remateDeck[0];
    const nextRemate = remateDeck.slice(1);
    setRemateDeck(nextRemate);
    setDrawnCard(card);
    setCardSource('remate');
    setTurnStep('action_drawn');
    setFeedbackMsg(`Robaste ${card.name}. Bájala, métela o pásala.`);

    if (isP2P) {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: profile.id,
        senderName: profile.name,
        payload: { action: 'DRAW_REMATO', drawn: card, nextRemate },
        timestamp: Date.now(),
      });
    }
  };

  // Take card from Discard pile (only if legal to meld!)
  const handlePlayerTakeDiscard = () => {
    if (turn !== 'player' || turnStep !== 'choose_draw' || isAiThinking) return;
    if (discardPile.length === 0) return;

    const topDiscard = discardPile[discardPile.length - 1];
    const possiblePlays = findPossibleMeldsWithCard(topDiscard, playerHand, playerMelds);

    if (possiblePlays.length === 0) {
      sound.playLose();
      triggerHaptic('warning');
      setFeedbackMsg('En Conquián solo puedes tomar del descarte si lo bajas de inmediato.');
      speakCrupier('Esa carta no te acomoda en ninguna baja, compadre.', 'taunting');
      return;
    }

    sound.playCardDeal();
    triggerHaptic('medium');

    setDiscardPile((prev) => prev.slice(0, prev.length - 1));
    setDrawnCard(topDiscard);
    setCardSource('discard');
    setTurnStep('action_drawn');
    setFeedbackMsg(`Tomaste ${topDiscard.name}. Selecciona tus cartas y presiona "Bajar".`);

    if (isP2P) {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: profile.id,
        senderName: profile.name,
        payload: { action: 'TAKE_DISCARD', drawn: topDiscard },
        timestamp: Date.now(),
      });
    }
  };

  // Toggle selection of card in hand
  const handleToggleCardSelection = (cardId: string) => {
    sound.playCardFlip();
    triggerHaptic('light');
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  // Player Melds (Bajar)
  const handlePlayerMeld = () => {
    if (turn !== 'player' || turnStep !== 'action_drawn' || !drawnCard) return;

    const selectedCards = playerHand.filter((c) => selectedCardIds.includes(c.id));
    const allPossiblePlays = findPossibleMeldsWithCard(drawnCard, playerHand, playerMelds);

    if (allPossiblePlays.length === 0) {
      sound.playLose();
      triggerHaptic('warning');
      setFeedbackMsg('No hay combinaciones válidas posibles con esta carta.');
      return;
    }

    let chosenPlay: PossiblePlay | null = null;

    // Check if user's manual selection matches a possible play
    if (selectedCards.length > 0) {
      const match = allPossiblePlays.find((p) => {
        if (p.handCardsUsed.length !== selectedCards.length) return false;
        const usedIds = new Set(p.handCardsUsed.map((c) => c.id));
        return selectedCards.every((c) => usedIds.has(c.id));
      });

      if (match) {
        chosenPlay = match;
      } else {
        // Test direct meld validation
        const manualCheck = [drawnCard, ...selectedCards];
        if (isValidMeld(manualCheck)) {
          chosenPlay = {
            id: 'manual',
            type: 'new_meld',
            description: 'Nueva baja',
            handCardsUsed: selectedCards,
            resultingMelds: [...playerMelds, manualCheck],
          };
        } else {
          sound.playLose();
          triggerHaptic('warning');
          setFeedbackMsg('La selección no forma una tercia o corrida válida.');
          return;
        }
      }
    } else {
      // No cards selected: auto-select the best play!
      chosenPlay = allPossiblePlays[0];
    }

    if (!chosenPlay) return;

    // Apply Meld!
    sound.playCardDeal();
    triggerHaptic('success');

    const usedIds = new Set(chosenPlay.handCardsUsed.map((c) => c.id));
    const updatedHand = playerHand.filter((c) => !usedIds.has(c.id));
    const updatedMelds = chosenPlay.resultingMelds;

    setPlayerHand(updatedHand);
    setPlayerMelds(updatedMelds);
    setSelectedCardIds([]);
    setDrawnCard(null);

    const meldedCount = countMeldedCards(updatedMelds);

    if (isP2P) {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: profile.id,
        senderName: profile.name,
        payload: { action: 'MELD_UPDATE', melds: updatedMelds, hand: updatedHand },
        timestamp: Date.now(),
      });
    }

    // Win condition check: 9 cards
    if (meldedCount >= WINNING_CARD_COUNT) {
      handleGameEnd('player', '¡Felicidades! Bajaste las 9 cartas.');
      return;
    }

    if (meldedCount === 8) {
      const speech = getCrupierDialogue('player_near_win', profile.crupierPersonality);
      speakCrupier(speech, 'shocked');
      setFeedbackMsg('¡ESTÁS A UNA CARTA DE GANAR! Selecciona 1 carta para descartar.');
    } else {
      const speech = getCrupierDialogue('player_melded', profile.crupierPersonality);
      speakCrupier(speech, 'talking');
      setFeedbackMsg('¡Baja completada! Ahora selecciona 1 carta de tu mano para descartar.');
    }

    // Move to discard step to end turn
    setTurnStep('must_discard');
  };

  // Player Forces Crupier ("Meter al Crupier")
  const handlePlayerForceCrupier = () => {
    if (turn !== 'player' || turnStep !== 'action_drawn' || !drawnCard) return;

    if (!canForceCardOnOpponent(drawnCard, crupierMelds, crupierHand.length)) {
      setFeedbackMsg('Esta carta no encaja en las bajas del Crupier.');
      return;
    }

    sound.playChip();
    triggerHaptic('medium');

    const updatedCrupierMelds = applyForcedCard(drawnCard, crupierMelds);
    if (!updatedCrupierMelds) return;

    setCrupierMelds(updatedCrupierMelds);
    const cardToForce = drawnCard;
    setDrawnCard(null);

    if (isP2P) {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: profile.id,
        senderName: profile.name,
        payload: { action: 'FORCE_PLAYER', forcedCard: cardToForce },
        timestamp: Date.now(),
      });
      setFeedbackMsg('¡Le metiste la carta a tu hermano! Ahora tu hermano debe descartar.');
      setTurn('crupier');
      setTurnStep('choose_draw');
      return;
    }

    const speech = getCrupierDialogue('player_forced_crupier', profile.crupierPersonality);
    speakCrupier(speech, 'shocked');
    setFeedbackMsg('¡Le metiste la carta al Crupier! El Crupier debe descartar.');

    // Crupier discards immediately to pay the castigo
    window.setTimeout(() => {
      if (crupierHand.length > 0) {
        const crupierDiscard = chooseAIDiscard(crupierHand, updatedCrupierMelds, playerMelds);
        const remCrupierHand = crupierHand.filter((c) => c.id !== crupierDiscard.id);
        setCrupierHand(remCrupierHand);
        setDiscardPile((prev) => [...prev, crupierDiscard]);
        sound.playCardFlip();
      }

      // Check if remate is empty
      if (remateDeck.length === 0) {
        handleGameEnd('draw', 'El remate se agotó.');
        return;
      }

      // Turn passes to Crupier
      setTurn('crupier');
      setTurnStep('choose_draw');
    }, 1000);
  };

  // Player Passes (Pasar)
  const handlePlayerPass = () => {
    if (turn !== 'player' || turnStep !== 'action_drawn' || !drawnCard) return;

    sound.playCardFlip();
    triggerHaptic('light');

    const card = drawnCard;
    setDrawnCard(null);
    setFeedbackMsg('');

    if (isP2P) {
      setDiscardPile((prev) => [...prev, card]);
      setTurn('crupier');
      setTurnStep('choose_draw');
      setFeedbackMsg('Pasaste la carta. Turno de tu hermano.');
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: profile.id,
        senderName: profile.name,
        payload: { action: 'PASS', card },
        timestamp: Date.now(),
      });
      return;
    }

    // Crupier evaluates if they want the passed card
    const crupierEvaluation = evaluateAICardPlay(card, crupierHand, crupierMelds, playerMelds);

    if (crupierEvaluation.action === 'meld' && crupierEvaluation.play) {
      speakCrupier('Si tú la dejas pasar, ¡yo la bajo con gusto!', 'taunting');
      const play = crupierEvaluation.play;
      const usedIds = new Set(play.handCardsUsed.map((c) => c.id));
      const newAiHand = crupierHand.filter((c) => !usedIds.has(c.id));
      const newAiMelds = play.resultingMelds;

      setCrupierHand(newAiHand);
      setCrupierMelds(newAiMelds);
      sound.playCardDeal();

      if (countMeldedCards(newAiMelds) >= WINNING_CARD_COUNT) {
        handleGameEnd('crupier', 'El Crupier aprovechó tu carta y ganó.');
        return;
      }

      // Crupier discards 1 card
      window.setTimeout(() => {
        const aiDiscard = chooseAIDiscard(newAiHand, newAiMelds, playerMelds);
        setCrupierHand((prev) => prev.filter((c) => c.id !== aiDiscard.id));
        setDiscardPile((prev) => [...prev, aiDiscard]);
        sound.playCardFlip();

        setTurn('player');
        setTurnStep('choose_draw');
      }, 1000);
    } else {
      // Crupier also doesn't want it: card goes to discard pile
      setDiscardPile((prev) => [...prev, card]);
      const speech = getCrupierDialogue('player_passed', profile.crupierPersonality);
      speakCrupier(speech, 'neutral');

      // Check if remate ran out
      if (remateDeck.length === 0) {
        handleGameEnd('draw', 'El remate se quedó sin cartas.');
        return;
      }

      // Turn moves to Crupier
      setTurn('crupier');
      setTurnStep('choose_draw');
    }
  };

  // Player Discards to Complete Turn
  const handlePlayerDiscard = () => {
    if (turn !== 'player' || turnStep !== 'must_discard') return;

    if (selectedCardIds.length !== 1) {
      triggerHaptic('warning');
      setFeedbackMsg('Debes seleccionar exactamente 1 carta de tu mano para descartarla.');
      return;
    }

    const discardCard = playerHand.find((c) => c.id === selectedCardIds[0]);
    if (!discardCard) return;

    sound.playCardDeal();
    triggerHaptic('light');

    const nextHand = playerHand.filter((c) => c.id !== discardCard.id);
    setPlayerHand(nextHand);
    setDiscardPile((prev) => [...prev, discardCard]);
    setSelectedCardIds([]);
    setFeedbackMsg(`Descartaste ${discardCard.name}. Turno del oponente.`);

    if (isP2P) {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: profile.id,
        senderName: profile.name,
        payload: {
          action: 'DISCARD',
          card: discardCard,
          nextHand,
          nextMelds: playerMelds,
        },
        timestamp: Date.now(),
      });
    }

    // Check if remate ran out
    if (remateDeck.length === 0) {
      handleGameEnd('draw', 'El remate se agotó.');
      return;
    }

    // Turn passes to Crupier / Opponent
    setTurn('crupier');
    setTurnStep('choose_draw');
  };

  // Sort Player Hand
  const handleSortHand = (type: 'suit' | 'rank') => {
    sound.playCardFlip();
    triggerHaptic('light');
    startTransition(() => {
      setPlayerHand((prev) => (type === 'suit' ? sortHandBySuit(prev) : sortHandByRank(prev)));
    });
  };

  // Total melded counts
  const playerMeldedCount = countMeldedCards(playerMelds);
  const crupierMeldedCount = countMeldedCards(crupierMelds);

  // Can player force Crupier with drawnCard?
  const canPlayerForce =
    drawnCard !== null &&
    turn === 'player' &&
    turnStep === 'action_drawn' &&
    canForceCardOnOpponent(drawnCard, crupierMelds, crupierHand.length);

  // Available plays for player with drawnCard
  const playerPossiblePlays =
    drawnCard && turn === 'player' && turnStep === 'action_drawn'
      ? findPossibleMeldsWithCard(drawnCard, playerHand, playerMelds)
      : [];

  return (
    <div
      className={`relative w-full max-w-full h-full flex flex-col bg-gradient-to-b ${getTableThemeClasses(
        profile.tableTheme
      )} overflow-hidden overflow-x-hidden select-none safe-top safe-bottom text-white`}
    >
      {/* ========================================================
          TOP APP BAR (Casino VIP Header)
          ======================================================== */}
      <header className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md z-30">
        {/* Back to Lobby */}
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onBackToLobby();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lobby</span>
        </button>

        {/* Game Title & Pot */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <OroIcon className="w-4 h-4 inline-block" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Conquián Clásico
            </span>
            {isP2P && (
              <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                <Wifi className="w-2.5 h-2.5 animate-pulse" /> P2P
              </span>
            )}
          </div>
          {phase === 'playing' && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <Coins className="w-3 h-3" />
              <span>Pozo: {formatMoney(currentPot)}</span>
            </div>
          )}
        </div>

        {/* Controls: Audio & Rules */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSoundOn(!soundOn);
              triggerHaptic('light');
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Toggle Sound"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          </button>
          <button
            onClick={() => {
              sound.playChip();
              triggerHaptic('light');
              setShowRulesModal(true);
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Reglas"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* ========================================================
          CRUPIER / OPPONENT SECTION
          ======================================================== */}
      <section className="px-3 pt-2 pb-1.5 flex flex-col gap-1.5 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between">
          {/* Dealer Info & Speech Bubble */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative shrink-0">
              {!isP2P ? (
                <CrupierAvatar
                  size={46}
                  personality={profile.crupierPersonality}
                  mood={
                    crupierMood === 'taunting'
                      ? 'smirk'
                      : crupierMood === 'shocked'
                      ? 'impressed'
                      : 'neutral'
                  }
                  isSpeaking={crupierMood !== 'neutral'}
                />
              ) : (
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 border-2 shadow-md flex items-center justify-center font-black text-xs ${
                    crupierMood === 'shocked'
                      ? 'border-rose-400 text-rose-300 ring-2 ring-rose-400/40'
                      : crupierMood === 'taunting'
                      ? 'border-purple-400 text-purple-300 ring-2 ring-purple-400/40'
                      : crupierMood === 'talking'
                      ? 'border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/40'
                      : 'border-amber-300 text-amber-200'
                  }`}
                >
                  {remotePlayer?.name?.substring(0, 2).toUpperCase() || 'P2'}
                </div>
              )}
              {isAiThinking && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 truncate">
                  {isP2P ? (remotePlayer?.name || 'Tu Hermano') : 'Don Aurelio'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                  {crupierHand.length} cartas en mano
                </span>
                {crupierMeldedCount === 8 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/80 text-white animate-pulse">
                    ¡A UNA!
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-200 italic truncate font-serif">
                "{crupierSpeech || 'Mano lista. Juguemos con estilo.'}"
              </p>
            </div>
          </div>

          {/* Crupier Progress Badge */}
          <div className="flex flex-col items-end pl-2">
            <div className="text-[10px] text-neutral-400 font-bold uppercase">Bajas Crupier</div>
            <div className="text-xs font-mono font-black text-amber-400">
              {crupierMeldedCount} / {WINNING_CARD_COUNT}
            </div>
          </div>
        </div>

        {/* Crupier Melds Display Tray */}
        <div className="w-full min-h-[46px] flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {crupierMelds.length === 0 ? (
            <span className="text-[11px] text-neutral-500 italic pl-1">Sin bajas aún</span>
          ) : (
            crupierMelds.map((meld, mIdx) => (
              <div
                key={`c-meld-${mIdx}`}
                className="flex items-center -space-x-4 bg-black/40 p-1 rounded-lg border border-amber-500/20 shadow-inner shrink-0"
              >
                {meld.map((c) => (
                  <SpanishCardView
                    key={c.id}
                    card={c}
                    className="w-8 h-12 text-[8px] pointer-events-none shadow"
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========================================================
          CENTER PLAYING TABLE: REMATE, DRAWN CARD, DISCARD PILE
          ======================================================== */}
      <section className="flex-1 flex flex-col justify-center items-center px-4 py-2 relative">
        {phase === 'betting' ? (
          // ==========================================
          // BETTING CONTROLS VIEW
          // ==========================================
          <div className="w-full max-w-sm flex flex-col items-center gap-4 bg-black/60 p-6 rounded-3xl border border-amber-500/30 backdrop-blur-lg shadow-2xl animate-fadeIn">
            <div className="text-center">
              <OroIcon className="w-12 h-12 mx-auto mb-2 filter drop-shadow" />
              <h2 className="text-lg font-black text-amber-300">Conquián Tradicional</h2>
              <p className="text-xs text-neutral-300 mt-0.5">
                Baraja Española de 40 cartas. Gana el primero en bajar 9.
              </p>
            </div>

            {/* Bankroll Pill */}
            <div className="w-full py-2 px-4 rounded-xl bg-neutral-900/80 border border-neutral-700 flex justify-between items-center text-xs">
              <span className="text-neutral-400">Tu Saldo:</span>
              <span className="font-mono font-bold text-emerald-400">{formatMoney(profile.bankroll)}</span>
            </div>

            {/* Bet Chip Selectors */}
            <div className="w-full flex flex-col gap-1.5">
              <div className="text-[11px] font-bold text-neutral-300">Selecciona tu apuesta:</div>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      sound.playChip();
                      triggerHaptic('light');
                      setBetAmount(amount);
                    }}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      betAmount === amount
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40 scale-105'
                        : 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Deal Button */}
            {isP2P && !multiplayer.getIsHost() ? (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 border border-amber-500/40 text-center text-xs font-bold text-amber-300 animate-pulse flex items-center justify-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                Esperando que {remotePlayer?.name || 'el Anfitrión'} reparta la baraja...
              </div>
            ) : (
              <button
                onClick={() => startNewGame()}
                disabled={profile.bankroll < betAmount}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Repartir Baraja (${betAmount})</span>
              </button>
            )}
          </div>
        ) : (
          // ==========================================
          // ACTIVE GAME TABLE VIEW
          // ==========================================
          <div className="w-full flex flex-col items-center justify-center gap-3">
            {/* Status / Feedback Banner */}
            <div className="min-h-[26px] flex items-center justify-center px-3 py-1 rounded-full bg-black/50 border border-white/10 text-center">
              <span className="text-xs font-semibold text-amber-200">
                {feedbackMsg ||
                  (turn === 'player'
                    ? turnStep === 'choose_draw'
                      ? 'Tu turno: Roba del Remate o toma del Descarte.'
                      : turnStep === 'action_drawn'
                      ? 'Carta en juego: Bájala, Métela al Crupier o Pásala.'
                      : 'Descarta 1 carta de tu mano para terminar tu turno.'
                    : 'Turno de Don Aurelio (Crupier)...')}
              </span>
            </div>

            {/* Center Felt Deck & Cards */}
            <div className="w-full max-w-md flex items-center justify-around gap-2 px-2">
              {/* 1. Remate Deck (Draw Pile) */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Remate ({remateDeck.length})
                </span>
                <div
                  onClick={handlePlayerDrawFromRemate}
                  className={`relative w-16 h-24 sm:w-20 sm:h-28 rounded-lg shadow-2xl transition-all ${
                    turn === 'player' && turnStep === 'choose_draw'
                      ? 'cursor-pointer hover:scale-105 ring-4 ring-amber-400 shadow-amber-400/30'
                      : 'opacity-80'
                  }`}
                >
                  {remateDeck.length > 0 ? (
                    <>
                      <div className="absolute inset-0 translate-x-1 translate-y-1 bg-amber-950/60 rounded-lg border border-amber-900/40" />
                      <CardBack theme={profile.cardBackTheme} />
                      {turn === 'player' && turnStep === 'choose_draw' && (
                        <div className="absolute inset-0 bg-amber-400/10 rounded-lg flex items-center justify-center">
                          <span className="text-[10px] font-black bg-black/80 text-amber-300 px-1.5 py-0.5 rounded shadow">
                            Robar
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full rounded-lg border-2 border-dashed border-neutral-600 flex items-center justify-center text-[10px] text-neutral-500">
                      Vacío
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Mesa / Carta en Juego (Drawn Card) */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {cardSource === 'discard' ? 'Del Descarte' : 'En Juego'}
                </span>
                <div className="relative w-16 h-24 sm:w-20 sm:h-28 flex items-center justify-center">
                  {drawnCard ? (
                    <div className="animate-scaleUp">
                      <SpanishCardView
                        card={drawnCard}
                        className="w-16 h-24 sm:w-20 sm:h-28 shadow-2xl ring-4 ring-emerald-400 shadow-emerald-400/40"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-2 text-center text-[10px] text-neutral-400">
                      <span>Esperando carta</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Discard Pile (Pozo de Descarte) */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Descarte ({discardPile.length})
                </span>
                <div
                  onClick={handlePlayerTakeDiscard}
                  className={`relative w-16 h-24 sm:w-20 sm:h-28 rounded-lg shadow-2xl transition-all ${
                    turn === 'player' && turnStep === 'choose_draw' && discardPile.length > 0
                      ? 'cursor-pointer hover:scale-105 ring-2 ring-emerald-400'
                      : ''
                  }`}
                >
                  {discardPile.length > 0 ? (
                    <>
                      <SpanishCardView
                        card={discardPile[discardPile.length - 1]}
                        className="w-16 h-24 sm:w-20 sm:h-28"
                      />
                      {turn === 'player' && turnStep === 'choose_draw' && (
                        <div className="absolute inset-0 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <span className="text-[10px] font-black bg-black/80 text-emerald-300 px-1.5 py-0.5 rounded shadow">
                            Tomar
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full rounded-lg border-2 border-dashed border-neutral-600 flex items-center justify-center text-[10px] text-neutral-500">
                      Vacío
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons for Active Drawn Card */}
            {turn === 'player' && turnStep === 'action_drawn' && drawnCard && (
              <div className="flex items-center gap-2 mt-1 animate-fadeIn">
                {/* Bajar Button */}
                <button
                  onClick={handlePlayerMeld}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bajar ({playerPossiblePlays.length > 0 ? 'Posible' : 'Mano'})</span>
                </button>

                {/* Meter al Crupier (Castigo!) */}
                {canPlayerForce && (
                  <button
                    onClick={handlePlayerForceCrupier}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30 active:scale-95 transition-all flex items-center gap-1 animate-pulse cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>¡Meter al Crupier!</span>
                  </button>
                )}

                {/* Pasar Button */}
                <button
                  onClick={handlePlayerPass}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-600 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  Pasar
                </button>
              </div>
            )}

            {/* Must Discard Banner & Action */}
            {turn === 'player' && turnStep === 'must_discard' && (
              <div className="flex items-center gap-2 mt-1 animate-bounce">
                <button
                  onClick={handlePlayerDiscard}
                  disabled={selectedCardIds.length !== 1}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" />
                  <span>Descartar Carta Seleccionada ({selectedCardIds.length}/1)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================
          PLAYER BAJAS TRAY (Mis Bajas - Progress toward 9 cards)
          ======================================================== */}
      <section className="px-3 py-1.5 bg-black/40 border-t border-white/10 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Mis Bajas
            </span>
            {playerMeldedCount === 8 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-black animate-pulse">
                ¡A UNA DEL CONQUIÁN!
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-mono font-black">
            <span className="text-neutral-400">Progreso:</span>
            <span
              className={`${
                playerMeldedCount >= 8 ? 'text-amber-400 font-black scale-110' : 'text-emerald-400'
              }`}
            >
              {playerMeldedCount} / {WINNING_CARD_COUNT}
            </span>
          </div>
        </div>

        {/* Melds horizontal tray */}
        <div className="w-full min-h-[50px] flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {playerMelds.length === 0 ? (
            <span className="text-[11px] text-neutral-500 italic pl-1">
              No tienes bajas aún. Forma tercias o corridas para bajar.
            </span>
          ) : (
            playerMelds.map((meld, mIdx) => (
              <div
                key={`p-meld-${mIdx}`}
                className="flex items-center -space-x-3 bg-black/50 p-1 rounded-lg border border-emerald-500/30 shadow shrink-0"
              >
                {meld.map((c) => (
                  <SpanishCardView
                    key={c.id}
                    card={c}
                    className="w-9 h-14 text-[9px] pointer-events-none shadow-md"
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========================================================
          PLAYER HAND TRAY (Concealed Hand, Touch Selection)
          ======================================================== */}
      <section className="px-3 pt-2 pb-3 bg-neutral-950/90 border-t border-white/10 flex flex-col gap-2">
        {/* Tray Header & Hand Sort Options */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-neutral-300">
            <span>Tu Mano</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-400">
              {playerHand.length} cartas
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-500 mr-1">Ordenar:</span>
            <button
              onClick={() => handleSortHand('suit')}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-neutral-300 active:scale-95 transition-all"
            >
              Palo
            </button>
            <button
              onClick={() => handleSortHand('rank')}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-neutral-300 active:scale-95 transition-all"
            >
              Número
            </button>
          </div>
        </div>

        {/* Player's Cards in Hand */}
        <div className="w-full flex items-center justify-center min-h-[92px] overflow-x-auto py-1 scrollbar-none">
          {playerHand.length === 0 ? (
            <div className="text-xs text-neutral-500 italic py-4">Mano vacía</div>
          ) : (
            <div className="flex items-center justify-center -space-x-3.5 sm:-space-x-2 px-4">
              {playerHand.map((card) => {
                const isSelected = selectedCardIds.includes(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => handleToggleCardSelection(card.id)}
                    className="transition-transform duration-150"
                  >
                    <SpanishCardView
                      card={card}
                      selected={isSelected}
                      className="w-14 h-20 sm:w-16 sm:h-24 hover:z-20 cursor-pointer shadow-xl"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          ROUND OVER MODAL / OVERLAY
          ======================================================== */}
      {phase === 'round_over' && roundResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-700 p-6 flex flex-col items-center gap-4 text-center shadow-2xl">
            {/* Trophy or Skull */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-3xl shadow-xl">
              {roundResult.winner === 'player' ? '🏆' : roundResult.winner === 'crupier' ? '💀' : '🤝'}
            </div>

            <div>
              <h3 className="text-xl font-black uppercase tracking-wider text-amber-300">
                {roundResult.winner === 'player'
                  ? '¡CONQUIÁN GANADO!'
                  : roundResult.winner === 'crupier'
                  ? 'GANA EL CRUPIER'
                  : 'TABLAS (EMPATE)'}
              </h3>
              <p className="text-xs text-neutral-300 mt-1">{roundResult.message}</p>
            </div>

            {/* Payout Breakdown */}
            <div className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex justify-between items-center text-xs">
              <span className="text-neutral-400">Balance de la Ronda:</span>
              <span
                className={`font-mono font-black text-sm ${
                  roundResult.profit > 0
                    ? 'text-emerald-400'
                    : roundResult.profit < 0
                    ? 'text-rose-400'
                    : 'text-neutral-300'
                }`}
              >
                {roundResult.profit > 0 ? `+${formatMoney(roundResult.profit)}` : formatMoney(roundResult.profit)}
              </span>
            </div>

            {/* Rematch Button */}
            <div className="w-full flex gap-2">
              <button
                onClick={() => startNewGame(betAmount)}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jugar Otra Ronda (${betAmount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          RULES / TUTORIAL MODAL
          ======================================================== */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md max-h-[85vh] rounded-3xl bg-neutral-900 border border-neutral-700 p-5 flex flex-col text-white shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                  Reglas de Conquián Tradicional
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rules Content */}
            <div className="flex flex-col gap-3 py-3 text-xs leading-relaxed text-neutral-300">
              <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60">
                <span className="font-bold text-amber-300 block mb-1">1. Baraja Española de 40 cartas:</span>
                Oros, Copas, Espadas y Bastos (1 al 7, Sota-10, Caballo-11 y Rey-12).
                <br />
                <span className="text-rose-400 font-semibold">¡Los 8 y 9 no existen!</span> El 7 conecta
                directamente con la Sota (10).
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60">
                <span className="font-bold text-amber-300 block mb-1">2. Objetivo y Victoria:</span>
                Cada jugador inicia con 8 cartas en mano. Para ganar la partida debes
                <strong className="text-emerald-400"> bajar 9 cartas</strong> en combinaciones válidas en tu
                mesa.
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60">
                <span className="font-bold text-amber-300 block mb-1">3. Bajas Válidas:</span>
                • <strong className="text-white">Tercias:</strong> 3 o 4 cartas del mismo número pero diferente
                palo (ej. Tres 5s).
                <br />• <strong className="text-white">Corridas:</strong> 3 o más cartas consecutivas del mismo
                palo (ej. 5-6-7 o 7-Sota-Caballo).
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60">
                <span className="font-bold text-amber-300 block mb-1">4. Regla del Robo y Descarte:</span>
                Las cartas robadas del remate o del pozo <strong className="text-amber-400">NO</strong> se pueden
                guardar en la mano en secreto. Deben bajarse de inmediato o descartarse. Tras bajar, debes
                descartar 1 carta de tu mano.
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60">
                <span className="font-bold text-amber-300 block mb-1">5. Castigo ("Meter"):</span>
                Si una carta en juego encaja legalmente en las bajas del oponente, las reglas tradicionales
                permiten forzarlo ("meter"). El oponente debe agregarla y pagar descartando una carta de su mano.
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider active:scale-95 transition-all mt-2 cursor-pointer"
            >
              ¡Entendido, a jugar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
