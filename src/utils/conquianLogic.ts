import type { SpanishCard, SpanishRank, SpanishSuit, PersonalityType } from '../types/casino';

// Spanish 40-Card Baraja Suits
export const SPANISH_SUITS: { id: SpanishSuit; name: string; symbol: string; color: string }[] = [
  { id: 'oros', name: 'Oros', symbol: '🟡', color: 'text-amber-500' },
  { id: 'copas', name: 'Copas', symbol: '🍷', color: 'text-red-500' },
  { id: 'espadas', name: 'Espadas', symbol: '⚔️', color: 'text-sky-500' },
  { id: 'bastos', name: 'Bastos', symbol: '🪵', color: 'text-emerald-500' },
];

// Spanish 40-Card Baraja Ranks (8 and 9 do NOT exist in traditional Spanish 40-card baraja)
// numValue defines consecutive sequence order: 7 is followed immediately by 10 (Sota)
export const SPANISH_RANKS: { rank: SpanishRank; numValue: number; name: string; shortDisplay: string }[] = [
  { rank: '1', numValue: 1, name: 'As', shortDisplay: '1' },
  { rank: '2', numValue: 2, name: 'Dos', shortDisplay: '2' },
  { rank: '3', numValue: 3, name: 'Tres', shortDisplay: '3' },
  { rank: '4', numValue: 4, name: 'Cuatro', shortDisplay: '4' },
  { rank: '5', numValue: 5, name: 'Cinco', shortDisplay: '5' },
  { rank: '6', numValue: 6, name: 'Seis', shortDisplay: '6' },
  { rank: '7', numValue: 7, name: 'Siete', shortDisplay: '7' },
  { rank: '10', numValue: 8, name: 'Sota', shortDisplay: 'Sota' },
  { rank: '11', numValue: 9, name: 'Caballo', shortDisplay: 'Cab' },
  { rank: '12', numValue: 10, name: 'Rey', shortDisplay: 'Rey' },
];

export const WINNING_CARD_COUNT = 9;

// ==========================================
// 1. DECK CREATION & SHUFFLING
// ==========================================

export function createSpanishDeck(): SpanishCard[] {
  const deck: SpanishCard[] = [];
  for (const s of SPANISH_SUITS) {
    for (const r of SPANISH_RANKS) {
      deck.push({
        id: `${s.id}-${r.rank}`,
        suit: s.id,
        rank: r.rank,
        numValue: r.numValue,
        name: `${r.name} de ${s.name}`,
        faceUp: true,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: SpanishCard[]): SpanishCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealConquianHands(): {
  playerHand: SpanishCard[];
  aiHand: SpanishCard[];
  remate: SpanishCard[];
} {
  const deck = shuffleDeck(createSpanishDeck());
  const playerHand = deck.slice(0, 8);
  const aiHand = deck.slice(8, 16);
  const remate = deck.slice(16); // Remaining 24 cards

  return {
    playerHand: sortHandBySuit(playerHand),
    aiHand: sortHandBySuit(aiHand),
    remate,
  };
}

// ==========================================
// 2. MELD VALIDATION (TERCIAS & CORRIDAS)
// ==========================================

/**
 * Checks if an array of cards forms a valid Tercia:
 * - 3 or 4 cards of identical rank.
 * - Each card must be of a DIFFERENT suit (no duplicates).
 */
export function isValidTercia(cards: SpanishCard[]): boolean {
  if (cards.length < 3 || cards.length > 4) return false;
  const firstRank = cards[0].rank;
  if (!cards.every((c) => c.rank === firstRank)) return false;
  const suits = new Set(cards.map((c) => c.suit));
  return suits.size === cards.length;
}

/**
 * Checks if an array of cards forms a valid Corrida (Straight):
 * - 3 or more consecutive cards (up to 10).
 * - All cards must belong to the SAME suit.
 * - Sequence order: 1, 2, 3, 4, 5, 6, 7, 10(numValue 8), 11(numValue 9), 12(numValue 10).
 * Note: 7 connects directly to 10 (Sota) since 8 and 9 do not exist.
 */
export function isValidCorrida(cards: SpanishCard[]): boolean {
  if (cards.length < 3 || cards.length > 10) return false;
  const firstSuit = cards[0].suit;
  if (!cards.every((c) => c.suit === firstSuit)) return false;
  const sorted = [...cards].sort((a, b) => a.numValue - b.numValue);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].numValue !== sorted[i].numValue + 1) {
      return false;
    }
  }
  return true;
}

export function isValidMeld(cards: SpanishCard[]): boolean {
  return isValidTercia(cards) || isValidCorrida(cards);
}

export function getMeldType(cards: SpanishCard[]): 'tercia' | 'corrida' | null {
  if (isValidTercia(cards)) return 'tercia';
  if (isValidCorrida(cards)) return 'corrida';
  return null;
}

export function sortMeld(meld: SpanishCard[]): SpanishCard[] {
  if (isValidCorrida(meld)) {
    return [...meld].sort((a, b) => a.numValue - b.numValue);
  }
  // Tercia: sort by suit order
  const suitOrder: Record<SpanishSuit, number> = { oros: 0, copas: 1, espadas: 2, bastos: 3 };
  return [...meld].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit]);
}

