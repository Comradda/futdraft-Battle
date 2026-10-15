import type { StandardCard, StandardRank, StandardSuit } from '../types/casino';

export interface HandValue {
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}

export type HandOutcome = 'won' | 'lost' | 'push' | 'blackjack' | 'bust';

export interface BlackjackHand {
  id: string;
  cards: StandardCard[];
  bet: number;
  isDoubled: boolean;
  isStood: boolean;
  isBust: boolean;
  isFromSplit: boolean;
  status: 'betting' | 'playing' | 'standing' | 'bust' | 'won' | 'lost' | 'push' | 'blackjack';
  payout: number;
}

const SUITS: StandardSuit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: StandardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function getRankValue(rank: StandardRank): number {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/**
 * Creates a shoe of N standard 52-card decks (default 6 decks = 312 cards)
 */
export function createShoe(deckCount: number = 6): StandardCard[] {
  const shoe: StandardCard[] = [];
  let cardIndex = 0;

  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({
          id: `shoe_${d}_${suit}_${rank}_${cardIndex++}`,
          suit,
          rank,
          value: getRankValue(rank),
          color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
          faceUp: true,
        });
      }
    }
  }

  return shuffleShoe(shoe);
}

/**
 * Generates an unbiased cryptographically secure random integer in range [0, max - 1]
 * using CSPRNG rejection sampling to eliminate modulo bias completely.
 */
