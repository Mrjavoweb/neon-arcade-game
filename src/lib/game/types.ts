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

export interface GameAssets {
  playerShip: HTMLImageElement;
  alienBasic: HTMLImageElement;
  alienHeavy: HTMLImageElement;
  alienFast: HTMLImageElement;
  bossAlien: HTMLImageElement;
  explosion: HTMLImageElement;
  powerupPlasma: HTMLImageElement;
  powerupRapid: HTMLImageElement;
  powerupShield: HTMLImageElement;
  powerupSlowmo: HTMLImageElement;
  shieldEffect: HTMLImageElement;
}

export const ASSET_PATHS = {
  playerShip: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/f3b62150-4a75-4f79-a287-beb738d7988f.webp',
  alienBasic: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/95d93858-1da2-4410-bc6d-7c97a81a2690.webp',
  alienHeavy: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/b6b8921b-cb05-4c7c-9637-17e8f8199206.webp',
  alienFast: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/0ee5fdad-b7fc-40b7-b71b-5785189cd229.webp',
  bossAlien: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/038a876a-d68c-4444-b8b0-2ae9ab25580c.webp',
  explosion: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/bf008940-7261-4765-8c6d-32086670999c.webp',
  powerupPlasma: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/652b9540-094e-4c3a-b9b9-64f112b28744.webp',
  powerupRapid: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/30aacb08-5108-4c70-8580-1823f93620ed.webp',
  powerupShield: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/c52e69ca-3469-4246-88ce-38a9fde77993.webp',
  powerupSlowmo: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/f825721c-8221-4dff-919b-1365add27ab7.webp',
  shieldEffect: 'https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/969a16ba-05c1-4406-8632-b5809c2e3b85.webp',
};