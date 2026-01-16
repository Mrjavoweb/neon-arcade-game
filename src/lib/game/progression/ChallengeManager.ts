import {
  Challenge,
  ChallengeData,
  ChallengeType,
  ChallengeDifficulty,
  SessionStats,
  STORAGE_KEYS
} from './ProgressionTypes';
import { CurrencyManager } from './CurrencyManager';
import { getAudioManager } from '../audio/AudioManager';

/**
 * ChallengeManager - Manages daily and weekly challenges
 *
 * Features:
 * - 3 daily challenges (Easy, Medium, Hard)
 * - 1 weekly challenge
 * - Deterministic challenge generation (same for all players each day)
 * - Progress tracking at end of game session
 * - Automatic reset at midnight (daily) and Monday (weekly)
 */

interface ChallengeTemplate {
  type: ChallengeType;
  target: number;
  description: string;
}

// Challenge pools by difficulty
const EASY_CHALLENGES: ChallengeTemplate[] = [
  { type: 'kills', target: 30, description: 'Kill 30 enemies' },
  { type: 'kills', target: 50, description: 'Kill 50 enemies' },
  { type: 'waves', target: 5, description: 'Reach Wave 5' },
  { type: 'waves', target: 8, description: 'Reach Wave 8' },
  { type: 'powerups', target: 5, description: 'Collect 5 power-ups' },
  { type: 'powerups', target: 8, description: 'Collect 8 power-ups' },
  { type: 'score', target: 10000, description: 'Score 10,000 points' },
  { type: 'score', target: 15000, description: 'Score 15,000 points' },
  { type: 'combo', target: 5, description: 'Achieve 5x combo' },
  { type: 'combo', target: 8, description: 'Achieve 8x combo' }
];

const MEDIUM_CHALLENGES: ChallengeTemplate[] = [
  { type: 'kills', target: 75, description: 'Kill 75 enemies' },
  { type: 'kills', target: 100, description: 'Kill 100 enemies' },
  { type: 'combo', target: 15, description: 'Achieve 15x combo' },
  { type: 'combo', target: 20, description: 'Achieve 20x combo' },
  { type: 'waves', target: 12, description: 'Reach Wave 12' },
  { type: 'waves', target: 15, description: 'Reach Wave 15' },
  { type: 'bosses', target: 1, description: 'Defeat 1 boss' },
  { type: 'bosses', target: 2, description: 'Defeat 2 bosses' },
  { type: 'score', target: 30000, description: 'Score 30,000 points' },
  { type: 'perfect_waves', target: 1, description: 'Complete 1 perfect wave' }
];

const HARD_CHALLENGES: ChallengeTemplate[] = [
  { type: 'kills', target: 150, description: 'Kill 150 enemies' },
  { type: 'kills', target: 200, description: 'Kill 200 enemies' },
  { type: 'combo', target: 30, description: 'Achieve 30x combo' },
  { type: 'combo', target: 40, description: 'Achieve 40x combo' },
  { type: 'waves', target: 20, description: 'Reach Wave 20' },
  { type: 'waves', target: 25, description: 'Reach Wave 25' },
  { type: 'bosses', target: 3, description: 'Defeat 3 bosses' },
  { type: 'perfect_waves', target: 3, description: 'Complete 3 perfect waves' },
  { type: 'score', target: 50000, description: 'Score 50,000 points' },
  { type: 'score', target: 75000, description: 'Score 75,000 points' }
];

const WEEKLY_CHALLENGES: ChallengeTemplate[] = [
  { type: 'kills', target: 500, description: 'Kill 500 enemies this week' },
  { type: 'bosses', target: 5, description: 'Defeat 5 bosses this week' },
  { type: 'combo', target: 50, description: 'Achieve 50x combo' },
  { type: 'waves', target: 30, description: 'Reach Wave 30' },
  { type: 'perfect_waves', target: 10, description: 'Complete 10 perfect waves' },
  { type: 'score', target: 200000, description: 'Score 200,000 points total' }
];

// Reward amounts
const REWARDS = {
  easy: 100,
  medium: 250,
  hard: 500,
  weekly: 2000,
  dailyBonus: 300
};

export class ChallengeManager {
  private data: ChallengeData;
  private currencyManager: CurrencyManager;

