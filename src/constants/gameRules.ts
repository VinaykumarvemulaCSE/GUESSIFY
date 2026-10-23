import { Difficulty, DifficultyConfig } from '../types';

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    stars: 1,
    min: 1,
    max: 50,
    baseScore: 500,
    shields: 8,
    description: 'Number between 1–50. Quick & friendly warm-up.',
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    stars: 2,
    min: 1,
    max: 100,
    baseScore: 800,
    shields: 10,
    description: 'Number between 1–100. Balanced classic challenge.',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    stars: 3,
    min: 1,
    max: 1000,
    baseScore: 1200,
    shields: 15,
    description: 'Number between 1–1000. Master-tier binary search corridor.',
  },
};

export const MAX_HINTS = 2;
export const HINT_PENALTY = 50;
export const ATTEMPT_PENALTY = 25;
export const MIN_SOLO_SCORE = 50;
export const TURN_TIMEOUT_SECONDS = 30;
export const ROOM_CODE_LENGTH = 6;
export const ROOM_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Scoring formula from PRD Section 6.1:
// score = max(50, difficultyBase - 25 * (attempts - 1) - 50 * hintsUsed)
export function calculateSoloScore(
  difficulty: Difficulty,
  attempts: number,
  hintsUsed: number
): number {
  const base = DIFFICULTY_CONFIGS[difficulty].baseScore;
  const rawScore = base - ATTEMPT_PENALTY * (attempts - 1) - HINT_PENALTY * hintsUsed;
  return Math.max(MIN_SOLO_SCORE, rawScore);
}

/**
 * 4 Directional Indications:
 * - CORRECT: exact match
 * - TOO_HIGH: difference is far above target (> 12% of range)
 * - HIGH: difference is slightly above target (<= 12% of range, getting warm!)
 * - LOW: difference is slightly below target (<= 12% of range, getting warm!)
 * - TOO_LOW: difference is far below target (> 12% of range)
 */
export function calculateGuessFeedback(
  guess: number,
  target: number,
  rangeMin: number = 1,
  rangeMax: number = 100
): import('../types').GuessResult {
  const diff = guess - target;
  if (diff === 0) return 'CORRECT';

  const rangeSpan = Math.max(10, rangeMax - rangeMin);
  const closeThreshold = Math.max(4, Math.round(rangeSpan * 0.12));

  if (diff > 0) {
    return diff > closeThreshold ? 'TOO_HIGH' : 'HIGH';
  } else {
    return Math.abs(diff) > closeThreshold ? 'TOO_LOW' : 'LOW';
  }
}

// Multiplayer points from PRD Section 6.2:
export const MULTIPLAYER_POINTS = {
  WIN: 150,
  LOSS: 45,
};

/** The player who holds the secret and scores guesses (PRD §6.3). */
export function refereeFor(
  mode: 'BOTH_TOGETHER' | 'HOST_GUESSES' | 'FRIEND_GUESSES',
  hostUid: string,
  guestUid?: string
): string {
  if (mode === 'HOST_GUESSES') return guestUid || hostUid;
  return hostUid;
}

/** The player who guesses first in a round. */
export function firstGuesserFor(
  mode: 'BOTH_TOGETHER' | 'HOST_GUESSES' | 'FRIEND_GUESSES',
  hostUid: string,
  guestUid?: string
): string {
  if (mode === 'FRIEND_GUESSES') return guestUid || hostUid;
  return hostUid;
}

// Generate random room code (6 alphanumeric characters)
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0, 1, I, O
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate hints for target number
export function generateHints(target: number, min: number, max: number) {
  // Hint 1: Narrow range
  const quarter = Math.floor((max - min) / 4);
  const hintMin = Math.max(min, target - Math.floor(quarter / 2));
  const hintMax = Math.min(max, hintMin + quarter);

  // Hint 2: Properties (even/odd & digit sum)
  const isEven = target % 2 === 0;
  const digitSum = target
    .toString()
    .split('')
    .reduce((sum, d) => sum + parseInt(d, 10), 0);

  return [
    {
      id: 1,
      title: 'Range Radar',
      description: `The secret number lies between ${hintMin} and ${hintMax}.`,
      unlocked: false,
    },
    {
      id: 2,
      title: 'Digit Matrix',
      description: `It is an ${isEven ? 'EVEN' : 'ODD'} number with a digit sum of ${digitSum}.`,
      unlocked: false,
    },
  ];
}
