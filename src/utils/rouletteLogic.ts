import type { BetType, CrupierSpeech, PersonalityType, RouletteBet, RouletteHistoryItem } from '../types/casino';

/**
 * Authentic European Roulette wheel layout sequence (37 numbers: 0 to 36).
 * Counter-clockwise / clockwise standard single-zero layout.
 */
export const ROULETTE_WHEEL_SEQUENCE: readonly number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

export const RED_NUMBERS: readonly number[] = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
] as const;

export const BLACK_NUMBERS: readonly number[] = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
] as const;

const RED_SET = new Set(RED_NUMBERS);
const BLACK_SET = new Set(BLACK_NUMBERS);

export type RouletteColor = 'red' | 'black' | 'green';

/**
 * Returns color of a given European roulette number
 */
export function getNumberColor(num: number): RouletteColor {
  if (num === 0) return 'green';
  return RED_SET.has(num) ? 'red' : 'black';
}

/**
 * Returns index of a number on the European roulette wheel sequence
 */
export function getWheelIndex(num: number): number {
  return ROULETTE_WHEEL_SEQUENCE.indexOf(num);
}

/**
 * Standard European Roulette payout multipliers (profit to 1).
 * Total return = bet * (multiplier + 1)
 */
export const PAYOUT_MULTIPLIERS: Record<BetType, number> = {
  straight: 35, // 35:1
  split: 17,    // 17:1
  street: 11,   // 11:1
  corner: 8,    // 8:1
  line: 5,      // 5:1
  dozen1: 2,    // 2:1
  dozen2: 2,    // 2:1
  dozen3: 2,    // 2:1
  col1: 2,      // 2:1
  col2: 2,      // 2:1
  col3: 2,      // 2:1
  red: 1,       // 1:1
  black: 1,     // 1:1
  even: 1,      // 1:1
  odd: 1,       // 1:1
  low: 1,       // 1:1 (1-18)
  high: 1,      // 1:1 (19-36)
};

/**
 * Placed bet on the table cloth with a unique ID for stack management
 */
export interface PlacedBet extends RouletteBet {
  id: string;
  chipStack: number[]; // e.g. [10, 25, 50] chips stacked on this position
  positionKey: string; // key identifying cloth coordinate or zone
}

/**
 * Result of bet evaluation
 */
export interface BetEvaluationResult {
  bet: PlacedBet;
  won: boolean;
  payout: number;    // Total return (original bet + profit)
  netProfit: number; // profit only
}

/**
 * Full settlement result of a roulette round
 */
export interface SpinSettlement {
  winningNumber: number;
  color: RouletteColor;
  totalBetAmount: number;
  totalPayout: number;
  netProfit: number;
  winningBets: BetEvaluationResult[];
  isWin: boolean;
  isBigWin: boolean;
  isNearMiss: boolean;
  isZero: boolean;
  nearMissNumber?: number;
}

/**
 * Generates random winning number (0-36) with cryptographic quality
 */
export function generateWinningNumber(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % 37;
  }
  return Math.floor(Math.random() * 37);
}

/**
 * Checks if a specific bet wins given a winning number
 */
export function isBetWinner(bet: RouletteBet, winningNumber: number): boolean {
  switch (bet.type) {
    case 'straight':
    case 'split':
    case 'street':
    case 'corner':
    case 'line':
      return bet.numbers.includes(winningNumber);

    case 'dozen1':
      return winningNumber >= 1 && winningNumber <= 12;
    case 'dozen2':
      return winningNumber >= 13 && winningNumber <= 24;
    case 'dozen3':
      return winningNumber >= 25 && winningNumber <= 36;

    case 'col1':
      return winningNumber !== 0 && winningNumber % 3 === 1;
    case 'col2':
      return winningNumber !== 0 && winningNumber % 3 === 2;
    case 'col3':
      return winningNumber !== 0 && winningNumber % 3 === 0;

    case 'red':
      return RED_SET.has(winningNumber);
    case 'black':
      return BLACK_SET.has(winningNumber);

    case 'even':
      return winningNumber !== 0 && winningNumber % 2 === 0;
    case 'odd':
      return winningNumber !== 0 && winningNumber % 2 !== 0;

    case 'low':
      return winningNumber >= 1 && winningNumber <= 18;
    case 'high':
      return winningNumber >= 19 && winningNumber <= 36;

    default:
      return false;
  }
}

/**
 * Checks if the spin was a near miss:
 * Returns true if ball landed on an immediate wheel neighbor (+1 or -1 pocket)
 * of any straight bet that the player placed.
 */
