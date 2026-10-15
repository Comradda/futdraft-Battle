import type { StandardCard, StandardRank, StandardSuit } from '../types/casino';

export type PokerPhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'ended';

export type HandTier = 
  | 9 // Escalera Real (Royal Flush)
  | 8 // Escalera de Color (Straight Flush)
  | 7 // Póker (Four of a Kind)
  | 6 // Full House
  | 5 // Color (Flush)
  | 4 // Escalera (Straight)
  | 3 // Trío (Three of a Kind)
  | 2 // Doble Pareja (Two Pair)
  | 1 // Pareja (One Pair)
  | 0; // Carta Alta (High Card)

export interface HandEvaluation {
  tier: HandTier;
  tierName: string;
  descr: string;
  score: number[]; // Lexicographically comparable: [tier, tiebreaker1, tiebreaker2, ...]
  best5Cards: StandardCard[];
}

export type PokerActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';

export interface AIActionDecision {
  action: PokerActionType;
  amount: number;
  reason?: string;
}

const SUITS: StandardSuit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: StandardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function getPokerRankValue(rank: StandardRank): number {
  switch (rank) {
    case '2': return 2;
    case '3': return 3;
    case '4': return 4;
    case '5': return 5;
    case '6': return 6;
    case '7': return 7;
    case '8': return 8;
    case '9': return 9;
    case '10': return 10;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    case 'A': return 14;
  }
}

export function getRankNameSpanish(val: number, plural = false): string {
  switch (val) {
    case 14: return plural ? 'Ases' : 'As';
    case 13: return plural ? 'Reyes' : 'Rey';
    case 12: return plural ? 'Reinas' : 'Reina';
    case 11: return plural ? 'Jotas' : 'Jota';
    case 10: return '10';
    case 9: return '9';
    case 8: return '8';
    case 7: return '7';
    case 6: return '6';
    case 5: return '5';
    case 4: return '4';
    case 3: return '3';
    case 2: return '2';
    default: return `${val}`;
  }
}

/**
 * Creates standard 52-card deck
 */
export function createPokerDeck(): StandardCard[] {
  const deck: StandardCard[] = [];
  let id = 0;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `poker_${suit}_${rank}_${id++}`,
        suit,
        rank,
        value: getPokerRankValue(rank),
        color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
        faceUp: true,
      });
    }
  }
  return shufflePokerDeck(deck);
}