// ==========================================
// 3. COMBINATIONS VALIDATOR & CARD SHARING
// ==========================================

/**
 * Extracts all valid melds (tercias and corridas of length >= 3)
 * that can be formed from any subset of the given cards.
 */
function findAllValidMeldsFromSubset(cards: SpanishCard[]): SpanishCard[][] {
  const validMelds: SpanishCard[][] = [];

  // 1. Check Tercias (by rank)
  const rankMap = new Map<string, SpanishCard[]>();
  for (const c of cards) {
    const list = rankMap.get(c.rank) || [];
    list.push(c);
    rankMap.set(c.rank, list);
  }

  for (const [, list] of rankMap) {
    if (list.length === 3) {
      if (isValidTercia(list)) validMelds.push(list);
    } else if (list.length === 4) {
      if (isValidTercia(list)) validMelds.push(list);
      for (let i = 0; i < 4; i++) {
        const sub = list.filter((_, idx) => idx !== i);
        if (isValidTercia(sub)) validMelds.push(sub);
      }
    }
  }

  // 2. Check Corridas (by suit)
  const suitMap = new Map<string, SpanishCard[]>();
  for (const c of cards) {
    const list = suitMap.get(c.suit) || [];
    list.push(c);
    suitMap.set(c.suit, list);
  }

  for (const [, list] of suitMap) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => a.numValue - b.numValue);
    for (let start = 0; start < sorted.length; start++) {
      for (let end = start + 3; end <= sorted.length; end++) {
        const sub = sorted.slice(start, end);
        if (isValidCorrida(sub)) {
          validMelds.push(sub);
        }
      }
    }
  }

  return validMelds;
}

/**
 * Checks if a given collection of cards can be partitioned completely
 * into disjoint valid melds (allowing cards to be shared / rearranged across melds).
 * Returns the array of partitioned melds or null if invalid.
 */
export function findValidPartition(cards: SpanishCard[]): SpanishCard[][] | null {
  if (cards.length === 0) return [];
  if (cards.length < 3) return null;

  const allPossibleMelds = findAllValidMeldsFromSubset(cards);

  function solve(remaining: SpanishCard[], currentMelds: SpanishCard[][]): SpanishCard[][] | null {
    if (remaining.length === 0) return currentMelds;
    if (remaining.length < 3) return null;

    const firstCard = remaining[0];
    const candidateMelds = allPossibleMelds.filter(
      (meld) =>
        meld.some((c) => c.id === firstCard.id) &&
        meld.every((c) => remaining.some((rc) => rc.id === c.id))
    );

    for (const meld of candidateMelds) {
      const meldIds = new Set(meld.map((c) => c.id));
      const nextRemaining = remaining.filter((c) => !meldIds.has(c.id));
      const result = solve(nextRemaining, [...currentMelds, sortMeld(meld)]);
      if (result) return result;
    }

    return null;
  }

  const sorted = [...cards].sort((a, b) => a.id.localeCompare(b.id));
  return solve(sorted, []);
}

/**
 * Checks whether a card can fit directly into an existing set of melds
 * (e.g. extending a corrida or adding the 4th card to a tercia, or by rearranging).
 */
