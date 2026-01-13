import { DailyLoginData, DailyReward, MilestoneReward, ComebackBonus, STORAGE_KEYS } from './ProgressionTypes';
import { CurrencyManager } from './CurrencyManager';

// Session storage key to track if popup was shown this session
const DAILY_REWARD_SHOWN_KEY = 'alienInvasion_dailyRewardShownThisSession';

/**
 * DailyRewardManager - Manages daily login rewards and streaks
 *
 * Features:
 * - 7-day reward cycle with escalating rewards
 * - Streak tracking with comeback bonus
 * - Milestone rewards for total logins
 * - localStorage persistence
 * - Auto-grant rewards on claim
 * - Session tracking to prevent duplicate popups
 */
export class DailyRewardManager {
  private data: DailyLoginData;
  private currencyManager: CurrencyManager;

  // 7-Day base reward cycle
  private readonly baseRewards: DailyReward[] = [
    { day: 1, stardust: 50, lives: 1 },
    { day: 2, stardust: 100 },
    { day: 3, stardust: 75, maxHealth: 1 },
    { day: 4, stardust: 150 },
    { day: 5, stardust: 100, powerUp: 'shield' },
    { day: 6, stardust: 200 },
    { day: 7, stardust: 300, lives: 2, special: 'weeklyBonus' }
  ];

