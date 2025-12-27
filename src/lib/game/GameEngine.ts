import { Player, Enemy, Projectile, Explosion } from './entities';
import { GameState, GameStats, GameConfig, GameAssets, ASSET_PATHS } from './types';

export class AssetManager {
  private assets: Partial<GameAssets> = {};
  private loadedCount = 0;
  private totalCount = 0;

  async loadAllAssets(): Promise<GameAssets> {
    const assetEntries = Object.entries(ASSET_PATHS) as [keyof GameAssets, string][];
    this.totalCount = assetEntries.length;

    const loadPromises = assetEntries.map(([key, path]) =>
    this.loadImage(key, path)
    );

    await Promise.all(loadPromises);
    return this.assets as GameAssets;
  }

  private loadImage(key: keyof GameAssets, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.assets[key] = img;
        this.loadedCount++;
        resolve();
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${path}`);
        // Create a fallback image
        this.assets[key] = img;
        this.loadedCount++;
        resolve(); // Don't reject, allow game to continue with fallback rendering
      };
      img.src = path;
    });
  }

  getAssets(): Partial<GameAssets> {
    return this.assets;
  }

  getLoadProgress(): number {
    return this.totalCount > 0 ? this.loadedCount / this.totalCount : 0;
  }
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  explosions: Explosion[];
  state: GameState;
  stats: GameStats;
  config: GameConfig;
  keys: Set<string>;
  lastFireTime: number;
  fireDelay: number;
  enemyDirection: number;
  enemySpeed: number;
  enemyFireRate: number;
  lastEnemyFireTime: number;
  isMobile: boolean;
  touchX: number | null;
  autoFireInterval: number | null;
  assets: Partial<GameAssets>;

  constructor(canvas: HTMLCanvasElement, isMobile: boolean, assets: Partial<GameAssets> = {}) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    this.isMobile = isMobile;
    this.keys = new Set();
    this.state = 'playing';
    this.lastFireTime = 0;
    this.fireDelay = 300;
    this.enemyDirection = 1;
    this.lastEnemyFireTime = 0;
    this.touchX = null;
    this.autoFireInterval = null;

    this.stats = {
      score: 0,
      lives: 3,
      wave: 1,
      enemiesDestroyed: 0
    };

    this.config = {
      playerSpeed: 6,
      projectileSpeed: 8,
      enemySpeed: 0.5,
      enemyFireRate: 2000,
      enemyDescendAmount: 15,
      initialLives: 3
    };

    this.enemySpeed = this.config.enemySpeed;
    this.enemyFireRate = this.config.enemyFireRate;
    this.assets = assets;

    this.player = new Player(canvas.width, canvas.height, this.config.playerSpeed, assets.playerShip);
    this.enemies = [];
    this.projectiles = [];
    this.explosions = [];

    this.initEnemies();
    this.setupControls();
  }

  initEnemies() {
    this.enemies = [];
    const rows = 5;
    const cols = 8;
    const enemyWidth = 45;
    const enemyHeight = 45;
    const padding = 15;
    const offsetX = (this.canvas.width - cols * (enemyWidth + padding)) / 2;
    const offsetY = 100;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * (enemyWidth + padding);
        const y = offsetY + row * (enemyHeight + padding);

        // Use different alien sprites based on row
        let sprite = this.assets.alienBasic;
        if (row === 0) sprite = this.assets.alienFast;else
        if (row === 1 || row === 2) sprite = this.assets.alienBasic;else
        sprite = this.assets.alienHeavy;

        this.enemies.push(new Enemy(x, y, sprite));
      }
    }
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }
      this.keys.add(e.key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        this.player.stop();
      }
    });

    if (this.isMobile) {
      this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
      this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

      // Auto-fire for mobile
      this.autoFireInterval = window.setInterval(() => {
        if (this.state === 'playing') {
          this.fire();
        }
      }, 400);
    }
  }

  handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    this.touchX = touch.clientX - rect.left;
    this.player.setPosition(this.touchX);
  }

  handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    this.touchX = touch.clientX - rect.left;
    this.player.setPosition(this.touchX);
  }

  handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    this.touchX = null;
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  handleInput() {
    if (this.state !== 'playing') return;

    if (this.keys.has('ArrowLeft')) {
      this.player.moveLeft();
    } else if (this.keys.has('ArrowRight')) {
      this.player.moveRight();
    } else {
      this.player.stop();
    }

    if (this.keys.has(' ') && !this.isMobile) {
      this.fire();
    }
  }

  fire() {
    const now = Date.now();
    if (now - this.lastFireTime < this.fireDelay) return;

    this.lastFireTime = now;
    const projectile = new Projectile(
      this.player.position.x + this.player.size.width / 2 - 2,
      this.player.position.y,
      true,
      this.config.projectileSpeed
    );
    this.projectiles.push(projectile);
  }

  enemyFire() {
    const now = Date.now();
    if (now - this.lastEnemyFireTime < this.enemyFireRate) return;

    this.lastEnemyFireTime = now;

    const aliveEnemies = this.enemies.filter((e) => e.isAlive);
    if (aliveEnemies.length === 0) return;

    const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    const projectile = new Projectile(
      shooter.position.x + shooter.size.width / 2 - 2,
      shooter.position.y + shooter.size.height,
      false,
      this.config.projectileSpeed * 0.7
    );
    this.projectiles.push(projectile);
  }

  updateEnemies() {
    let shouldDescend = false;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      const nextX = enemy.position.x + this.enemySpeed * this.enemyDirection;
      if (nextX <= 0 || nextX + enemy.size.width >= this.canvas.width) {
        shouldDescend = true;
        break;
      }
    }

    if (shouldDescend) {
      this.enemyDirection *= -1;
      for (const enemy of this.enemies) {
        if (enemy.isAlive) {
          enemy.update(0, this.config.enemyDescendAmount);
        }
      }
    } else {
      for (const enemy of this.enemies) {
        if (enemy.isAlive) {
          enemy.update(this.enemySpeed * this.enemyDirection, 0);
        }
      }
    }

    // Check if enemies reached player
    for (const enemy of this.enemies) {
      if (enemy.isAlive && enemy.position.y + enemy.size.height >= this.player.position.y) {
        this.gameOver();
        break;
      }
    }
  }

  checkCollisions() {
    // Player projectiles vs enemies
    for (const projectile of this.projectiles) {
      if (!projectile.isActive || !projectile.isPlayerProjectile) continue;

      for (const enemy of this.enemies) {
        if (!enemy.isAlive) continue;

        if (this.checkCollision(projectile.getBounds(), enemy.getBounds())) {
          projectile.deactivate();
          enemy.hit();
          this.stats.score += enemy.points;
          this.stats.enemiesDestroyed++;

          this.explosions.push(new Explosion(
            enemy.position.x + enemy.size.width / 2,
            enemy.position.y + enemy.size.height / 2,
            '#ec4899',
            this.assets.explosion
          ));
          break;
        }
      }
    }

    // Enemy projectiles vs player
    for (const projectile of this.projectiles) {
      if (!projectile.isActive || projectile.isPlayerProjectile) continue;

      if (this.checkCollision(projectile.getBounds(), this.player.getBounds())) {
        projectile.deactivate();
        this.hitPlayer();
        this.explosions.push(new Explosion(
          this.player.position.x + this.player.size.width / 2,
          this.player.position.y + this.player.size.height / 2,
          '#22d3ee',
          this.assets.explosion
        ));
      }
    }
  }

  checkCollision(bounds1: any, bounds2: any): boolean {
    return !(
    bounds1.right < bounds2.left ||
    bounds1.left > bounds2.right ||
    bounds1.bottom < bounds2.top ||
    bounds1.top > bounds2.bottom);

  }

  hitPlayer() {
    this.stats.lives--;
    if (this.stats.lives <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.state = 'gameOver';
  }

  checkWaveComplete() {
    const aliveEnemies = this.enemies.filter((e) => e.isAlive);
    if (aliveEnemies.length === 0) {
      this.nextWave();
    }
  }

  nextWave() {
    this.stats.wave++;
    this.enemySpeed += 0.2;
    this.enemyFireRate = Math.max(1000, this.enemyFireRate - 200);
    this.initEnemies();
    this.projectiles = [];
  }

  update() {
    if (this.state !== 'playing') return;

    this.handleInput();
    this.player.update();
    this.updateEnemies();
    this.enemyFire();

    // Update projectiles
    this.projectiles = this.projectiles.filter((p) => {
      if (!p.isActive) return false;
      p.update();
      return p.position.y > -20 && p.position.y < this.canvas.height + 20;
    });

    // Update explosions
    this.explosions.forEach((e) => e.update());
    this.explosions = this.explosions.filter((e) => !e.isDone());

    this.checkCollisions();
    this.checkWaveComplete();
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#0a0014';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render entities
    this.player.render(this.ctx);
    this.enemies.forEach((enemy) => enemy.render(this.ctx));
    this.projectiles.forEach((projectile) => projectile.render(this.ctx));
    this.explosions.forEach((explosion) => explosion.render(this.ctx));
  }

  reset() {
    this.stats = {
      score: 0,
      lives: this.config.initialLives,
      wave: 1,
      enemiesDestroyed: 0
    };
    this.enemySpeed = this.config.enemySpeed;
    this.enemyFireRate = this.config.enemyFireRate;
    this.state = 'playing';
    this.projectiles = [];
    this.explosions = [];
    this.enemyDirection = 1;
    this.player = new Player(this.canvas.width, this.canvas.height, this.config.playerSpeed, this.assets.playerShip);
    this.initEnemies();
  }

  cleanup() {
    if (this.autoFireInterval) {
      clearInterval(this.autoFireInterval);
    }
  }
}