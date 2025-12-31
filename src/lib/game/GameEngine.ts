import { Player, Enemy, Boss, Projectile, ExplosionAnimation, PowerUpEntity } from './entities';
import { GameState, GameStats, GameConfig, Particle, SpriteAssets, BossState, ComboNotification, WaveTransition } from './types';
import { CurrencyManager } from './progression/CurrencyManager';
import { DailyRewardManager } from './progression/DailyRewardManager';
import { AchievementManager } from './progression/AchievementManager';
import { CosmeticManager } from './progression/CosmeticManager';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  enemies: Enemy[];
  boss: Boss | null;
  bossMinions: Enemy[];
  projectiles: Projectile[];
  explosions: ExplosionAnimation[];
  powerUps: PowerUpEntity[];
  particles: Particle[];
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
  assets?: SpriteAssets;
  screenShake: {x: number;y: number;intensity: number;};
  hitFlashAlpha: number; // Red flash when player is hit
  slowMotionActive: boolean;
  slowMotionDuration: number;
  lastPowerUpSpawn: number;
  powerUpSpawnRate: number;
  bossState: BossState;
  levelUpCallback?: (level: number, upgrade: string) => void;
  pendingLevelUp: boolean;
  lastCheckpoint: number; // Save last boss wave completed
  lastFrameTime: number;
  targetFPS: number;
  lastDescentTime: number;
  tapCount: number;
  lastTapTime: number;
  tapTimer: number | null;
  comboNotifications: ComboNotification[];
  lastKillTime: number;
  comboTimeout: number;
  waveTransition: WaveTransition | null;
  has15ComboReward: boolean;
  has30ComboReward: boolean;
  has50ComboReward: boolean;
  tookDamageThisWave: boolean; // Track if player took damage this wave (for perfect wave achievement)

  // Progression systems
  currencyManager: CurrencyManager;
  dailyRewardManager: DailyRewardManager;
  achievementManager: AchievementManager;
  cosmeticManager: CosmeticManager;

  constructor(canvas: HTMLCanvasElement, isMobile: boolean) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    this.isMobile = isMobile;
    this.keys = new Set();
    this.state = 'playing';
    this.lastFireTime = 0;
    this.fireDelay = 250;
    this.enemyDirection = 1;
    this.lastEnemyFireTime = 0;
    this.touchX = null;
    this.autoFireInterval = null;
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.hitFlashAlpha = 0;
    this.slowMotionActive = false;
    this.slowMotionDuration = 0;
    this.lastPowerUpSpawn = 0;
    this.powerUpSpawnRate = 12000; // 12 seconds between spawn attempts
    this.pendingLevelUp = false;
    this.lastCheckpoint = 0; // No checkpoint initially
    this.lastFrameTime = performance.now();
    this.targetFPS = 60;
    this.lastDescentTime = 0;
    this.tapCount = 0;
    this.lastTapTime = 0;
    this.tapTimer = null;
    this.comboNotifications = [];
    this.lastKillTime = 0;
    this.comboTimeout = 2000; // 2 seconds to maintain combo
    this.waveTransition = null;
    this.has15ComboReward = false;
    this.has30ComboReward = false;
    this.has50ComboReward = false;
    this.tookDamageThisWave = false;

    this.stats = {
      score: 0,
      lives: 4,
      wave: 1,
      enemiesDestroyed: 0,
      xp: 0,
      level: 1,
      maxHealth: 4,
      fireRateBonus: 0,
      movementSpeedBonus: 0,
      combo: 0,
      maxCombo: 0
    };

    this.config = {
      playerSpeed: 7,
      projectileSpeed: 10,
      enemySpeed: isMobile ? 0.8 : 0.8,
      enemyFireRate: isMobile ? 5000 : 3500, // Changed from 2000 to 3500 for gentler difficulty
      enemyDescendAmount: 15, // Base descent amount (overridden per-device in movement logic)
      initialLives: 4 // Changed from 3 to 4 for beginner-friendly difficulty
    };

    this.enemySpeed = this.config.enemySpeed;
    this.enemyFireRate = this.config.enemyFireRate;

    this.player = new Player(canvas.width, canvas.height, this.config.playerSpeed);

    // Move spaceship up in portrait mode for better visibility
    if (this.isMobile && canvas.height > canvas.width) {
      this.player.position.y = canvas.height - this.player.size.height - 50; // 50px from bottom instead of 30px
    }

    this.enemies = [];
    this.boss = null;
    this.bossMinions = [];
    this.projectiles = [];
    this.explosions = [];
    this.powerUps = [];
    this.particles = [];

    this.bossState = {
      isBossWave: false,
      bossActive: false,
      bossHealth: 0,
      bossMaxHealth: 0,
      bossPhase: 'phase1',
      bossIntroTimer: 0,
      bossVictoryTimer: 0,
      lastAttackTime: 0,
      attackPattern: 'spread',
      teleportCooldown: 0
    };

    // Initialize progression systems
    this.currencyManager = new CurrencyManager();
    this.achievementManager = new AchievementManager(this.currencyManager);
    this.dailyRewardManager = new DailyRewardManager(this.currencyManager);
    this.cosmeticManager = new CosmeticManager(this.currencyManager);

    // Check for daily reward on game start
    this.checkDailyReward();

    this.initEnemies();
    this.setupControls();

    // Expose cheat functions globally for testing (only in dev)
    if (typeof window !== 'undefined') {
      (window as any).gameCheat = {
        addCurrency: (amount: number) => {
          this.currencyManager.earnStardust(amount, 'cheat');
          console.log(`💎 Cheat: Added ${amount} Stardust. New balance: ${this.currencyManager.getStardust()}`);
        },
        getCurrency: () => {
          const balance = this.currencyManager.getStardust();
          console.log(`💎 Current balance: ${balance} Stardust`);
          return balance;
        }
      };
      console.log('🎮 Dev cheats enabled! Use window.gameCheat.addCurrency(100000) to add currency');
    }
  }

  async loadAssets(): Promise<void> {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        // CRITICAL FIX: Enable CORS for external images to allow CSS filters
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      const [
      playerShip,
      alienBasic,
      alienHeavy,
      alienFast,
      bossAlien,
      bossPhase1,
      bossPhase2,
      bossPhase3,
      bossPhase4,
      explosion,
      powerUpPlasma,
      powerUpRapid,
      powerUpShield,
      powerUpSlowmo,
      shieldEffect] =
      await Promise.all([
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/f3b62150-4a75-4f79-a287-beb738d7988f.webp'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/95d93858-1da2-4410-bc6d-7c97a81a2690.webp'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/b6b8921b-cb05-4c7c-9637-17e8f8199206.webp'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/0ee5fdad-b7fc-40b7-b71b-5785189cd229.webp'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/038a876a-d68c-4444-b8b0-2ae9ab25580c.webp'), // Legacy boss
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/63f19d5b-0342-487b-8747-2fc17cb64440.webp'), // Boss Phase 1 - Red
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/a9af17d6-1d6a-46e4-916b-90492bd7b4d2.webp'), // Boss Phase 2 - Turquoise
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/d0c7b32c-6d54-4092-8588-a5d09cbe60d3.webp'), // Boss Phase 3 - Yellow
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/3595b35a-b995-4194-9445-3963d9199a8d.webp'), // Boss Phase 4 - Purple
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/bf008940-7261-4765-8c6d-32086670999c.webp'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/652b9540-094e-4c3a-b9b9-64f112b28744.webp'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/30aacb08-5108-4c70-8580-1823f93620ed.webp'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/c52e69ca-3469-4246-88ce-38a9fde77993.webp'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/f825721c-8221-4dff-919b-1365add27ab7.webp'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/969a16ba-05c1-4406-8632-b5809c2e3b85.webp')]
      );

      this.assets = {
        playerShip,
        alienBasic,
        alienHeavy,
        alienFast,
        bossAlien,
        bossPhase1,
        bossPhase2,
        bossPhase3,
        bossPhase4,
        explosion,
        powerUpPlasma,
        powerUpRapid,
        powerUpShield,
        powerUpSlowmo,
        shieldEffect
      };

      // Assign sprites to entities
      this.player.setImage(playerShip);
      this.enemies.forEach((enemy) => {
        if (enemy.type === 'boss') enemy.setImage(bossAlien);else
        if (enemy.type === 'heavy') enemy.setImage(alienHeavy);else
        if (enemy.type === 'fast') enemy.setImage(alienFast);else
        enemy.setImage(alienBasic);
      });
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  }

  initEnemies() {
    this.enemies = [];
    this.bossMinions = [];
    const wave = this.stats.wave;

    // Boss wave every 5 waves
    if (wave % 5 === 0) {
      this.bossState.isBossWave = true;
      // Shorter intro on mobile for immediate engagement, disable on desktop
      this.bossState.bossIntroTimer = this.isMobile ? 0 : 60; // Instant on mobile, 1 sec on desktop
      // Keep game state as 'playing' - don't block gameplay
      this.slowMotionActive = false; // Don't slow down during intro
      this.slowMotionDuration = 0;

      // Boss position: adjusted for better visibility
      const isLandscape = this.canvas.width > this.canvas.height;
      const bossY = this.isMobile ? isLandscape ? 20 : 180 : 80; // Lowered from 130 to 180 in portrait
      this.boss = new Boss(this.canvas.width / 2 - 60, bossY, wave);
      if (this.assets) this.boss.setImage(this.assets.bossPhase1); // Start with Phase 1 (Red) boss

      this.bossState.bossActive = true;
      this.bossState.bossHealth = this.boss.health;
      this.bossState.bossMaxHealth = this.boss.maxHealth;
      this.bossState.bossPhase = 'phase1';
      this.bossState.lastAttackTime = 0;
      this.bossState.attackPattern = 'spread';
      return;
    }

    this.bossState.isBossWave = false;
    this.bossState.bossActive = false;
    this.boss = null;

    // Adjust grid based on orientation for mobile
    const isLandscape = this.canvas.width > this.canvas.height;
    const rows = this.isMobile && isLandscape ?
    Math.min(4 + Math.floor(wave / 3), 4) // 4 rows max in landscape
    : Math.min(5 + Math.floor(wave / 3), 7); // Normal rows in portrait
    const cols = this.isMobile && isLandscape ? 10 : 8; // 10 cols in landscape, 8 in portrait

    // Optimized sizing and spacing for mobile
    const enemyWidth = this.isMobile ? isLandscape ? 16 : 20 : 40;
    const enemyHeight = this.isMobile ? isLandscape ? 16 : 20 : 40;
    const padding = this.isMobile ? isLandscape ? 28 : 29 : 15;

    const offsetX = (this.canvas.width - cols * (enemyWidth + padding)) / 2;

    // Adjusted positioning - ensure spaceship is visible in landscape
    const offsetY = this.isMobile ?
    isLandscape ? 30 : 65 // Moved down in landscape so HUD and top row are visible
    : Math.max(80, this.canvas.height * 0.1);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * (enemyWidth + padding);
        const y = offsetY + row * (enemyHeight + padding);

        let type: 'basic' | 'heavy' | 'fast' = 'basic';
        const rand = Math.random();
        if (wave > 2 && rand < 0.15) type = 'heavy';else
        if (wave > 1 && rand < 0.3) type = 'fast';

        const enemy = new Enemy(x, y, type, this.getEnemyDifficultyMultiplier());
        if (this.assets) {
          if (type === 'heavy') enemy.setImage(this.assets.alienHeavy);else
          if (type === 'fast') enemy.setImage(this.assets.alienFast);else
          enemy.setImage(this.assets.alienBasic);
        }
        this.enemies.push(enemy);
      }
    }
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }
      // CHEAT: Test Achievement Notification (Press 'A')
      if (e.key === 'a' || e.key === 'A') {
        console.log('🎮 CHEAT: Triggering test achievement!');
        window.dispatchEvent(new CustomEvent('achievement-unlocked', {
          detail: {
            achievement: {
              id: 'test_achievement',
              name: 'Test Achievement',
              description: 'Testing the notification system',
              icon: '⚡',
              rewards: {
                stardust: 100,
                lives: 1
              },
              difficulty: 'medium'
            }
          }
        }));
      }
      // Cheat codes for testing - Boss Level Shortcuts
      if (e.key === 'b' || e.key === 'B') {
        // Jump to Boss 1 (Wave 5)
        if (this.state === 'playing') {
          console.log('🎮 CHEAT: Jumping to Boss 1 (Wave 5)!');
          this.stats.wave = 4; // Will become wave 5 on nextWave()
          this.nextWave();
        }
      }
      if (e.key === 'n' || e.key === 'N') {
        // Jump to Boss 2 (Wave 10)
        if (this.state === 'playing') {
          console.log('🎮 CHEAT: Jumping to Boss 2 (Wave 10)!');
          this.stats.wave = 9; // Will become wave 10 on nextWave()
          this.nextWave();
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        // Jump to Boss 3 (Wave 15)
        if (this.state === 'playing') {
          console.log('🎮 CHEAT: Jumping to Boss 3 (Wave 15)!');
          this.stats.wave = 14; // Will become wave 15 on nextWave()
          this.nextWave();
        }
      }
      if (e.key === ',' || e.key === '<') {
        // Jump to Boss 4 (Wave 20)
        if (this.state === 'playing') {
          console.log('🎮 CHEAT: Jumping to Boss 4 (Wave 20)!');
          this.stats.wave = 19; // Will become wave 20 on nextWave()
          this.nextWave();
        }
      }
      if (e.key === '+' || e.key === '=') {
        // Skip ahead 5 waves
        if (this.state === 'playing') {
          console.log('🎮 CHEAT: Skipping ahead 5 waves!');
          this.stats.wave = Math.min(95, this.stats.wave + 5);
          // Use new beginner-friendly difficulty formula
          const wave = this.stats.wave;
          // Progressive speed scaling: waves 1-10 (+0.03), 11-30 (+0.04), 31+ (+0.02)
          const wave1to10 = Math.min(wave - 1, 10) * 0.03;
          const wave11to30 = Math.max(0, Math.min(wave - 1, 30) - 10) * 0.04;
          const wave31plus = Math.max(0, wave - 31) * 0.02;
          this.enemySpeed = this.config.enemySpeed + wave1to10 + wave11to30 + wave31plus;
          this.enemyFireRate = Math.max(1800, this.config.enemyFireRate - (wave - 1) * 40);
          this.initEnemies();
        }
      }
      if (e.key === '-' || e.key === '_') {
        // Go back 5 waves
        if (this.state === 'playing') {
          console.log('🎮 CHEAT: Going back 5 waves!');
          this.stats.wave = Math.max(1, this.stats.wave - 5);
          // Use new beginner-friendly difficulty formula
          const wave = this.stats.wave;
          // Progressive speed scaling: waves 1-10 (+0.03), 11-30 (+0.04), 31+ (+0.02)
          const wave1to10 = Math.min(wave - 1, 10) * 0.03;
          const wave11to30 = Math.max(0, Math.min(wave - 1, 30) - 10) * 0.04;
          const wave31plus = Math.max(0, wave - 31) * 0.02;
          this.enemySpeed = this.config.enemySpeed + wave1to10 + wave11to30 + wave31plus;
          this.enemyFireRate = Math.max(1800, this.config.enemyFireRate - (wave - 1) * 40);
          this.initEnemies();
        }
      }
      if (e.key === 'h' || e.key === 'H') {
        // Add a life
        console.log('🎮 CHEAT: +1 Life!');
        this.stats.lives = Math.min(this.stats.maxHealth, this.stats.lives + 1);
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
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // Triple-tap cheat codes in corners (for testing)
    const cornerSize = 100; // 100px corner area
    const now = Date.now();

    // Top corners - Wave navigation
    if (touchY < cornerSize) {
      // Top-left corner: Skip ahead 5 waves
      if (touchX < cornerSize) {
        if (now - this.lastTapTime < 500) {
          this.tapCount++;
        } else {
          this.tapCount = 1;
        }
        this.lastTapTime = now;

        if (this.tapCount >= 3 && this.state === 'playing') {
          console.log('🎮 MOBILE CHEAT: Skipping ahead 5 waves!');
          this.stats.wave = Math.min(95, this.stats.wave + 5);
          // Use new beginner-friendly difficulty formula
          const wave = this.stats.wave;
          // Progressive speed scaling: waves 1-10 (+0.03), 11-30 (+0.04), 31+ (+0.02)
          const wave1to10 = Math.min(wave - 1, 10) * 0.03;
          const wave11to30 = Math.max(0, Math.min(wave - 1, 30) - 10) * 0.04;
          const wave31plus = Math.max(0, wave - 31) * 0.02;
          this.enemySpeed = this.config.enemySpeed + wave1to10 + wave11to30 + wave31plus;
          this.enemyFireRate = Math.max(1800, this.config.enemyFireRate - (wave - 1) * 40);
          this.initEnemies();
          this.tapCount = 0;
        }
        return; // Don't move player when activating cheat
      }

      // Top-right corner: Go back 5 waves
      if (touchX > this.canvas.width - cornerSize) {
        if (now - this.lastTapTime < 500) {
          this.tapCount++;
        } else {
          this.tapCount = 1;
        }
        this.lastTapTime = now;

        if (this.tapCount >= 3 && this.state === 'playing') {
          console.log('🎮 MOBILE CHEAT: Going back 5 waves!');
          this.stats.wave = Math.max(1, this.stats.wave - 5);
          // Use new beginner-friendly difficulty formula
          const wave = this.stats.wave;
          // Progressive speed scaling: waves 1-10 (+0.03), 11-30 (+0.04), 31+ (+0.02)
          const wave1to10 = Math.min(wave - 1, 10) * 0.03;
          const wave11to30 = Math.max(0, Math.min(wave - 1, 30) - 10) * 0.04;
          const wave31plus = Math.max(0, wave - 31) * 0.02;
          this.enemySpeed = this.config.enemySpeed + wave1to10 + wave11to30 + wave31plus;
          this.enemyFireRate = Math.max(1800, this.config.enemyFireRate - (wave - 1) * 40);
          this.initEnemies();
          this.tapCount = 0;
        }
        return; // Don't move player when activating cheat
      }
    }

    // Bottom corners - Boss level shortcuts
    if (touchY > this.canvas.height - cornerSize) {
      // Bottom-left corner: Boss 1 (Wave 5) or Boss 3 (Wave 15)
      if (touchX < cornerSize) {
        if (now - this.lastTapTime < 500) {
          this.tapCount++;
        } else {
          this.tapCount = 1;
        }
        this.lastTapTime = now;

        if (this.tapCount >= 3 && this.state === 'playing') {
          console.log('🎮 MOBILE CHEAT: Jumping to Boss 1 (Wave 5)!');
          this.stats.wave = 4; // Will become wave 5 on nextWave()
          this.nextWave();
          this.tapCount = 0;
        } else if (this.tapCount === 5 && this.state === 'playing') {
          console.log('🎮 MOBILE CHEAT: Jumping to Boss 3 (Wave 15)!');
          this.stats.wave = 14; // Will become wave 15 on nextWave()
          this.nextWave();
          this.tapCount = 0;
        }
        return; // Don't move player when activating cheat
      }

      // Bottom-right corner: Boss 2 (Wave 10) or Boss 4 (Wave 20)
      if (touchX > this.canvas.width - cornerSize) {
        if (now - this.lastTapTime < 500) {
          this.tapCount++;
        } else {
          this.tapCount = 1;
        }
        this.lastTapTime = now;

        if (this.tapCount >= 3 && this.state === 'playing') {
          console.log('🎮 MOBILE CHEAT: Jumping to Boss 2 (Wave 10)!');
          this.stats.wave = 9; // Will become wave 10 on nextWave()
          this.nextWave();
          this.tapCount = 0;
        } else if (this.tapCount === 5 && this.state === 'playing') {
          console.log('🎮 MOBILE CHEAT: Jumping to Boss 4 (Wave 20)!');
          this.stats.wave = 19; // Will become wave 20 on nextWave()
          this.nextWave();
          this.tapCount = 0;
        }
        return; // Don't move player when activating cheat
      }
    }

    this.touchX = touchX;
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
    const fireRate = this.player.rapidActive ? this.fireDelay / 2 : this.fireDelay;
    if (now - this.lastFireTime < fireRate) return;

    this.lastFireTime = now;

    if (this.player.plasmaActive) {
      // Spread shot
      [-15, 0, 15].forEach((offset) => {
        const projectile = new Projectile(
          this.player.position.x + this.player.size.width / 2 - 2 + offset,
          this.player.position.y,
          true,
          this.config.projectileSpeed
        );
        projectile.color = this.cosmeticManager.getBulletColor(); // Apply skin bullet color
        this.projectiles.push(projectile);
      });
    } else {
      const projectile = new Projectile(
        this.player.position.x + this.player.size.width / 2 - 2,
        this.player.position.y,
        true,
        this.config.projectileSpeed
      );
      projectile.color = this.cosmeticManager.getBulletColor(); // Apply skin bullet color
      this.projectiles.push(projectile);
    }
  }

  enemyFire() {
    const now = Date.now();
    if (now - this.lastEnemyFireTime < this.enemyFireRate) return;

    this.lastEnemyFireTime = now;

    const aliveEnemies = this.enemies.filter((e) => e.isAlive);
    if (aliveEnemies.length === 0) return;

    // BALANCED Progressive difficulty - Much gentler scaling for all devices
    const wave = this.stats.wave;
    let simultaneousShooters = 1;
    let burstFire = false;
    let columnAttack = false;

    if (this.isMobile) {
      // MOBILE: Very gentle curve - prioritize fun over challenge
      if (wave >= 31) {
        simultaneousShooters = 3; // Max 3 on mobile after wave 31
        burstFire = Math.random() < 0.15; // 15% chance
      } else if (wave >= 21) {
        simultaneousShooters = 2;
        burstFire = Math.random() < 0.10; // 10% chance
      } else if (wave >= 11) {
        simultaneousShooters = 2;
        burstFire = Math.random() < 0.05; // 5% chance - very rare
      }
      // No column attacks on mobile - too overwhelming
    } else {
      // DESKTOP: Balanced difficulty curve
      if (wave >= 31) {
        simultaneousShooters = 3;
        burstFire = Math.random() < 0.25; // 25% chance burst fire
        columnAttack = Math.random() < 0.10; // 10% chance column attack
      } else if (wave >= 21) {
        simultaneousShooters = 2;
        burstFire = Math.random() < 0.20; // 20% chance burst fire
        columnAttack = Math.random() < 0.05; // 5% chance column attack
      } else if (wave >= 11) {
        simultaneousShooters = 2;
        burstFire = Math.random() < 0.10; // 10% chance burst fire
      }
      // Waves 1-10: Always 1 shooter, no burst fire - Learn the game!
    }

    // Column attack: All aliens in a random column fire together (desktop only)
    if (columnAttack) {
      this.enemyColumnAttack(aliveEnemies);
      return;
    }

    // Select random shooters (ensure unique aliens)
    const shooters: typeof aliveEnemies = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < Math.min(simultaneousShooters, aliveEnemies.length); i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * aliveEnemies.length);
      } while (usedIndices.has(randomIndex));

      usedIndices.add(randomIndex);
      shooters.push(aliveEnemies[randomIndex]);
    }

    // Fire projectiles from selected shooters
    shooters.forEach((shooter) => {
      this.createEnemyProjectile(shooter);

      // Burst fire: Fire 2 rapid shots with slight delay (mobile gets only 2, desktop gets 2-3)
      if (burstFire) {
        setTimeout(() => this.createEnemyProjectile(shooter), 150);
        if (!this.isMobile && wave >= 16) {
          setTimeout(() => this.createEnemyProjectile(shooter), 300);
        }
      }
    });
  }

  // Helper method to create enemy projectile
  createEnemyProjectile(shooter: any) {
    if (!shooter.isAlive) return;

    const projectile = new Projectile(
      shooter.position.x + shooter.size.width / 2 - 2,
      shooter.position.y + shooter.size.height,
      false,
      this.config.projectileSpeed * 0.7,
      1 // 1 damage = lose 1 life (not instant kill)
    );
    this.projectiles.push(projectile);
  }

  // Column attack: All aliens in a vertical column fire
  enemyColumnAttack(aliveEnemies: any[]) {
    // Group enemies by column (approximate X position)
    const columns = new Map<number, any[]>();

    aliveEnemies.forEach((enemy) => {
      const columnKey = Math.floor(enemy.position.x / 50); // Group by ~50px columns
      if (!columns.has(columnKey)) {
        columns.set(columnKey, []);
      }
      columns.get(columnKey)!.push(enemy);
    });

    // Pick a random column with at least 2 aliens
    const validColumns = Array.from(columns.entries()).filter(([_, enemies]) => enemies.length >= 2);
    if (validColumns.length === 0) {
      // Fallback to regular attack
      this.createEnemyProjectile(aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]);
      return;
    }

    const [_, columnEnemies] = validColumns[Math.floor(Math.random() * validColumns.length)];

    // All enemies in column fire with slight stagger for visual effect
    columnEnemies.forEach((enemy, index) => {
      setTimeout(() => this.createEnemyProjectile(enemy), index * 50);
    });
  }

  spawnPowerUp() {
    const now = Date.now();
    if (now - this.lastPowerUpSpawn < this.powerUpSpawnRate) return;
    if (Math.random() < 0.45) return; // 55% spawn chance (improved from 30%)

    this.lastPowerUpSpawn = now;

    // Weighted rarity system for power-up types
    // Common: Rapid Fire, Plasma (70% combined)
    // Uncommon: Shield (20%)
    // Rare: Slow Motion (10%)
    const rand = Math.random();
    let type: 'plasma' | 'rapid' | 'shield' | 'slowmo';

    if (rand < 0.35) {
      type = 'rapid'; // 35% - Common offensive boost
    } else if (rand < 0.70) {
      type = 'plasma'; // 35% - Common offensive boost
    } else if (rand < 0.90) {
      type = 'shield'; // 20% - Uncommon defensive boost
    } else {
      type = 'slowmo'; // 10% - Rare tactical advantage
    }

    const x = Math.random() * (this.canvas.width - 40) + 20;

    const powerUp = new PowerUpEntity(x, -40, type);
    if (this.assets) {
      const imageMap = {
        plasma: this.assets.powerUpPlasma,
        rapid: this.assets.powerUpRapid,
        shield: this.assets.powerUpShield,
        slowmo: this.assets.powerUpSlowmo
      };
      powerUp.setImage(imageMap[type]);
    }
    this.powerUps.push(powerUp);
  }

  updateBoss(deltaTime: number = 1) {
    if (!this.boss || !this.boss.isAlive) return;

    // Boss intro - descend slowly (non-blocking)
    if (this.bossState.bossIntroTimer > 0) {
      this.bossState.bossIntroTimer -= deltaTime;
      // if (this.boss.position.y < 80) {
      //   this.boss.position.y += 0.7 * deltaTime;
      // }
      // Don't return - allow boss to start attacking during descent
    }

    this.boss.update(this.canvas.width);
    this.bossState.bossHealth = this.boss.health;

    // Update boss image when phase changes
    const previousPhase = this.bossState.bossPhase;
    this.bossState.bossPhase = this.boss.phase;

    if (previousPhase !== this.boss.phase && this.assets) {
      // Switch boss appearance based on current phase
      const bossImageMap = {
        phase1: this.assets.bossPhase1,
        phase2: this.assets.bossPhase2,
        phase3: this.assets.bossPhase3,
        phase4: this.assets.bossPhase4
      };
      this.boss.setImage(bossImageMap[this.boss.phase]);
    }

    // Boss attacks (scales with both phase AND wave)
    const now = Date.now();

    // Base attack delay by phase
    const baseDelay = this.boss.phase === 'phase4' ? 1200 :
    this.boss.phase === 'phase3' ? 1800 :
    this.boss.phase === 'phase2' ? 2400 : 3000;

    // Wave-based scaling: Each boss wave increases attack speed progressively
    // Boss 1: 100% | Boss 2: 85% | Boss 3: 72% | Boss 4: 61% | Boss 5: 52%
    const bossNumber = this.stats.wave / 5; // 1, 2, 3, 4...
    const waveMultiplier = Math.max(0.5, 1 - (bossNumber - 1) * 0.15); // -15% per boss
    const attackDelay = baseDelay * waveMultiplier;

    if (now - this.bossState.lastAttackTime > attackDelay) {
      this.bossState.lastAttackTime = now;
      this.executeBossAttack();
    }

    // Update minions with delta time
    this.bossMinions = this.bossMinions.filter((m) => m.isAlive);
    this.bossMinions.forEach((minion) => {
      minion.update(this.enemySpeed * this.enemyDirection * 0.5 * deltaTime, 0);
    });

    // Teleport cooldown
    if (this.bossState.teleportCooldown > 0) {
      this.bossState.teleportCooldown -= deltaTime;
    }
  }

  executeBossAttack() {
    if (!this.boss) return;

    // Choose attack pattern based on phase (no minion summoning for beginners)
    const patterns: Array<'spread' | 'laser' | 'teleport'> = ['spread'];

    if (this.boss.phase === 'phase2' || this.boss.phase === 'phase3' || this.boss.phase === 'phase4') {
      patterns.push('laser');
    }
    if (this.boss.phase === 'phase3' || this.boss.phase === 'phase4') {
      if (this.bossState.teleportCooldown === 0) patterns.push('teleport');
    }
    // Removed minion summoning for beginner-friendly gameplay

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    this.bossState.attackPattern = pattern;

    switch (pattern) {
      case 'spread':
        this.bossSpreadShot();
        break;
      case 'laser':
        this.bossLaserBeam();
        break;
      case 'teleport':
        this.bossTeleport();
        break;
    }
  }

  bossSpreadShot() {
    if (!this.boss) return;

    const angles = this.boss.phase === 'phase4' ? 7 :
    this.boss.phase === 'phase3' ? 5 : 3;
    const spread = Math.PI / 3;
    const startAngle = Math.PI / 2 - spread / 2;

    // Wave-based speed scaling: +0.8 speed per boss wave for noticeable progression
    const baseSpeed = 6;
    const bossNumber = this.stats.wave / 5; // 1, 2, 3, 4...
    const waveBonus = (bossNumber - 1) * 0.8; // Boss 1: +0 | Boss 2: +0.8 | Boss 3: +1.6
    const speed = baseSpeed + waveBonus;

    for (let i = 0; i < angles; i++) {
      const angle = startAngle + spread * i / (angles - 1);
      const projectile = new Projectile(
        this.boss.position.x + this.boss.size.width / 2,
        this.boss.position.y + this.boss.size.height,
        false,
        speed,
        2 // 2 damage (heavy hit - costs 2 lives)
      );
      projectile.velocity.x = Math.cos(angle) * speed;
      projectile.velocity.y = Math.sin(angle) * speed;
      projectile.color = '#ff6600'; // Orange color for 2 damage
      this.projectiles.push(projectile);
    }
  }

  bossLaserBeam() {
    if (!this.boss) return;

    // Base laser speed by phase
    const baseSpeed = this.boss.phase === 'phase4' ? 10 :
    this.boss.phase === 'phase3' ? 8 :
    this.boss.phase === 'phase2' ? 7 : 5;

    // Wave-based speed scaling: +0.8 speed per boss wave for consistent progression
    const bossNumber = this.stats.wave / 5; // 1, 2, 3, 4...
    const waveBonus = (bossNumber - 1) * 0.8; // Boss 1: +0 | Boss 2: +0.8 | Boss 3: +1.6
    const laserSpeed = baseSpeed + waveBonus;

    // Create vertical laser beam (3 damage - devastating hit)
    // Fewer, more spaced out projectiles to avoid multi-hits
    for (let i = 0; i < 8; i++) {
      const projectile = new Projectile(
        this.boss.position.x + this.boss.size.width / 2 - 5 + (Math.random() - 0.5) * 10,
        this.boss.position.y + this.boss.size.height + i * 15,
        false,
        laserSpeed,
        3 // 3 damage (devastating hit - costs 3 lives)
      );
      projectile.size.width = 6;
      projectile.size.height = 18;
      projectile.color = '#ff0000'; // Red color for devastating damage
      this.projectiles.push(projectile);
    }

    this.addScreenShake(6);
  }

  bossTeleport() {
    if (!this.boss) return;

    // Create teleport effect particles
    this.spawnDebrisParticles(
      this.boss.position.x + this.boss.size.width / 2,
      this.boss.position.y + this.boss.size.height / 2,
      '#a855f7'
    );

    // Teleport to random position
    this.boss.position.x = Math.random() * (this.canvas.width - this.boss.size.width);
    this.boss.position.y = 50 + Math.random() * 100;

    // Arrival particles
    this.spawnDebrisParticles(
      this.boss.position.x + this.boss.size.width / 2,
      this.boss.position.y + this.boss.size.height / 2,
      '#22d3ee'
    );

    // Wave-based teleport cooldown: -30 frames per boss wave (more frequent teleports)
    const baseCooldown = 300; // 5 seconds at wave 5
    const waveReduction = (this.stats.wave / 5 - 1) * 30;
    this.bossState.teleportCooldown = Math.max(150, baseCooldown - waveReduction); // Minimum 2.5s

    this.addScreenShake(8);
  }

  bossSummonMinions() {
    if (!this.boss) return;
    if (this.bossMinions.length >= 6) return; // Max 6 minions

    const count = this.boss.phase === 'phase4' ? 3 : 2;

    for (let i = 0; i < count; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = this.boss.position.x + side * (this.boss.size.width + 50);
      const y = this.boss.position.y + 40;

      const minion = new Enemy(x, y, 'fast', this.getEnemyDifficultyMultiplier());
      if (this.assets) minion.setImage(this.assets.alienFast);
      this.bossMinions.push(minion);

      // Spawn particles
      this.createCollectParticles(x, y);
    }
  }

  updateEnemies(deltaTime: number = 1) {
    let shouldDescend = false;

    // Reduce speed in landscape mode to prevent rapid wall hits
    const isLandscape = this.canvas.width > this.canvas.height;
    const speedMultiplier = this.isMobile && isLandscape ? 0.25 : 1.0; // Even slower in landscape
    const adjustedSpeed = this.enemySpeed * speedMultiplier;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      const nextX = enemy.position.x + adjustedSpeed * this.enemyDirection * deltaTime;
      if (nextX <= 0 || nextX + enemy.size.width >= this.canvas.width) {
        shouldDescend = true;
        break;
      }
    }

    const now = performance.now();
    // Much longer cooldown in landscape (wider screen = more wall hits)
    const descentCooldown = this.isMobile ? isLandscape ? 1500 : 300 : 0;

    if (shouldDescend && now - this.lastDescentTime > descentCooldown) {
      this.lastDescentTime = now;
      this.enemyDirection *= -1;
      for (const enemy of this.enemies) {
        if (enemy.isAlive) {
          // Improved descent amounts for better pacing
          const descentAmount = this.isMobile && isLandscape ? 2 : this.isMobile ? 8 : 15;
          enemy.update(0, descentAmount);
        }
      }
    } else {
      for (const enemy of this.enemies) {
        if (enemy.isAlive) {
          // Apply individual enemy speed multiplier
          const enemySpeed = adjustedSpeed * enemy.speedMultiplier * this.enemyDirection * deltaTime;
          enemy.update(enemySpeed, 0);
        }
      }
    }

    const safetyMargin = 40;
    for (const enemy of this.enemies) {
      if (enemy.isAlive && enemy.position.y + enemy.size.height >= this.player.position.y + safetyMargin) {
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

          if (!enemy.isAlive) {
            this.stats.score += enemy.points;
            this.stats.enemiesDestroyed++;
            this.registerKill(enemy.points); // Track combo

            // Award XP based on enemy type
            const xpReward = enemy.type === 'heavy' ? 25 : enemy.type === 'fast' ? 15 : 10;
            this.awardXP(xpReward);

            this.createExplosion(
              enemy.position.x + enemy.size.width / 2,
              enemy.position.y + enemy.size.height / 2
            );
            this.addScreenShake(8);
            this.spawnDebrisParticles(enemy.position.x + enemy.size.width / 2, enemy.position.y + enemy.size.height / 2, enemy.color);
          } else {
            this.createImpactParticles(enemy.position.x + enemy.size.width / 2, enemy.position.y + enemy.size.height / 2, '#ffff00');
            this.addScreenShake(3);
          }
          break;
        }
      }

      // Player projectiles vs boss minions
      for (const minion of this.bossMinions) {
        if (!minion.isAlive) continue;

        if (this.checkCollision(projectile.getBounds(), minion.getBounds())) {
          projectile.deactivate();
          minion.hit();

          if (!minion.isAlive) {
            this.stats.score += minion.points;
            this.stats.enemiesDestroyed++;
            this.registerKill(minion.points); // Track combo
            this.awardXP(15); // Fast enemy XP
            this.createExplosion(
              minion.position.x + minion.size.width / 2,
              minion.position.y + minion.size.height / 2
            );
            this.spawnDebrisParticles(minion.position.x + minion.size.width / 2, minion.position.y + minion.size.height / 2, minion.color);
          } else {
            this.createImpactParticles(minion.position.x + minion.size.width / 2, minion.position.y + minion.size.height / 2, '#ffff00');
          }
          break;
        }
      }

      // Player projectiles vs boss
      if (this.boss && this.boss.isAlive && this.bossState.bossIntroTimer <= 0) {
        if (this.checkCollision(projectile.getBounds(), this.boss.getBounds())) {
          projectile.deactivate();
          this.boss.hit(1);

          if (!this.boss.isAlive) {
            // Boss defeated!
            this.stats.score += this.boss.points * 5; // 5x score
            this.stats.enemiesDestroyed++;
            this.registerKill(this.boss.points * 5); // Track combo (boss counts!)
            this.awardXP(200); // Boss XP
            this.createExplosion(
              this.boss.position.x + this.boss.size.width / 2,
              this.boss.position.y + this.boss.size.height / 2
            );
            this.addScreenShake(25);
            this.spawnDebrisParticles(this.boss.position.x + this.boss.size.width / 2, this.boss.position.y + this.boss.size.height / 2, '#dc2626');

            // Guaranteed power-up
            const types: Array<'plasma' | 'rapid' | 'shield' | 'slowmo'> = ['plasma', 'rapid', 'shield', 'slowmo'];
            const type = types[Math.floor(Math.random() * types.length)];
            const powerUp = new PowerUpEntity(
              this.boss.position.x + this.boss.size.width / 2 - 20,
              this.boss.position.y + this.boss.size.height / 2,
              type
            );
            if (this.assets) {
              const imageMap = {
                plasma: this.assets.powerUpPlasma,
                rapid: this.assets.powerUpRapid,
                shield: this.assets.powerUpShield,
                slowmo: this.assets.powerUpSlowmo
              };
              powerUp.setImage(imageMap[type]);
            }
            this.powerUps.push(powerUp);

            this.bossState.bossActive = false;
            this.bossState.bossHealth = 0;
            this.bossState.bossVictoryTimer = 120; // 2 second victory pause
            this.state = 'bossVictory';

            // Progression tracking for boss defeat
            this.currencyManager.earnStardust(100, 'boss_defeat');
            this.achievementManager.trackBossDefeat();
          } else {
            this.createImpactParticles(this.boss.position.x + this.boss.size.width / 2, this.boss.position.y + this.boss.size.height / 2, '#ffff00');
            this.addScreenShake(5);
          }
          break;
        }
      }
    }

    // Enemy projectiles vs player
    if (!this.player.shieldActive && !this.player.invulnerable) {
      for (const projectile of this.projectiles) {
        if (!projectile.isActive || projectile.isPlayerProjectile) continue;

        if (this.checkCollision(projectile.getBounds(), this.player.getBounds())) {
          projectile.deactivate();

          // Use projectile damage:
          // 1 = lose 1 life (regular enemy bullets)
          // 2 = lose 2 lives (boss orange spread shots)
          // 3 = lose 3 lives (boss red laser beams)
          // 999 = instant death (not used)
          if (projectile.damage >= 999) {
            this.stats.lives = 0; // Instant kill (not used currently)
            this.gameOver();
          } else {
            this.stats.lives -= projectile.damage; // Partial damage
            if (this.stats.lives <= 0) {
              this.gameOver();
            }
          }

          // Track damage taken for perfect wave achievement
          this.tookDamageThisWave = true;

          // Activate invulnerability after taking damage (2 seconds at 60fps)
          this.player.invulnerable = true;
          this.player.invulnerabilityTimer = 120;

          this.createExplosion(
            this.player.position.x + this.player.size.width / 2,
            this.player.position.y + this.player.size.height / 2
          );
          this.addScreenShake(12);

          // CRITICAL: Break after first hit to prevent multiple projectiles hitting in same frame
          break;
        }
      }
    }

    // Power-ups vs player
    for (const powerUp of this.powerUps) {
      if (!powerUp.isActive) continue;

      if (this.checkCollision(powerUp.getBounds(), this.player.getBounds())) {
        powerUp.deactivate();
        this.activatePowerUp(powerUp.type);
        this.createCollectParticles(powerUp.position.x, powerUp.position.y);
      }
    }
  }

  activatePowerUp(type: 'plasma' | 'rapid' | 'shield' | 'slowmo') {
    switch (type) {
      case 'plasma':
        this.player.activatePlasma();
        break;
      case 'rapid':
        this.player.activateRapid();
        break;
      case 'shield':
        this.player.activateShield();
        break;
      case 'slowmo':
        this.slowMotionActive = true;
        this.slowMotionDuration = 360; // 6 seconds (improved from 5s)
        break;
    }

    // Track power-up collection for achievements
    this.achievementManager.trackPowerUpCollected(type);
  }

  checkCollision(bounds1: any, bounds2: any): boolean {
    return !(
    bounds1.right < bounds2.left ||
    bounds1.left > bounds2.right ||
    bounds1.bottom < bounds2.top ||
    bounds1.top > bounds2.bottom);

  }

  addScreenShake(intensity: number) {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
  }

  updateScreenShake() {
    if (this.screenShake.intensity > 0) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.intensity *= 0.9;

      if (this.screenShake.intensity < 0.1) {
        this.screenShake.intensity = 0;
        this.screenShake.x = 0;
        this.screenShake.y = 0;
      }
    }

    // Fade out hit flash
    if (this.hitFlashAlpha > 0) {
      this.hitFlashAlpha -= 0.02; // Quick fade
      if (this.hitFlashAlpha < 0) this.hitFlashAlpha = 0;
    }
  }

  createExplosion(x: number, y: number) {
    if (this.assets) {
      this.explosions.push(new ExplosionAnimation(x, y, this.assets.explosion, this.isMobile));
    }
  }

  createImpactParticles(x: number, y: number, color: string) {
    // Drastically reduced particles for mobile performance
    const particleCount = this.isMobile ? 3 : 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.PI * 2 * i / particleCount;
      const speed = 2 + Math.random() * 5;
      const particleColor = i % 3 === 0 ? '#ffffff' : color;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: particleColor,
        alpha: 1,
        decay: 0.06,
        lifetime: 0,
        maxLifetime: 25
      });
    }
  }

  spawnDebrisParticles(x: number, y: number, color: string) {
    // Drastically reduced particles for mobile performance
    const particleCount = this.isMobile ? 6 : 18;
    const colors = [color, '#ffffff', '#ff6600', '#ffaa00', '#ff0000'];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 6;
      const particleColor = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Add upward bias
        size: 2 + Math.random() * 5,
        color: particleColor,
        alpha: 1,
        decay: this.isMobile ? 0.05 : 0.025, // Faster decay on mobile
        lifetime: 0,
        maxLifetime: this.isMobile ? 30 : 50 // Shorter lifetime on mobile
      });
    }
  }

  createCollectParticles(x: number, y: number) {
    // Drastically reduced particles for mobile performance
    const particleCount = this.isMobile ? 4 : 12;
    const colors = ['#10b981', '#22d3ee', '#fbbf24', '#ffffff'];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: this.isMobile ? 0.08 : 0.05,
        lifetime: 0,
        maxLifetime: this.isMobile ? 25 : 35
      });
    }
  }

  // COMBO SYSTEM - Track kill streaks and show notifications
  registerKill(points: number) {
    const now = Date.now();

    // Reset combo if too much time has passed
    if (now - this.lastKillTime > this.comboTimeout) {
      this.stats.combo = 0;
    }

    this.lastKillTime = now;
    this.stats.combo++;

    // Track max combo
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo;
    }

    // Show combo notification at milestones
    if (this.stats.combo === 5) {
      this.addComboNotification('NICE! x5', '#22d3ee', 1.2);
      this.stats.score += 50;
    } else if (this.stats.combo === 10) {
      this.addComboNotification('GREAT! x10', '#fbbf24', 1.4);
      this.stats.score += 100;
      this.addScreenShake(10);
    } else if (this.stats.combo === 15 && !this.has15ComboReward) {
      // 15 Combo Life Reward (one-time per game)
      this.has15ComboReward = true;

      // Award +1 life (can exceed max health!)
      this.stats.lives++;
      this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

      // Celebration
      this.addComboNotification('EPIC 15 COMBO!\n+1 LIFE REWARD!', '#ff6600', 2.0);
      this.stats.score += 500;
      this.addScreenShake(25);
    } else if (this.stats.combo === 20) {
      this.addComboNotification('AMAZING! x20', '#ec4899', 1.6);
      this.stats.score += 250;
      this.addScreenShake(15);
    } else if (this.stats.combo === 30 && !this.has30ComboReward) {
      // 30 Combo Life Reward (one-time per game)
      this.has30ComboReward = true;

      // Award +1 life (can exceed max health!)
      this.stats.lives++;
      this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

      // Epic celebration
      this.addComboNotification('INSANE 30 COMBO!\n+1 LIFE REWARD!', '#a855f7', 2.3);
      this.stats.score += 1000;
      this.addScreenShake(28);
    } else if (this.stats.combo === 50 && !this.has50ComboReward) {
      // 50 Combo Life Reward (one-time per game)
      this.has50ComboReward = true;

      // Award +1 life (can exceed max health for legendary achievement!)
      this.stats.lives++;
      this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

      // Legendary celebration
      this.addComboNotification('LEGENDARY 50 COMBO!\n+1 LIFE REWARD!', '#ff00ff', 2.5);
      this.stats.score += 2000;
      this.addScreenShake(30);
    } else if (this.stats.combo % 25 === 0 && this.stats.combo > 50) {
      this.addComboNotification(`UNSTOPPABLE! x${this.stats.combo}`, '#ff6600', 2.2);
      this.stats.score += 1000;
      this.addScreenShake(25);
    }

    // Progression tracking
    this.achievementManager.trackKill();
    this.achievementManager.trackCombo(this.stats.combo);

    // Earn Stardust for combo milestones (one-time per session)
    if (this.stats.combo === 15 && this.has15ComboReward) {
      this.currencyManager.earnStardust(25, 'combo_15x');
    } else if (this.stats.combo === 30 && this.has30ComboReward) {
      this.currencyManager.earnStardust(50, 'combo_30x');
    } else if (this.stats.combo === 50 && this.has50ComboReward) {
      this.currencyManager.earnStardust(100, 'combo_50x');
    }
  }

  addComboNotification(message: string, color: string, scale: number) {
    this.comboNotifications.push({
      message,
      color,
      scale,
      alpha: 1,
      lifetime: 0
    });
  }

  // WAVE COMPLETION EFFECTS - Celebration when clearing a wave
  triggerWaveCompletionEffects(isMilestone: boolean) {
    // Screen shake - stronger for milestones
    this.addScreenShake(isMilestone ? 20 : 12);

    // Particle burst from screen edges
    const particleCount = this.isMobile ? isMilestone ? 60 : 40 : isMilestone ? 120 : 80;
    const colors = isMilestone ?
    ['#fbbf24', '#f59e0b', '#ff6600', '#ec4899', '#a855f7'] // Gold, orange, pink, purple for milestones
    : ['#22d3ee', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1']; // Cyan, blue spectrum for normal

    // Burst from all four corners
    const corners = [
    { x: 0, y: 0 }, // Top-left
    { x: this.canvas.width, y: 0 }, // Top-right
    { x: 0, y: this.canvas.height }, // Bottom-left
    { x: this.canvas.width, y: this.canvas.height } // Bottom-right
    ];

    corners.forEach((corner) => {
      for (let i = 0; i < particleCount / 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * (isMilestone ? 10 : 7);
        const particleColor = colors[Math.floor(Math.random() * colors.length)];

        this.particles.push({
          x: corner.x,
          y: corner.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * (isMilestone ? 8 : 5), // Larger particles
          color: particleColor,
          alpha: 1,
          decay: this.isMobile ? 0.01 : 0.005, // Even slower decay for 2-3 second lifetime
          lifetime: 0,
          maxLifetime: isMilestone ? 180 : 150 // 2.5-3 seconds at 60fps
        });
      }
    });

    // Center burst for milestones
    if (isMilestone) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;

      for (let i = 0; i < (this.isMobile ? 50 : 100); i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 12;
        const particleColor = colors[Math.floor(Math.random() * colors.length)];

        this.particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 9, // Larger particles
          color: particleColor,
          alpha: 1,
          decay: 0.004, // Even slower decay for milestones
          lifetime: 0,
          maxLifetime: 200 // ~3.3 seconds at 60fps
        });
      }
    }
  }

  hitPlayer() {
    // Don't take damage if invulnerable or shield is active
    if (this.player.invulnerable || this.player.shieldActive) {
      return;
    }

    // Lose a life
    this.stats.lives--;

    // Reset combo on hit
    this.stats.combo = 0;

    // SCREEN SHAKE - Intense shake on hit
    this.addScreenShake(25);

    // RED FLASH - Screen flash on hit
    this.hitFlashAlpha = 0.4;

    // PARTICLE BURST - Explosion at player position
    const burstColors = ['#ff0000', '#ff4500', '#ff6347', '#ffa500', '#ffff00'];
    const particleCount = this.isMobile ? 20 : 30;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.PI * 2 * i / particleCount + Math.random() * 0.3;
      const speed = 4 + Math.random() * 8;
      const particleColor = burstColors[Math.floor(Math.random() * burstColors.length)];

      this.particles.push({
        x: this.player.position.x + this.player.size.width / 2,
        y: this.player.position.y + this.player.size.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: particleColor,
        alpha: 1,
        decay: 0.015,
        lifetime: 0,
        maxLifetime: 80
      });
    }

    // INVULNERABILITY - Brief invulnerability after hit (2 seconds at 60fps)
    this.player.invulnerable = true;
    this.player.invulnerabilityTimer = 120;

    // Check for game over
    if (this.stats.lives <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.state = 'gameOver';

    // Track final score for achievements
    this.achievementManager.trackScore(this.stats.score);
  }

  checkWaveComplete() {
    // Boss wave completion
    if (this.bossState.isBossWave) {
      if (this.boss && !this.boss.isAlive && this.bossMinions.filter((m) => m.isAlive).length === 0) {
        // Timer is already being decremented in update() method
        // Auto-advance when timer reaches or goes below 0
        if (this.bossState.bossVictoryTimer <= 0) {
          this.state = 'playing'; // Resume playing
          this.nextWave();
        }
        return;
      }
      return;
    }

    // Normal wave completion - add transition delay with celebration effects
    const aliveEnemies = this.enemies.filter((e) => e.isAlive);
    if (aliveEnemies.length === 0) {
      // Start wave transition if not already active
      if (!this.waveTransition) {
        const isMilestone = (this.stats.wave + 1) % 5 === 0; // Next wave is milestone
        this.waveTransition = {
          active: true,
          progress: 0,
          waveNumber: this.stats.wave + 1,
          isMilestone
        };

        // Celebration effects when wave completes
        this.triggerWaveCompletionEffects(isMilestone);
      }
    }
  }

  nextWave() {
    // Save checkpoint when completing a boss wave
    if (this.stats.wave % 5 === 0 && this.stats.wave > 0) {
      this.lastCheckpoint = this.stats.wave;
      console.log(`✅ Checkpoint saved at Wave ${this.lastCheckpoint}`);
    }

    // Reset boss victory timer when advancing waves
    this.bossState.bossVictoryTimer = 0;

    this.stats.wave++;

    // BEGINNER-FRIENDLY DIFFICULTY CURVE - Gentler early game scaling
    // Enemy speed: Progressive scaling with different rates for early/mid/late game
    if (this.stats.wave <= 10) {
      this.enemySpeed += 0.03; // Gentle early game (waves 1-10)
    } else if (this.stats.wave <= 30) {
      this.enemySpeed += 0.04; // Moderate mid game (waves 11-30)
    } else {
      this.enemySpeed += 0.02; // Slow late game (waves 31+)
    }

    // Fire rate: -40ms per wave with floor at 1800ms (gentler than before)
    this.enemyFireRate = Math.max(1800, this.enemyFireRate - 40);

    // Progression tracking
    this.currencyManager.earnStardust(10, 'wave_complete');
    this.achievementManager.trackWave(this.stats.wave);
    this.checkWaveMilestone(this.stats.wave);

    // Track perfect wave (completed previous wave without damage)
    if (!this.tookDamageThisWave && this.stats.wave > 1) {
      this.achievementManager.trackPerfectWave();
      console.log(`✨ Perfect Wave ${this.stats.wave - 1}! No damage taken.`);
    }

    // Reset damage flag for next wave
    this.tookDamageThisWave = false;

    this.initEnemies();
    this.projectiles = [];
  }

  checkWaveMilestone(wave: number) {
    const milestones: { [key: number]: number } = {
      10: 50,
      20: 150,
      30: 300,
      50: 500,
      100: 1000
    };

    if (milestones[wave]) {
      this.currencyManager.earnStardust(milestones[wave], `wave_${wave}_milestone`);
      // Could add visual celebration here
      console.log(`🎉 Wave ${wave} Milestone! +${milestones[wave]} 💎`);
    }
  }

  checkDailyReward() {
    const rewardCheck = this.dailyRewardManager.checkReward();

    if (rewardCheck.available && rewardCheck.reward) {
      // Dispatch event for UI to show daily reward popup
      window.dispatchEvent(new CustomEvent('daily-reward-available', {
        detail: {
          day: rewardCheck.day,
          reward: rewardCheck.reward,
          streak: rewardCheck.streak
        }
      }));

      console.log(`🎁 Daily Reward Available: Day ${rewardCheck.day} (Streak: ${rewardCheck.streak})`);
    } else {
      console.log(`✅ Daily reward already claimed today. Current streak: ${rewardCheck.streak}`);
    }
  }

  update() {
    // Calculate delta time for frame-rate independent movement
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / (1000 / this.targetFPS);
    this.lastFrameTime = currentTime;

    // Clamp delta time to prevent huge jumps (e.g., when tab is inactive)
    const clampedDelta = Math.min(deltaTime, 3);

    // Handle boss victory state
    if (this.state === 'bossVictory') {
      if (this.bossState.bossVictoryTimer > 0) {
        this.bossState.bossVictoryTimer -= clampedDelta;
      }
      this.player.update();
      this.powerUps.forEach((p) => p.update());
      this.particles.forEach((p) => {
        p.x += p.vx * clampedDelta;
        p.y += p.vy * clampedDelta;
        p.alpha -= p.decay * clampedDelta;
        p.lifetime += clampedDelta;
        p.size *= Math.pow(0.97, clampedDelta);
        p.vy += 0.1 * clampedDelta;
      });
      this.particles = this.particles.filter((p) => p.alpha > 0 && p.lifetime < p.maxLifetime);
      this.updateScreenShake();
      this.checkCollisions();
      this.checkWaveComplete();
      return;
    }

    if (this.state !== 'playing') return;

    // Update animated cosmetics (rainbow, galaxy skins)
    this.cosmeticManager.update();

    const timeScale = this.slowMotionActive ? 0.5 : 1;

    if (this.slowMotionDuration > 0) {
      this.slowMotionDuration -= clampedDelta;
      if (this.slowMotionDuration <= 0) this.slowMotionActive = false;
    }

    this.handleInput();
    this.player.update();

    if (this.bossState.isBossWave) {
      this.updateBoss(clampedDelta);
    } else {
      this.updateEnemies(clampedDelta);
    }

    this.enemyFire();
    this.spawnPowerUp();
    this.updateScreenShake();

    // Update projectiles with delta time
    this.projectiles = this.projectiles.filter((p) => {
      if (!p.isActive) return false;
      const updates = timeScale * clampedDelta;
      for (let i = 0; i < Math.floor(updates); i++) p.update();
      if (updates % 1 > 0) p.update(); // Handle fractional updates
      return p.position.y > -20 && p.position.y < this.canvas.height + 20;
    });

    // Update power-ups
    this.powerUps = this.powerUps.filter((p) => {
      if (!p.isActive) return false;
      p.update();
      return p.position.y < this.canvas.height + 50;
    });

    // Update explosions
    this.explosions.forEach((e) => e.update());
    this.explosions = this.explosions.filter((e) => !e.isDone());

    // Update particles with delta time
    this.particles.forEach((p) => {
      p.x += p.vx * clampedDelta;
      p.y += p.vy * clampedDelta;
      p.alpha -= p.decay * clampedDelta;
      p.lifetime += clampedDelta;
      p.size *= Math.pow(0.97, clampedDelta);
      p.vy += 0.1 * clampedDelta; // Gravity
    });
    this.particles = this.particles.filter((p) => p.alpha > 0 && p.lifetime < p.maxLifetime);

    // Update combo notifications
    this.comboNotifications = this.comboNotifications.map((notif) => ({
      ...notif,
      lifetime: notif.lifetime + clampedDelta,
      alpha: Math.max(0, 1 - notif.lifetime / 120), // Fade out over 2 seconds
      scale: notif.scale + clampedDelta * 0.01 // Slight grow effect
    })).filter((notif) => notif.lifetime < 120);

    // Reset combo if timeout reached
    const now = Date.now();
    if (this.stats.combo > 0 && now - this.lastKillTime > this.comboTimeout) {
      this.stats.combo = 0;
    }

    // Update wave transition
    if (this.waveTransition && this.waveTransition.active) {
      this.waveTransition.progress += clampedDelta / 150; // 2.5 second transition

      // Complete transition and start next wave
      if (this.waveTransition.progress >= 1) {
        this.waveTransition = null;
        this.nextWave();
      }
    }

    this.checkCollisions();
    this.checkWaveComplete();
  }

  render() {
    this.ctx.save();
    this.ctx.translate(this.screenShake.x, this.screenShake.y);

    // Clear canvas with gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0a0014');
    gradient.addColorStop(0.5, '#0d001a');
    gradient.addColorStop(1, '#150028');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(-this.screenShake.x, -this.screenShake.y, this.canvas.width, this.canvas.height);

    // Hit flash overlay - Red flash when player gets hit
    if (this.hitFlashAlpha > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 0, ${this.hitFlashAlpha})`;
      this.ctx.fillRect(-this.screenShake.x, -this.screenShake.y, this.canvas.width, this.canvas.height);
    }

    // Slow-mo overlay with enhanced effect
    if (this.slowMotionActive) {
      this.ctx.fillStyle = 'rgba(100, 50, 200, 0.15)';
      this.ctx.fillRect(-this.screenShake.x, -this.screenShake.y, this.canvas.width, this.canvas.height);

      // Add scanlines effect for slow-mo
      this.ctx.strokeStyle = 'rgba(100, 50, 200, 0.1)';
      this.ctx.lineWidth = 2;
      for (let y = 0; y < this.canvas.height; y += 4) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
    }

    // Render particles (background layer) with enhanced glow
    this.particles.forEach((p) => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 15 + p.size * 2;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Add bright core to particles
      if (p.alpha > 0.5) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.globalAlpha = (p.alpha - 0.5) * 0.6;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    });

    // Render entities with layering
    this.powerUps.forEach((p) => p.render(this.ctx));

    // FIXED: Pass filter directly to player render method to ensure it's applied inside save/restore block
    const skinFilter = this.cosmeticManager.getProcessedFilter();
    this.player.render(this.ctx, this.assets?.shieldEffect, skinFilter);

    this.enemies.forEach((enemy) => enemy.render(this.ctx));
    this.bossMinions.forEach((minion) => minion.render(this.ctx));
    if (this.boss && this.boss.isAlive) {
      this.boss.render(this.ctx);
    }
    this.projectiles.forEach((projectile) => projectile.render(this.ctx));
    this.explosions.forEach((explosion) => explosion.render(this.ctx));

    // Render combo notifications (centered top, smaller size)
    this.comboNotifications.forEach((notif) => {
      this.ctx.save();
      this.ctx.globalAlpha = notif.alpha;

      // Smaller font size
      const fontSize = this.isMobile ? 16 : 22;
      this.ctx.font = `bold ${fontSize}px 'Space Grotesk', monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';

      // Position: top-center, below wave indicator
      const x = this.canvas.width / 2;
      const y = this.isMobile ? 55 : 70; // Just below wave

      // Reduced glow
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = notif.color;

      // Stroke for readability
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(notif.message, x, y);

      this.ctx.fillStyle = notif.color;
      this.ctx.fillText(notif.message, x, y);

      this.ctx.restore();
    });

    // Show current combo counter (smaller, centered top)
    if (this.stats.combo >= 3) {
      this.ctx.save();

      // Position: top-center, below wave
      const fontSize = this.isMobile ? 13 : 18;
      const x = this.canvas.width / 2;
      const y = this.isMobile ? 72 : 90;

      this.ctx.font = `bold ${fontSize}px 'Space Grotesk', monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';

      // Reduced pulse
      const pulse = 1 + Math.sin(Date.now() / 300) * 0.05;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.scale(pulse, pulse);
      this.ctx.translate(-x, -y);

      // Fill with color based on combo size
      let color = '#fbbf24'; // Default yellow
      if (this.stats.combo >= 50) color = '#a855f7'; // Purple for legendary
      else if (this.stats.combo >= 20) color = '#ec4899'; // Pink for amazing
      else if (this.stats.combo >= 10) color = '#fbbf24'; // Yellow for great

      // Reduced glow
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = color;

      // Stroke
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(`COMBO ${this.stats.combo}x`, x, y);

      this.ctx.fillStyle = color;
      this.ctx.fillText(`COMBO ${this.stats.combo}x`, x, y);

      this.ctx.restore();
      this.ctx.restore();
    }

    // Render wave transition overlay
    if (this.waveTransition && this.waveTransition.active) {
      this.ctx.save();

      // Screen flash effect - bright flash at the start that fades quickly
      if (this.waveTransition.progress < 0.4) {
        const flashAlpha = this.waveTransition.isMilestone ?
        (0.4 - this.waveTransition.progress) / 0.4 * 0.6 // Much brighter flash for milestones
        : (0.4 - this.waveTransition.progress) / 0.4 * 0.45; // More visible flash for normal waves

        const flashColor = this.waveTransition.isMilestone ?
        `rgba(251, 191, 36, ${flashAlpha})` // Golden flash for milestones
        : `rgba(34, 211, 238, ${flashAlpha})`; // Cyan flash for normal waves

        this.ctx.fillStyle = flashColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // Dimmed background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Wave complete message
      const fontSize = this.isMobile ? 32 : 48;
      this.ctx.font = `bold ${fontSize}px 'Space Grotesk', monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const centerY = this.canvas.height / 2;

      // "WAVE X COMPLETE!" message
      const alpha = this.waveTransition.progress < 0.5 ?
      this.waveTransition.progress * 2 :
      (1 - this.waveTransition.progress) * 2;

      this.ctx.globalAlpha = alpha;
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = '#22d3ee';

      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText(`WAVE ${this.stats.wave} COMPLETE!`, this.canvas.width / 2, centerY - 40);

      this.ctx.fillStyle = '#22d3ee';
      this.ctx.fillText(`WAVE ${this.stats.wave} COMPLETE!`, this.canvas.width / 2, centerY - 40);

      // "Next wave starting..." message
      const smallFont = this.isMobile ? 18 : 24;
      this.ctx.font = `${smallFont}px 'Space Grotesk', monospace`;

      // Enhanced glow for milestone waves
      if (this.waveTransition.isMilestone) {
        const pulse = 1 + Math.sin(this.waveTransition.progress * Math.PI * 4) * 0.3;
        this.ctx.shadowBlur = 10 + pulse * 15;
        this.ctx.shadowColor = '#fbbf24';
      } else {
        this.ctx.shadowBlur = 10;
      }

      this.ctx.fillStyle = '#fbbf24';
      this.ctx.fillText(
        this.waveTransition.isMilestone ? 'BOSS WAVE INCOMING...' : 'Get ready...',
        this.canvas.width / 2,
        centerY + 30
      );

      this.ctx.restore();
    }

    this.ctx.restore();
  }

  reset() {
    // Continue from last checkpoint if available, otherwise start from wave 1
    const startWave = this.lastCheckpoint > 0 ? this.lastCheckpoint : 1;

    if (this.lastCheckpoint > 0) {
      console.log(`🔄 Continuing from checkpoint: Wave ${startWave}`);
    }

    this.stats = {
      score: 0,
      lives: 4, // Changed from 3 to 4 for beginner-friendly difficulty
      wave: startWave,
      enemiesDestroyed: 0,
      xp: 0,
      level: 1,
      maxHealth: 4, // Changed from 3 to 4 for beginner-friendly difficulty
      fireRateBonus: 0,
      movementSpeedBonus: 0,
      combo: 0,
      maxCombo: 0
    };
    this.fireDelay = 250; // Changed from 300ms to 250ms for faster firing
    this.config.playerSpeed = 7;

    // Restore enemy difficulty for the checkpoint wave using beginner-friendly formula
    // Progressive speed scaling: waves 1-10 (+0.03), 11-30 (+0.04), 31+ (+0.02)
    const wave1to10 = Math.min(startWave - 1, 10) * 0.03;
    const wave11to30 = Math.max(0, Math.min(startWave - 1, 30) - 10) * 0.04;
    const wave31plus = Math.max(0, startWave - 31) * 0.02;
    this.enemySpeed = this.config.enemySpeed + wave1to10 + wave11to30 + wave31plus;
    this.enemyFireRate = Math.max(1800, this.config.enemyFireRate - (startWave - 1) * 40);

    this.state = 'playing';
    this.projectiles = [];
    this.explosions = [];
    this.powerUps = [];
    this.particles = [];
    this.enemyDirection = 1;
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.slowMotionActive = false;
    this.slowMotionDuration = 0;
    this.lastPowerUpSpawn = 0;
    this.has15ComboReward = false;
    this.has30ComboReward = false;
    this.has50ComboReward = false;
    this.tookDamageThisWave = false;
    this.boss = null;
    this.bossMinions = [];
    this.bossState = {
      isBossWave: false,
      bossActive: false,
      bossHealth: 0,
      bossMaxHealth: 0,
      bossPhase: 'phase1',
      bossIntroTimer: 0,
      bossVictoryTimer: 0,
      lastAttackTime: 0,
      attackPattern: 'spread',
      teleportCooldown: 0
    };
    this.player = new Player(this.canvas.width, this.canvas.height, this.config.playerSpeed);

    // Move spaceship up in portrait mode for better visibility
    if (this.isMobile && this.canvas.height > this.canvas.width) {
      this.player.position.y = this.canvas.height - this.player.size.height - 50; // 50px from bottom instead of 30px
    }

    if (this.assets) this.player.setImage(this.assets.playerShip);
    this.initEnemies();

    // Track new game started for achievements
    this.achievementManager.trackGamePlayed();
    this.achievementManager.trackScore(0); // Reset for new game
  }

  setLevelUpCallback(callback: (level: number, upgrade: string) => void) {
    this.levelUpCallback = callback;
  }

  awardXP(amount: number) {
    this.stats.xp += amount;

    // Check for level up (500 XP per level)
    const xpPerLevel = 500;
    while (this.stats.xp >= xpPerLevel) {
      this.stats.xp -= xpPerLevel;
      this.stats.level++;
      this.pendingLevelUp = true;
      this.applyLevelUpgrade();
    }
  }

  applyLevelUpgrade() {
    const level = this.stats.level;
    const upgradeIndex = (level - 1) % 3;

    let upgradeText = '';

    switch (upgradeIndex) {
      case 0:
        // +5% fire rate
        this.stats.fireRateBonus += 5;
        this.fireDelay = 300 * (1 - this.stats.fireRateBonus / 100);
        upgradeText = '+5% Fire Rate';
        break;
      case 1:
        // +10% movement speed
        this.stats.movementSpeedBonus += 10;
        this.config.playerSpeed = 7 * (1 + this.stats.movementSpeedBonus / 100);
        this.player.speed = this.config.playerSpeed;
        upgradeText = '+10% Movement Speed';
        break;
      case 2:
        // +1 max health (no cap - can grow indefinitely)
        this.stats.maxHealth++;
        this.stats.lives = Math.min(this.stats.lives + 1, this.stats.maxHealth);
        upgradeText = '+1 Max Health';
        break;
    }

    // Track level progression
    this.achievementManager.trackLevel(this.stats.level);
    this.currencyManager.earnStardust(5, `level_${this.stats.level}`);

    // Trigger celebration
    if (this.levelUpCallback) {
      this.levelUpCallback(this.stats.level, upgradeText);
    }

    // Add screen shake
    this.addScreenShake(15);

    // Spawn burst particles at player
    this.spawnLevelUpParticles(
      this.player.position.x + this.player.size.width / 2,
      this.player.position.y + this.player.size.height / 2
    );
  }

  spawnLevelUpParticles(x: number, y: number) {
    // Epic level up burst with multiple rings
    for (let ring = 0; ring < 3; ring++) {
      const particlesInRing = 30 + ring * 10;
      for (let i = 0; i < particlesInRing; i++) {
        const angle = Math.PI * 2 * i / particlesInRing;
        const speed = 3 + ring * 2 + Math.random() * 4;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          size: 3 + Math.random() * 5,
          color: ['#fbbf24', '#f59e0b', '#a855f7', '#22d3ee', '#ffffff'][Math.floor(Math.random() * 5)],
          alpha: 1,
          decay: 0.015,
          lifetime: 0,
          maxLifetime: 100
        });
      }
    }
  }

  getEnemyDifficultyMultiplier(): number {
    // 2% stronger per player level
    return 1 + (this.stats.level - 1) * 0.02;
  }

  cleanup() {
    if (this.autoFireInterval) {
      clearInterval(this.autoFireInterval);
    }
  }
}