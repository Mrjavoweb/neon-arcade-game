// Settings system types for game preferences and accessibility options

export type ParticleQuality = 'low' | 'medium' | 'high';
export type ControlSensitivity = 'low' | 'normal' | 'high';
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface GameSettings {
  // Visual Settings
  screenShake: boolean;
  particleQuality: ParticleQuality;
  showFPS: boolean;

  // Audio Settings
  soundEffects: boolean;
  music: boolean;

  // Gameplay Settings (Mobile)
  touchSensitivity: ControlSensitivity;
  hapticFeedback: boolean;

  // Difficulty Settings
  difficulty: DifficultyLevel;

  // UI Settings
  showTutorialHints: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  // Visual
  screenShake: true,
  particleQuality: 'medium',
  showFPS: false,

  // Audio
  soundEffects: true,
  music: true,

  // Gameplay
  touchSensitivity: 'normal',
  hapticFeedback: true,

  // Difficulty
  difficulty: 'normal',

  // UI
  showTutorialHints: true,
};

export interface ParticleQualityConfig {
  maxParticles: number;
  maxProjectiles: number;
  maxExplosions: number;
  celebrationMultiplier: number; // Multiplier for celebration effects
}

export const PARTICLE_QUALITY_CONFIGS: Record<ParticleQuality, ParticleQualityConfig> = {
  low: {
    maxParticles: 150,
    maxProjectiles: 100,
    maxExplosions: 15,
    celebrationMultiplier: 0.5, // 50% of normal
  },
  medium: {
    maxParticles: 300,
    maxProjectiles: 150,
    maxExplosions: 20,
    celebrationMultiplier: 1.0, // 100% normal
  },
  high: {
    maxParticles: 600,
    maxProjectiles: 250,
    maxExplosions: 35,
    celebrationMultiplier: 1.5, // 150% more particles
  },
};

export const SENSITIVITY_MULTIPLIERS: Record<ControlSensitivity, number> = {
  low: 0.7,
  normal: 1.0,
  high: 1.3,
};

// Difficulty settings - affects boss damage, projectile speed, and attack delay
export interface DifficultyConfig {
  damageMultiplier: number;    // Damage taken from boss attacks
  speedMultiplier: number;     // Boss projectile speed
  delayMultiplier: number;     // Boss attack delay (higher = easier)
  label: string;               // Display name
  description: string;         // User-facing description
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    damageMultiplier: 0.5,     // 50% damage
    speedMultiplier: 0.75,     // 25% slower projectiles
    delayMultiplier: 1.5,      // 50% longer attack delays
    label: 'Easy',
    description: 'Reduced damage, slower attacks'
  },
  normal: {
    damageMultiplier: 1.0,     // 100% damage
    speedMultiplier: 1.0,      // Normal speed
    delayMultiplier: 1.0,      // Normal delays
    label: 'Normal',
    description: 'Balanced challenge'
  },
  hard: {
    damageMultiplier: 1.5,     // 150% damage
    speedMultiplier: 1.25,     // 25% faster projectiles
    delayMultiplier: 0.75,     // 25% shorter attack delays
    label: 'Hard',
    description: 'More damage, faster attacks'
  }
};