export function shufflePokerDeck(deck: StandardCard[]): StandardCard[] {
  const cards = [...deck];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/**
 * Evaluates exactly 5 cards and returns HandEvaluation
 */
function evaluate5Cards(cards: StandardCard[]): HandEvaluation {
  // Sort descending by rank value
  const sorted = [...cards].sort((a, b) => getPokerRankValue(b.rank) - getPokerRankValue(a.rank));
  const values = sorted.map(c => getPokerRankValue(c.rank));
  const suits = sorted.map(c => c.suit);

  // Check Flush
  const isFlush = suits.every(s => s === suits[0]);

  // Check Straight
  let isStraight = false;
  let straightHigh = 0;

  if (
    values[0] === values[1] + 1 &&
    values[1] === values[2] + 1 &&
    values[2] === values[3] + 1 &&
    values[3] === values[4] + 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  } else if (
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    // Wheel Straight: A-2-3-4-5 (5-high)
    isStraight = true;
    straightHigh = 5;
  }

  // Straight Flush or Royal Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        tier: 9,
        tierName: 'Escalera Real',
        descr: 'Escalera Real de Color (As al 10)',
        score: [9, 14, 0, 0, 0, 0],
        best5Cards: sorted,
      };
    }
    return {
      tier: 8,
      tierName: 'Escalera de Color',
      descr: `Escalera de Color al ${getRankNameSpanish(straightHigh)}`,
      score: [8, straightHigh, 0, 0, 0, 0],
      best5Cards: sorted,
    };
  }

  // Count frequencies
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }

  // Group by frequency descending, then rank descending
  const freqGroups = Object.entries(counts)
    .map(([rankStr, count]) => ({ rank: parseInt(rankStr, 10), count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  // Four of a Kind
  if (freqGroups[0].count === 4) {
    const quadRank = freqGroups[0].rank;
    const kicker = freqGroups[1].rank;
    return {
      tier: 7,
      tierName: 'Póker',
      descr: `Póker de ${getRankNameSpanish(quadRank, true)}`,
      score: [7, quadRank, kicker, 0, 0, 0],
      best5Cards: sorted,
    };
  }

  // Full House
  if (freqGroups[0].count === 3 && freqGroups[1].count === 2) {
    const tripRank = freqGroups[0].rank;
    const pairRank = freqGroups[1].rank;
    return {
      tier: 6,
      tierName: 'Full House',
      descr: `Full de ${getRankNameSpanish(tripRank, true)} y ${getRankNameSpanish(pairRank, true)}`,
      score: [6, tripRank, pairRank, 0, 0, 0],
      best5Cards: sorted,
    };
  }

  // Flush
  if (isFlush) {
    return {
      tier: 5,
      tierName: 'Color',
      descr: `Color al ${getRankNameSpanish(values[0])}`,
      score: [5, ...values],
      best5Cards: sorted,
    };
  }

  // Straight
  if (isStraight) {
    return {
      tier: 4,
      tierName: 'Escalera',
      descr: `Escalera al ${getRankNameSpanish(straightHigh)}`,
      score: [4, straightHigh, 0, 0, 0, 0],
      best5Cards: sorted,
    };
  }

  // Three of a Kind
  if (freqGroups[0].count === 3) {
    const tripRank = freqGroups[0].rank;
    const kickers = freqGroups.slice(1).map(g => g.rank);
    return {
      tier: 3,
      tierName: 'Trío',
      descr: `Trío de ${getRankNameSpanish(tripRank, true)}`,
      score: [3, tripRank, ...kickers, 0],
      best5Cards: sorted,
    };
  }

  // Two Pair
  if (freqGroups[0].count === 2 && freqGroups[1].count === 2) {
    const highPair = Math.max(freqGroups[0].rank, freqGroups[1].rank);
    const lowPair = Math.min(freqGroups[0].rank, freqGroups[1].rank);
    const kicker = freqGroups[2].rank;
    return {
      tier: 2,
      tierName: 'Doble Pareja',
      descr: `Doble Pareja de ${getRankNameSpanish(highPair, true)} y ${getRankNameSpanish(lowPair, true)}`,
      score: [2, highPair, lowPair, kicker, 0, 0],
      best5Cards: sorted,
    };
  }

  // One Pair
  if (freqGroups[0].count === 2) {
    const pairRank = freqGroups[0].rank;
    const kickers = freqGroups.slice(1).map(g => g.rank);
    return {
      tier: 1,
      tierName: 'Pareja',
      descr: `Pareja de ${getRankNameSpanish(pairRank, true)}`,
      score: [1, pairRank, ...kickers, 0],
      best5Cards: sorted,
    };
  }

  // High Card
  return {
    tier: 0,
    tierName: 'Carta Alta',
    descr: `Carta Alta ${getRankNameSpanish(values[0])}`,
    score: [0, ...values],
    best5Cards: sorted,
  };
}

/**
 * Generates all subsets of size k from an array
 */
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === arr.length) return [arr];
  if (k === 1) return arr.map(e => [e]);
  if (k === 0 || arr.length === 0) return [];

  const head = arr[0];
  const tail = arr.slice(1);

  const withHead = getCombinations(tail, k - 1).map(c => [head, ...c]);
  const withoutHead = getCombinations(tail, k);

  return [...withHead, ...withoutHead];
}

/**
 * Compare two hand scores lexicographically.
 * Returns > 0 if a wins, < 0 if b wins, 0 if tie.
 */
export function compareHandScores(scoreA: number[], scoreB: number[]): number {
  const maxLen = Math.max(scoreA.length, scoreB.length);
  for (let i = 0; i < maxLen; i++) {
    const a = scoreA[i] || 0;
    const b = scoreB[i] || 0;
    if (a !== b) return a - b;
  }
  return 0;
}

/**
 * 7-Card Poker Hand Evaluator (Finds the best 5-card hand out of up to 7 cards)
 */
