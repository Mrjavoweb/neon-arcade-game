import {
  Achievement,
  AchievementProgress,
  STORAGE_KEYS
} from './ProgressionTypes';
import { CurrencyManager } from './CurrencyManager';

/**
 * AchievementManager - Manages all 30 achievements
 *
 * Features:
 * - 30 achievements across 5 categories
 * - Progress tracking
 * - Auto-unlock detection
 * - Reward distribution
 * - Hidden achievements
 */
export class AchievementManager {
  private achievements: Achievement[] = [];
  private progress: AchievementProgress;
  private currencyManager: CurrencyManager;

  constructor(currencyManager: CurrencyManager) {
    this.currencyManager = currencyManager;
    this.progress = this.loadProgress();
    this.initializeAchievements();
    this.loadAchievementUnlocks();
  }

  // ============================================================================
  // ACHIEVEMENT DEFINITIONS (30 Total)
  // ============================================================================

  private initializeAchievements(): void {
    this.achievements = [
      // ========================================================================
      // COMBAT ACHIEVEMENTS (8 total)
      // ========================================================================
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Kill 100 enemies',
        icon: '⚔️',
        requirement: { type: 'kills', target: 100 },
        rewards: { stardust: 100 },
        category: 'combat',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'centurion',
        name: 'Centurion',
        description: 'Kill 1,000 enemies',
        icon: '🗡️',
        requirement: { type: 'kills', target: 1000 },
        rewards: { stardust: 200 },
        category: 'combat',
        difficulty: 'medium',
        unlocked: false
      },
      {
        id: 'war_machine',
        name: 'War Machine',
        description: 'Kill 5,000 enemies',
        icon: '⚔️',
        requirement: { type: 'kills', target: 5000 },
        rewards: { stardust: 500, maxHealth: 1 },
        category: 'combat',
        difficulty: 'hard',
        unlocked: false
      },
      {
        id: 'annihilator',
        name: 'Annihilator',
        description: 'Kill 10,000 enemies',
        icon: '💀',
        requirement: { type: 'kills', target: 10000 },
        rewards: { stardust: 1000 },
        category: 'combat',
        difficulty: 'extreme',
        unlocked: false,
        hidden: true
      },
      {
        id: 'combo_novice',
        name: 'Combo Novice',
        description: 'Achieve a 10x combo',
        icon: '🔥',
        requirement: { type: 'combo', target: 10 },
        rewards: { stardust: 50 },
        category: 'combat',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Achieve a 30x combo',
        icon: '🔥',
        requirement: { type: 'combo', target: 30 },
        rewards: { stardust: 250 },
        category: 'combat',
        difficulty: 'medium',
        unlocked: false
      },
      {
        id: 'combo_legend',
        name: 'Combo Legend',
        description: 'Achieve a 50x combo',
        icon: '🔥',
        requirement: { type: 'combo', target: 50 },
        rewards: { stardust: 500 },
        category: 'combat',
        difficulty: 'hard',
        unlocked: false
      },
      {
        id: 'combo_god',
        name: 'Combo God',
        description: 'Achieve a 100x combo',
        icon: '💥',
        requirement: { type: 'combo', target: 100 },
        rewards: { stardust: 1000 },
        category: 'combat',
        difficulty: 'extreme',
        unlocked: false,
        hidden: true
      },

      // ========================================================================
      // SURVIVAL ACHIEVEMENTS (8 total)
      // ========================================================================
      {
        id: 'wave_warrior',
        name: 'Wave Warrior',
        description: 'Reach Wave 10',
        icon: '🌊',
        requirement: { type: 'waves', target: 10 },
        rewards: { stardust: 100 },
        category: 'survival',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'survivor',
        name: 'Survivor',
        description: 'Reach Wave 20',
        icon: '🌊',
        requirement: { type: 'waves', target: 20 },
        rewards: { stardust: 200 },
        category: 'survival',
        difficulty: 'medium',
        unlocked: false
      },
      {
        id: 'immortal',
        name: 'Immortal',
        description: 'Reach Wave 50',
        icon: '👑',
        requirement: { type: 'waves', target: 50 },
        rewards: { stardust: 600 },
        category: 'survival',
        difficulty: 'hard',
        unlocked: false
      },
      {
        id: 'secret_wave_66',
        name: 'Hell Survivor',
        description: 'Reach Wave 66',
        icon: '😈',
        requirement: { type: 'waves', target: 66 },
        rewards: { stardust: 666 },
        category: 'survival',
        difficulty: 'extreme',
        unlocked: false,
        hidden: true
      },
      {
        id: 'untouchable',
        name: 'Untouchable',
        description: 'Complete a wave without taking damage',
        icon: '🛡️',
        requirement: { type: 'perfect_waves', target: 1 },
        rewards: { stardust: 150 },
        category: 'survival',
        difficulty: 'medium',
        unlocked: false
      },
      {
        id: 'iron_will',
        name: 'Iron Will',
        description: 'Complete 10 waves without taking damage',
        icon: '🛡️',
        requirement: { type: 'perfect_waves', target: 10 },
        rewards: { stardust: 300, maxHealth: 1 },
        category: 'survival',
        difficulty: 'hard',
        unlocked: false
      },
      {
        id: 'clutch_master',
        name: 'Clutch Master',
        description: 'Win 5 waves with only 1 life remaining',
        icon: '💪',
        requirement: { type: 'custom', target: 5 },
        rewards: { stardust: 250 },
        category: 'survival',
        difficulty: 'medium',
        unlocked: false
      },
      {
        id: 'high_roller',
        name: 'High Roller',
        description: 'Score 100,000 points in one game',
        icon: '💯',
        requirement: { type: 'score', target: 100000 },
        rewards: { stardust: 350 },
        category: 'survival',
        difficulty: 'hard',
        unlocked: false
      },

      // ========================================================================
      // BOSS ACHIEVEMENTS (4 total)
      // ========================================================================
      {
        id: 'boss_hunter',
        name: 'Boss Hunter',
        description: 'Defeat 5 bosses',
        icon: '👾',
        requirement: { type: 'bosses', target: 5 },
        rewards: { stardust: 150 },
        category: 'mastery',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'boss_slayer',
        name: 'Boss Slayer',
        description: 'Defeat 20 bosses',
        icon: '👾',
        requirement: { type: 'bosses', target: 20 },
        rewards: { stardust: 400 },
        category: 'mastery',
        difficulty: 'hard',
        unlocked: false
      },
      {
        id: 'perfect_boss',
        name: 'Perfect Boss',
        description: 'Defeat a boss without taking damage',
        icon: '👑',
        requirement: { type: 'custom', target: 1 },
        rewards: { stardust: 300 },
        category: 'mastery',
        difficulty: 'hard',
        unlocked: false
      },
      {
        id: 'speed_killer',
        name: 'Speed Killer',
        description: 'Defeat a boss in under 60 seconds',
        icon: '⚡',
        requirement: { type: 'custom', target: 1 },
        rewards: { stardust: 250 },
        category: 'mastery',
        difficulty: 'medium',
        unlocked: false
      },

      // ========================================================================
      // COLLECTION ACHIEVEMENTS (6 total)
      // ========================================================================
      {
        id: 'power_collector',
        name: 'Power Collector',
        description: 'Collect 20 power-ups',
        icon: '⚡',
        requirement: { type: 'powerups', target: 20 },
        rewards: { stardust: 100 },
        category: 'collection',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'shield_master',
        name: 'Shield Master',
        description: 'Use Shield power-up 25 times',
        icon: '🛡️',
        requirement: { type: 'custom', target: 25 },
        rewards: { stardust: 100 },
        category: 'collection',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'plasma_expert',
        name: 'Plasma Expert',
        description: 'Use Plasma power-up 25 times',
        icon: '⚡',
        requirement: { type: 'custom', target: 25 },
        rewards: { stardust: 100 },
        category: 'collection',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'rapid_master',
        name: 'Rapid Fire Master',
        description: 'Use Rapid Fire power-up 25 times',
        icon: '🔫',
        requirement: { type: 'custom', target: 25 },
        rewards: { stardust: 100 },
        category: 'collection',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'slowmo_expert',
        name: 'Slow-Mo Expert',
        description: 'Use Slow-Mo power-up 25 times',
        icon: '🕐',
        requirement: { type: 'custom', target: 25 },
        rewards: { stardust: 100 },
        category: 'collection',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'power_addict',
        name: 'Power Addict',
        description: 'Collect 100 power-ups',
        icon: '💊',
        requirement: { type: 'powerups', target: 100 },
        rewards: { stardust: 300 },
        category: 'collection',
        difficulty: 'medium',
        unlocked: false
      },

      // ========================================================================
      // MASTERY ACHIEVEMENTS (4 total)
      // ========================================================================
      {
        id: 'rising_star',
        name: 'Rising Star',
        description: 'Reach Level 10',
        icon: '⭐',
        requirement: { type: 'level', target: 10 },
        rewards: { stardust: 200 },
        category: 'mastery',
        difficulty: 'easy',
        unlocked: false
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'Reach Level 25',
        icon: '⭐',
        requirement: { type: 'level', target: 25 },
        rewards: { stardust: 500, maxHealth: 1 },
        category: 'mastery',
        difficulty: 'hard',
        unlocked: false
      },
      {
        id: 'grinder',
        name: 'Grinder',
        description: 'Play 50 games',
        icon: '🎮',
        requirement: { type: 'games', target: 50 },
        rewards: { stardust: 500 },
        category: 'mastery',
        difficulty: 'medium',
        unlocked: false
      },
      {
        id: 'marathon',
        name: 'Marathon',
        description: 'Play 100 games',
        icon: '🏃',
        requirement: { type: 'games', target: 100 },
        rewards: { stardust: 750 },
        category: 'mastery',
        difficulty: 'hard',
        unlocked: false
      }
    ];
  }

  // ============================================================================
  // PUBLIC API - PROGRESS TRACKING
  // ============================================================================

  trackKill(enemyType?: string): void {
    this.progress.totalKills++;
    if (this.progress.totalKills % 10 === 0) {
      console.log(`🎯 Total kills: ${this.progress.totalKills}`);
    }
    this.checkAchievements();
    this.saveProgress();
  }

  trackBossDefeat(): void {
    this.progress.bossesDefeated++;
    this.checkAchievements();
    this.saveProgress();
  }

  trackWave(wave: number): void {
    this.progress.maxWaveReached = Math.max(this.progress.maxWaveReached, wave);
    this.checkAchievements();
    this.saveProgress();
  }

  trackCombo(combo: number): void {
    this.progress.maxComboReached = Math.max(this.progress.maxComboReached, combo);
    this.checkAchievements();
    this.saveProgress();
  }

  trackScore(score: number): void {
    this.progress.totalScore += score;
    this.progress.highestScore = Math.max(this.progress.highestScore, score);
    this.checkAchievements();
    this.saveProgress();
  }

  trackPerfectWave(): void {
    this.progress.perfectWaves++;
    this.checkAchievements();
    this.saveProgress();
  }

  trackPowerUpCollected(type?: string): void {
    this.progress.powerUpsCollected++;
    if (type === 'shield') this.progress.shieldsUsed++;
    if (type === 'plasma') this.progress.plasmaUsed++;
    if (type === 'rapid') this.progress.rapidUsed++;
    if (type === 'slowmo') this.progress.slowmoUsed++;
    this.checkAchievements();
    this.saveProgress();
  }

  trackGamePlayed(): void {
    this.progress.gamesPlayed++;
    this.checkAchievements();
    this.saveProgress();
  }

  trackLevel(level: number): void {
    this.progress.maxLevel = Math.max(this.progress.maxLevel, level);
    this.checkAchievements();
    this.saveProgress();
  }

  trackClutchWin(): void {
    this.progress.clutchWins++;
    this.checkCustomAchievements();
    this.saveProgress();
  }

  trackPerfectBoss(): void {
    this.progress.perfectBosses++;
    this.checkCustomAchievements();
    this.saveProgress();
  }

  // ============================================================================
  // PUBLIC API - QUERIES
  // ============================================================================

  getAllAchievements(): any[] {
    return this.achievements.map(a => {
      // Hide hidden achievements that aren't unlocked
      if (a.hidden && !a.unlocked) {
        return {
          id: a.id,
          name: '???',
          description: 'Hidden achievement',
          icon: '🔒',
          rewards: a.rewards,
          isUnlocked: a.unlocked,
          unlockedAt: a.unlockedDate,
          difficulty: a.difficulty,
          category: a.category,
          progress: {
            current: a.requirement.current || 0,
            target: a.requirement.target
          }
        };
      }
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        rewards: a.rewards,
        isUnlocked: a.unlocked,
        unlockedAt: a.unlockedDate,
        difficulty: a.difficulty,
        category: a.category,
        progress: {
          current: a.requirement.current || 0,
          target: a.requirement.target
        }
      };
    });
  }

  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  getAchievementById(id: string): Achievement | undefined {
    return this.achievements.find(a => a.id === id);
  }

  getProgress(): any {
    const unlocked = this.achievements.filter(a => a.unlocked).length;
    const total = this.achievements.length;
    const totalStardust = this.getTotalStardustFromAchievements();

    // Calculate category breakdown
    const categories: Record<string, { total: number; unlocked: number }> = {};
    this.achievements.forEach(a => {
      if (!categories[a.category]) {
        categories[a.category] = { total: 0, unlocked: 0 };
      }
      categories[a.category].total++;
      if (a.unlocked) {
        categories[a.category].unlocked++;
      }
    });

    return {
      ...this.progress,
      totalAchievements: total,
      unlockedAchievements: unlocked,
      totalStardust: totalStardust,
      categories: categories
    };
  }

  getCompletionPercentage(): number {
    const unlocked = this.achievements.filter(a => a.unlocked).length;
    return Math.round((unlocked / this.achievements.length) * 100);
  }

  getTotalStardustFromAchievements(): number {
    return this.achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + (a.rewards.stardust || 0), 0);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private checkAchievements(): void {
    this.achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      const req = achievement.requirement;
      let current = 0;

      switch (req.type) {
        case 'kills':
          current = this.progress.totalKills;
          break;
        case 'bosses':
          current = this.progress.bossesDefeated;
          break;
        case 'waves':
          current = this.progress.maxWaveReached;
          break;
        case 'combo':
          current = this.progress.maxComboReached;
          break;
        case 'score':
          current = this.progress.highestScore;
          break;
        case 'powerups':
          current = this.progress.powerUpsCollected;
          break;
        case 'level':
          current = this.progress.maxLevel;
          break;
        case 'games':
          current = this.progress.gamesPlayed;
          break;
        case 'perfect_waves':
          current = this.progress.perfectWaves;
          break;
      }

      achievement.requirement.current = current;

      if (current >= req.target) {
        this.unlockAchievement(achievement);
      }
    });
  }

  private checkCustomAchievements(): void {
    // Clutch Master
    const clutchMaster = this.getAchievementById('clutch_master');
    if (clutchMaster && !clutchMaster.unlocked && this.progress.clutchWins >= 5) {
      clutchMaster.requirement.current = this.progress.clutchWins;
      this.unlockAchievement(clutchMaster);
    }

    // Perfect Boss
    const perfectBoss = this.getAchievementById('perfect_boss');
    if (perfectBoss && !perfectBoss.unlocked && this.progress.perfectBosses >= 1) {
      perfectBoss.requirement.current = this.progress.perfectBosses;
      this.unlockAchievement(perfectBoss);
    }

    // Shield Master
    const shieldMaster = this.getAchievementById('shield_master');
    if (shieldMaster && !shieldMaster.unlocked && this.progress.shieldsUsed >= 25) {
      shieldMaster.requirement.current = this.progress.shieldsUsed;
      this.unlockAchievement(shieldMaster);
    }

    // Plasma Expert
    const plasmaExpert = this.getAchievementById('plasma_expert');
    if (plasmaExpert && !plasmaExpert.unlocked && this.progress.plasmaUsed >= 25) {
      plasmaExpert.requirement.current = this.progress.plasmaUsed;
      this.unlockAchievement(plasmaExpert);
    }

    // Rapid Master
    const rapidMaster = this.getAchievementById('rapid_master');
    if (rapidMaster && !rapidMaster.unlocked && this.progress.rapidUsed >= 25) {
      rapidMaster.requirement.current = this.progress.rapidUsed;
      this.unlockAchievement(rapidMaster);
    }

    // Slow-Mo Expert
    const slowmoExpert = this.getAchievementById('slowmo_expert');
    if (slowmoExpert && !slowmoExpert.unlocked && this.progress.slowmoUsed >= 25) {
      slowmoExpert.requirement.current = this.progress.slowmoUsed;
      this.unlockAchievement(slowmoExpert);
    }
  }

  private unlockAchievement(achievement: Achievement): void {
    console.log(`🏆 UNLOCKING ACHIEVEMENT: ${achievement.name}`, {
      id: achievement.id,
      rewards: achievement.rewards,
      requirement: achievement.requirement
    });

    achievement.unlocked = true;
    achievement.unlockedDate = new Date().toISOString();

    // Grant rewards
    if (achievement.rewards.stardust) {
      this.currencyManager.earnStardust(
        achievement.rewards.stardust,
        `achievement_${achievement.id}`
      );
    }

    // Lives and maxHealth granted by GameEngine when it receives event

    this.saveAchievements();

    // Dispatch event for UI notification
    const eventDetail = { achievement: { ...achievement } };
    console.log(`📢 Dispatching achievement-unlocked event:`, eventDetail);
    window.dispatchEvent(new CustomEvent('achievement-unlocked', {
      detail: eventDetail
    }));

    console.log(`✅ Achievement Unlocked: ${achievement.name}`);
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENT_PROGRESS, JSON.stringify(this.progress));
    } catch (error) {
      console.error('Failed to save achievement progress:', error);
    }
  }

  private loadProgress(): AchievementProgress {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENT_PROGRESS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load achievement progress:', error);
    }

    return {
      totalKills: 0,
      bossesDefeated: 0,
      maxWaveReached: 0,
      maxComboReached: 0,
      totalScore: 0,
      highestScore: 0,
      perfectWaves: 0,
      powerUpsCollected: 0,
      gamesPlayed: 0,
      totalPlayTime: 0,
      maxLevel: 0,
      shieldsUsed: 0,
      plasmaUsed: 0,
      rapidUsed: 0,
      slowmoUsed: 0,
      shotsfired: 0,
      shotsHit: 0,
      livesLost: 0,
      clutchWins: 0,
      perfectBosses: 0
    };
  }

  private saveAchievements(): void {
    try {
      const saveData = this.achievements.map(a => ({
        id: a.id,
        unlocked: a.unlocked,
        unlockedDate: a.unlockedDate
      }));
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  }

  private loadAchievementUnlocks(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (saved) {
        const saveData = JSON.parse(saved);
        saveData.forEach((saved: any) => {
          const achievement = this.achievements.find(a => a.id === saved.id);
          if (achievement) {
            achievement.unlocked = saved.unlocked;
            achievement.unlockedDate = saved.unlockedDate;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load achievement unlocks:', error);
    }
  }

  // ============================================================================
  // DEBUG METHODS
  // ============================================================================

  debugUnlockAll(): void {
    if (import.meta.env.DEV) {
      this.achievements.forEach(a => {
        if (!a.unlocked) {
          this.unlockAchievement(a);
        }
      });
      console.log('🎮 DEBUG: Unlocked all achievements');
    }
  }

  debugResetAchievements(): void {
    if (import.meta.env.DEV) {
      this.achievements.forEach(a => {
        a.unlocked = false;
        a.unlockedDate = undefined;
      });
      this.progress = this.loadProgress();
      this.saveAchievements();
      console.log('🎮 DEBUG: Reset all achievements');
    }
  }

  debugPrintStatus(): void {
    const unlocked = this.getUnlockedAchievements().length;
    const total = this.achievements.length;
    const stardust = this.getTotalStardustFromAchievements();
    console.log('🏆 Achievement Status:', {
      unlocked: `${unlocked}/${total} (${this.getCompletionPercentage()}%)`,
      totalStardust: `${stardust} 💎`,
      progress: this.progress,
      closeToUnlocking: this.achievements
        .filter(a => !a.unlocked && a.requirement.current)
        .map(a => ({
          name: a.name,
          progress: `${a.requirement.current}/${a.requirement.target}`,
          percentage: Math.round((a.requirement.current! / a.requirement.target) * 100) + '%'
        }))
        .sort((a, b) => {
          const aPercent = parseInt(a.percentage);
          const bPercent = parseInt(b.percentage);
          return bPercent - aPercent;
        })
        .slice(0, 5)
    });
  }
}
