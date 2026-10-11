// Domain Models and Types for Guessify

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  stars: number;
  min: number;
  max: number;
  baseScore: number;
  shields: number;
  description: string;
}

export type GuessResult = 'TOO_HIGH' | 'HIGH' | 'LOW' | 'TOO_LOW' | 'CORRECT';

export interface GuessRecord {
  id: string;
  guessNumber: number;
  result: GuessResult;
  timestamp: number;
}

export interface HintItem {
  id: number;
  title: string;
  description: string;
  unlocked: boolean;
  penalty: number;
}

export interface SoloGameSession {
  difficulty: Difficulty;
  targetNumber: number;
  rangeMin: number;
  rangeMax: number;
  attempts: GuessRecord[];
  maxAttempts: number;
  hintsUsed: number;
  startTime: number;
  endTime?: number;
  isWon: boolean;
  isGameOver: boolean;
  score: number;
}

export type MultiplayerMode = 'BOTH_TOGETHER' | 'HOST_GUESSES' | 'FRIEND_GUESSES';

export interface PlayerInfo {
  uid: string;
  name: string;
  avatarSeed: string;
  isReady: boolean;
  isHost: boolean;
  attemptsCount: number;
  score: number;
}

export interface MultiplayerRoom {
  roomId: string;
  code: string;
  hostUid: string;
  guestUid?: string;
  hostName: string;
  guestName?: string;
  status: 'WAITING' | 'MODE_SELECTION' | 'CONFIRMING' | 'PLAYING' | 'RESULT' | 'EXPIRED';
  selectedMode: MultiplayerMode;
  targetNumber?: number; // Server-only or held by setter
  setterUid?: string;
  currentTurnUid?: string;
  turnDeadline?: number;
  createdAt: number;
  expiresAt: number;
  guesses: {
    uid: string;
    playerName: string;
    guessNumber: number;
    result: GuessResult;
    timestamp: number;
  }[];
  winnerUid?: string;
  rematchAgreed: string[]; // List of uids who clicked Rematch
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  mode: 'Solo' | 'Multiplayer';
  difficultyOrMode: string;
  outcome: 'Victory' | 'Defeat' | 'Draw';
  targetNumber: number;
  attempts: number;
  score: number;
  durationSeconds: number;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  highScore: number;
  currentStreak: number;
  bestStreak: number;
  averageAttempts: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  isGuest: boolean;
  points: number;
  stats: UserStats;
  hideFromLeaderboard: boolean;
}

export interface LeaderboardUser {
  rank: number;
  uid: string;
  displayName: string;
  points: number;
  wins: number;
  tier: 'Grandmaster' | 'Master' | 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  isCurrentUser?: boolean;
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  keypadVibration: boolean;
  notifications: boolean;
}
