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

  // Milestone tracking
  milestonesUnlocked: number[]; // Array of milestone IDs claimed
  lastMilestoneCheck: number; // Last totalLogins count when milestones were checked

  // Future expansion
  missedDays?: number;
  streakResetDate?: string;
  premiumPassActive?: boolean;
  comebackBonusUsed?: string; // ISO date of last comeback bonus
}

export interface DailyReward {
  day: number;
  stardust?: number;
  lives?: number;
  maxHealth?: number;
  powerUp?: 'plasma' | 'rapid' | 'shield' | 'slowmo';
  special?: string;

  // Escalation bonus
  weekMultiplier?: number; // Multiplier based on week number (1.0 - 2.5)

  // Premium track (future)
  premiumStardust?: number;
  premiumCosmetic?: string;
}

export interface MilestoneReward {
  id: number; // Milestone ID (total logins required)
  totalLogins: number; // Number of logins required
  stardust: number;
  lives?: number;
  maxHealth?: number;
  cosmetic?: string; // Ship skin ID
  title?: string; // Player title/badge
  description: string;
}

export interface ComebackBonus {
  available: boolean;
  daysAway: number; // How many days player was away
  streakRecovery: number; // Percentage of streak recovered (0-100)
  bonusStardust: number;
  message: string;
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

export type ShipRole = 'balanced' | 'offensive' | 'mobility' | 'defensive' | 'utility';

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
  role?: ShipRole; // Ship role/category

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
// MODULE TYPES
// ============================================================================

export type ModuleId =
  // Offensive
  | 'quick_trigger_1' | 'quick_trigger_2' | 'quick_trigger_3'
  | 'impact_rounds_1' | 'impact_rounds_2' | 'impact_rounds_3'
  | 'boss_buster' | 'chain_lightning'
  // Defensive
  | 'reinforced_hull_1' | 'reinforced_hull_2' | 'reinforced_hull_3'
  | 'shield_boost_1' | 'shield_boost_2'
  | 'emergency_shield' | 'phase_shift'
  // Utility
  | 'magnet_1' | 'magnet_2'
  | 'lucky_star_1' | 'lucky_star_2'
  | 'stardust_hunter_1' | 'stardust_hunter_2'
  | 'combo_keeper';

export type ModuleTier = 'basic' | 'advanced' | 'elite' | 'legendary';
export type ModuleCategory = 'offensive' | 'defensive' | 'utility';

export type ModuleEffectType =
  | 'fire_rate_boost'
  | 'damage_boost'
  | 'boss_damage_boost'
  | 'chain_lightning'
  | 'max_hp_boost'
  | 'shield_duration_boost'
  | 'emergency_shield'
  | 'phase_shift'
  | 'powerup_attract_boost'
  | 'powerup_drop_boost'
  | 'stardust_boost'
  | 'combo_keeper';

export interface ModuleEffect {
  type: ModuleEffectType;
  value: number; // Percentage or flat value depending on type
  description: string;
}

export interface Module {
  id: ModuleId;
  name: string;
  description: string;
  icon: string; // Emoji
  tier: ModuleTier;
  category: ModuleCategory;
  price: number; // Stardust cost

  effect: ModuleEffect;

  // Unlock requirements
  achievementCountRequired: number; // Number of achievements needed
  specificAchievement?: string; // Specific achievement ID required (for legendary)

  // State
  owned: boolean;
}

export interface PlayerModules {
  ownedModules: ModuleId[];
  equippedModules: ModuleId[]; // Max 3 slots
  slotsUnlocked: number; // 1-3, based on player level or boss kills
}

// Module balance caps
export const MODULE_CAPS = {
  MAX_DAMAGE_BONUS: 50, // +50% max
  MAX_HP_BONUS: 3, // +3 HP max (7 total)
  MAX_FIRE_RATE_BONUS: 40, // +40% max
  MAX_SHIELD_DURATION_BONUS: 45, // +45% max
  MAX_STARDUST_BONUS: 30, // +30% max
  MAX_POWERUP_DROP_BONUS: 25, // +25% max
  MAX_POWERUP_ATTRACT_BONUS: 40, // +40% max
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  CURRENCY: 'alienInvasion_currency',
  ACHIEVEMENTS: 'alienInvasion_achievements',
  ACHIEVEMENT_PROGRESS: 'alienInvasion_achievementProgress',
  DAILY_REWARDS: 'alienInvasion_dailyRewards',
  COSMETICS: 'alienInvasion_cosmetics',
  MODULES: 'alienInvasion_modules',
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