export function evaluateBestPokerHand(cards: StandardCard[]): HandEvaluation {
  const safeCards = Array.isArray(cards) ? cards.filter((c): c is StandardCard => Boolean(c && c.rank)) : [];
  if (safeCards.length < 5) {
    // If fewer than 5 cards (e.g. preflop 2 cards), evaluate baseline high card or pair
    if (safeCards.length === 2) {
      const v0 = getPokerRankValue(safeCards[0].rank);
      const v1 = getPokerRankValue(safeCards[1].rank);
      if (v0 === v1) {
        return {
          tier: 1,
          tierName: 'Pareja',
          descr: `Pareja de ${getRankNameSpanish(v0, true)}`,
          score: [1, v0, 0, 0, 0, 0],
          best5Cards: safeCards,
        };
      }
      const high = Math.max(v0, v1);
      const low = Math.min(v0, v1);
      return {
        tier: 0,
        tierName: 'Carta Alta',
        descr: `Carta Alta ${getRankNameSpanish(high)}`,
        score: [0, high, low, 0, 0, 0],
        best5Cards: safeCards,
      };
    }
    return {
      tier: 0,
      tierName: 'Carta Alta',
      descr: safeCards.length === 0 ? 'Sin cartas en mesa' : 'Esperando cartas comunitarias...',
      score: [0, 0, 0, 0, 0, 0],
      best5Cards: safeCards,
    };
  }

  // If exactly 5 cards
  if (safeCards.length === 5) {
    return evaluate5Cards(safeCards);
  }

  // If 6 or 7 cards, find the best combination of 5
  const combos = getCombinations(safeCards, 5);
  let bestEval: HandEvaluation | null = null;

  for (const combo of combos) {
    const currentEval = evaluate5Cards(combo);
    if (!bestEval || compareHandScores(currentEval.score, bestEval.score) > 0) {
      bestEval = currentEval;
    }
  }

  return (
    bestEval || {
      tier: 0,
      tierName: 'Carta Alta',
      descr: 'Carta Alta',
      score: [0, 0, 0, 0, 0, 0],
      best5Cards: safeCards.slice(0, 5),
    }
  );
}

/**
 * Calculates draw potential (flush draws & straight draws) for AI decision making
 */
export function calculateDraws(holeCards: StandardCard[], communityCards: StandardCard[]): {
  hasFlushDraw: boolean;
  hasOpenStraightDraw: boolean;
  totalOuts: number;
} {
  const all = [...holeCards, ...communityCards];
  if (all.length < 5 || all.length >= 7) {
    return { hasFlushDraw: false, hasOpenStraightDraw: false, totalOuts: 0 };
  }

  // Flush draw: 4 cards of same suit
  const suitCounts: Record<string, number> = {};
  for (const c of all) {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  }
  const hasFlushDraw = Object.values(suitCounts).some(c => c === 4);

  // Straight draw: 4 distinct values within span of 5
  const uniqueVals = Array.from(new Set(all.map(c => getPokerRankValue(c.rank)))).sort((a, b) => a - b);
  let hasOpenStraightDraw = false;

  for (let i = 0; i <= uniqueVals.length - 4; i++) {
    const span = uniqueVals[i + 3] - uniqueVals[i];
    if (span === 3) {
      hasOpenStraightDraw = true; // 4 consecutive cards
      break;
    }
  }

  let outs = 0;
  if (hasFlushDraw) outs += 9;
  if (hasOpenStraightDraw) outs += 8;

  return { hasFlushDraw, hasOpenStraightDraw, totalOuts: outs };
}

/**
 * Cunning AI Decision Engine for Heads-Up Texas Hold'em
 * Evaluates hand strength, draws, pot odds, bluff opportunities, and raises aggressively.
 */