export function checkWheelNearMiss(
  bets: PlacedBet[],
  winningNumber: number
): { isNearMiss: boolean; nearMissNumber?: number } {
  const winIdx = getWheelIndex(winningNumber);
  const leftNeighborIdx = (winIdx - 1 + 37) % 37;
  const rightNeighborIdx = (winIdx + 1) % 37;
  const leftNeighbor = ROULETTE_WHEEL_SEQUENCE[leftNeighborIdx];
  const rightNeighbor = ROULETTE_WHEEL_SEQUENCE[rightNeighborIdx];

  const straightBets = bets.filter((b) => b.type === 'straight' && b.numbers.length > 0);

  for (const bet of straightBets) {
    const num = bet.numbers[0];
    if (num === leftNeighbor || num === rightNeighbor) {
      return { isNearMiss: true, nearMissNumber: num };
    }
  }

  return { isNearMiss: false };
}

/**
 * Settles all placed bets against the winning number
 */
export function settleRouletteBets(
  bets: PlacedBet[],
  winningNumber: number
): SpinSettlement {
  const color = getNumberColor(winningNumber);
  let totalBetAmount = 0;
  let totalPayout = 0;
  const winningBets: BetEvaluationResult[] = [];

  for (const bet of bets) {
    totalBetAmount += bet.amount;
    const won = isBetWinner(bet, winningNumber);

    if (won) {
      const multiplier = PAYOUT_MULTIPLIERS[bet.type] ?? 1;
      const payout = bet.amount * (multiplier + 1); // Bet returned + profit
      const netProfit = bet.amount * multiplier;
      totalPayout += payout;
      winningBets.push({
        bet,
        won: true,
        payout,
        netProfit,
      });
    }
  }

  const netProfit = totalPayout - totalBetAmount;
  const isWin = totalPayout > 0;
  const isBigWin = netProfit >= totalBetAmount * 3 || winningBets.some((w) => w.bet.type === 'straight');
  const isZero = winningNumber === 0;

  const nearMissInfo = !isWin
    ? checkWheelNearMiss(bets, winningNumber)
    : { isNearMiss: false, nearMissNumber: undefined };

  return {
    winningNumber,
    color,
    totalBetAmount,
    totalPayout,
    netProfit,
    winningBets,
    isWin,
    isBigWin,
    isNearMiss: nearMissInfo.isNearMiss,
    isZero,
    nearMissNumber: nearMissInfo.nearMissNumber,
  };
}

/**
 * Hot & Cold Numbers calculation
 */
export interface HotColdStats {
  hot: { number: number; count: number; color: RouletteColor }[];
  cold: { number: number; count: number; color: RouletteColor }[];
  redPercentage: number;
  blackPercentage: number;
  greenPercentage: number;
  evenPercentage: number;
  oddPercentage: number;
  totalSpins: number;
}

export function calculateHotAndColdNumbers(
  history: (RouletteHistoryItem | number)[],
  limit = 5
): HotColdStats {
  const normalized: number[] = history.map((item) =>
    typeof item === 'number' ? item : item.number
  );

  const counts = new Map<number, number>();
  for (let n = 0; n <= 36; n++) {
    counts.set(n, 0);
  }

  let redCount = 0;
  let blackCount = 0;
  let greenCount = 0;
  let evenCount = 0;
  let oddCount = 0;

  for (const num of normalized) {
    counts.set(num, (counts.get(num) || 0) + 1);
    const col = getNumberColor(num);
    if (col === 'red') redCount++;
    else if (col === 'black') blackCount++;
    else greenCount++;

    if (num !== 0) {
      if (num % 2 === 0) evenCount++;
      else oddCount++;
    }
  }

  const total = normalized.length || 1;

  // Sort numbers by frequency
  const sorted = Array.from(counts.entries()).map(([number, count]) => ({
    number,
    count,
    color: getNumberColor(number),
  }));

  const hot = [...sorted]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const cold = [...sorted]
    .sort((a, b) => a.count - b.count)
    .slice(0, limit);

  return {
    hot,
    cold,
    redPercentage: Math.round((redCount / total) * 100),
    blackPercentage: Math.round((blackCount / total) * 100),
    greenPercentage: Math.round((greenCount / total) * 100),
    evenPercentage: Math.round((evenCount / total) * 100),
    oddPercentage: Math.round((oddCount / total) * 100),
    totalSpins: normalized.length,
  };
}

/**
 * Crupier reaction triggers based on roulette settlement and personality
 */
