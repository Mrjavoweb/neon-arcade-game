export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export type GameState = 'playing' | 'paused' | 'gameOver' | 'victory' | 'bossIntro' | 'bossVictory';

export type BossPhase = 'phase1' | 'phase2' | 'phase3' | 'phase4';

export interface BossState {
  isBossWave: boolean;
  bossActive: boolean;
  bossHealth: number;
  bossMaxHealth: number;
  bossPhase: BossPhase;
  bossIntroTimer: number;
  bossVictoryTimer: number;
  lastAttackTime: number;
  attackPattern: 'spread' | 'laser' | 'teleport' | 'summon';
  teleportCooldown: number;
}

export interface GameStats {
  score: number;
  lives: number;
  wave: number;
  enemiesDestroyed: number;
  xp: number;
  level: number;
  maxHealth: number;
  fireRateBonus: number;
  movementSpeedBonus: number;
  combo: number; // Current kill streak
  maxCombo: number; // Highest combo this session
}

export interface GameConfig {
  playerSpeed: number;
  projectileSpeed: number;
  enemySpeed: number;
  enemyFireRate: number;
  enemyDescendAmount: number;
  initialLives: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  lifetime: number;
  maxLifetime: number;
}

export interface ComboNotification {
  message: string;
  color: string;
  scale: number;
  alpha: number;
  lifetime: number;
}

export interface WaveTransition {
  active: boolean;
  progress: number; // 0-1
  waveNumber: number;
  isMilestone: boolean;
}

export interface PowerUp {
  position: Position;
  size: Size;
  velocity: Velocity;
  type: 'plasma' | 'rapid' | 'shield' | 'slowmo';
  isActive: boolean;
  image?: HTMLImageElement;
}

export interface SpriteAssets {
  playerShip: HTMLImageElement;
  alienBasic: HTMLImageElement;
  alienHeavy: HTMLImageElement;
  alienFast: HTMLImageElement;
  bossAlien: HTMLImageElement;
  explosion: HTMLImageElement;
  powerUpPlasma: HTMLImageElement;
  powerUpRapid: HTMLImageElement;
  powerUpShield: HTMLImageElement;
  powerUpSlowmo: HTMLImageElement;
  shieldEffect: HTMLImageElement;
}