export function canCardFitInMelds(
  card: SpanishCard,
  existingMelds: SpanishCard[][]
): { canFit: boolean; newMelds?: SpanishCard[][] } {
  if (existingMelds.length === 0) return { canFit: false };
  const allCards = [...existingMelds.flat(), card];
  const partition = findValidPartition(allCards);
  if (partition) {
    return { canFit: true, newMelds: partition };
  }
  return { canFit: false };
}

export interface PossiblePlay {
  id: string;
  type: 'extend' | 'new_meld' | 'rearrange';
  description: string;
  handCardsUsed: SpanishCard[];
  resultingMelds: SpanishCard[][];
  meldFormed?: SpanishCard[];
}

/**
 * Discovers all legal plays that incorporate a given table card,
 * using either cards from hand, existing melds, or borrowing from existing melds.
 */
export function findPossibleMeldsWithCard(
  tableCard: SpanishCard,
  hand: SpanishCard[],
  existingMelds: SpanishCard[][]
): PossiblePlay[] {
  const plays: PossiblePlay[] = [];
  const seenSignatures = new Set<string>();

  // 1. Direct Extension: Does tableCard fit directly into existing melds?
  const directFit = canCardFitInMelds(tableCard, existingMelds);
  if (directFit.canFit && directFit.newMelds) {
    const sig = directFit.newMelds
      .map((m) => m.map((c) => c.id).sort().join(','))
      .sort()
      .join('|');
    seenSignatures.add(sig);
    plays.push({
      id: `extend-${tableCard.id}`,
      type: 'extend',
      description: `Agregar ${tableCard.name} a tus bajas existentes`,
      handCardsUsed: [],
      resultingMelds: directFit.newMelds,
    });
  }

  // 2. New Meld using 2 cards from hand
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      const candidate = [tableCard, hand[i], hand[j]];
      if (isValidMeld(candidate)) {
        const sorted = sortMeld(candidate);
        const meldType = isValidTercia(candidate) ? 'Tercia' : 'Corrida';
        const resultingMelds = [...existingMelds, sorted];
        const sig = resultingMelds
          .map((m) => m.map((c) => c.id).sort().join(','))
          .sort()
          .join('|');
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          plays.push({
            id: `new-${hand[i].id}-${hand[j].id}`,
            type: 'new_meld',
            description: `${meldType} con ${hand[i].name} y ${hand[j].name}`,
            handCardsUsed: [hand[i], hand[j]],
            resultingMelds,
            meldFormed: sorted,
          });
        }
      }
    }
  }

  // 3. New Meld using 3 cards from hand (4-card meld)
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      for (let k = j + 1; k < hand.length; k++) {
        const candidate = [tableCard, hand[i], hand[j], hand[k]];
        if (isValidMeld(candidate)) {
          const sorted = sortMeld(candidate);
          const meldType = isValidTercia(candidate) ? 'Tercia de 4' : 'Corrida de 4';
          const resultingMelds = [...existingMelds, sorted];
          const sig = resultingMelds
            .map((m) => m.map((c) => c.id).sort().join(','))
            .sort()
            .join('|');
          if (!seenSignatures.has(sig)) {
            seenSignatures.add(sig);
            plays.push({
              id: `new-4-${hand[i].id}-${hand[j].id}-${hand[k].id}`,
              type: 'new_meld',
              description: `${meldType} de 4 cartas`,
              handCardsUsed: [hand[i], hand[j], hand[k]],
              resultingMelds,
              meldFormed: sorted,
            });
          }
        }
      }
    }
  }

  // 4. Rearrangement / Borrowing from existing melds with 1 card from hand
  if (existingMelds.length > 0) {
    const flatMelded = existingMelds.flat();
    for (const hCard of hand) {
      const combined = [...flatMelded, tableCard, hCard];
      const partition = findValidPartition(combined);
      if (partition && partition.length >= existingMelds.length) {
        const sig = partition
          .map((m) => m.map((c) => c.id).sort().join(','))
          .sort()
          .join('|');
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          plays.push({
            id: `rearrange-${hCard.id}`,
            type: 'rearrange',
            description: `Reorganizar bajas usando ${hCard.name}`,
            handCardsUsed: [hCard],
            resultingMelds: partition,
          });
        }
      }
    }
  }

  return plays;
}

/**
 * Validates a user's manual selection of hand cards + table card
 */