export function getRouletteCrupierSpeech(
  personality: PersonalityType,
  settlement: SpinSettlement
): CrupierSpeech {
  const { winningNumber, color, isWin, isBigWin, isNearMiss, isZero, nearMissNumber, netProfit } =
    settlement;
  const colorName = color === 'red' ? 'Rojo' : color === 'black' ? 'Negro' : 'Cero Verde';

  // 1. Zero landed!
  if (isZero) {
    if (isWin) {
      return {
        text: `¡El Cero verde cayó y lo tenías cubierto! ¡Eso es visión de gran apostador!`,
        mood: 'celebrating',
      };
    }
    switch (personality) {
      case 'burlona':
        return {
          text: '¡Cero Verde! ¡La casa barre la mesa! ¿No sabías que el cero es mi número preferido? 😏',
          mood: 'laughing',
        };
      case 'desafiante':
        return {
          text: '¡El Cero implacable! La ruleta demuestra quién manda aquí.',
          mood: 'challenging',
        };
      case 'amigable':
        return {
          text: '¡Vaya, cayó el Cero verde! Una tirada dura, ¡vamos por el desquite!',
          mood: 'thinking',
        };
      case 'neutral':
      default:
        return {
          text: 'Cero verde. Suertes sencillas y docenas pierden.',
          mood: 'neutral',
        };
    }
  }

  // 2. Big Win / Pleno 35:1
  if (isBigWin) {
    switch (personality) {
      case 'burlona':
        return {
          text: `¡Pleno al ${winningNumber}! ¡+$${netProfit.toLocaleString()}! Qué barbaridad... ¿trajiste un imán en el bolsillo?`,
          mood: 'impressed',
        };
      case 'desafiante':
        return {
          text: `¡Tiro maestro al ${winningNumber}! Has doblegado la rueda imperial esta vez.`,
          mood: 'impressed',
        };
      case 'amigable':
        return {
          text: `¡¡SIII!! ¡Número ${winningNumber} en pleno! ¡Ganaste $${netProfit.toLocaleString()}! ¡Increíble acierto!`,
          mood: 'celebrating',
        };
      case 'neutral':
      default:
        return {
          text: `Número ${winningNumber}, ${colorName}. Pago de pleno realizado con éxito.`,
          mood: 'impressed',
        };
    }
  }

  // 3. Near Miss (Landed 1 pocket away from player's straight bet on the wheel)
  if (isNearMiss && nearMissNumber !== undefined) {
    switch (personality) {
      case 'burlona':
        return {
          text: `¡Cayó el ${winningNumber}, a un pelo de rana de tu número ${nearMissNumber}! El aire se te congeló en la garganta, ¿verdad?`,
          mood: 'smirk',
        };
      case 'desafiante':
        return {
          text: `Rozó el ${nearMissNumber} y cayó en el ${winningNumber}. El destino te retó por milímetros.`,
          mood: 'challenging',
        };
      case 'amigable':
        return {
          text: `¡Uyyy qué cerquita estuvo tu número ${nearMissNumber}! ¡Rebotó en la casilla de al lado!`,
          mood: 'thinking',
        };
      case 'neutral':
      default:
        return {
          text: `Número ${winningNumber}, vecino inmediato del ${nearMissNumber} en la rueda.`,
          mood: 'thinking',
        };
    }
  }

  // 4. Regular Win
  if (isWin) {
    switch (personality) {
      case 'burlona':
        return {
          text: `Número ${winningNumber}, ${colorName}. Cobraste $${netProfit.toLocaleString()}, pero no te confíes que la rueda gira rápido.`,
          mood: 'smirk',
        };
      case 'desafiante':
        return {
          text: `Número ${winningNumber}. Buena jugada, cobras tus fichas. Mantén la concentración.`,
          mood: 'challenging',
        };
      case 'amigable':
        return {
          text: `¡Muy bien jugado! El ${winningNumber} te dio la victoria de $${netProfit.toLocaleString()}.`,
          mood: 'celebrating',
        };
      case 'neutral':
      default:
        return {
          text: `Número ${winningNumber}, ${colorName}. Pagos efectuados.`,
          mood: 'neutral',
        };
    }
  }

  // 5. Normal Loss
  switch (personality) {
    case 'burlona':
      return {
        text: `Cayó el ${winningNumber}, ${colorName}. Gracias por tu amable contribución al casino.`,
        mood: 'smirk',
      };
    case 'desafiante':
      return {
        text: `Número ${winningNumber}. La rueda no perdona a los débiles. ¿Duplicas tu apuesta?`,
        mood: 'challenging',
      };
    case 'amigable':
      return {
        text: `El ${winningNumber} se nos escapó esta vez. ¡Respira y confía en la siguiente bola!`,
        mood: 'neutral',
      };
    case 'neutral':
    default:
      return {
        text: `Número ${winningNumber}, ${colorName}. Las apuestas no premiadas van a la banca.`,
        mood: 'neutral',
      };
  }
}
