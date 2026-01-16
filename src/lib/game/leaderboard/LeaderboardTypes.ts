/**
 * Leaderboard Types
 */

export interface LeaderboardEntry {
  id: string;
  score: number;
  wave: number;
  maxCombo: number;
  enemiesDestroyed: number;
  timestamp: number;
  date: string; // Human-readable date
}

export interface LeaderboardData {
  highScores: LeaderboardEntry[];
  highestWaves: LeaderboardEntry[];
  bestCombos: LeaderboardEntry[];
}

export type LeaderboardCategory = 'highScores' | 'highestWaves' | 'bestCombos';

export const STORAGE_KEY_LEADERBOARD = 'alienInvasion_leaderboard';

export const MAX_LEADERBOARD_ENTRIES = 10;