  constructor(currencyManager: CurrencyManager) {
    this.currencyManager = currencyManager;
    this.data = this.loadData();
    this.checkResets();
    // Ensure data is persisted after initialization
    this.saveData();
    console.log('🎯 ChallengeManager initialized:', this.data.dailyChallenges.length, 'daily,', this.data.weeklyChallenge ? '1 weekly' : 'no weekly');
  }

  // ============================================================================
  // PUBLIC API - QUERIES
  // ============================================================================

  getDailyChallenges(): Challenge[] {
    return this.data.dailyChallenges;
  }

  getWeeklyChallenge(): Challenge | null {
    return this.data.weeklyChallenge;
  }

  getChallengeData(): ChallengeData {
    return { ...this.data };
  }

  getAllDailyCompleted(): boolean {
    return this.data.dailyChallenges.every(c => c.completed);
  }

  canClaimDailyBonus(): boolean {
    return this.getAllDailyCompleted() && !this.data.dailyBonusClaimed;
  }

  // ============================================================================
  // PUBLIC API - PROGRESS TRACKING
  // ============================================================================

  /**
   * Track progress from a completed game session.
   * Called at end of game with session stats.
   */
  trackSessionProgress(stats: SessionStats): void {
    console.log('📊 Tracking challenge progress:', stats);

    // Track daily challenges
    for (const challenge of this.data.dailyChallenges) {
      if (challenge.completed) continue;

      const newProgress = this.getProgressForType(challenge.type, stats);
      const previousProgress = challenge.current;
      challenge.current = Math.min(challenge.target, challenge.current + newProgress);

      // Check if just completed
      if (challenge.current >= challenge.target && previousProgress < challenge.target) {
        this.completeChallenge(challenge);
      }
    }

    // Track weekly challenge
    if (this.data.weeklyChallenge && !this.data.weeklyChallenge.completed) {
      const weekly = this.data.weeklyChallenge;
      const newProgress = this.getProgressForType(weekly.type, stats);
      const previousProgress = weekly.current;
      weekly.current = Math.min(weekly.target, weekly.current + newProgress);

      if (weekly.current >= weekly.target && previousProgress < weekly.target) {
        this.completeChallenge(weekly);
      }
    }

    // Check if all daily completed
    if (this.getAllDailyCompleted() && !this.data.allDailyCompleted) {
      this.data.allDailyCompleted = true;
      window.dispatchEvent(new CustomEvent('daily-bonus-available'));
    }

    this.saveData();

    // Dispatch progress update event
    window.dispatchEvent(new CustomEvent('challenge-progress', {
      detail: { challenges: this.data.dailyChallenges, weekly: this.data.weeklyChallenge }
    }));
  }

  /**
   * Claim the daily bonus for completing all 3 challenges.
   */
  claimDailyBonus(): { success: boolean; reward: number; message: string } {
    if (!this.canClaimDailyBonus()) {
      return {
        success: false,
        reward: 0,
        message: this.data.dailyBonusClaimed
          ? 'Daily bonus already claimed'
          : 'Complete all daily challenges first'
      };
    }

    this.data.dailyBonusClaimed = true;
    this.data.currentStreak++;
    this.currencyManager.earnStardust(REWARDS.dailyBonus, 'daily_challenge_bonus');

    const audioManager = getAudioManager();
    audioManager.playSound('achievement_unlock', 0.7);

    this.saveData();

    return {
      success: true,
      reward: REWARDS.dailyBonus,
      message: `+${REWARDS.dailyBonus} Stardust bonus!`
    };
  }

  // ============================================================================
  // PRIVATE - CHALLENGE GENERATION
  // ============================================================================

  private generateDailyChallenges(): Challenge[] {
    const today = this.getTodayString();
    const seed = this.hashString(today);

    return [
      this.createChallenge(EASY_CHALLENGES, 'easy', seed, 0),
      this.createChallenge(MEDIUM_CHALLENGES, 'medium', seed, 1),
      this.createChallenge(HARD_CHALLENGES, 'hard', seed, 2)
    ];
  }

  private generateWeeklyChallenge(): Challenge {
    const weekStart = this.getWeekStartString();
    const seed = this.hashString(weekStart);

    return this.createChallenge(WEEKLY_CHALLENGES, 'weekly', seed, 0);
  }