export function validateManualMeld(
  selectedHandCards: SpanishCard[],
  tableCard: SpanishCard | null,
  existingMelds: SpanishCard[][]
): { valid: boolean; newMelds?: SpanishCard[][]; error?: string } {
  if (!tableCard) {
    return { valid: false, error: 'No hay carta seleccionada en la mesa.' };
  }

  // Case 1: Just the table card (adding to existing melds)
  if (selectedHandCards.length === 0) {
    const fit = canCardFitInMelds(tableCard, existingMelds);
    if (fit.canFit && fit.newMelds) {
      return { valid: true, newMelds: fit.newMelds };
    }
    return { valid: false, error: 'La carta no encaja en ninguna de tus bajas existentes.' };
  }

  // Case 2: Hand cards + table card forming a new meld
  const directCombo = [tableCard, ...selectedHandCards];
  if (isValidMeld(directCombo)) {
    return {
      valid: true,
      newMelds: [...existingMelds, sortMeld(directCombo)],
    };
  }

  // Case 3: Rearrangement with existing melds
  const allCards = [...existingMelds.flat(), tableCard, ...selectedHandCards];
  const partition = findValidPartition(allCards);
  if (partition) {
    return { valid: true, newMelds: partition };
  }

  return {
    valid: false,
    error: 'La combinación seleccionada no forma una tercia o corrida válida.',
  };
}

// ==========================================
// 4. FORCING / CASTIGO ('METER')
// ==========================================

/**
 * In Conquian, if a card fits into opponent's melds, the active player
 * can FORCE opponent to take it ('Meter').
 * Opponent must add it to their melds and discard one card from their hand!
 */
export function canForceCardOnOpponent(
  tableCard: SpanishCard,
  opponentMelds: SpanishCard[][],
  opponentHandLength: number
): boolean {
  if (opponentMelds.length === 0) return false;
  // If opponent has 0 cards in hand, forcing might give them 9 cards (a win),
  // which you'd never want to do, or they wouldn't have a card to discard.
  if (opponentHandLength <= 0) return false;
  return canCardFitInMelds(tableCard, opponentMelds).canFit;
}

export function applyForcedCard(
  tableCard: SpanishCard,
  targetMelds: SpanishCard[][]
): SpanishCard[][] | null {
  const fit = canCardFitInMelds(tableCard, targetMelds);
  return fit.canFit && fit.newMelds ? fit.newMelds : null;
}

// ==========================================
// 5. WIN CONDITION
// ==========================================

export function countMeldedCards(melds: SpanishCard[][]): number {
  return melds.reduce((sum, meld) => sum + meld.length, 0);
}

export function checkWinCondition(melds: SpanishCard[][]): boolean {
  return countMeldedCards(melds) >= WINNING_CARD_COUNT;
}

// ==========================================
// 6. SMART AI OPPONENT
// ==========================================

export interface AIAction {
  action: 'meld' | 'force' | 'pass';
  play?: PossiblePlay;
  reason: string;
}

/**
 * Calculates card utility in hand (higher = keep, lower = discard)
 */
export function evaluateCardUtility(
  card: SpanishCard,
  hand: SpanishCard[],
  aiMelds: SpanishCard[][],
  playerMelds: SpanishCard[][]
): number {
  let score = 0;
  const otherHandCards = hand.filter((c) => c.id !== card.id);

  // 1. Pair or Three of a kind in hand
  const sameRankCount = otherHandCards.filter((c) => c.rank === card.rank).length;
  if (sameRankCount === 1) score += 35; // Pair
  if (sameRankCount >= 2) score += 70; // 3 of a kind (ready to meld)

  // 2. Straight potential in hand (consecutive cards)
  const sameSuitCards = otherHandCards.filter((c) => c.suit === card.suit);
  for (const oc of sameSuitCards) {
    const diff = Math.abs(oc.numValue - card.numValue);
    if (diff === 1) score += 40; // Adjacent consecutive
    if (diff === 2) score += 20; // 1-card gap
  }

  // 3. Fits into own existing melds (could be melded or rearranged later)
  if (canCardFitInMelds(card, aiMelds).canFit) {
    score += 45;
  }

  // 4. Defensive check: Does this card fit directly into Player's melds?
  // Discarding a card the player needs is dangerous!
  if (canCardFitInMelds(card, playerMelds).canFit) {
    score += 60; // Keep it to avoid feeding or being forced!
  }

  return score;
}

