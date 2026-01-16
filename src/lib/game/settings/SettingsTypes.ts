// Settings system types for game preferences and accessibility options

export type ParticleQuality = 'low' | 'medium' | 'high';
export type ControlSensitivity = 'low' | 'normal' | 'high';

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

  // UI
  showTutorialHints: true
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
    celebrationMultiplier: 0.5 // 50% of normal
  },
  medium: {
    maxParticles: 300,
    maxProjectiles: 150,
    maxExplosions: 20,
    celebrationMultiplier: 1.0 // 100% normal
  },
  high: {
    maxParticles: 600,
    maxProjectiles: 250,
    maxExplosions: 35,
    celebrationMultiplier: 1.5 // 150% more particles
  }
};

export const SENSITIVITY_MULTIPLIERS: Record<ControlSensitivity, number> = {
  low: 0.7,
  normal: 1.0,
  high: 1.3
};