  private createChallenge(
    pool: ChallengeTemplate[],
    difficulty: ChallengeDifficulty,
    seed: number,
    offset: number
  ): Challenge {
    const index = (seed + offset * 7) % pool.length;
    const template = pool[index];

    return {
      id: `${difficulty}_${template.type}_${template.target}`,
      type: template.type,
      target: template.target,
      current: 0,
      difficulty,
      description: template.description,
      reward: REWARDS[difficulty],
      completed: false
    };
  }

  // ============================================================================
  // PRIVATE - RESET LOGIC
  // ============================================================================

  private checkResets(): void {
    const today = this.getTodayString();
    const weekStart = this.getWeekStartString();

    // Daily reset
    if (this.data.lastDailyReset !== today) {
      console.log('🌅 Daily challenge reset');
      this.data.dailyChallenges = this.generateDailyChallenges();
      this.data.lastDailyReset = today;
      this.data.allDailyCompleted = false;
      this.data.dailyBonusClaimed = false;
      this.saveData();
    }

    // Weekly reset (Monday)
    if (this.data.lastWeeklyReset !== weekStart) {
      console.log('📅 Weekly challenge reset');
      this.data.weeklyChallenge = this.generateWeeklyChallenge();
      this.data.lastWeeklyReset = weekStart;
      this.saveData();
    }
  }

  // ============================================================================
  // PRIVATE - HELPERS
  // ============================================================================

  private getProgressForType(type: ChallengeType, stats: SessionStats): number {
    switch (type) {
      case 'kills':
        return stats.kills;
      case 'combo':
        return stats.maxCombo;
      case 'waves':
        return stats.wavesReached;
      case 'bosses':
        return stats.bossesKilled;
      case 'perfect_waves':
        return stats.perfectWaves;
      case 'score':
        return stats.score;
      case 'powerups':
        return stats.powerups;
      default:
        return 0;
    }
  }

  private completeChallenge(challenge: Challenge): void {
    challenge.completed = true;
    challenge.completedAt = new Date().toISOString();
    this.data.totalChallengesCompleted++;

    // Grant reward
    this.currencyManager.earnStardust(challenge.reward, `challenge_${challenge.id}`);

    // Play sound
    const audioManager = getAudioManager();
    audioManager.playSound('achievement_unlock', 0.6);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('challenge-completed', {
      detail: { challenge }
    }));

    console.log(`✅ Challenge completed: ${challenge.description} (+${challenge.reward} 💎)`);
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getWeekStartString(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return monday.toISOString().split('T')[0];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // ============================================================================
  // STORAGE
  // ============================================================================

  private loadData(): ChallengeData {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load challenge data:', error);
    }

    // Return default data
    return {
      dailyChallenges: this.generateDailyChallenges(),
      weeklyChallenge: this.generateWeeklyChallenge(),
      lastDailyReset: this.getTodayString(),
      lastWeeklyReset: this.getWeekStartString(),
      allDailyCompleted: false,
      dailyBonusClaimed: false,
      totalChallengesCompleted: 0,
      currentStreak: 0
    };
  }

  private saveData(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save challenge data:', error);
    }
  }

  // ============================================================================
  // DEBUG
  // ============================================================================

  debugResetChallenges(): void {
    if (import.meta.env.DEV) {
      this.data = {
        dailyChallenges: this.generateDailyChallenges(),
        weeklyChallenge: this.generateWeeklyChallenge(),
        lastDailyReset: this.getTodayString(),
        lastWeeklyReset: this.getWeekStartString(),
        allDailyCompleted: false,
        dailyBonusClaimed: false,
        totalChallengesCompleted: 0,
        currentStreak: 0
      };
      this.saveData();
      console.log('🔧 DEBUG: Challenges reset');
    }
  }

  debugCompleteAll(): void {
    if (import.meta.env.DEV) {
      for (const challenge of this.data.dailyChallenges) {
        if (!challenge.completed) {
          challenge.current = challenge.target;
          this.completeChallenge(challenge);
        }
      }
      this.saveData();
      console.log('🔧 DEBUG: All daily challenges completed');
    }
  }
}
