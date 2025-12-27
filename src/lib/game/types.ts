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

export type GameState = 'playing' | 'paused' | 'gameOver' | 'victory';

export interface GameStats {
  score: number;
  lives: number;
  wave: number;
  enemiesDestroyed: number;
}

export interface GameConfig {
  playerSpeed: number;
  projectileSpeed: number;
  enemySpeed: number;
  enemyFireRate: number;
  enemyDescendAmount: number;
  initialLives: number;
}