export function getAIDecision(params: {
  phase: PokerPhase;
  aiHoleCards: StandardCard[];
  communityCards: StandardCard[];
  pot: number;
  currentBetToCall: number; // Amount needed to call (e.g. highestBet - aiCurrentBet)
  aiBankroll: number;
  playerBankroll: number;
  bigBlind: number;
  aiAggressionFactor?: number; // 0.8 to 1.3
}): AIActionDecision {
  const {
    phase,
    aiHoleCards,
    communityCards,
    pot,
    currentBetToCall,
    aiBankroll,
    bigBlind,
    aiAggressionFactor = 1.0,
  } = params;

  if (aiBankroll <= 0) {
    return { action: 'check', amount: 0 };
  }

  if (!aiHoleCards || aiHoleCards.length < 2 || !aiHoleCards[0] || !aiHoleCards[1]) {
    return { action: currentBetToCall === 0 ? 'check' : 'fold', amount: 0 };
  }

  // Pre-flop strategy based on hole cards
  if (phase === 'preflop') {
    const c1 = aiHoleCards[0];
    const c2 = aiHoleCards[1];
    const v1 = getPokerRankValue(c1.rank);
    const v2 = getPokerRankValue(c2.rank);
    const isPair = v1 === v2;
    const isSuited = c1.suit === c2.suit;
    const highVal = Math.max(v1, v2);
    const lowVal = Math.min(v1, v2);

    // Premium hands: AA, KK, QQ, JJ, AK
    const isPremium = isPair && highVal >= 11 || (highVal === 14 && lowVal >= 13);
    // Strong hands: TT-77, AQ, AJ, KQ, suited broadways
    const isStrong = (isPair && highVal >= 7) || (highVal >= 13 && lowVal >= 10) || (isSuited && highVal >= 12);
    // Playable hands: pairs, connectors, suited cards
    const isPlayable = isPair || isSuited || (highVal >= 10 && lowVal >= 8);

    if (isPremium) {
      // 3-Bet / aggressive raise
      const raiseAmt = Math.min(aiBankroll, Math.max(bigBlind * 3, currentBetToCall * 2.5));
      return {
        action: currentBetToCall === 0 ? 'bet' : 'raise',
        amount: Math.round(raiseAmt),
        reason: 'Mano premium preflop',
      };
    }

    if (isStrong) {
      if (currentBetToCall === 0) {
        return { action: 'bet', amount: bigBlind * 2, reason: 'Apuesta de apertura' };
      }
      if (currentBetToCall <= bigBlind * 3) {
        // 35% chance to re-raise for aggression
        if (Math.random() < 0.35 * aiAggressionFactor && aiBankroll >= currentBetToCall * 2) {
          return { action: 'raise', amount: currentBetToCall * 2, reason: 'Resubida con mano fuerte' };
        }
        return { action: 'call', amount: currentBetToCall, reason: 'Paga con buena mano' };
      }
      return { action: 'call', amount: currentBetToCall };
    }

    if (isPlayable) {
      if (currentBetToCall === 0) {
        return { action: 'check', amount: 0 };
      }
      if (currentBetToCall <= bigBlind * 2) {
        return { action: 'call', amount: currentBetToCall };
      }
      // Fold against huge bet with merely playable cards
      return { action: 'fold', amount: 0, reason: 'Retirada con cartas medias ante apuesta alta' };
    }

    // Weak preflop hand
    if (currentBetToCall === 0) {
      return { action: 'check', amount: 0 };
    }
    // Occasional bluff raise preflop (15% bluff rate)
    if (Math.random() < 0.15 && currentBetToCall <= bigBlind * 2 && aiBankroll >= bigBlind * 3) {
      return { action: 'raise', amount: bigBlind * 3, reason: 'Farol preflop agresivo' };
    }
    if (currentBetToCall <= bigBlind) {
      return { action: 'call', amount: currentBetToCall };
    }
    return { action: 'fold', amount: 0, reason: 'Cartas débiles' };
  }

  // Post-flop (Flop, Turn, River)
  const currentHand = evaluateBestPokerHand([...aiHoleCards, ...communityCards]);
  const draws = calculateDraws(aiHoleCards, communityCards);

  // Pot odds calculation
  const totalPot = pot + currentBetToCall;
  const potOdds = currentBetToCall > 0 ? currentBetToCall / totalPot : 0;

  // Base strength estimate (0.0 to 1.0)
  let strength = 0.15;
  if (currentHand.tier >= 6) strength = 0.95; // Full House or better (Monster)
  else if (currentHand.tier === 5) strength = 0.88; // Flush
  else if (currentHand.tier === 4) strength = 0.82; // Straight
  else if (currentHand.tier === 3) strength = 0.75; // Three of a Kind
  else if (currentHand.tier === 2) strength = 0.65; // Two Pair
  else if (currentHand.tier === 1) {
    const pairRank = currentHand.score[1];
    strength = pairRank >= 10 ? 0.55 : 0.40; // High Pair vs Low Pair
  } else {
    // High Card
    strength = 0.20;
  }

  // Draw boost on flop/turn
  if (phase !== 'river') {
    if (draws.hasFlushDraw) strength += 0.20;
    if (draws.hasOpenStraightDraw) strength += 0.15;
  }

  // --- Decision Making ---

  // 1. Monster Hands (strength >= 0.80): Always Bet or Raise aggressively
  if (strength >= 0.80) {
    if (currentBetToCall === 0) {
      // Bet 60% to 100% of pot
      const betAmt = Math.min(aiBankroll, Math.max(bigBlind, Math.round(pot * 0.75)));
      return { action: 'bet', amount: betAmt, reason: 'Apuesta por valor con mano demoledora' };
    } else {
      // Re-raise or All-in
      const raiseAmt = Math.min(aiBankroll, Math.round(currentBetToCall * 2.2 + pot * 0.4));
      if (raiseAmt >= aiBankroll * 0.8 || aiBankroll <= bigBlind * 5) {
        return { action: 'allin', amount: aiBankroll, reason: '¡All-in con jugada dominante!' };
      }
      return { action: 'raise', amount: raiseAmt, reason: 'Resubida destructiva con gran mano' };
    }
  }

  // 2. Strong Hands (strength 0.60 to 0.79): Two pair, high pair, good flush draw
  if (strength >= 0.60) {
    if (currentBetToCall === 0) {
      // 70% bet, 30% check-trap
      if (Math.random() < 0.70) {
        const betAmt = Math.min(aiBankroll, Math.max(bigBlind, Math.round(pot * 0.5)));
        return { action: 'bet', amount: betAmt, reason: 'Apuesta de continuación' };
      }
      return { action: 'check', amount: 0, reason: 'Pasa para tender trampa' };
    } else {
      if (potOdds <= 0.45) {
        // If bet is moderate, call or raise
        if (Math.random() < 0.35 && aiBankroll >= currentBetToCall * 2) {
          return { action: 'raise', amount: currentBetToCall * 2, reason: 'Presión con buena mano' };
        }
        return { action: 'call', amount: currentBetToCall, reason: 'Paga con mano sólida' };
      }
      // Big bet against us
      if (strength >= 0.70) {
        return { action: 'call', amount: currentBetToCall };
      }
      return { action: 'fold', amount: 0, reason: 'Apuesta demasiado alta' };
    }
  }

  // 3. Medium Hands / Draws (strength 0.35 to 0.59):
  if (strength >= 0.35) {
    if (currentBetToCall === 0) {
      // 40% bet probe, 60% check
      if (Math.random() < 0.40 * aiAggressionFactor) {
        const betAmt = Math.min(aiBankroll, Math.max(bigBlind, Math.round(pot * 0.4)));
        return { action: 'bet', amount: betAmt, reason: 'Apuesta de tanteo' };
      }
      return { action: 'check', amount: 0 };
    } else {
      // Check pot odds for draws or call if small
      if (potOdds <= 0.28 || currentBetToCall <= bigBlind * 2) {
        return { action: 'call', amount: currentBetToCall, reason: 'Paga por precio de pozo' };
      }
      return { action: 'fold', amount: 0, reason: 'Pozo desfavorable para igualar' };
    }
  }

  // 4. Weak / Air Hands (strength < 0.35):
  if (currentBetToCall === 0) {
    // Cunning Bluff chance! (22% bluff frequency when checked to)
    if (Math.random() < 0.22 * aiAggressionFactor && aiBankroll >= bigBlind * 2) {
      const bluffAmt = Math.min(aiBankroll, Math.max(bigBlind, Math.round(pot * 0.55)));
      return { action: 'bet', amount: bluffAmt, reason: 'Farol audaz en mesa pasiva' };
    }
    return { action: 'check', amount: 0 };
  }

  // If facing a bet with weak hand: Fold (unless tiny micro bet)
  if (currentBetToCall <= bigBlind && Math.random() < 0.25) {
    return { action: 'call', amount: currentBetToCall, reason: 'Paga barato por curiosidad' };
  }

  return { action: 'fold', amount: 0, reason: 'Se retira con mano vacía' };
}
