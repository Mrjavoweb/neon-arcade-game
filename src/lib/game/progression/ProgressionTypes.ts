// Shared type definitions for progression system
// Currency, Achievements, Daily Rewards, Cosmetics

// ============================================================================
// CURRENCY TYPES
// ============================================================================

export interface PlayerCurrency {
  stardust: number;
  lifetimeStardustEarned: number;

  // Future expansion (not implemented yet)
  premiumGems?: number;
  sessionCoins?: number;
}

export interface CurrencyTransaction {
  type: 'earn' | 'spend';
  currency: 'stardust' | 'gems' | 'coins';
  amount: number;
  source: string;
  timestamp: number;
}

// ============================================================================
// ACHIEVEMENT TYPES
// ============================================================================

export type AchievementCategory = 'combat' | 'survival' | 'mastery' | 'collection' | 'hidden';
export type AchievementDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type AchievementRequirementType = 'kills' | 'waves' | 'bosses' | 'combo' | 'score' |
  'powerups' | 'lives' | 'level' | 'games' | 'perfect_waves' | 'custom';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji

  requirement: {
    type: AchievementRequirementType;
    target: number;
    current?: number;
  };

  rewards: {
    stardust?: number;
    lives?: number;
    maxHealth?: number;
    cosmetic?: string;
  };

  category: AchievementCategory;
  difficulty: AchievementDifficulty;

  unlocked: boolean;
  unlockedDate?: string;
  hidden?: boolean;

  // Future expansion
  prerequisite?: string;
  series?: string;
  seasonal?: boolean;
}

export interface AchievementProgress {
  totalKills: number;
  bossesDefeated: number;
  maxWaveReached: number;
  maxComboReached: number;
  totalScore: number;
  highestScore: number;
  perfectWaves: number;
  powerUpsCollected: number;
  gamesPlayed: number;
  totalPlayTime: number;
  maxLevel: number;

  // Power-up specific
  shieldsUsed: number;
  plasmaUsed: number;
  rapidUsed: number;
  slowmoUsed: number;

  // Combat stats
  shotsfired: number;
  shotsHit: number;

  // Survival stats
  livesLost: number;
  clutchWins: number; // Won wave with 1 life
  perfectBosses: number; // Boss without damage
}

// ============================================================================
// DAILY REWARD TYPES
// ============================================================================

export interface DailyLoginData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string; // ISO date (YYYY-MM-DD)
  totalLogins: number;
  rewardsCollected: number[];

  // Future expansion
  missedDays?: number;
  streakResetDate?: string;
  premiumPassActive?: boolean;
}

export interface DailyReward {
  day: number;
  stardust?: number;
  lives?: number;
  maxHealth?: number;
  powerUp?: 'plasma' | 'rapid' | 'shield' | 'slowmo';
  special?: string;

  // Premium track (future)
  premiumStardust?: number;
  premiumCosmetic?: string;
}

// ============================================================================
// COSMETIC TYPES
// ============================================================================

export type ShipSkinId =
  | 'default'
  | 'red_phoenix'
  | 'green_viper'
  | 'gold_elite'
  | 'purple_shadow'
  | 'cyan_frost'
  | 'rainbow_streak'
  | 'dark_matter'
  | 'solar_flare'
  | 'cosmic_void'
  | 'diamond_elite';

export type ShipSuperpowerType =
  | 'none'
  | 'fire_rate_boost'
  | 'movement_speed_boost'
  | 'shield_duration_boost'
  | 'dual_guns'
  | 'piercing_shots'
  | 'triple_shot'
  | 'lifesteal'
  | 'explosive_rounds'
  | 'gravity_bullets'
  | 'auto_shield';

export interface ShipSuperpower {
  type: ShipSuperpowerType;
  name: string;
  description: string;
  // Effect values (varies by type)
  value?: number; // e.g., 10 for 10% boost, 2 for dual guns
  duration?: number; // For timed effects
}

export interface ShipSkin {
  id: ShipSkinId;
  name: string;
  description: string;
  tier: 'default' | 'common' | 'rare' | 'epic' | 'legendary';
  price: number; // Stardust cost

  // Visual properties
  filter: string; // CSS filter
  bulletColor?: string; // Custom bullet color
  trailColor?: string; // Custom trail color

  // Superpower system
  superpower?: ShipSuperpower;

  // Unlock conditions
  unlocked: boolean;
  requiresAchievement?: string; // Achievement ID needed to unlock
}

export interface PlayerCosmetics {
  activeSkin: ShipSkinId;
  ownedSkins: ShipSkinId[];

  // Future expansion
  activeBulletTrail?: string;
  activExplosionEffect?: string;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  CURRENCY: 'alienInvasion_currency',
  ACHIEVEMENTS: 'alienInvasion_achievements',
  ACHIEVEMENT_PROGRESS: 'alienInvasion_achievementProgress',
  DAILY_REWARDS: 'alienInvasion_dailyRewards',
  COSMETICS: 'alienInvasion_cosmetics',
  SETTINGS: 'alienInvasion_settings'
} as const;

// ============================================================================
// EVENT TYPES (for notifications)
// ============================================================================

export interface GameEvent {
  type: 'currency_earned' | 'achievement_unlocked' | 'daily_reward_available' |
        'skin_purchased' | 'milestone_reached';
  data: any;
  timestamp: number;
}