/**
 * Smart AI chooses the least useful card from hand to discard.
 */
export function chooseAIDiscard(
  aiHand: SpanishCard[],
  aiMelds: SpanishCard[][],
  playerMelds: SpanishCard[][]
): SpanishCard {
  if (aiHand.length === 0) {
    throw new Error('AI has no cards to discard');
  }

  let minScore = Infinity;
  let bestDiscard = aiHand[0];

  for (const card of aiHand) {
    const utility = evaluateCardUtility(card, aiHand, aiMelds, playerMelds);
    if (utility < minScore) {
      minScore = utility;
      bestDiscard = card;
    }
  }

  return bestDiscard;
}

/**
 * Evaluates what the AI should do with a card on the table (drawn or discard).
 */
export function evaluateAICardPlay(
  tableCard: SpanishCard,
  aiHand: SpanishCard[],
  aiMelds: SpanishCard[][],
  playerMelds: SpanishCard[][]
): AIAction {
  const possiblePlays = findPossibleMeldsWithCard(tableCard, aiHand, aiMelds);

  // 1. Instant Win check: If any play leads to 9 melded cards, TAKE IT!
  for (const play of possiblePlays) {
    const newMeldedCount = countMeldedCards(play.resultingMelds);
    if (newMeldedCount >= WINNING_CARD_COUNT) {
      return {
        action: 'meld',
        play,
        reason: '¡Gano con esta jugada!',
      };
    }
  }

  // 2. If AI can form a new meld using 2 cards from hand, take it!
  const newMeldPlay = possiblePlays.find((p) => p.type === 'new_meld');
  if (newMeldPlay) {
    return {
      action: 'meld',
      play: newMeldPlay,
      reason: 'Bajo nueva tercia o corrida a mi favor.',
    };
  }

  // 3. If AI can extend existing melds, take it if AI has safe discard in hand
  const extendPlay = possiblePlays.find((p) => p.type === 'extend' || p.type === 'rearrange');
  if (extendPlay && aiHand.length > 1) {
    return {
      action: 'meld',
      play: extendPlay,
      reason: 'Extiendo mis bajas en la mesa.',
    };
  }

  // 4. Forcing / Meter al jugador:
  // If AI doesn't need it, can AI force it onto the player?
  const playerMeldedCount = countMeldedCards(playerMelds);
  // Important: NEVER force if it gives player the winning 9th card!
  if (
    playerMeldedCount + 1 < WINNING_CARD_COUNT &&
    canForceCardOnOpponent(tableCard, playerMelds, 4) // player has cards
  ) {
    return {
      action: 'force',
      reason: '¡Te la meto! Castigo para que descartes una buena.',
    };
  }

  // 5. Otherwise, pass
  return {
    action: 'pass',
    reason: 'Paso, esta carta no me sirve.',
  };
}

// ==========================================
// 7. HAND SORTING HELPERS
// ==========================================

export function sortHandByRank(cards: SpanishCard[]): SpanishCard[] {
  return [...cards].sort((a, b) => {
    if (a.numValue !== b.numValue) {
      return a.numValue - b.numValue;
    }
    return a.suit.localeCompare(b.suit);
  });
}

export function sortHandBySuit(cards: SpanishCard[]): SpanishCard[] {
  const suitOrder: Record<SpanishSuit, number> = { oros: 0, copas: 1, espadas: 2, bastos: 3 };
  return [...cards].sort((a, b) => {
    if (a.suit !== b.suit) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return a.numValue - b.numValue;
  });
}

// ==========================================
// 8. CRUPIER CONQUIAN DIALOGUE GENERATOR
// ==========================================

export type ConquianDialogueEvent =
  | 'start_round'
  | 'player_melded'
  | 'player_passed'
  | 'player_forced_crupier'
  | 'crupier_forced_player'
  | 'crupier_melded'
  | 'crupier_near_win'
  | 'player_near_win'
  | 'crupier_won'
  | 'player_won'
  | 'draw';

