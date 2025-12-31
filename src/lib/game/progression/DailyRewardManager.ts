import { DailyLoginData, DailyReward, STORAGE_KEYS } from './ProgressionTypes';
import { CurrencyManager } from './CurrencyManager';

/**
 * DailyRewardManager - Manages daily login rewards and streaks
 *
 * Features:
 * - 7-day reward cycle
 * - Streak tracking
 * - localStorage persistence
 * - Auto-grant rewards on claim
 */
export class DailyRewardManager {
  private data: DailyLoginData;
  private currencyManager: CurrencyManager;

  // 7-Day reward cycle
  private readonly rewards: DailyReward[] = [
    { day: 1, stardust: 50, lives: 1 },
    { day: 2, stardust: 100 },
    { day: 3, stardust: 75, maxHealth: 1 },
    { day: 4, stardust: 150 },
    { day: 5, stardust: 100, powerUp: 'shield' },
    { day: 6, stardust: 200 },
    { day: 7, stardust: 300, lives: 2, special: 'weeklyBonus' }
  ];

  constructor(currencyManager: CurrencyManager) {
    this.currencyManager = currencyManager;
    this.data = this.loadFromStorage();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Check if daily reward is available
   * Returns available status, day number, and reward info
   */
  checkReward(): { available: boolean; day: number; reward?: DailyReward; streak: number } {
    const today = this.getTodayDateString();

    // Already claimed today
    if (this.data.lastLoginDate === today) {
      return {
        available: false,
        day: (this.data.currentStreak % 7) + 1,
        streak: this.data.currentStreak
      };
    }

    // Check if continuing streak
    const yesterday = this.getYesterdayDateString();

    if (this.data.lastLoginDate === yesterday) {
      // Continue streak
      this.data.currentStreak = this.data.currentStreak + 1;
    } else if (this.data.lastLoginDate !== '') {
      // Streak broken
      this.data.missedDays = (this.data.missedDays || 0) + 1;
      this.data.currentStreak = 1; // Reset to day 1
      this.data.streakResetDate = today;
    } else {
      // First time login
      this.data.currentStreak = 1;
    }

    // Get current day's reward (cycle through 1-7)
    const dayIndex = ((this.data.currentStreak - 1) % 7);
    const reward = this.rewards[dayIndex];

    return {
      available: true,
      day: dayIndex + 1,
      reward,
      streak: this.data.currentStreak
    };
  }

  /**
   * Claim daily reward
   * Returns the reward that was claimed, or null if not available
   */
  claimReward(): { success: boolean; reward?: DailyReward; message?: string } {
    const check = this.checkReward();

    if (!check.available) {
      return {
        success: false,
        message: 'Already claimed today'
      };
    }

    if (!check.reward) {
      return {
        success: false,
        message: 'No reward available'
      };
    }

    // Update login data
    this.data.lastLoginDate = this.getTodayDateString();
    this.data.totalLogins++;
    this.data.longestStreak = Math.max(this.data.longestStreak, this.data.currentStreak);

    // Grant rewards
    const reward = check.reward;

    if (reward.stardust) {
      this.currencyManager.earnStardust(reward.stardust, `daily_day${reward.day}`);
    }

    // Lives and maxHealth are granted by GameEngine when it receives the reward
    // PowerUp is also granted by GameEngine

    this.saveToStorage();

    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('daily-reward-claimed', {
      detail: { reward, day: check.day, streak: check.streak }
    }));

    return {
      success: true,
      reward,
      message: `Day ${check.day} reward claimed!`
    };
  }

  /**
   * Get current streak info
   */
  getStreakInfo(): { current: number; longest: number; totalLogins: number } {
    return {
      current: this.data.currentStreak,
      longest: this.data.longestStreak,
      totalLogins: this.data.totalLogins
    };
  }

  /**
   * Get preview of next 7 days rewards
   */
  getRewardCalendar(): DailyReward[] {
    return [...this.rewards];
  }

  /**
   * Check if today's reward has been claimed
   */
  hasClaimedToday(): boolean {
    return this.data.lastLoginDate === this.getTodayDateString();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_REWARDS, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save daily rewards to localStorage:', error);
    }
  }

  private loadFromStorage(): DailyLoginData {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_REWARDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentStreak: parsed.currentStreak || 0,
          longestStreak: parsed.longestStreak || 0,
          lastLoginDate: parsed.lastLoginDate || '',
          totalLogins: parsed.totalLogins || 0,
          rewardsCollected: parsed.rewardsCollected || [],
          missedDays: parsed.missedDays || 0,
          streakResetDate: parsed.streakResetDate,
          premiumPassActive: parsed.premiumPassActive
        };
      }
    } catch (error) {
      console.error('Failed to load daily rewards from localStorage:', error);
    }

    // Return default data
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: '',
      totalLogins: 0,
      rewardsCollected: [],
      missedDays: 0
    };
  }

  // ============================================================================
  // DEBUG METHODS
  // ============================================================================

  /**
   * Debug: Reset streak (for testing)
   */
  debugResetStreak(): void {
    if (import.meta.env.DEV) {
      this.data.currentStreak = 0;
      this.data.lastLoginDate = '';
      this.saveToStorage();
      console.log('🎮 DEBUG: Daily streak reset');
    }
  }

  /**
   * Debug: Simulate next day (for testing)
   */
  debugAdvanceDay(): void {
    if (import.meta.env.DEV) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      this.data.lastLoginDate = yesterday.toISOString().split('T')[0];
      this.saveToStorage();
      console.log('🎮 DEBUG: Advanced to next day');
    }
  }

  /**
   * Debug: Print status
   */
  debugPrintStatus(): void {
    if (import.meta.env.DEV) {
      const check = this.checkReward();
      console.log('🎁 Daily Reward Status:', {
        available: check.available,
        currentDay: check.day,
        streak: this.data.currentStreak,
        longestStreak: this.data.longestStreak,
        totalLogins: this.data.totalLogins,
        lastLogin: this.data.lastLoginDate
      });
    }
  }
}
