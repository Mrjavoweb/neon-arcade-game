import {
  LeaderboardEntry,
  LeaderboardData,
  LeaderboardCategory,
  STORAGE_KEY_LEADERBOARD,
  MAX_LEADERBOARD_ENTRIES
} from './LeaderboardTypes';
import { GameStats } from '../types';

/**
 * LeaderboardManager - Manages local leaderboard storage and rankings
 */
export class LeaderboardManager {
  private data: LeaderboardData;

  constructor() {
    this.data = this.loadLeaderboard();
  }

  /**
   * Load leaderboard from localStorage
   */
  private loadLeaderboard(): LeaderboardData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }

    // Return empty leaderboard
    return {
      highScores: [],
      highestWaves: [],
      bestCombos: []
    };
  }

  /**
   * Save leaderboard to localStorage
   */
  private saveLeaderboard(): void {
    try {
      localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(this.data));
      console.log('📊 Leaderboard saved');
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
    }
  }

  /**
   * Submit a game result to the leaderboard
   */
  public submitScore(stats: GameStats): {
    isHighScore: boolean;
    isHighestWave: boolean;
    isBestCombo: boolean;
    highScoreRank?: number;
    highestWaveRank?: number;
    bestComboRank?: number;
  } {
    const entry: LeaderboardEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      score: stats.score,
      wave: stats.wave,
      maxCombo: stats.maxCombo,
      enemiesDestroyed: stats.enemiesDestroyed,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    let isHighScore = false;
    let isHighestWave = false;
    let isBestCombo = false;
    let highScoreRank: number | undefined;
    let highestWaveRank: number | undefined;
    let bestComboRank: number | undefined;

    // Check High Score
    const scoreRank = this.addToCategory('highScores', entry, 'score');
    if (scoreRank !== -1) {
      isHighScore = true;
      highScoreRank = scoreRank + 1; // Convert to 1-based ranking
    }

    // Check Highest Wave
    const waveRank = this.addToCategory('highestWaves', entry, 'wave');
    if (waveRank !== -1) {
      isHighestWave = true;
      highestWaveRank = waveRank + 1;
    }

    // Check Best Combo
    const comboRank = this.addToCategory('bestCombos', entry, 'maxCombo');
    if (comboRank !== -1) {
      isBestCombo = true;
      bestComboRank = comboRank + 1;
    }

    // Save if any category was updated
    if (isHighScore || isHighestWave || isBestCombo) {
      this.saveLeaderboard();
    }

    return {
      isHighScore,
      isHighestWave,
      isBestCombo,
      highScoreRank,
      highestWaveRank,
      bestComboRank
    };
  }

  /**
   * Add entry to a specific leaderboard category
   * Returns the rank (0-based) if added, -1 if not added
   */
  private addToCategory(
    category: LeaderboardCategory,
    entry: LeaderboardEntry,
    sortKey: keyof LeaderboardEntry
  ): number {
    const list = this.data[category];

    // Find insertion position
    let insertIndex = list.findIndex(e => (entry[sortKey] as number) > (e[sortKey] as number));

    // If not found and list is full, entry doesn't make the cut
    if (insertIndex === -1 && list.length >= MAX_LEADERBOARD_ENTRIES) {
      return -1;
    }

    // If not found but list has space, add to end
    if (insertIndex === -1) {
      list.push(entry);
      return list.length - 1;
    }

    // Insert at the found position
    list.splice(insertIndex, 0, entry);

    // Trim to max entries
    if (list.length > MAX_LEADERBOARD_ENTRIES) {
      list.length = MAX_LEADERBOARD_ENTRIES;
    }

    return insertIndex;
  }

  /**
   * Get leaderboard for a specific category
   */
  public getLeaderboard(category: LeaderboardCategory): LeaderboardEntry[] {
    return [...this.data[category]];
  }

  /**
   * Get all leaderboard data
   */
  public getAllLeaderboards(): LeaderboardData {
    return {
      highScores: [...this.data.highScores],
      highestWaves: [...this.data.highestWaves],
      bestCombos: [...this.data.bestCombos]
    };
  }

  /**
   * Clear all leaderboard data
   */
  public clearLeaderboard(): void {
    this.data = {
      highScores: [],
      highestWaves: [],
      bestCombos: []
    };
    this.saveLeaderboard();
    console.log('📊 Leaderboard cleared');
  }

  /**
   * Get player's best scores
   */
  public getPersonalBests(): {
    highScore: number;
    highestWave: number;
    bestCombo: number;
  } {
    return {
      highScore: this.data.highScores[0]?.score || 0,
      highestWave: this.data.highestWaves[0]?.wave || 1,
      bestCombo: this.data.bestCombos[0]?.maxCombo || 0
    };
  }
}

// Singleton instance
let leaderboardManagerInstance: LeaderboardManager | null = null;

export function getLeaderboardManager(): LeaderboardManager {
  if (!leaderboardManagerInstance) {
    leaderboardManagerInstance = new LeaderboardManager();
  }
  return leaderboardManagerInstance;
}