export function getCrupierDialogue(
  event: ConquianDialogueEvent,
  personality: PersonalityType = 'burlona',
  details?: { cardName?: string; meldType?: string }
): string {
  const cardStr = details?.cardName ? ` con ${details.cardName}` : '';
  const meldStr = details?.meldType ? ` ${details.meldType}` : '';

  switch (personality) {
    case 'burlona':
      switch (event) {
        case 'start_round':
          return 'Baraja cortada y 8 en mano. A ver si bajas 9 o te quedas a una.';
        case 'player_melded':
          return `Buena bajada${meldStr}${cardStr}... pero te sigo vigilando la mano.`;
        case 'player_passed':
          return '¿No la quieres? Más baraja para quien sí sabe qué hacer con ella.';
        case 'player_forced_crupier':
          return '¡Ah caramba! Me la metiste doblada... me toca pagar con descarte.';
        case 'crupier_forced_player':
          return '¡Toma castigo! Te la metí en tu baja. Ahora descártame una buena.';
        case 'crupier_melded':
          return `¡Baja mía! Ya sumé${meldStr}, se te acaba el tiempo.`;
        case 'crupier_near_win':
          return '¡Estoy a una carta del Conquián! Reza para que no salga mi número.';
        case 'player_near_win':
          return 'Uyyy, a una de ganar... voy a cuidar cada descarte con mi vida.';
        case 'crupier_won':
          return '¡CONQUIÁN! 9 cartas completitas. La casa nunca perdona.';
        case 'player_won':
          return '¡Válgame Dios! Me leíste toda la baraja. Te llevas el pozo completo.';
        case 'draw':
          return 'Se acabó el remate y nadie bajó las 9. ¡Tablas! El pozo se defiende.';
      }
      break;

    case 'desafiante':
      switch (event) {
        case 'start_round':
          return 'Mesa de respeto. 8 cartas repartidas, 9 para ganar. Demuestra tu calibre.';
        case 'player_melded':
          return `Aceptable${meldStr}. Pero te falta mucho camino para ganarme.`;
        case 'player_passed':
          return 'Dejar pasar cartas es dejar ir la victoria.';
        case 'player_forced_crupier':
          return 'Buen meter. Me costó una carta de mano, pero te devolveré el golpe.';
        case 'crupier_forced_player':
          return '¡Te la metí! Paga con descarte y cuida tu estrategia.';
        case 'crupier_melded':
          return `¡Meld limpio en la mesa! Cada vez más cerca de coronar.`;
        case 'crupier_near_win':
          return 'Tengo el Conquián en la mira. Una carta más y bajas la cabeza.';
        case 'player_near_win':
          return 'Estás a una. Vamos a ver si tienes la sangre fría para cerrarlo.';
        case 'crupier_won':
          return '¡CONQUIÁN! Victoria contundente de la casa. Buen intento.';
        case 'player_won':
          return '¡Victoria tuya! Jugaste con maestría este Conquián. Merecido.';
        case 'draw':
          return 'Remate agotado. Empate de guerreros. La siguiente define.';
      }
      break;

    case 'amigable':
    default:
      switch (event) {
        case 'start_round':
          return '¡Mano repartida! Que disfrutes esta partida de Conquián tradicional.';
        case 'player_melded':
          return `¡Excelente jugada${meldStr}! Muy bien armada esa combinación.`;
        case 'player_passed':
          return 'Pasaste la carta, a veces la paciencia es la mejor jugada.';
        case 'player_forced_crupier':
          return '¡Bien jugado ese castigo! Me toca descartar de mi mano.';
        case 'crupier_forced_player':
          return 'Regla del juego: entra en tu baja. Selecciona tu descarte.';
        case 'crupier_melded':
          return `Logré armar${meldStr}. ¡La partida está muy reñida!`;
        case 'crupier_near_win':
          return '¡Me falta solo una para completar 9! ¡Qué emoción!';
        case 'player_near_win':
          return '¡Estás a una carta de ganar! Mucho éxito en tu jugada.';
        case 'crupier_won':
          return '¡Conquián! Completé las 9 cartas. ¡Gran partida!';
        case 'player_won':
          return '¡Felicidades! ¡Conquián impecable! El premio es todo tuyo.';
        case 'draw':
          return '¡Tablas! Se terminaron las cartas del remate. ¡Gran juego!';
      }
  }
  return 'Juega con calma y piensa cada carta.';
}