  // Milestone rewards for total logins
  private readonly milestones: MilestoneReward[] = [
    { id: 7, totalLogins: 7, stardust: 500, description: '7 Day Champion' },
    { id: 14, totalLogins: 14, stardust: 1000, title: 'Dedicated', description: '14 Day Streak' },
    { id: 30, totalLogins: 30, stardust: 2500, cosmetic: 'cyan_frost', description: '30 Day Warrior' },
    { id: 60, totalLogins: 60, stardust: 5000, lives: 3, cosmetic: 'purple_shadow', description: '60 Day Legend' },
    { id: 100, totalLogins: 100, stardust: 10000, lives: 5, maxHealth: 2, cosmetic: 'rainbow_streak', title: 'Centurion', description: '100 Day Master' },
    { id: 365, totalLogins: 365, stardust: 50000, lives: 10, maxHealth: 5, cosmetic: 'cosmic_void', title: 'Eternal', description: '365 Day God' }
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
   * Returns available status, day number, and reward info with escalation
   */
  checkReward(): { available: boolean; day: number; reward?: DailyReward; streak: number; comebackBonus?: ComebackBonus } {
    const today = this.getTodayDateString();

    // Already claimed today
    if (this.data.lastLoginDate === today) {
      return {
        available: false,
        day: (this.data.currentStreak % 7) + 1,
        streak: this.data.currentStreak
      };
    }

    // Check if continuing streak or comeback bonus applies
    const yesterday = this.getYesterdayDateString();
    const daysAway = this.calculateDaysAway(this.data.lastLoginDate, today);
    let comebackBonus: ComebackBonus | undefined;

    if (this.data.lastLoginDate === yesterday) {
      // Continue streak
      this.data.currentStreak = this.data.currentStreak + 1;
    } else if (this.data.lastLoginDate !== '' && daysAway <= 3) {
      // Comeback bonus: missed 1-3 days, offer streak recovery
      const oldStreak = this.data.currentStreak;
      const recoveryPercent = daysAway === 1 ? 50 : daysAway === 2 ? 25 : 0;
      const bonusStardust = daysAway === 1 ? 50 : daysAway === 2 ? 25 : 0;

      if (recoveryPercent > 0) {
        const recoveredStreak = Math.floor(oldStreak * (recoveryPercent / 100));
        this.data.currentStreak = Math.max(1, recoveredStreak);

        comebackBonus = {
          available: true,
          daysAway,
          streakRecovery: recoveryPercent,
          bonusStardust,
          message: `Welcome back! ${recoveryPercent}% streak recovered + ${bonusStardust} 💎 bonus!`
        };
      } else {
        this.data.currentStreak = 1; // Full reset after 3 days
      }

      this.data.missedDays = (this.data.missedDays || 0) + daysAway;
    } else if (this.data.lastLoginDate !== '') {
      // Streak broken (4+ days away)
      this.data.missedDays = (this.data.missedDays || 0) + daysAway;
      this.data.currentStreak = 1; // Reset to day 1
      this.data.streakResetDate = today;
    } else {
      // First time login
      this.data.currentStreak = 1;
    }

    // Get current day's reward (cycle through 1-7) with escalation
    const dayIndex = ((this.data.currentStreak - 1) % 7);
    const baseReward = { ...this.baseRewards[dayIndex] };

    // Calculate week multiplier (1.0, 1.25, 1.5, 2.0, 2.5 cap)
    const weekNumber = Math.floor(this.data.currentStreak / 7) + 1;
    const weekMultiplier = this.getWeekMultiplier(weekNumber);

    // Apply escalation to stardust
    if (baseReward.stardust) {
      baseReward.stardust = Math.floor(baseReward.stardust * weekMultiplier);
      baseReward.weekMultiplier = weekMultiplier;
    }

    return {
      available: true,
      day: dayIndex + 1,
      reward: baseReward,
      streak: this.data.currentStreak,
      comebackBonus
    };
  }

  /**
   * Calculate week multiplier for escalating rewards
   * Week 1: 1.0x, Week 2: 1.25x, Week 3: 1.5x, Week 4: 2.0x, Week 5+: 2.5x
   */
  private getWeekMultiplier(weekNumber: number): number {
    if (weekNumber === 1) return 1.0;
    if (weekNumber === 2) return 1.25;
    if (weekNumber === 3) return 1.5;
    if (weekNumber === 4) return 2.0;
    return 2.5; // Week 5+ cap
  }

  /**
   * Calculate days away between two date strings
   */
  private calculateDaysAway(lastDate: string, currentDate: string): number {
    if (!lastDate) return 0;
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diffTime = Math.abs(current.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays - 1; // -1 because yesterday = 0 days away
  }

  /**
   * Claim daily reward
   * Returns the reward that was claimed, milestones unlocked, and comeback bonus
   */
  claimReward(): {
    success: boolean;
    reward?: DailyReward;
    message?: string;
    milestonesUnlocked?: MilestoneReward[];
    comebackBonus?: ComebackBonus;
  } {
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

    // Grant daily rewards
    const reward = check.reward;

    if (reward.stardust) {
      this.currencyManager.earnStardust(reward.stardust, `daily_day${reward.day}`);
    }

    // Grant comeback bonus if available
    if (check.comebackBonus && check.comebackBonus.bonusStardust > 0) {
      this.currencyManager.earnStardust(check.comebackBonus.bonusStardust, 'comeback_bonus');
    }

    // Check for milestone unlocks
    const milestonesUnlocked = this.checkAndGrantMilestones();

    // Lives and maxHealth are granted by GameEngine when it receives the reward
    // PowerUp is also granted by GameEngine

    this.saveToStorage();

    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('daily-reward-claimed', {
      detail: {
        reward,
        day: check.day,
        streak: check.streak,
        milestonesUnlocked,
        comebackBonus: check.comebackBonus
      }
    }));

    return {
      success: true,
      reward,
      message: `Day ${check.day} reward claimed!`,
      milestonesUnlocked,
      comebackBonus: check.comebackBonus
    };
  }

  /**
   * Check for and grant milestone rewards
   * Returns array of newly unlocked milestones
   */
  private checkAndGrantMilestones(): MilestoneReward[] {
    const unlockedMilestones: MilestoneReward[] = [];

    for (const milestone of this.milestones) {
      // Check if milestone is reached and not yet claimed
      if (this.data.totalLogins >= milestone.totalLogins &&
          !this.data.milestonesUnlocked.includes(milestone.id)) {

        // Grant milestone rewards
        this.currencyManager.earnStardust(milestone.stardust, `milestone_${milestone.id}`);

        // Mark as unlocked
        this.data.milestonesUnlocked.push(milestone.id);
        unlockedMilestones.push(milestone);

        // Cosmetics, lives, and maxHealth are granted by GameEngine
        console.log(`🎉 Milestone unlocked: ${milestone.description} (${milestone.totalLogins} logins)`);
      }
    }

    return unlockedMilestones;
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
   * Get preview of next 7 days rewards with current week multiplier
   */
  getRewardCalendar(): DailyReward[] {
    const weekNumber = Math.floor(this.data.currentStreak / 7) + 1;
    const multiplier = this.getWeekMultiplier(weekNumber);

    return this.baseRewards.map(reward => ({
      ...reward,
      stardust: reward.stardust ? Math.floor(reward.stardust * multiplier) : undefined,
      weekMultiplier: multiplier
    }));
  }

  /**
   * Get all milestone rewards and their unlock status
   */
  getMilestones(): Array<MilestoneReward & { unlocked: boolean }> {
    return this.milestones.map(milestone => ({
      ...milestone,
      unlocked: this.data.milestonesUnlocked.includes(milestone.id)
    }));
  }

  /**
   * Get next milestone to unlock
   */
  getNextMilestone(): (MilestoneReward & { progress: number }) | null {
    const next = this.milestones.find(m => !this.data.milestonesUnlocked.includes(m.id));
    if (!next) return null;

    return {
      ...next,
      progress: Math.min(100, Math.floor((this.data.totalLogins / next.totalLogins) * 100))
    };
  }

  /**
   * Check if today's reward has been claimed
   */
  hasClaimedToday(): boolean {
    return this.data.lastLoginDate === this.getTodayDateString();
  }

  /**
   * Check if the popup was already shown in this browser session
   * This prevents the popup from appearing multiple times when navigating between pages
   */
  wasPopupShownThisSession(): boolean {
    try {
      const shown = sessionStorage.getItem(DAILY_REWARD_SHOWN_KEY);
      const today = this.getTodayDateString();
      // Check if shown today (session might span midnight)
      return shown === today;
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark that the popup was shown in this session
   * Called when the popup is displayed to the user
   */
  markPopupShownThisSession(): void {
    try {
      sessionStorage.setItem(DAILY_REWARD_SHOWN_KEY, this.getTodayDateString());
    } catch (error) {
      console.warn('Failed to save popup shown flag to sessionStorage:', error);
    }
  }

  /**
   * Clear the popup shown flag (called when reward is claimed)
   * This allows the next day's popup to show
   */
  clearPopupShownFlag(): void {
    try {
      sessionStorage.removeItem(DAILY_REWARD_SHOWN_KEY);
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Check if daily reward should be shown
   * Returns true only if: reward is available AND popup hasn't been shown this session
   */
  shouldShowPopup(): boolean {
    // If already claimed today, never show
    if (this.hasClaimedToday()) {
      return false;
    }
    // If popup was already shown this session, don't show again
    if (this.wasPopupShownThisSession()) {
      return false;
    }
    // Check if reward is available
    const check = this.checkReward();
    return check.available;
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
          milestonesUnlocked: parsed.milestonesUnlocked || [],
          lastMilestoneCheck: parsed.lastMilestoneCheck || 0,
          missedDays: parsed.missedDays || 0,
          streakResetDate: parsed.streakResetDate,
          premiumPassActive: parsed.premiumPassActive,
          comebackBonusUsed: parsed.comebackBonusUsed
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
      milestonesUnlocked: [],
      lastMilestoneCheck: 0,
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