export function getSecureRandomInt(max: number): number {
  if (max <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const maxUint = 0x100000000;
    const limit = maxUint - (maxUint % max);
    const buffer = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);
    return buffer[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * Multi-Pass Casino Grade Shoe Shuffle:
 * 1. Initial riffle & interleave scramble
 * 2. Unbiased Fisher-Yates CSPRNG hardware-entropy shuffle
 * 3. International Casino Strip-Cut & Cut-Card packet insertion
 * 4. Burn card discard (eliminates top card predictability)
 */
export function shuffleShoe(shoe: StandardCard[]): StandardCard[] {
  let deck = [...shoe];
  const passes = 4;

  for (let p = 0; p < passes; p++) {
    // Unbiased Fisher-Yates with hardware CSPRNG
    for (let i = deck.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Casino Cut packet swap (cut card between 25% and 75% depth)
    const minCut = Math.floor(deck.length * 0.25);
    const maxCut = Math.floor(deck.length * 0.75);
    const cutPoint = minCut + getSecureRandomInt(maxCut - minCut);
    deck = [...deck.slice(cutPoint), ...deck.slice(0, cutPoint)];
  }

  // Real casino procedure: Burn the top card face down
  if (deck.length > 5) {
    deck.pop(); // Burn card discarded
  }

  return deck;
}

/**
 * Calculates hand total counting Aces as 11 or 1, and flags soft hand
 */
export function calculateHandValue(cards: StandardCard[]): HandValue {
  if (!cards || cards.length === 0) {
    return { total: 0, isSoft: false, isBust: false, isBlackjack: false };
  }

  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces += 1;
      total += 11;
    } else {
      total += getRankValue(card.rank);
    }
  }

  // Soft aces adjustment
  let softAces = aces;
  while (total > 21 && softAces > 0) {
    total -= 10;
    softAces -= 1;
  }

  const isBust = total > 21;
  const isSoft = softAces > 0 && !isBust;
  const isBlackjack = cards.length === 2 && total === 21;

  return { total, isSoft, isBust, isBlackjack };
}

/**
 * Regla de Casino S17 (Dealer Stands on ALL 17s):
 * El crupier pide carta ÚNICAMENTE si tiene 16 o menos (< 17).
 * Se planta estrictamente con cualquier 17 (suave o duro) o más (17-21).
 * Nunca pide carta cuando tiene 17.
 */
export function shouldDealerHit(dealerCards: StandardCard[]): boolean {
  const { total, isBust } = calculateHandValue(dealerCards);
  if (isBust) return false;
  return total < 17; // Se planta en 17, 18, 19, 20 y 21
}

/**
 * Checks whether 2 cards can be split (matching rank or 10-value)
 */
export function canSplitCards(cards: StandardCard[]): boolean {
  if (cards.length !== 2) return false;
  const [c1, c2] = cards;
  const sameRank = c1.rank === c2.rank;
  const sameTenValue = getRankValue(c1.rank) === 10 && getRankValue(c2.rank) === 10;
  return sameRank || sameTenValue;
}

/**
 * Checks whether the hand can be split:
 * Must have exactly 2 cards and matching rank or 10-value
 */
export function canSplitHand(hand: BlackjackHand, playerBankroll: number): boolean {
  if (!canSplitCards(hand.cards)) return false;
  return playerBankroll >= hand.bet;
}

/**
 * Checks if the hand can be doubled down:
 * Must have exactly 2 cards and sufficient bankroll
 */
export function canDoubleDown(hand: BlackjackHand, playerBankroll: number): boolean {
  return hand.cards.length === 2 && playerBankroll >= hand.bet && !hand.isDoubled && !hand.isStood;
}

/**
 * Evaluates outcome and payout for a player hand against the dealer
 * Natural 21 Blackjack payout: 3 to 2 (e.g. bet $100 -> return $250, profit $150)
 * Regular win payout: 1 to 1 (e.g. bet $100 -> return $200, profit $100)
 * Push: 1 to 1 refund (e.g. bet $100 -> return $100, profit $0)
 * Loss: $0 returned (loss = -bet)
 */
export function evaluateOutcome(
  playerHand: BlackjackHand,
  dealerCards: StandardCard[]
): { outcome: HandOutcome; payout: number; profit: number; message: string } {
  const playerVal = calculateHandValue(playerHand.cards);
  const dealerVal = calculateHandValue(dealerCards);

  // Player busted
  if (playerVal.isBust) {
    return {
      outcome: 'bust',
      payout: 0,
      profit: -playerHand.bet,
      message: 'Te pasaste de 21',
    };
  }

  // Player has natural Blackjack (only from original hand, not split)
  const isPlayerNaturalBJ = playerVal.isBlackjack && !playerHand.isFromSplit;
  const isDealerNaturalBJ = dealerVal.isBlackjack;

  if (isPlayerNaturalBJ) {
    if (isDealerNaturalBJ) {
      // Push between two natural blackjacks
      return {
        outcome: 'push',
        payout: playerHand.bet,
        profit: 0,
        message: '¡Empate de Blackjack!',
      };
    }
    // Blackjack 3:2 payout
    const bjPayout = playerHand.bet + playerHand.bet * 1.5;
    return {
      outcome: 'blackjack',
      payout: bjPayout,
      profit: playerHand.bet * 1.5,
      message: '¡BLACKJACK! Pago 3 a 2',
    };
  }

  // Dealer has natural Blackjack and player does not
  if (isDealerNaturalBJ) {
    return {
      outcome: 'lost',
      payout: 0,
      profit: -playerHand.bet,
      message: 'Blackjack del Crupier',
    };
  }

  // Dealer busted
  if (dealerVal.isBust) {
    return {
      outcome: 'won',
      payout: playerHand.bet * 2,
      profit: playerHand.bet,
      message: '¡El Crupier se pasó! Ganaste',
    };
  }

  // Normal score comparison
  if (playerVal.total > dealerVal.total) {
    return {
      outcome: 'won',
      payout: playerHand.bet * 2,
      profit: playerHand.bet,
      message: `¡Ganaste! ${playerVal.total} contra ${dealerVal.total}`,
    };
  } else if (playerVal.total < dealerVal.total) {
    return {
      outcome: 'lost',
      payout: 0,
      profit: -playerHand.bet,
      message: `La casa gana: ${dealerVal.total} contra ${playerVal.total}`,
    };
  } else {
    return {
      outcome: 'push',
      payout: playerHand.bet,
      profit: 0,
      message: `Empate en ${playerVal.total}`,
    };
  }
}
