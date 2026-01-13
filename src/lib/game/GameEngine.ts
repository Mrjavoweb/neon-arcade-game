import { Player, Enemy, Boss, Projectile, ExplosionAnimation, PowerUpEntity, Asteroid, FormationType, selectFormation } from './entities';
import { GameState, GameStats, GameConfig, Particle, SpriteAssets, BossState, ComboNotification, WaveTransition, PowerUpType } from './types';
import { CurrencyManager } from './progression/CurrencyManager';
import { DailyRewardManager } from './progression/DailyRewardManager';
import { AchievementManager } from './progression/AchievementManager';
import { CosmeticManager } from './progression/CosmeticManager';
import { ModuleManager } from './progression/ModuleManager';
import { getSettingsManager } from './settings/SettingsManager';
import { GameSettings, DIFFICULTY_CONFIGS } from './settings/SettingsTypes';
import { getAudioManager, AudioManager } from './audio/AudioManager';
import { getHapticManager, HapticManager } from './haptic/HapticManager';
import { getHintManager, HintManager } from './hints/HintManager';
import { getLeaderboardManager, LeaderboardManager } from './leaderboard/LeaderboardManager';

// Module-level asset cache - persists across GameEngine instances for instant subsequent loads
let cachedAssets: SpriteAssets | null = null;
let assetsLoading: Promise<void> | null = null;

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  enemies: Enemy[];
  boss: Boss | null;
  bossMinions: Enemy[];
  asteroids: Asteroid[]; // Asteroid wave entities
  asteroidWaveActive: boolean; // Is this an asteroid wave (pre-boss)?
  asteroidWaveTimer: number; // Timer for asteroid wave (30 seconds max)
  asteroidIntroTimer: number; // Intro pause before asteroid wave starts
  currentFormation: FormationType; // Current wave's formation type
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

  // === JUICE EFFECTS ===
  hitStopFrames: number; // Frame freeze on significant events
  hitStopCooldown: number; // Cooldown to prevent rapid hit stop spam
  chromaticAberration: number; // RGB offset intensity (0-1)
  timeDilation: number; // Dynamic speed multiplier (0.3 = slow, 1.0 = normal, 1.2 = fast)
  timeDilationTarget: number; // Target to lerp towards
  cameraZoom: number; // Current zoom level (1.0 = normal)
  cameraZoomTarget: number; // Target zoom to lerp to
  nearMissTimer: number; // Cooldown for near-miss detection
  lastPowerUpSpawn: number;
  powerUpSpawnRate: number;
  // New powerup system properties
  scoreMultiplier: number;
  scoreMultiplierDuration: number;
  laserBeam: {
    active: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null;
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
  moduleManager: ModuleManager;

  // Settings system
  private settings: GameSettings;

  // Audio system
  audioManager: AudioManager;

  // Haptic feedback system
  hapticManager: HapticManager;

  // Tutorial hints system
  hintManager: HintManager;

  // Leaderboard system
  leaderboardManager: LeaderboardManager;

  // Performance limits to prevent freezing during intense gameplay
  readonly MAX_PARTICLES: number;
  readonly MAX_PROJECTILES: number;
  readonly MAX_EXPLOSIONS: number;
  private performanceLogTimer = 0;

  // Particle throttle thresholds (% of MAX_PARTICLES)
  private readonly PARTICLE_THROTTLE_START = 0.6; // Start reducing at 60% capacity
  private readonly PARTICLE_THROTTLE_HEAVY = 0.85; // Heavy reduction at 85% capacity

  // FPS counter
  private fpsFrameCount = 0;
  private fpsLastTime = 0;
  private currentFPS = 0;

  // Performance optimization: frame counter for periodic cleanup
  private frameCount = 0;

  // Performance optimization: pre-rendered scanline pattern
  private scanlinePattern: CanvasPattern | null = null;

  // Adaptive difficulty system - tracks consecutive boss deaths
  private consecutiveBossDeaths: number = 0;
  private readonly ADAPTIVE_DIFFICULTY_KEY = 'alien_invasion_boss_deaths';

  // Upgrade notification system - helps players discover shop/modules
  // HintManager handles boss hint showOnce logic via localStorage
  private consecutiveGameOvers: number = 0;
  private upgradeHintShownStruggle: boolean = false;

  constructor(canvas: HTMLCanvasElement, isMobile: boolean) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    this.isMobile = isMobile;

    // Set aggressive performance limits based on device (Option 1)
    this.MAX_PARTICLES = isMobile ? 200 : 500;
    this.MAX_PROJECTILES = isMobile ? 150 : 200;
    this.MAX_EXPLOSIONS = isMobile ? 20 : 30;

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

    // Initialize juice effects
    this.hitStopFrames = 0;
    this.hitStopCooldown = 0;
    this.chromaticAberration = 0;
    this.timeDilation = 1.0;
    this.timeDilationTarget = 1.0;
    this.cameraZoom = 1.0;
    this.cameraZoomTarget = 1.0;
    this.nearMissTimer = 0;

    this.lastPowerUpSpawn = 0;
    this.powerUpSpawnRate = 12000; // 12 seconds between spawn attempts
    // New powerup properties
    this.scoreMultiplier = 1;
    this.scoreMultiplierDuration = 0;
    this.laserBeam = null;
    this.pendingLevelUp = false;
    this.lastCheckpoint = this.loadCheckpoint(); // Load checkpoint from localStorage
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

    // Start from checkpoint if available, otherwise start from wave 1
    const startWave = this.lastCheckpoint > 0 ? this.lastCheckpoint : 1;
    if (this.lastCheckpoint > 0) {
      console.log(`🔄 Starting from saved checkpoint: Wave ${startWave}`);
    }

    this.stats = {
      score: 0,
      lives: 4,
      wave: startWave,
      enemiesDestroyed: 0,
      xp: 0,
      level: 1,
      maxHealth: 4,
      fireRateBonus: 0,
      movementSpeedBonus: 0,
      combo: 0,
      maxCombo: 0
    };

    // Note: Module HP boost applied after moduleManager is initialized (see below)

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

    this.enemies = [];
    this.boss = null;
    this.bossMinions = [];
    this.asteroids = [];
    this.asteroidWaveActive = false;
    this.asteroidWaveTimer = 0;
    this.asteroidIntroTimer = 0;
    this.currentFormation = 'grid';
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
      teleportCooldown: 0,
      chargeActive: false,
      chargeTelegraphTimer: 0,
      chargeDirection: 1,
      chargeStartX: 0,
      bombsActive: []
    };

    // Initialize progression systems FIRST (before player creation)
    this.currencyManager = new CurrencyManager();
    this.achievementManager = new AchievementManager(this.currencyManager);
    this.dailyRewardManager = new DailyRewardManager(this.currencyManager);
    this.cosmeticManager = new CosmeticManager(this.currencyManager);
    this.moduleManager = new ModuleManager(this.currencyManager, this.achievementManager);

    // Apply module HP boost
    const moduleHPBoost = this.moduleManager.getEffectValue('max_hp_boost');
    if (moduleHPBoost > 0) {
      this.stats.maxHealth += moduleHPBoost;
      this.stats.lives += moduleHPBoost;
    }

    // Load adaptive difficulty (consecutive boss deaths)
    this.loadAdaptiveDifficulty();

    // NOW create player with movement speed boost from superpower
    const superpower = this.cosmeticManager.getActiveSuperpower();
    let playerSpeed = this.config.playerSpeed;
    if (superpower.type === 'movement_speed_boost' && superpower.value) {
      playerSpeed = playerSpeed * (1 + superpower.value / 100);
    }

    this.player = new Player(canvas.width, canvas.height, playerSpeed);

    // Grant immediate invulnerability at game start (prevents race condition with enemy fire)
    this.player.invulnerable = true;
    this.player.invulnerabilityTimer = this.isMobile ? 45 : 60; // 0.75s mobile, 1.0s desktop

    // Move spaceship up in portrait mode for better visibility
    if (this.isMobile && canvas.height > canvas.width) {
      this.player.position.y = canvas.height - this.player.size.height - 50; // 50px from bottom instead of 30px
    }

    // Initialize settings system
    const settingsManager = getSettingsManager();
    this.settings = settingsManager.getSettings();

    // Listen for settings changes
    window.addEventListener('settings-changed', ((event: CustomEvent) => {
      this.settings = event.detail.settings;
      console.log('⚙️ Settings updated in GameEngine:', this.settings);
    }) as EventListener);

    // Initialize audio system
    this.audioManager = getAudioManager();
    console.log('🔊 AudioManager initialized in GameEngine');

    // Initialize haptic feedback system
    this.hapticManager = getHapticManager();
    console.log('📳 HapticManager initialized in GameEngine');

    // Initialize tutorial hints system
    this.hintManager = getHintManager(isMobile);
    console.log('💡 HintManager initialized in GameEngine');

    // Initialize leaderboard system
    this.leaderboardManager = getLeaderboardManager();
    console.log('📊 LeaderboardManager initialized in GameEngine');

    // Daily reward check is now called from GameCanvas after event listener is set up

    this.initEnemies();
    this.setupControls();

    // Performance optimization: Pre-render scanline pattern
    this.scanlinePattern = this.createScanlinePattern();

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

  async loadAssets(onProgress?: (progress: number) => void): Promise<void> {
    // Return immediately if assets are already cached (instant load)
    if (cachedAssets) {
      console.log('⚡ Using cached assets (instant load)');
      this.assets = cachedAssets;
      this.assignSpritesToEntities();
      if (onProgress) onProgress(100);
      return;
    }

    // Prevent duplicate loading if already in progress (wait for existing load)
    if (assetsLoading) {
      console.log('⏳ Waiting for assets loading in progress...');
      await assetsLoading;
      if (cachedAssets) {
        this.assets = cachedAssets;
        this.assignSpritesToEntities();
        if (onProgress) onProgress(100);
      }
      return;
    }

    // First time loading - proceed with full load
    assetsLoading = this._loadAssetsInternal(onProgress);
    await assetsLoading;
    assetsLoading = null;
  }

  private async _loadAssetsInternal(onProgress?: (progress: number) => void): Promise<void> {
    const totalAssets = 15; // Total number of images to load
    let loadedAssets = 0;

    const loadImage = (src: string, name: string = 'image'): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        // CRITICAL: Enable CORS for all images to allow canvas filters to work
        // Without CORS, the canvas becomes "tainted" and filters fail silently
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          console.log(`✅ Loaded ${name}:`, src.substring(0, 60) + '...');
          loadedAssets++;
          if (onProgress) {
            onProgress((loadedAssets / totalAssets) * 100);
          }
          resolve(img);
        };

        img.onerror = (error) => {
          console.error(`❌ Failed to load ${name}:`, src, error);
          // Try again with CORS as fallback
          const retryImg = new Image();
          retryImg.crossOrigin = 'anonymous';
          retryImg.onload = () => {
            console.log(`✅ Loaded ${name} (with CORS):`, src.substring(0, 60) + '...');
            loadedAssets++;
            if (onProgress) {
              onProgress((loadedAssets / totalAssets) * 100);
            }
            resolve(retryImg);
          };
          retryImg.onerror = () => {
            console.error(`❌ Failed to load ${name} (with CORS):`, src);
            reject(new Error(`Failed to load ${name}`));
          };
          retryImg.src = src;
        };

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
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/f3b62150-4a75-4f79-a287-beb738d7988f.webp', 'playerShip'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/95d93858-1da2-4410-bc6d-7c97a81a2690.webp', 'alienBasic'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/b6b8921b-cb05-4c7c-9637-17e8f8199206.webp', 'alienHeavy'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/0ee5fdad-b7fc-40b7-b71b-5785189cd229.webp', 'alienFast'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/038a876a-d68c-4444-b8b0-2ae9ab25580c.webp', 'bossAlien'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/63f19d5b-0342-487b-8747-2fc17cb64440.webp', 'bossPhase1'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/a9af17d6-1d6a-46e4-916b-90492bd7b4d2.webp', 'bossPhase2'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/d0c7b32c-6d54-4092-8588-a5d09cbe60d3.webp', 'bossPhase3'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/3595b35a-b995-4194-9445-3963d9199a8d.webp', 'bossPhase4'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/bf008940-7261-4765-8c6d-32086670999c.webp', 'explosion'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/652b9540-094e-4c3a-b9b9-64f112b28744.webp', 'powerUpPlasma'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/30aacb08-5108-4c70-8580-1823f93620ed.webp', 'powerUpRapid'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/c52e69ca-3469-4246-88ce-38a9fde77993.webp', 'powerUpShield'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/f825721c-8221-4dff-919b-1365add27ab7.webp', 'powerUpSlowmo'),
      loadImage('https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/969a16ba-05c1-4406-8632-b5809c2e3b85.webp', 'shieldEffect')]
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

      // Cache assets for instant future loads
      cachedAssets = this.assets;
      console.log('💾 Assets cached for instant future loads');

      // Assign sprites to entities
      this.assignSpritesToEntities();

      // Preload audio files
      console.log('🔊 Preloading audio files...');
      this.audioManager.preloadSounds([
        // Player sounds
        'player_shoot',
        'player_hit',
        'player_death',
        'player_powerup_collect',
        // Enemy sounds
        'enemy_shoot',
        'enemy_hit',
        'enemy_death',
        'enemy_spawn',
        // Boss sounds
        'boss_spawn',
        'boss_attack_laser',
        'boss_attack_missile',
        'boss_hit',
        'boss_phase_change',
        'boss_death',
        // Powerup sounds
        'powerup_collect',
        'powerup_shield_activate',
        'powerup_rapid_fire',
        'powerup_plasma',
        'powerup_slowmo',
        // UI sounds
        'ui_button_click',
        'ui_button_hover',
        // Progression sounds
        'level_up',
        'achievement_unlock',
        'wave_complete',
        'checkpoint_reached',
        'combo_milestone',
        'game_over'
      ]);

      this.audioManager.preloadMusic([
        'menu_theme',
        'gameplay_theme',
        'boss_battle_theme',
        'victory_theme',
        'game_over_theme',
        'ambient_space'
      ]);
      console.log('✅ Audio preloading initiated');

    } catch (error) {
      console.error('❌ Failed to load assets:', error);
      // Even if assets fail, the game should still work with fallback shapes
    }
  }

  private assignSpritesToEntities(): void {
    if (!this.assets) return;

    console.log('🎨 Assigning sprites to entities...', {
      playerShipLoaded: !!this.assets.playerShip,
      playerShipSize: this.assets.playerShip ? `${this.assets.playerShip.width}x${this.assets.playerShip.height}` : 'N/A'
    });

    this.player.setImage(this.assets.playerShip);
    console.log('✅ Player ship image assigned');

    this.enemies.forEach((enemy) => {
      if (enemy.type === 'boss') enemy.setImage(this.assets!.bossAlien);
      else if (enemy.type === 'heavy') enemy.setImage(this.assets!.alienHeavy);
      else if (enemy.type === 'fast') enemy.setImage(this.assets!.alienFast);
      else enemy.setImage(this.assets!.alienBasic);
    });
    console.log('✅ All sprites assigned successfully');
  }

  initEnemies() {
    this.enemies = [];
    this.bossMinions = [];
    this.asteroids = [];
    this.asteroidWaveActive = false;
    this.asteroidWaveTimer = 0;
    this.asteroidIntroTimer = 0;
    const wave = this.stats.wave;

    // Boss wave every 5 waves
    if (wave % 5 === 0) {
      this.bossState.isBossWave = true;
      this.waveTransition = null; // Clear any lingering wave transition
      this.hintManager.onBossWave(); // Show boss hint
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

      // Play boss spawn sound and switch to boss music
      this.audioManager.playSound('boss_spawn', 0.8);
      this.audioManager.playMusic('boss_battle_theme', true);

      this.bossState.bossActive = true;
      this.bossState.bossHealth = this.boss.health;
      this.bossState.bossMaxHealth = this.boss.maxHealth;
      this.bossState.bossPhase = 'phase1';
      this.bossState.lastAttackTime = 0;
      this.bossState.attackPattern = 'spread';
      this.currentFormation = 'grid'; // Boss waves don't use formations
      return;
    }

    this.bossState.isBossWave = false;
    this.bossState.bossActive = false;
    this.boss = null;

    // Check for mid-cycle waves (3, 8, 13, 18, etc.) - ASTEROID WAVE!
    // Moved from pre-boss to mid-cycle for better balance (gives player breather, not life-depleter before boss)
    const isAsteroidWave = wave % 5 === 3;

    if (isAsteroidWave) {
      // Initialize asteroid wave
      this.waveTransition = null; // Clear any lingering wave transition
      this.initAsteroidWave(wave);
      return;
    }

    // Select formation for this wave
    this.currentFormation = selectFormation(wave);
    console.log(`🌀 FORMATION: ${this.currentFormation.toUpperCase()} (wave ${wave})`);

    // Spawn enemies based on formation
    this.spawnFormation(wave, this.currentFormation);

    // Announce non-grid formations
    if (this.currentFormation !== 'grid') {
      this.announceFormation(this.currentFormation);
    }
  }

  // Initialize asteroid wave (pre-boss)
  private initAsteroidWave(wave: number) {
    // Set intro timer for brief pause before asteroids start (1.5 seconds)
    this.asteroidIntroTimer = this.isMobile ? 60 : 90; // Shorter on mobile (1s vs 1.5s)
    this.asteroidWaveActive = true;
    this.asteroidWaveTimer = 60 * 60; // 60 seconds (1 minute) at 60fps

    // Scale asteroids VERY GENTLY by wave cycle
    // Wave 3 = cycle 1, Wave 8 = cycle 2, Wave 13 = cycle 3, etc.
    const asteroidCycle = Math.floor(wave / 5) + 1;

    // EASIER scaling: 2-4 large asteroids max, medium only in later cycles
    const largeCount = Math.min(1 + asteroidCycle, 4); // 2, 3, 4, 4 (capped at 4)
    const mediumCount = asteroidCycle >= 4 ? Math.min(asteroidCycle - 3, 2) : 0; // 0, 0, 0, 1, 2 (delayed start)

    // Very gentle speed scaling: slow and manageable
    const baseSpeed = 0.5 + (asteroidCycle - 1) * 0.1; // 0.5, 0.6, 0.7, 0.8 (very slow)

    console.log(`☄️ ASTEROID WAVE! Cycle ${asteroidCycle} - ${largeCount} large, ${mediumCount} medium asteroids (speed: ${baseSpeed.toFixed(2)})`);

    // Spawn large asteroids from edges (they won't move until intro ends)
    for (let i = 0; i < largeCount; i++) {
      const spawnEdge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let x: number, y: number;

      switch (spawnEdge) {
        case 0: // Top
          x = Math.random() * this.canvas.width;
          y = -50;
          break;
        case 1: // Right
          x = this.canvas.width + 50;
          y = Math.random() * this.canvas.height * 0.6;
          break;
        case 2: // Bottom
          x = Math.random() * this.canvas.width;
          y = this.canvas.height * 0.4;
          break;
        default: // Left
          x = -50;
          y = Math.random() * this.canvas.height * 0.6;
      }

      // Velocity toward center of screen
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 3;
      const angle = Math.atan2(centerY - y, centerX - x) + (Math.random() - 0.5) * 0.5;
      const speed = baseSpeed + Math.random() * 0.5;

      const asteroid = new Asteroid(
        x, y, 'large',
        this.canvas.width, this.canvas.height,
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
      );
      this.asteroids.push(asteroid);
    }

    // Spawn medium asteroids (for higher boss levels)
    for (let i = 0; i < mediumCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height * 0.3;
      const angle = Math.random() * Math.PI * 2;
      const speed = baseSpeed * 1.2 + Math.random() * 0.5;

      const asteroid = new Asteroid(
        x, y, 'medium',
        this.canvas.width, this.canvas.height,
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
      );
      this.asteroids.push(asteroid);
    }

    // Announce asteroid wave with notification
    this.addScreenShake(10);
    this.audioManager.playSound('boss_phase_change', 0.7);

    // Show intro notification
    this.comboNotifications.push({
      text: '☄️ ASTEROID FIELD INCOMING! ☄️',
      lifetime: 0,
      alpha: 1,
      scale: 1.3,
      x: this.canvas.width / 2,
      y: this.canvas.height / 2.5
    });

    window.dispatchEvent(new CustomEvent('special-wave', {
      detail: {
        type: 'asteroid',
        text: 'ASTEROID FIELD!',
        color: '#22d3ee'
      }
    }));
  }

  // Spawn enemies in formation
  private spawnFormation(wave: number, formation: FormationType) {
    const isLandscape = this.canvas.width > this.canvas.height;

    // Base enemy count scales with wave
    let baseCount = Math.min(15 + Math.floor(wave * 1.5), 50);

    // Harder formations spawn fewer enemies to compensate
    const formationCountModifier: Record<FormationType, number> = {
      grid: 1.0,
      v_formation: 0.9,
      spiral: 0.85,
      swarm: 0.95,
      pincer: 0.8,
      diamond: 0.75
    };
    baseCount = Math.floor(baseCount * formationCountModifier[formation]);

    // Mobile adjustments
    if (this.isMobile) {
      baseCount = Math.floor(baseCount * 0.7);
    }

    const enemyWidth = this.isMobile ? isLandscape ? 24 : 20 : 40;
    const enemyHeight = this.isMobile ? isLandscape ? 24 : 20 : 40;

    const positions = this.getFormationPositions(formation, baseCount, enemyWidth, enemyHeight);

    // Create enemies at formation positions
    for (const pos of positions) {
      const rand = Math.random();
      let type: 'basic' | 'heavy' | 'fast' = 'basic';
      if (wave > 2 && rand < 0.15) type = 'heavy';
      else if (wave > 1 && rand < 0.3) type = 'fast';

      const enemy = new Enemy(pos.x, pos.y, type, this.getEnemyDifficultyMultiplier());

      // Formation speed modifiers
      if (formation === 'swarm') {
        enemy.speedMultiplier = 1.25;
      } else if (formation === 'pincer' || formation === 'v_formation') {
        enemy.speedMultiplier = 1.1;
      }

      if (this.assets) {
        if (type === 'heavy') enemy.setImage(this.assets.alienHeavy);
        else if (type === 'fast') enemy.setImage(this.assets.alienFast);
        else enemy.setImage(this.assets.alienBasic);
      }
      this.enemies.push(enemy);
    }
  }

  // Generate positions for each formation type
  private getFormationPositions(
    formation: FormationType,
    count: number,
    enemyWidth: number,
    enemyHeight: number
  ): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const isLandscape = this.canvas.width > this.canvas.height;
    const padding = this.isMobile ? isLandscape ? 22 : 29 : 15;

    const centerX = this.canvas.width / 2;
    const startY = this.isMobile ? isLandscape ? 30 : 65 : 50;

    switch (formation) {
      case 'grid': {
        // Classic grid formation
        const cols = this.isMobile && isLandscape ? 10 : 8;
        const rows = Math.ceil(count / cols);
        const offsetX = (this.canvas.width - cols * (enemyWidth + padding)) / 2;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (positions.length >= count) break;
            positions.push({
              x: offsetX + col * (enemyWidth + padding),
              y: startY + row * (enemyHeight + padding)
            });
          }
        }
        break;
      }

      case 'v_formation': {
        // HORIZONTAL ARROW formation - spreads LEFT/RIGHT, not up/down
        // All enemies stay at roughly the same Y level (safe!)
        const colSpacing = enemyWidth + padding * 0.7;
        const rowSpacing = (enemyHeight + padding) * 0.5; // Compact rows

        // Create a horizontal arrow pointing right: >
        // Row 0:     X
        // Row 1:   X X X
        // Row 2: X X X X X  (center row - widest)
        // Row 3:   X X X
        // Row 4:     X

        const maxRowWidth = Math.min(Math.ceil(count / 3), 7); // Max enemies in center row
        const numRows = Math.min(5, Math.ceil(count / maxRowWidth)); // 3-5 rows

        let placed = 0;
        for (let row = 0; row < numRows && placed < count; row++) {
          // Arrow shape: narrow at edges, wide in middle
          const distFromCenter = Math.abs(row - Math.floor(numRows / 2));
          const rowWidth = Math.max(1, maxRowWidth - distFromCenter * 2);
          const rowStartX = centerX - (rowWidth * colSpacing) / 2;

          for (let col = 0; col < rowWidth && placed < count; col++) {
            positions.push({
              x: rowStartX + col * colSpacing,
              y: startY + row * rowSpacing
            });
            placed++;
          }
        }
        break;
      }

      case 'spiral': {
        // Spiral formation from center outward
        const spiralSpacing = Math.max(enemyWidth, enemyHeight) + padding;
        let angle = 0;
        let radius = 30;

        for (let i = 0; i < count; i++) {
          positions.push({
            x: centerX + Math.cos(angle) * radius,
            y: startY + 80 + Math.sin(angle) * radius * 0.6
          });
          angle += 0.5;
          radius += spiralSpacing / 6;
        }
        break;
      }

      case 'swarm': {
        // Dense cluster with slight randomness
        const clusterRadius = Math.min(this.canvas.width, this.canvas.height) * 0.25;
        const clusterCenterY = startY + 80;

        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
          const r = Math.random() * clusterRadius;
          positions.push({
            x: centerX + Math.cos(angle) * r,
            y: clusterCenterY + Math.sin(angle) * r * 0.6
          });
        }
        break;
      }

      case 'pincer': {
        // Two groups on left and right - more columns to stay compact vertically
        const groupSize = Math.floor(count / 2);
        const cols = 4; // More columns = fewer rows = stays higher
        const groupSpacing = (enemyHeight + padding) * 0.5; // More compact
        const sideOffset = this.canvas.width * 0.22;

        // Left group
        for (let i = 0; i < groupSize; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          positions.push({
            x: sideOffset + col * (enemyWidth + padding * 0.6),
            y: startY + row * groupSpacing
          });
        }

        // Right group
        for (let i = 0; i < count - groupSize; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          positions.push({
            x: this.canvas.width - sideOffset - cols * (enemyWidth + padding * 0.6) + col * (enemyWidth + padding * 0.6),
            y: startY + row * groupSpacing
          });
        }
        break;
      }

      case 'diamond': {
        // Diamond shape - more compact to stay higher on screen
        const diamondSize = Math.ceil(Math.sqrt(count * 2));
        const rowSpacing = (enemyHeight + padding) * 0.45; // More compact
        const colSpacing = enemyWidth + padding * 0.8;

        let index = 0;
        for (let row = 0; row < diamondSize && index < count; row++) {
          const width = row < diamondSize / 2 ? row + 1 : diamondSize - row;
          const rowOffset = (diamondSize / 2 - width / 2) * colSpacing;

          for (let col = 0; col < width && index < count; col++) {
            positions.push({
              x: centerX - (width * colSpacing) / 2 + col * colSpacing + rowOffset,
              y: startY + row * rowSpacing
            });
            index++;
          }
        }
        break;
      }
    }

    return positions;
  }

  // Announce formation with visual effect
  private announceFormation(formation: FormationType) {
    const announcements: Record<FormationType, { text: string; color: string }> = {
      grid: { text: 'GRID FORMATION', color: '#22d3ee' },
      v_formation: { text: 'ARROW FORMATION!', color: '#f97316' },
      spiral: { text: 'SPIRAL ASSAULT!', color: '#a855f7' },
      swarm: { text: 'SWARM INCOMING!', color: '#22d3ee' },
      pincer: { text: 'PINCER MANEUVER!', color: '#ef4444' },
      diamond: { text: 'DIAMOND DEFENSE!', color: '#fbbf24' }
    };

    const announcement = announcements[formation];

    this.addScreenShake(6);
    this.audioManager.playSound('boss_phase_change', 0.5);

    window.dispatchEvent(new CustomEvent('special-wave', {
      detail: { type: formation, text: announcement.text, color: announcement.color }
    }));
  }

  // Announce special wave with visual effect
  private announceSpecialWave(waveType: 'swarm' | 'elite' | 'blitz') {
    const announcements = {
      swarm: { text: 'SWARM INCOMING!', color: '#22d3ee' },
      elite: { text: 'ELITE SQUAD!', color: '#a855f7' },
      blitz: { text: 'BLITZ ATTACK!', color: '#f97316' }
    };

    const announcement = announcements[waveType];

    // Add screen shake for impact
    this.addScreenShake(8);

    // Play a sound
    this.audioManager.playSound('boss_phase_change', 0.6);

    // Dispatch event for UI to show announcement
    window.dispatchEvent(new CustomEvent('special-wave', {
      detail: { type: waveType, text: announcement.text, color: announcement.color }
    }));
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
      if (e.key === 'r' || e.key === 'R') {
        // Restart from wave 1
        console.log('🎮 CHEAT: Restarting from Wave 1!');
        this.resetFromWave1();
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

      // Dynamic auto-fire that adjusts based on rapid fire powerup
      const autoFire = () => {
        if (this.state === 'playing') {
          this.fire();
        }
        // Adjust interval based on rapid fire status
        const interval = this.player.rapidActive ? 200 : 400;
        this.autoFireInterval = window.setTimeout(autoFire, interval);
      };
      this.autoFireInterval = window.setTimeout(autoFire, 400);
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

    // ASTEROID MODE: Zone-based controls
    if (this.asteroidWaveActive && this.player.asteroidModeActive) {
      // Left 1/3 = rotate left, Right 1/3 = rotate right, Middle 1/3 = thrust
      this.touchX = touchX;
      // Store touch zone for continuous input handling
      return;
    }

    // Normal mode: Set player position directly
    this.touchX = touchX;
    this.player.setPosition(this.touchX);
  }

  handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;

    // ASTEROID MODE: Zone-based controls
    if (this.asteroidWaveActive && this.player.asteroidModeActive) {
      this.touchX = touchX;
      return;
    }

    // Normal mode: Set player position directly
    this.touchX = touchX;
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

    // Asteroid mode: Classic Asteroids-style rotation controls
    if (this.asteroidWaveActive && this.player.asteroidModeActive) {
      // Keyboard controls
      if (this.keys.has('ArrowLeft')) {
        this.player.rotateLeft();
      }
      if (this.keys.has('ArrowRight')) {
        this.player.rotateRight();
      }
      if (this.keys.has('ArrowUp')) {
        this.player.thrust();
      }
      if (this.keys.has('ArrowDown')) {
        this.player.brake();
      }

      // Mobile touch controls: Zone-based
      if (this.isMobile && this.touchX !== null) {
        const leftZone = this.canvas.width / 3;
        const rightZone = this.canvas.width * 2 / 3;

        if (this.touchX < leftZone) {
          // Left 1/3: Rotate left
          this.player.rotateLeft();
        } else if (this.touchX > rightZone) {
          // Right 1/3: Rotate right
          this.player.rotateRight();
        } else {
          // Middle 1/3: Thrust forward
          this.player.thrust();
        }

        // Auto-fire while touching during asteroid mode
        this.fire();
      }
    } else {
      // Normal mode: Left/right horizontal movement
      if (this.keys.has('ArrowLeft')) {
        this.player.moveLeft();
      } else if (this.keys.has('ArrowRight')) {
        this.player.moveRight();
      } else {
        this.player.stop();
      }
    }

    if (this.keys.has(' ') && !this.isMobile) {
      this.fire();
    }
  }

  fire() {
    const now = Date.now();

    // Get active superpower
    const superpower = this.cosmeticManager.getActiveSuperpower();

    // Apply fire rate boost if applicable
    let fireRate = this.player.rapidActive ? this.fireDelay / 2 : this.fireDelay;
    if (superpower.type === 'fire_rate_boost' && superpower.value) {
      fireRate = fireRate * (1 - superpower.value / 100);
    }
    // Apply module fire rate boost
    const moduleFireRateBoost = this.moduleManager.getEffectValue('fire_rate_boost');
    if (moduleFireRateBoost > 0) {
      fireRate = fireRate * (1 - moduleFireRateBoost / 100);
    }

    if (now - this.lastFireTime < fireRate) return;

    this.lastFireTime = now;

    // Play player shoot sound
    this.audioManager.playSound('player_shoot', 0.3);

    // Determine shot pattern based on superpowers and powerups
    const plasmaActive = this.player.plasmaActive;
    const isTripleShot = superpower.type === 'triple_shot';
    const isDualGuns = superpower.type === 'dual_guns';
    const isPiercing = superpower.type === 'piercing_shots';
    const isExplosive = superpower.type === 'explosive_rounds';
    const isGravity = superpower.type === 'gravity_bullets';

    // Triple Shot superpower (Rainbow Streak) - Always fires 3 bullets
    if (isTripleShot) {
      [-15, 0, 15].forEach((offset) => {
        const projectile = new Projectile(
          this.player.position.x + this.player.size.width / 2 - 2 + offset,
          this.player.position.y,
          true,
          this.config.projectileSpeed
        );
        projectile.color = this.cosmeticManager.getBulletColor();
        if (isPiercing || this.player.piercingActive) projectile.piercing = true;
        if (isExplosive) projectile.explosive = true;
        if (isGravity) projectile.gravity = true;
        this.projectiles.push(projectile);
      });
    }
    // Dual Guns superpower (Gold Elite) - Fires 2-3 bullets depending on powerups
    else if (isDualGuns) {
      // Base dual guns pattern
      let offsets = [-8, 8];

      // Plasma powerup: 3 bullets with symmetric spread
      if (plasmaActive) {
        offsets = [-10, 0, 10]; // Centered symmetric spread (3 bullets)
      }
      // Rapid Fire: 3 bullets in tight pattern
      else if (this.player.rapidActive) {
        offsets = [-8, 0, 8]; // Center + sides (3 bullets)
      }

      offsets.forEach((offset) => {
        const projectile = new Projectile(
          this.player.position.x + this.player.size.width / 2 - 2 + offset,
          this.player.position.y,
          true,
          this.config.projectileSpeed
        );
        projectile.color = this.cosmeticManager.getBulletColor();
        if (isPiercing || this.player.piercingActive) projectile.piercing = true;
        if (isExplosive) projectile.explosive = true;
        if (isGravity) projectile.gravity = true;
        this.projectiles.push(projectile);
      });
    }
    // Plasma powerup - spread shot (overrides single shot)
    else if (plasmaActive) {
      [-15, 0, 15].forEach((offset) => {
        const projectile = new Projectile(
          this.player.position.x + this.player.size.width / 2 - 2 + offset,
          this.player.position.y,
          true,
          this.config.projectileSpeed
        );
        projectile.color = this.cosmeticManager.getBulletColor();
        if (isPiercing || this.player.piercingActive) projectile.piercing = true;
        if (isExplosive) projectile.explosive = true;
        if (isGravity) projectile.gravity = true;
        this.projectiles.push(projectile);
      });
    }
    // Standard single shot
    else {
      const projectile = new Projectile(
        this.player.position.x + this.player.size.width / 2 - 2,
        this.player.position.y,
        true,
        this.config.projectileSpeed
      );
      projectile.color = this.cosmeticManager.getBulletColor();
      if (isPiercing || this.player.piercingActive) projectile.piercing = true;
      if (isExplosive) projectile.explosive = true;
      if (isGravity) projectile.gravity = true;
      this.projectiles.push(projectile);
    }

    // Homing Missiles - assign target to newly created projectiles
    if (this.player.homingActive) {
      // Find nearest enemy (includes regular enemies and boss minions)
      let nearestEnemy: Enemy | null = null;
      let minDist = Infinity;
      for (const enemy of this.enemies) {
        if (!enemy.isAlive) continue;
        const dist = Math.hypot(
          enemy.position.x - this.player.position.x,
          enemy.position.y - this.player.position.y
        );
        if (dist < minDist) {
          minDist = dist;
          nearestEnemy = enemy;
        }
      }

      // If no enemies exist but boss is alive, target the boss (fallback)
      if (!nearestEnemy && this.boss && this.boss.isAlive) {
        // Boss targeting uses weaker homing strength (handled in Projectile.update)
        nearestEnemy = this.boss as any; // Cast boss as target
      }

      // Determine bullet count based on fire pattern
      let bulletCount = 1; // Default single shot
      if (isTripleShot) bulletCount = 3;
      else if (isDualGuns) {
        if (plasmaActive) bulletCount = 3; // Updated: 3 bullets for dual guns plasma
        else if (this.player.rapidActive) bulletCount = 3;
        else bulletCount = 2;
      } else if (plasmaActive) bulletCount = 3;

      // Assign homing to all newly fired projectiles
      const newProjectiles = this.projectiles.slice(-bulletCount);

      newProjectiles.forEach(projectile => {
        projectile.homing = true;
        projectile.target = nearestEnemy;
      });
    }

    // ASTEROID MODE: Adjust projectile velocities to fire in ship's facing direction
    if (this.asteroidWaveActive && this.player.asteroidModeActive) {
      // Determine how many bullets were just fired
      let bulletCount = 1;
      if (isTripleShot) bulletCount = 3;
      else if (isDualGuns) {
        if (plasmaActive) bulletCount = 3;
        else if (this.player.rapidActive) bulletCount = 3;
        else bulletCount = 2;
      } else if (plasmaActive) bulletCount = 3;

      const newProjectiles = this.projectiles.slice(-bulletCount);
      const direction = this.player.getFiringDirection();
      const speed = this.config.projectileSpeed;

      newProjectiles.forEach((projectile, index) => {
        // Set velocity based on ship's rotation
        projectile.velocity.x = direction.x * speed;
        projectile.velocity.y = direction.y * speed;

        // Adjust spawn position to be at the nose of the rotated ship
        const noseOffset = 25; // Distance from center to nose
        projectile.position.x = this.player.position.x + this.player.size.width / 2 +
          direction.x * noseOffset;
        projectile.position.y = this.player.position.y + this.player.size.height / 2 +
          direction.y * noseOffset;

        // For spread shots, add slight angle variation
        if (bulletCount > 1) {
          const spreadAngle = (index - (bulletCount - 1) / 2) * 0.1; // ~6 degrees spread per bullet
          const cos = Math.cos(spreadAngle);
          const sin = Math.sin(spreadAngle);
          const newVx = projectile.velocity.x * cos - projectile.velocity.y * sin;
          const newVy = projectile.velocity.x * sin + projectile.velocity.y * cos;
          projectile.velocity.x = newVx;
          projectile.velocity.y = newVy;
        }
      });
    }
  }

  enemyFire() {
    // Don't fire when frozen
    if (this.player.freezeActive) return;

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

    // Play enemy shoot sound
    this.audioManager.playSound('enemy_shoot', 0.2);

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
    // Faster spawn rate during boss fights (7s vs 12s)
    const isBossFight = this.boss && this.boss.isAlive;
    const spawnRate = isBossFight ? 7000 : this.powerUpSpawnRate;
    if (now - this.lastPowerUpSpawn < spawnRate) return;
    // Higher spawn chance during boss fights (65% vs 55%)
    const spawnChance = isBossFight ? 0.35 : 0.45; // 0.35 = 65% chance, 0.45 = 55% chance
    if (Math.random() < spawnChance) return;

    this.lastPowerUpSpawn = now;

    // Rarity-based weighted spawn system with 12 powerup types
    const rand = Math.random();
    let type: PowerUpType;

    // Common (60% total) - Basic powerups
    if (rand < 0.25) {
      type = 'rapid';      // 25% - Most common
    } else if (rand < 0.45) {
      type = 'plasma';     // 20%
    } else if (rand < 0.60) {
      type = 'shield';     // 15%
    }
    // Uncommon (18% total) - Utility and tactical
    else if (rand < 0.68) {
      type = 'slowmo';     // 8%
    } else if (rand < 0.78) {
      type = 'homing';     // 10%
    }
    // Rare (19% total) - Powerful effects
    else if (rand < 0.84) {
      type = 'freeze';     // 6%
    } else if (rand < 0.90) {
      type = 'multiplier'; // 6%
    } else if (rand < 0.94) {
      type = 'laser';      // 4%
    } else if (rand < 0.97) {
      type = 'piercing';   // 3%
    }
    // Legendary (3% total) - Game-changing
    else if (rand < 0.985) {
      type = 'invincibility'; // 1.5%
    } else if (rand < 0.995) {
      type = 'nuke';       // 1%
    } else {
      type = 'extralife';  // 0.5% - Ultra rare
    }

    const x = Math.random() * (this.canvas.width - 40) + 20;

    const powerUp = new PowerUpEntity(x, -40, type);
    // Only set images for original powerups (new ones will use colored fallback)
    if (this.assets) {
      const imageMap: Partial<Record<PowerUpType, HTMLImageElement>> = {
        plasma: this.assets.powerUpPlasma,
        rapid: this.assets.powerUpRapid,
        shield: this.assets.powerUpShield,
        slowmo: this.assets.powerUpSlowmo
      };
      if (imageMap[type]) {
        powerUp.setImage(imageMap[type]!);
      }
      // New powerups will render with their assigned colors
    }
    this.powerUps.push(powerUp);
  }

  // Spawn power-up at specific position (used for boss phase drops)
  spawnPowerUpAtPosition(x: number, y: number, defensiveWeighted: boolean = false) {
    const rand = Math.random();
    let type: PowerUpType;

    if (defensiveWeighted) {
      // Weighted toward defensive power-ups for boss phase drops
      if (rand < 0.40) {
        type = 'shield';     // 40% - Most helpful during boss
      } else if (rand < 0.65) {
        type = 'rapid';      // 25%
      } else if (rand < 0.85) {
        type = 'plasma';     // 20%
      } else if (rand < 0.92) {
        type = 'slowmo';     // 7%
      } else if (rand < 0.97) {
        type = 'invincibility'; // 5%
      } else {
        type = 'extralife';  // 3%
      }
    } else {
      // Standard distribution
      type = 'shield';
    }

    const powerUp = new PowerUpEntity(x, y, type);
    if (this.assets) {
      const imageMap: Partial<Record<PowerUpType, HTMLImageElement>> = {
        plasma: this.assets.powerUpPlasma,
        rapid: this.assets.powerUpRapid,
        shield: this.assets.powerUpShield,
        slowmo: this.assets.powerUpSlowmo
      };
      if (imageMap[type]) {
        powerUp.setImage(imageMap[type]!);
      }
    }
    this.powerUps.push(powerUp);

    // Visual effect for loot drop
    this.createPowerUpDropParticles(x, y);
  }

  // Create particle effect for power-up drops
  createPowerUpDropParticles(x: number, y: number) {
    const colors = ['#22d3ee', '#a855f7', '#fbbf24', '#34d399'];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 3
      });
    }
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

    this.boss.update(this.canvas.width, this.player.freezeActive, deltaTime);
    this.bossState.bossHealth = this.boss.health;

    // Update boss image when phase changes
    const previousPhase = this.bossState.bossPhase;
    this.bossState.bossPhase = this.boss.phase;

    if (previousPhase !== this.boss.phase && this.assets) {
      // Play boss phase change sound
      this.audioManager.playSound('boss_phase_change', 0.8);

      // 1E: Boss phase transition radial explosion particles
      this.spawnBossPhaseParticles(
        this.boss.position.x + this.boss.size.width / 2,
        this.boss.position.y + this.boss.size.height / 2
      );
      this.addScreenShake(12);
      this.triggerChromaticAberration(0.5);

      // === JUICE: Dramatic time dilation on boss phase transition ===
      this.triggerHitStop(4, true); // Brief freeze for impact
      this.triggerCameraZoom(1.06); // Zoom in for dramatic effect
      this.triggerTimeDilation(0.3, 30); // 0.3x slow-mo for ~0.5 seconds

      // Switch boss appearance based on current phase
      const bossImageMap = {
        phase1: this.assets.bossPhase1,
        phase2: this.assets.bossPhase2,
        phase3: this.assets.bossPhase3,
        phase4: this.assets.bossPhase4
      };
      this.boss.setImage(bossImageMap[this.boss.phase]);

      // Drop guaranteed power-ups on phase change (1-2 based on phase)
      // Adaptive difficulty: extra power-ups after 3+ consecutive boss deaths
      const bossX = this.boss.position.x + this.boss.size.width / 2;
      const bossY = this.boss.position.y + this.boss.size.height;
      const adaptive = this.getAdaptiveDifficultyModifiers();
      const baseDropCount = this.boss.phase === 'phase4' ? 2 : 1;
      const dropCount = baseDropCount + adaptive.extraPowerUps;

      for (let i = 0; i < dropCount; i++) {
        // Offset multiple drops so they don't overlap
        const offsetX = (i - (dropCount - 1) / 2) * 40;
        this.spawnPowerUpAtPosition(bossX + offsetX, bossY, true);
      }

      // Visual feedback for phase transition loot
      console.log(`🎁 Boss phase change: Dropped ${dropCount} power-up(s)!${adaptive.extraPowerUps > 0 ? ' (adaptive bonus!)' : ''}`);
    }

    // Boss attacks (scales with both phase AND wave) - but not when frozen
    if (!this.player.freezeActive) {
      const now = Date.now();

      // Base attack delay by phase
      const baseDelay = this.boss.phase === 'phase4' ? 1200 :
      this.boss.phase === 'phase3' ? 1800 :
      this.boss.phase === 'phase2' ? 2400 : 3000;

      // Wave-based scaling: Each boss wave increases attack speed progressively
      // Boss 1: 100% | Boss 2: 85% | Boss 3: 72% | Boss 4: 61% | Boss 5: 52%
      const bossNumber = this.stats.wave / 5; // 1, 2, 3, 4...
      const waveMultiplier = Math.max(0.5, 1 - (bossNumber - 1) * 0.15); // -15% per boss
      // Mobile-friendly: 20% longer attack delay on mobile (more time to react)
      const mobileDelayMultiplier = this.isMobile ? 1.2 : 1.0;
      // Adaptive difficulty: increase delay after consecutive boss deaths
      const adaptive = this.getAdaptiveDifficultyModifiers();
      const attackDelay = baseDelay * waveMultiplier * mobileDelayMultiplier * adaptive.delayMultiplier;

      if (now - this.bossState.lastAttackTime > attackDelay) {
        this.bossState.lastAttackTime = now;
        this.executeBossAttack();
      }
    }

    // Update minions with kamikaze dive behavior - stay above player to be shootable
    this.bossMinions = this.bossMinions.filter((m) => m.isAlive);
    this.bossMinions.forEach((minion) => {
      const playerCenterX = this.player.position.x + this.player.size.width / 2;
      const playerTopY = this.player.position.y; // Target above player, not center
      const minionCenterX = minion.position.x + minion.size.width / 2;
      const minionCenterY = minion.position.y + minion.size.height / 2;

      // Horizontal distance to player
      const dx = playerCenterX - minionCenterX;
      const horizontalDist = Math.abs(dx);

      // Distance above player (positive = minion is above player)
      const distAbovePlayer = playerTopY - minionCenterY;

      // Dive threshold - stay this far above player until aligned
      const hoverHeight = 100; // Stay 100px above player while tracking
      const alignThreshold = 40; // Horizontal alignment needed to dive

      const diveSpeed = 3.5 * deltaTime;

      // Check minion behavior type (stored in custom property or default to 'dive')
      const behaviorType = (minion as Enemy & { behaviorType?: string }).behaviorType || 'dive';

      if (behaviorType === 'dive') {
        // Standard dive behavior: track horizontally while staying above, then dive when aligned
        if (distAbovePlayer > hoverHeight) {
          // Still above hover zone - move toward player position (both X and Y)
          const targetY = playerTopY - hoverHeight;
          const dy = targetY - minionCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 0) {
            minion.position.x += (dx / distance) * diveSpeed;
            minion.position.y += (dy / distance) * diveSpeed;
          }
        } else if (horizontalDist > alignThreshold) {
          // In hover zone but not aligned - track horizontally only, maintain height
          const moveX = dx > 0 ? Math.min(diveSpeed, dx) : Math.max(-diveSpeed, dx);
          minion.position.x += moveX;
          // Slight downward drift to create pressure
          minion.position.y += diveSpeed * 0.3;
        } else {
          // Aligned and in position - DIVE STRAIGHT DOWN!
          minion.position.y += diveSpeed * 1.5; // Faster dive for intensity
          // Slight tracking to stay on target
          minion.position.x += dx * 0.05;
        }
      } else if (behaviorType === 'sweep') {
        // Sweep behavior: move in a horizontal pattern while descending
        const sweepDir = (minion as Enemy & { sweepDir?: number }).sweepDir || 1;
        minion.position.x += diveSpeed * 1.2 * sweepDir;
        minion.position.y += diveSpeed * 0.6;
        // Reverse at screen edges
        if (minion.position.x < 20 || minion.position.x > this.canvas.width - 20 - minion.size.width) {
          (minion as Enemy & { sweepDir?: number }).sweepDir = -sweepDir;
        }
      } else if (behaviorType === 'zigzag') {
        // Zigzag behavior: erratic movement pattern
        const zigTimer = ((minion as Enemy & { zigTimer?: number }).zigTimer || 0) + deltaTime;
        (minion as Enemy & { zigTimer?: number }).zigTimer = zigTimer;
        const zigPhase = Math.sin(zigTimer * 0.15) * diveSpeed * 1.5;
        minion.position.x += zigPhase;
        minion.position.y += diveSpeed * 0.8;
      }

      // Remove minion if it goes off screen (missed the player)
      if (minion.position.y > this.canvas.height + 50) {
        minion.isAlive = false;
      }
    });

    // Teleport cooldown
    if (this.bossState.teleportCooldown > 0) {
      this.bossState.teleportCooldown -= deltaTime;
    }

    // Update charge attack state
    if (this.bossState.chargeActive || this.bossState.chargeTelegraphTimer > 0) {
      this.updateBossCharge(deltaTime);
    }

    // Update bomb danger zones
    if (this.bossState.bombsActive.length > 0) {
      this.updateBossBombs(deltaTime);
    }
  }

  executeBossAttack() {
    if (!this.boss) return;

    // Don't start new attacks while charge is active
    if (this.bossState.chargeActive || this.bossState.chargeTelegraphTimer > 0) return;

    // Weighted attack selection based on phase
    // Phase 1: Spread (70%), Laser (30%)
    // Phase 2: Spread (40%), Laser (25%), Charge (20%), Minions (15%)
    // Phase 3: Spread (30%), Laser (20%), Charge (15%), Minions (15%), Bombs (20%)
    // Phase 4: Spread (25%), Laser (15%), Charge (15%), Minions (20%), Bombs (25%)

    type AttackType = 'spread' | 'laser' | 'teleport' | 'minions' | 'charge' | 'bombs';
    let weights: { attack: AttackType; weight: number }[] = [];

    switch (this.boss.phase) {
      case 'phase1':
        weights = [
          { attack: 'spread', weight: 70 },
          { attack: 'laser', weight: 30 }
        ];
        break;
      case 'phase2':
        weights = [
          { attack: 'spread', weight: 40 },
          { attack: 'laser', weight: 25 },
          { attack: 'charge', weight: 20 },
          { attack: 'minions', weight: this.bossMinions.length < 4 ? 15 : 0 }
        ];
        break;
      case 'phase3':
        weights = [
          { attack: 'spread', weight: 30 },
          { attack: 'laser', weight: 20 },
          { attack: 'charge', weight: 15 },
          { attack: 'minions', weight: this.bossMinions.length < 4 ? 15 : 0 },
          { attack: 'bombs', weight: 20 }
        ];
        // Add teleport if off cooldown
        if (this.bossState.teleportCooldown === 0) {
          weights.push({ attack: 'teleport', weight: 10 });
        }
        break;
      case 'phase4':
        weights = [
          { attack: 'spread', weight: 25 },
          { attack: 'laser', weight: 15 },
          { attack: 'charge', weight: 15 },
          { attack: 'minions', weight: this.bossMinions.length < 4 ? 20 : 0 },
          { attack: 'bombs', weight: 25 }
        ];
        // Add teleport if off cooldown
        if (this.bossState.teleportCooldown === 0) {
          weights.push({ attack: 'teleport', weight: 15 });
        }
        break;
    }

    // Calculate total weight and select attack
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    let pattern: AttackType = 'spread';

    for (const w of weights) {
      random -= w.weight;
      if (random <= 0) {
        pattern = w.attack;
        break;
      }
    }

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
      case 'minions':
        this.bossSummonMinions();
        break;
      case 'charge':
        this.bossChargeAttack();
        break;
      case 'bombs':
        this.bossBombDrop();
        break;
    }
  }

  bossSpreadShot() {
    if (!this.boss) return;

    // Play boss missile attack sound
    this.audioManager.playSound('boss_attack_missile', 0.5);

    // Mobile-friendly: fewer projectiles on mobile (2/4/6 vs 3/5/7)
    const mobileReduction = this.isMobile ? 1 : 0;
    const angles = (this.boss.phase === 'phase4' ? 7 :
                   this.boss.phase === 'phase3' ? 5 : 3) - mobileReduction;
    const spread = Math.PI / 3;
    const startAngle = Math.PI / 2 - spread / 2;

    // Wave-based speed scaling: +0.8 speed per boss wave for noticeable progression
    const baseSpeed = 6;
    const bossNumber = this.stats.wave / 5; // 1, 2, 3, 4...
    const waveBonus = (bossNumber - 1) * 0.8; // Boss 1: +0 | Boss 2: +0.8 | Boss 3: +1.6
    // Mobile-friendly: 20% slower projectiles on mobile
    const mobileSpeedMultiplier = this.isMobile ? 0.8 : 1.0;
    // Adaptive difficulty: reduce speed after consecutive boss deaths
    const adaptive = this.getAdaptiveDifficultyModifiers();
    const speed = (baseSpeed + waveBonus) * mobileSpeedMultiplier * adaptive.speedMultiplier;

    for (let i = 0; i < angles; i++) {
      const angle = startAngle + spread * i / (Math.max(1, angles - 1));
      const projectile = new Projectile(
        this.boss.position.x + this.boss.size.width / 2,
        this.boss.position.y + this.boss.size.height,
        false,
        speed,
        1 // 1 damage (reduced from 2 for better balance)
      );
      projectile.velocity.x = Math.cos(angle) * speed;
      projectile.velocity.y = Math.sin(angle) * speed;
      projectile.color = '#ff6600'; // Orange color for spread shot
      this.projectiles.push(projectile);
    }
  }

  bossLaserBeam() {
    if (!this.boss) return;

    // Play boss laser attack sound
    this.audioManager.playSound('boss_attack_laser', 0.6);

    // Base laser speed by phase
    const baseSpeed = this.boss.phase === 'phase4' ? 10 :
    this.boss.phase === 'phase3' ? 8 :
    this.boss.phase === 'phase2' ? 7 : 5;

    // Wave-based speed scaling: +0.8 speed per boss wave for consistent progression
    const bossNumber = this.stats.wave / 5; // 1, 2, 3, 4...
    const waveBonus = (bossNumber - 1) * 0.8; // Boss 1: +0 | Boss 2: +0.8 | Boss 3: +1.6
    // Mobile-friendly: 20% slower projectiles on mobile
    const mobileSpeedMultiplier = this.isMobile ? 0.8 : 1.0;
    // Adaptive difficulty: reduce speed after consecutive boss deaths
    const adaptive = this.getAdaptiveDifficultyModifiers();
    const laserSpeed = (baseSpeed + waveBonus) * mobileSpeedMultiplier * adaptive.speedMultiplier;

    // Create vertical laser beam (2 damage - reduced from 3 for better balance)
    // Fewer, more spaced out projectiles to avoid multi-hits
    for (let i = 0; i < 8; i++) {
      const projectile = new Projectile(
        this.boss.position.x + this.boss.size.width / 2 - 5 + (Math.random() - 0.5) * 10,
        this.boss.position.y + this.boss.size.height + i * 15,
        false,
        laserSpeed,
        2 // 2 damage (reduced from 3 for better balance)
      );
      projectile.size.width = 6;
      projectile.size.height = 18;
      projectile.color = '#ff0000'; // Red color for laser damage
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
    if (this.bossMinions.length >= 6) return; // Max 6 minions at once

    // Spawn count based on phase: Phase 2: 2, Phase 3: 3, Phase 4: 4
    const count = this.boss.phase === 'phase4' ? 4 :
                  this.boss.phase === 'phase3' ? 3 : 2;

    // Choose formation type based on phase and randomness
    type FormationType = 'arc' | 'vformation' | 'line' | 'flanking';
    const formations: FormationType[] = ['arc', 'vformation', 'line', 'flanking'];
    const formationIndex = this.boss.phase === 'phase2' ? 0 : Math.floor(Math.random() * formations.length);
    const formation = formations[formationIndex];

    // Choose behavior mix - later phases get more variety
    type BehaviorType = 'dive' | 'sweep' | 'zigzag';
    const behaviors: BehaviorType[] = this.boss.phase === 'phase2' ? ['dive'] :
                     this.boss.phase === 'phase3' ? ['dive', 'dive', 'sweep'] :
                     ['dive', 'sweep', 'zigzag', 'dive'];

    // Play summon sound
    this.audioManager.playSound('powerup_invincibility', 0.4);

    // Calculate spawn positions based on formation
    const bossX = this.boss.position.x + this.boss.size.width / 2;
    const bossY = this.boss.position.y + this.boss.size.height;
    const spawnPositions: { x: number; y: number; sweepDir?: number }[] = [];

    if (formation === 'arc') {
      // Original arc formation from boss
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 0.8 + Math.PI * 0.1;
        const spawnRadius = 80;
        spawnPositions.push({
          x: bossX + Math.cos(angle) * spawnRadius,
          y: bossY + Math.sin(angle) * spawnRadius * 0.5
        });
      }
    } else if (formation === 'vformation') {
      // V-formation descending from top
      const vSpread = 60;
      const startX = this.canvas.width / 2;
      const startY = 50;
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / 2);
        const side = i % 2 === 0 ? -1 : 1;
        spawnPositions.push({
          x: startX + side * (row + 1) * vSpread,
          y: startY + row * 40
        });
      }
    } else if (formation === 'line') {
      // Horizontal line from one side, sweeping across
      const startY = 80;
      const startX = Math.random() > 0.5 ? -30 : this.canvas.width + 30;
      const sweepDir = startX < 0 ? 1 : -1;
      for (let i = 0; i < count; i++) {
        spawnPositions.push({
          x: startX,
          y: startY + i * 35,
          sweepDir
        });
      }
    } else if (formation === 'flanking') {
      // Two groups from left and right sides
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? 0 : 1;
        const yOffset = Math.floor(i / 2) * 40;
        spawnPositions.push({
          x: side === 0 ? 30 : this.canvas.width - 60,
          y: 100 + yOffset,
          sweepDir: side === 0 ? 1 : -1
        });
      }
    }

    // Spawn minions at calculated positions
    for (let i = 0; i < spawnPositions.length; i++) {
      const pos = spawnPositions[i];
      const behavior = behaviors[i % behaviors.length];

      // Create kamikaze minion (1 HP, deals 1 damage on contact)
      const minion = new Enemy(pos.x, pos.y, 'fast', this.getEnemyDifficultyMultiplier()) as Enemy & {
        behaviorType?: string;
        sweepDir?: number;
        zigTimer?: number;
      };
      minion.health = 1; // 1 HP - can be shot easily
      minion.behaviorType = behavior;
      if (pos.sweepDir) minion.sweepDir = pos.sweepDir;
      if (behavior === 'zigzag') minion.zigTimer = Math.random() * 60; // Random phase offset

      if (this.assets) minion.setImage(this.assets.alienFast);
      this.bossMinions.push(minion);

      // Spawn warning particles - color coded by behavior
      const particleColor = behavior === 'dive' ? '#ffaa00' :
                           behavior === 'sweep' ? '#00ffaa' : '#ff66ff';
      for (let p = 0; p < 8; p++) {
        const particleAngle = (p / 8) * Math.PI * 2;
        this.particles.push({
          x: pos.x,
          y: pos.y,
          vx: Math.cos(particleAngle) * 3,
          vy: Math.sin(particleAngle) * 3,
          life: 25,
          color: particleColor,
          size: 4
        });
      }
    }

    // Add formation announcement for added drama
    const formationNames: Record<FormationType, string> = {
      arc: 'MINIONS INCOMING!',
      vformation: 'V-FORMATION!',
      line: 'SWEEP ATTACK!',
      flanking: 'FLANKING MANEUVER!'
    };
    if (formation !== 'arc') {
      window.dispatchEvent(new CustomEvent('minion-formation', {
        detail: { formation, text: formationNames[formation] }
      }));
    }
  }

  // Charge attack - boss rushes horizontally across screen
  bossChargeAttack() {
    if (!this.boss) return;

    // Start telegraph phase (60 frames = 1 second)
    this.bossState.chargeTelegraphTimer = 60;
    this.bossState.chargeActive = false;
    this.bossState.chargeStartX = this.boss.position.x;

    // Determine charge direction based on player position
    const playerCenterX = this.player.position.x + this.player.size.width / 2;
    const bossCenterX = this.boss.position.x + this.boss.size.width / 2;
    this.bossState.chargeDirection = playerCenterX > bossCenterX ? 1 : -1;

    // Play warning sound
    this.audioManager.playSound('boss_phase_change', 0.7);

    // Screen shake to telegraph danger
    this.addScreenShake(5);
  }

  // Update charge attack state (called from updateBoss)
  updateBossCharge(deltaTime: number) {
    if (!this.boss) return;

    // Telegraph phase - boss glows red and prepares
    if (this.bossState.chargeTelegraphTimer > 0) {
      this.bossState.chargeTelegraphTimer -= deltaTime;

      // Create warning particles during telegraph
      if (Math.random() < 0.3) {
        this.particles.push({
          x: this.boss.position.x + Math.random() * this.boss.size.width,
          y: this.boss.position.y + Math.random() * this.boss.size.height,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random(),
          life: 20,
          color: '#ff3333',
          size: 4 + Math.random() * 3
        });
      }

      // Start charge when telegraph ends
      if (this.bossState.chargeTelegraphTimer <= 0) {
        this.bossState.chargeActive = true;
        this.audioManager.playSound('boss_attack_laser', 0.8);
      }
      return;
    }

    // Active charge phase
    if (this.bossState.chargeActive) {
      const chargeSpeed = 15 * deltaTime;
      this.boss.position.x += chargeSpeed * this.bossState.chargeDirection;

      // Create trail particles
      this.particles.push({
        x: this.boss.position.x + (this.bossState.chargeDirection > 0 ? 0 : this.boss.size.width),
        y: this.boss.position.y + this.boss.size.height / 2,
        vx: -this.bossState.chargeDirection * 3,
        vy: (Math.random() - 0.5) * 2,
        life: 15,
        color: '#ff6600',
        size: 5
      });

      // Check collision with player during charge (2 damage)
      if (!this.player.shieldActive && !this.player.invulnerable && !this.player.invincibilityActive) {
        if (this.checkCollision(this.boss.getBounds(), this.player.getBounds())) {
          this.audioManager.playSound('player_hit', 0.7);
          this.hapticManager.onPlayerHit();
          this.stats.lives -= 2;
          this.tookDamageThisWave = true;
          this.player.invulnerable = true;
          this.player.invulnerabilityTimer = 120;
          this.addScreenShake(15);
          this.hitFlashAlpha = 0.4;

          if (this.stats.lives <= 0) {
            this.gameOver();
          }
        }
      }

      // End charge when boss reaches edge of screen
      if (this.boss.position.x <= -this.boss.size.width / 2 ||
          this.boss.position.x >= this.canvas.width - this.boss.size.width / 2) {
        this.bossState.chargeActive = false;

        // Return boss to center area
        this.boss.position.x = this.canvas.width / 2 - this.boss.size.width / 2;
        this.boss.position.y = 80;

        // Arrival effect
        this.spawnDebrisParticles(
          this.boss.position.x + this.boss.size.width / 2,
          this.boss.position.y + this.boss.size.height / 2,
          '#ff6600'
        );
      }
    }
  }

  // Bomb drop attack - boss drops bombs that create danger zones
  bossBombDrop() {
    if (!this.boss) return;

    // Drop 2-4 bombs based on phase
    const bombCount = this.boss.phase === 'phase4' ? 4 :
                      this.boss.phase === 'phase3' ? 3 : 2;

    // Play bomb drop sound
    this.audioManager.playSound('boss_attack_missile', 0.6);

    for (let i = 0; i < bombCount; i++) {
      // Spread bombs across boss width
      const spreadX = (i / (bombCount - 1 || 1) - 0.5) * this.boss.size.width * 0.8;
      const bombX = this.boss.position.x + this.boss.size.width / 2 + spreadX;
      const bombY = this.boss.position.y + this.boss.size.height;

      this.bossState.bombsActive.push({
        x: bombX,
        y: bombY,
        timer: 0 // Will count up, explode when reaching bottom 1/4
      });
    }
  }

  // Update bomb positions and explosions (called from updateBoss)
  updateBossBombs(deltaTime: number) {
    const bombSpeed = 3 * deltaTime;
    const explosionY = this.canvas.height * 0.75; // Bottom 1/4 of screen
    const dangerRadius = 80;
    const dangerDuration = 90; // 1.5 seconds

    this.bossState.bombsActive = this.bossState.bombsActive.filter(bomb => {
      // Move bomb down
      if (bomb.timer === 0) {
        bomb.y += bombSpeed;

        // Create falling trail
        if (Math.random() < 0.3) {
          this.particles.push({
            x: bomb.x,
            y: bomb.y,
            vx: (Math.random() - 0.5) * 1,
            vy: -1,
            life: 15,
            color: '#ff4444',
            size: 3
          });
        }

        // Check if bomb reached explosion height
        if (bomb.y >= explosionY) {
          bomb.timer = 1; // Start danger zone timer
          // Explosion effect
          this.audioManager.playSound('explosion_normal', 0.5);
          this.addScreenShake(6);
          for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            this.particles.push({
              x: bomb.x,
              y: bomb.y,
              vx: Math.cos(angle) * 4,
              vy: Math.sin(angle) * 4,
              life: 30,
              color: '#ff6600',
              size: 5
            });
          }
        }
      } else {
        // Danger zone active
        bomb.timer += deltaTime;

        // Create danger zone particles
        if (Math.random() < 0.2) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * dangerRadius;
          this.particles.push({
            x: bomb.x + Math.cos(angle) * dist,
            y: bomb.y + Math.sin(angle) * dist * 0.3,
            vx: 0,
            vy: -0.5 - Math.random(),
            life: 20,
            color: '#ff3300',
            size: 3
          });
        }

        // Check player in danger zone (1 damage per 30 frames)
        if (!this.player.shieldActive && !this.player.invulnerable && !this.player.invincibilityActive) {
          const playerCenterX = this.player.position.x + this.player.size.width / 2;
          const playerCenterY = this.player.position.y + this.player.size.height / 2;
          const dx = playerCenterX - bomb.x;
          const dy = playerCenterY - bomb.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < dangerRadius && Math.floor(bomb.timer) % 30 === 0) {
            this.audioManager.playSound('player_hit', 0.4);
            this.stats.lives -= 1;
            this.tookDamageThisWave = true;
            this.hitFlashAlpha = 0.2;
            if (this.stats.lives <= 0) {
              this.gameOver();
            }
          }
        }

        // Remove danger zone after duration
        if (bomb.timer >= dangerDuration) {
          return false;
        }
      }
      return true;
    });
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
          enemy.update(0, descentAmount, this.player.freezeActive);
        }
      }
    } else {
      for (const enemy of this.enemies) {
        if (enemy.isAlive) {
          // Apply individual enemy speed multiplier
          const enemySpeed = adjustedSpeed * enemy.speedMultiplier * this.enemyDirection * deltaTime;
          enemy.update(enemySpeed, 0, this.player.freezeActive);
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

  // Update asteroid wave
  updateAsteroids(deltaTime: number = 1) {
    // Handle intro timer (brief pause before asteroids start)
    if (this.asteroidIntroTimer > 0) {
      this.asteroidIntroTimer -= deltaTime;

      // Intro just ended - enter asteroid mode and show "GET READY!" message
      if (this.asteroidIntroTimer <= 0) {
        this.asteroidIntroTimer = 0;
        this.player.enterAsteroidMode();
        this.audioManager.playSound('wave_complete', 0.5);

        // Show asteroid control hint for first 2 asteroid waves
        // Small delay so it appears after "GO!" notification
        setTimeout(() => {
          this.hintManager.onAsteroidWaveStart();
        }, 1000);

        // Show "GO!" notification
        this.comboNotifications.push({
          text: '🚀 GO! 🚀',
          lifetime: 0,
          alpha: 1,
          scale: 1.5,
          x: this.canvas.width / 2,
          y: this.canvas.height / 2
        });
      }
      return; // Don't update asteroids during intro
    }

    const isFrozen = this.player.freezeActive;

    // Update asteroid timer
    if (!isFrozen) {
      this.asteroidWaveTimer -= deltaTime;
    }

    // Update each asteroid
    for (const asteroid of this.asteroids) {
      if (asteroid.isAlive) {
        asteroid.update(deltaTime, isFrozen);
      }
    }

    // Remove dead asteroids
    this.asteroids = this.asteroids.filter(a => a.isAlive);

    // Check wave completion
    const allDestroyed = this.asteroids.length === 0;
    const timerExpired = this.asteroidWaveTimer <= 0;

    if (allDestroyed || timerExpired) {
      // Wave complete!
      if (allDestroyed) {
        console.log('✅ ASTEROID WAVE CLEARED! Bonus awarded!');
        // Bonus for clearing all asteroids
        this.stats.score += 500;
        this.awardStardust(100, 'asteroid_clear_bonus');

        // Show bonus notification
        this.comboNotifications.push({
          text: 'ASTEROID BONUS +500',
          lifetime: 0,
          alpha: 1,
          scale: 1,
          x: this.canvas.width / 2,
          y: this.canvas.height / 3
        });
      } else {
        console.log('⏰ ASTEROID WAVE: Timer expired');
      }

      // Exit asteroid mode and restore ship to bottom
      this.player.exitAsteroidMode();

      // End asteroid wave
      this.asteroidWaveActive = false;
      this.asteroids = [];

      // Play completion sound and effects
      this.audioManager.playSound('wave_clear', 0.6);
      this.addScreenShake(8);

      // Check if next wave is a milestone (boss wave)
      const upcomingWave = this.stats.wave + 1;
      const isMilestone = upcomingWave % 5 === 0;

      // Start wave transition with proper properties (this will call nextWave() when complete)
      this.waveTransition = {
        active: true,
        progress: 0,
        waveNumber: upcomingWave,
        isMilestone: isMilestone
      };

      // Show asteroid wave complete notification
      this.comboNotifications.push({
        text: allDestroyed ? '🪨 ASTEROID FIELD CLEARED! 🪨' : '🪨 ASTEROID WAVE SURVIVED! 🪨',
        lifetime: 0,
        alpha: 1,
        scale: 1.2,
        x: this.canvas.width / 2,
        y: this.canvas.height / 2.5
      });
    }

    // Collision: Asteroid hits player
    if (!this.player.shieldActive && !this.player.invincibilityActive && !this.player.invulnerable) {
      const playerCenterX = this.player.position.x + this.player.size.width / 2;
      const playerCenterY = this.player.position.y + this.player.size.height / 2;
      const playerRadius = Math.min(this.player.size.width, this.player.size.height) / 2 - 5; // Forgiving hitbox

      for (const asteroid of this.asteroids) {
        if (!asteroid.isAlive) continue;

        if (asteroid.checkCircleCollision(playerCenterX, playerCenterY, playerRadius)) {
          // === JUICE: Dramatic hit stop on asteroid collision ===
          this.triggerHitStop(4, true); // Bypass cooldown for player damage
          this.triggerChromaticAberration(0.6);
          this.triggerTimeDilation(0.5, 20);
          this.triggerCameraZoom(1.05);

          // Play hit sound and haptic
          this.audioManager.playSound('player_hit', 0.6);
          this.hapticManager.onPlayerHit();

          // Asteroid collision deals 1 damage
          this.stats.lives -= 1;
          if (this.stats.lives <= 0) {
            this.gameOver();
            return; // Exit immediately on game over
          }

          // Track damage taken for perfect wave achievement
          this.tookDamageThisWave = true;

          // Activate invulnerability (2 seconds)
          this.player.invulnerable = true;
          this.player.invulnerabilityTimer = 120;

          // Explosion at player position
          this.createExplosion(
            this.player.position.x + this.player.size.width / 2,
            this.player.position.y + this.player.size.height / 2
          );
          this.addScreenShake(12);
          this.hitFlashAlpha = 0.3;

          break; // Only one collision per frame
        }
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
          // Piercing shots - unlimited piercing (from powerup or superpower)
          const isPiercing = projectile.piercing;
          if (!isPiercing) {
            projectile.deactivate();
          } else {
            projectile.piercedEnemies++;
          }

          // Calculate damage with module boost
          const moduleDamageBoost = this.moduleManager.getEffectValue('damage_boost');
          const damage = Math.ceil(1 * (1 + moduleDamageBoost / 100));
          enemy.hit(damage);

          if (!enemy.isAlive) {
            // Play enemy death sound and haptic
            this.audioManager.playSound('enemy_death', 0.4);
            this.hapticManager.onEnemyKill();

            // === JUICE: Hit stop on enemy kill ===
            // Heavy enemies get 3 frames, others get 2 (respects cooldown to prevent rapid-fire stutter)
            const hitStopFrames = enemy.type === 'heavy' ? 3 : 2;
            this.triggerHitStop(hitStopFrames);
            // NOTE: Camera zoom removed from regular kills to reduce visual noise during rapid fire

            this.stats.score += Math.floor(enemy.points * this.scoreMultiplier);
            this.stats.enemiesDestroyed++;
            this.registerKill(enemy.points); // Track combo

            // Award XP based on enemy type
            const xpReward = enemy.type === 'heavy' ? 25 : enemy.type === 'fast' ? 15 : 10;
            this.awardXP(xpReward);

            // === JUICE: Death flash before explosion (1F) ===
            this.createDeathFlash(
              enemy.position.x + enemy.size.width / 2,
              enemy.position.y + enemy.size.height / 2,
              enemy.size.width
            );

            this.createExplosion(
              enemy.position.x + enemy.size.width / 2,
              enemy.position.y + enemy.size.height / 2
            );
            this.addScreenShake(8);
            // 1E/1F: Enhanced directional debris with enemy-type specific effects
            this.spawnDirectionalDebris(
              enemy.position.x + enemy.size.width / 2,
              enemy.position.y + enemy.size.height / 2,
              enemy.color,
              projectile.velocity.x,
              projectile.velocity.y,
              enemy.type
            );

            // Explosive rounds - create additional explosion damage
            if (projectile.explosive) {
              this.createExplosiveRoundDamage(
                enemy.position.x + enemy.size.width / 2,
                enemy.position.y + enemy.size.height / 2
              );
            }
          } else {
            // Play enemy hit sound (not dead yet)
            this.audioManager.playSound('enemy_hit', 0.3);
            this.createImpactParticles(enemy.position.x + enemy.size.width / 2, enemy.position.y + enemy.size.height / 2, '#ffff00');
            this.addScreenShake(3);
          }
          if (!isPiercing) break;
        }
      }

      // Player projectiles vs boss minions
      for (const minion of this.bossMinions) {
        if (!minion.isAlive) continue;

        if (this.checkCollision(projectile.getBounds(), minion.getBounds())) {
          // Piercing shots - unlimited piercing
          const isPiercing = projectile.piercing;
          if (!isPiercing) {
            projectile.deactivate();
          } else {
            projectile.piercedEnemies++;
          }

          // Calculate damage with module boost
          const moduleDamageBoost = this.moduleManager.getEffectValue('damage_boost');
          const damage = Math.ceil(1 * (1 + moduleDamageBoost / 100));
          minion.hit(damage);

          if (!minion.isAlive) {
            // === JUICE: Hit stop on minion kill ===
            this.triggerHitStop(2);
            // NOTE: Camera zoom removed from minion kills to reduce visual noise

            this.stats.score += Math.floor(minion.points * this.scoreMultiplier);
            this.stats.enemiesDestroyed++;
            this.registerKill(minion.points); // Track combo
            this.awardXP(15); // Fast enemy XP

            // === JUICE: Death flash for minion (1F) ===
            this.createDeathFlash(
              minion.position.x + minion.size.width / 2,
              minion.position.y + minion.size.height / 2,
              minion.size.width
            );

            this.createExplosion(
              minion.position.x + minion.size.width / 2,
              minion.position.y + minion.size.height / 2
            );
            // 1E/1F: Directional debris for minions (fast enemy type)
            this.spawnDirectionalDebris(
              minion.position.x + minion.size.width / 2,
              minion.position.y + minion.size.height / 2,
              minion.color,
              projectile.velocity.x,
              projectile.velocity.y,
              'fast'
            );
          } else {
            this.createImpactParticles(minion.position.x + minion.size.width / 2, minion.position.y + minion.size.height / 2, '#ffff00');
          }
          if (!isPiercing) break;
        }
      }

      // Player projectiles vs boss
      if (this.boss && this.boss.isAlive && this.bossState.bossIntroTimer <= 0) {
        if (this.checkCollision(projectile.getBounds(), this.boss.getBounds())) {
          // Piercing shots - unlimited piercing AND deal 2 damage to boss
          const isPiercing = projectile.piercing;
          let bossDamage = isPiercing ? 2 : 1;

          // Apply module damage boosts
          const moduleDamageBoost = this.moduleManager.getEffectValue('damage_boost');
          const moduleBossDamageBoost = this.moduleManager.getEffectValue('boss_damage_boost');
          const totalBoost = 1 + (moduleDamageBoost + moduleBossDamageBoost) / 100;
          bossDamage = Math.ceil(bossDamage * totalBoost);

          if (!isPiercing) {
            projectile.deactivate();
          } else {
            projectile.piercedEnemies++;
          }

          this.boss.hit(bossDamage);

          if (!this.boss.isAlive) {
            // Boss defeated!
            // === JUICE: Maximum hit stop for boss death ===
            this.triggerHitStop(6, true); // Longest hit stop for dramatic effect (bypass cooldown)
            this.triggerCameraZoom(1.08); // Strong zoom for epic moment
            this.triggerChromaticAberration(0.8); // Strong RGB split

            // Play boss death sound, victory theme, and haptic
            this.audioManager.playSound('boss_death', 0.9);
            this.audioManager.playMusic('victory_theme', false);
            this.hapticManager.onBossDefeat();

            this.stats.score += Math.floor(this.boss.points * 5 * this.scoreMultiplier); // 5x score + multiplier
            this.stats.enemiesDestroyed++;
            this.registerKill(this.boss.points * 5); // Track combo (boss counts!)
            this.awardXP(200); // Boss XP
            this.createExplosion(
              this.boss.position.x + this.boss.size.width / 2,
              this.boss.position.y + this.boss.size.height / 2
            );
            this.addScreenShake(25);
            this.spawnDebrisParticles(this.boss.position.x + this.boss.size.width / 2, this.boss.position.y + this.boss.size.height / 2, '#dc2626');

            // Guaranteed power-up (better drops from bosses - include new powerups)
            const types: Array<PowerUpType> = [
              'plasma', 'rapid', 'shield', 'slowmo',
              'homing', 'laser', 'freeze', 'piercing', 'multiplier'
            ];
            const type = types[Math.floor(Math.random() * types.length)];
            const powerUp = new PowerUpEntity(
              this.boss.position.x + this.boss.size.width / 2 - 20,
              this.boss.position.y + this.boss.size.height / 2,
              type
            );
            if (this.assets) {
              const imageMap: Partial<Record<PowerUpType, HTMLImageElement>> = {
                plasma: this.assets.powerUpPlasma,
                rapid: this.assets.powerUpRapid,
                shield: this.assets.powerUpShield,
                slowmo: this.assets.powerUpSlowmo
              };
              if (imageMap[type]) {
                powerUp.setImage(imageMap[type]!);
              }
            }
            this.powerUps.push(powerUp);

            // Kill all remaining minions when boss dies (prevents wave stall)
            for (const minion of this.bossMinions) {
              if (minion.isAlive) {
                minion.isAlive = false;
                this.createExplosion(
                  minion.position.x + minion.size.width / 2,
                  minion.position.y + minion.size.height / 2
                );
              }
            }
            this.bossMinions = [];

            this.bossState.bossActive = false;
            this.bossState.bossHealth = 0;
            this.bossState.bossVictoryTimer = 120; // 2 second victory pause
            this.state = 'bossVictory';

            // Progression tracking for boss defeat
            this.awardStardust(100, 'boss_defeat');
            this.achievementManager.trackBossDefeat();
            // Update module slots after boss defeat
            this.moduleManager.updateSlotUnlocks(this.stats.level, this.achievementManager.getProgress().bossesDefeated + 1);
          } else {
            // Play boss hit sound and haptic (not dead yet)
            this.audioManager.playSound('boss_hit', 0.5);
            this.hapticManager.onBossHit();

            // === JUICE: Hit stop on boss damage ===
            this.triggerHitStop(2, true); // Brief freeze on boss hit (bypass cooldown)
            this.triggerChromaticAberration(0.3); // Subtle RGB split
            this.triggerCameraZoom(1.03); // Medium zoom

            this.createImpactParticles(this.boss.position.x + this.boss.size.width / 2, this.boss.position.y + this.boss.size.height / 2, '#ffff00');
            this.addScreenShake(5);
          }
          // Piercing bullets continue through boss, non-piercing stop
          if (!isPiercing) break;
        }
      }

      // Player projectiles vs asteroids
      if (this.asteroidWaveActive) {
        for (const asteroid of this.asteroids) {
          if (!asteroid.isAlive) continue;

          if (this.checkCollision(projectile.getBounds(), asteroid.getBounds())) {
            // Piercing shots
            const isPiercing = projectile.piercing;
            if (!isPiercing) {
              projectile.deactivate();
            } else {
              projectile.piercedEnemies++;
            }

            // Calculate damage with module boost
            const moduleDamageBoost = this.moduleManager.getEffectValue('damage_boost');
            const damage = Math.ceil(1 * (1 + moduleDamageBoost / 100));

            const result = asteroid.hit(damage);

            if (result.destroyed) {
              // Asteroid destroyed!
              this.audioManager.playSound('enemy_death', 0.5);
              this.hapticManager.onEnemyKill();

              // Hit stop for asteroid destruction
              const hitStopFrames = asteroid.size === 'large' ? 4 : asteroid.size === 'medium' ? 3 : 2;
              this.triggerHitStop(hitStopFrames);

              this.stats.score += Math.floor(asteroid.points * this.scoreMultiplier);
              this.registerKill(asteroid.points);

              // Award XP based on size
              const xpReward = asteroid.size === 'large' ? 30 : asteroid.size === 'medium' ? 20 : 10;
              this.awardXP(xpReward);

              // Create explosion
              this.createExplosion(asteroid.position.x, asteroid.position.y);
              this.addScreenShake(asteroid.size === 'large' ? 10 : asteroid.size === 'medium' ? 6 : 3);

              // Spawn debris particles
              this.spawnDebrisParticles(asteroid.position.x, asteroid.position.y, asteroid.glowColor);

              // Add split asteroids
              if (result.splitInto) {
                this.asteroids.push(...result.splitInto);
              }

              // Chance to drop stardust from small asteroids
              if (asteroid.size === 'small' && Math.random() < 0.25) {
                this.awardStardust(5, 'asteroid_destroy');
              } else if (asteroid.size === 'medium' && Math.random() < 0.15) {
                this.awardStardust(10, 'asteroid_destroy');
              } else if (asteroid.size === 'large' && Math.random() < 0.1) {
                this.awardStardust(20, 'asteroid_destroy');
              }
            } else {
              // Asteroid hit but not destroyed
              this.audioManager.playSound('enemy_hit', 0.3);
              this.createImpactParticles(asteroid.position.x, asteroid.position.y, asteroid.glowColor);
              this.addScreenShake(2);
            }

            if (!isPiercing) break;
          }
        }
      }
    }

    // Enemy projectiles vs player
    if (!this.player.shieldActive && !this.player.invulnerable && !this.player.invincibilityActive) {
      for (const projectile of this.projectiles) {
        if (!projectile.isActive || projectile.isPlayerProjectile) continue;

        if (this.checkCollision(projectile.getBounds(), this.player.getBounds())) {
          projectile.deactivate();

          // === JUICE: Dramatic hit stop on player damage ===
          this.triggerHitStop(4, true); // Longer freeze for player hit (bypass cooldown)
          this.triggerChromaticAberration(0.6); // Strong RGB split
          this.triggerTimeDilation(0.5, 20); // Brief slow-mo (0.5x for 20 frames)
          this.triggerCameraZoom(1.05); // Strong zoom

          // Use projectile damage:
          // 1 = lose 1 life (regular enemy bullets)
          // 2 = lose 2 lives (boss orange spread shots)
          // 3 = lose 3 lives (boss red laser beams)
          // Play player hit sound and haptic feedback
          this.audioManager.playSound('player_hit', 0.6);
          this.hapticManager.onPlayerHit();

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

    // 1G: Near-Miss Detection - check for projectiles that came close but didn't hit
    if (this.nearMissTimer <= 0 && !this.player.shieldActive && !this.player.invulnerable && !this.player.invincibilityActive) {
      const playerBounds = this.player.getBounds();
      const playerCenterX = playerBounds.x + playerBounds.width / 2;
      const playerCenterY = playerBounds.y + playerBounds.height / 2;
      const nearMissRadius = 25; // 25px detection radius around player

      for (const projectile of this.projectiles) {
        if (!projectile.isActive || projectile.isPlayerProjectile) continue;

        // Calculate distance from projectile to player center
        const projCenterX = projectile.position.x + projectile.size / 2;
        const projCenterY = projectile.position.y + projectile.size / 2;
        const dx = projCenterX - playerCenterX;
        const dy = projCenterY - playerCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Near miss: within detection radius but not colliding (actual collision is ~15-20px)
        // Also check that projectile is moving AWAY or passing by (not approaching)
        const isMovingAway = (projectile.velocity.y < 0 && projCenterY < playerCenterY) ||
                            (projectile.velocity.y > 0 && projCenterY > playerCenterY);

        if (distance < nearMissRadius && distance > 15 && !isMovingAway) {
          this.triggerNearMiss(projCenterX, projCenterY);
          break; // Only one near-miss per cooldown period
        }
      }
    }

    // Kamikaze minions vs player
    if (!this.player.shieldActive && !this.player.invulnerable && !this.player.invincibilityActive) {
      for (const minion of this.bossMinions) {
        if (!minion.isAlive) continue;

        if (this.checkCollision(minion.getBounds(), this.player.getBounds())) {
          // Minion dies on contact
          minion.isAlive = false;

          // === JUICE: Dramatic hit stop on kamikaze hit ===
          this.triggerHitStop(4, true); // Bypass cooldown for player damage
          this.triggerChromaticAberration(0.6);
          this.triggerTimeDilation(0.5, 20);
          this.triggerCameraZoom(1.05);

          // Play hit sound and haptic
          this.audioManager.playSound('player_hit', 0.6);
          this.hapticManager.onPlayerHit();

          // Minion deals 1 damage
          this.stats.lives -= 1;
          if (this.stats.lives <= 0) {
            this.gameOver();
          }

          // Track damage taken
          this.tookDamageThisWave = true;

          // Activate invulnerability (2 seconds)
          this.player.invulnerable = true;
          this.player.invulnerabilityTimer = 120;

          // Explosion at collision point
          this.createExplosion(
            minion.position.x + minion.size.width / 2,
            minion.position.y + minion.size.height / 2
          );
          this.addScreenShake(10);
          this.hitFlashAlpha = 0.3;

          // Only one minion can hit per frame
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

  activatePowerUp(type: PowerUpType) {
    // Play powerup collect sound and haptic
    this.audioManager.playSound('powerup_collect', 0.5);
    this.hapticManager.onPowerUpCollect();
    this.hintManager.onFirstPowerUp(); // Show hint on first power-up

    // Get superpower for possible duration extensions
    const superpower = this.cosmeticManager.getActiveSuperpower();
    const bonusDuration = superpower.type === 'gravity_bullets' && superpower.value ? superpower.value * 60 : 0;
    const isDualGuns = superpower.type === 'dual_guns';

    // Check if we're in boss mode for duration adjustments
    const isBossMode = this.bossState.isBossWave;

    switch (type) {
      // Original powerups
      case 'plasma':
        this.player.activatePlasma(bonusDuration, isDualGuns, isBossMode);
        this.audioManager.playSound('powerup_plasma', 0.6);
        break;
      case 'rapid':
        this.player.activateRapid(bonusDuration, isDualGuns, isBossMode);
        this.audioManager.playSound('powerup_rapid_fire', 0.5);
        break;
      case 'shield':
        const superpowerShieldBoost = superpower.type === 'shield_duration_boost' && superpower.value ? superpower.value : 0;
        const moduleShieldBoost = this.moduleManager.getEffectValue('shield_duration_boost');
        const totalShieldBoost = superpowerShieldBoost + moduleShieldBoost;
        this.player.activateShield(bonusDuration, totalShieldBoost);
        this.audioManager.playSound('powerup_shield_activate', 0.6);
        this.hintManager.onShieldCollected();
        break;
      case 'slowmo':
        this.slowMotionActive = true;
        this.slowMotionDuration = 360 + bonusDuration; // 6 seconds + bonus
        this.audioManager.playSound('powerup_slowmo', 0.6);
        break;

      // New offensive powerups
      case 'homing':
        this.player.activateHoming(bonusDuration);
        this.audioManager.playSound('powerup_collect', 0.6);
        break;
      case 'laser':
        this.player.activateLaser(bonusDuration);
        this.audioManager.playSound('powerup_plasma', 0.7); // Similar to plasma sound
        this.hintManager.onLaserCollected();
        break;
      case 'nuke':
        this.activateNuke();
        this.audioManager.playSound('boss_death', 0.8); // Big explosion sound
        this.hintManager.onNukeCollected();
        break;

      // New defensive powerups
      case 'invincibility':
        this.player.activateInvincibility(bonusDuration);
        this.audioManager.playSound('powerup_shield_activate', 0.7);
        break;
      case 'freeze':
        this.player.activateFreeze(bonusDuration);
        this.audioManager.playSound('powerup_slowmo', 0.6); // Similar to slowmo
        break;

      // New utility powerups
      case 'extralife':
        this.stats.lives++;
        this.audioManager.playSound('powerup_collect', 0.8);
        this.hintManager.onExtraLifeCollected();
        break;
      case 'multiplier':
        this.scoreMultiplier = 2;
        this.scoreMultiplierDuration = 360 + bonusDuration; // 6 seconds + bonus
        this.audioManager.playSound('powerup_collect', 0.7);
        break;
      case 'piercing':
        this.player.activatePiercing(bonusDuration);
        this.audioManager.playSound('powerup_rapid_fire', 0.6); // Similar to rapid fire
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
    // Check if screen shake is enabled in settings
    if (!this.settings.screenShake) {
      return; // Don't add shake if disabled
    }

    // Apply 50% reduction to make shake less intense and more subtle
    const reducedIntensity = intensity * 0.5;
    this.screenShake.intensity = Math.max(this.screenShake.intensity, reducedIntensity);
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

  /**
   * 1F: Death Flash - Brief white pulse effect before enemy death
   * Creates bright white particles that fade quickly for impact feedback
   */
  createDeathFlash(x: number, y: number, size: number = 40) {
    // PERF: Skip if particle count is high
    const spawnMultiplier = this.getParticleSpawnMultiplier();
    if (spawnMultiplier === 0) return;

    // Create a ring of bright white particles that expand and fade quickly
    const particleCount = Math.max(4, Math.floor((this.isMobile ? 6 : 10) * spawnMultiplier));
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size * 0.15 + Math.random() * 3,
        color: '#ffffff',
        alpha: 1,
        decay: 0.15, // Fast fade for flash effect
        lifetime: 0,
        maxLifetime: 12 // Very short lifetime
      });
    }

    // Center bright particle
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: size * 0.4,
      color: '#ffffff',
      alpha: 1,
      decay: 0.2, // Very fast fade
      lifetime: 0,
      maxLifetime: 8
    });
  }

  createExplosiveRoundDamage(x: number, y: number) {
    // Explosive rounds - damage nearby enemies in small AoE
    const explosionRadius = 30;

    // Check all enemies in range
    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      const dx = (enemy.position.x + enemy.size.width / 2) - x;
      const dy = (enemy.position.y + enemy.size.height / 2) - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < explosionRadius) {
        enemy.hit();
        if (!enemy.isAlive) {
          this.audioManager.playSound('enemy_death', 0.3);
          this.hapticManager.onEnemyKill();
          this.stats.score += Math.floor(enemy.points * this.scoreMultiplier);
          this.stats.enemiesDestroyed++;
          this.registerKill(enemy.points);
          const xpReward = enemy.type === 'heavy' ? 25 : enemy.type === 'fast' ? 15 : 10;
          this.awardXP(xpReward);
          this.createExplosion(
            enemy.position.x + enemy.size.width / 2,
            enemy.position.y + enemy.size.height / 2
          );
          this.spawnDebrisParticles(enemy.position.x + enemy.size.width / 2, enemy.position.y + enemy.size.height / 2, enemy.color);
        }
      }
    }

    // Visual effect for explosion
    this.createImpactParticles(x, y, '#ff8c00');
    this.addScreenShake(5);
  }

  applyGravityPull(projectile: Projectile) {
    // Gravity bullets - pull enemies slightly toward the bullet
    const gravityRadius = 60;
    const pullStrength = 0.3;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      const dx = projectile.position.x - (enemy.position.x + enemy.size.width / 2);
      const dy = projectile.position.y - (enemy.position.y + enemy.size.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < gravityRadius && distance > 0) {
        // Pull enemy toward bullet
        const pullX = (dx / distance) * pullStrength;
        const pullY = (dy / distance) * pullStrength;
        enemy.position.x += pullX;
        enemy.position.y += pullY;
      }
    }

    // Also pull boss minions
    for (const minion of this.bossMinions) {
      if (!minion.isAlive) continue;

      const dx = projectile.position.x - (minion.position.x + minion.size.width / 2);
      const dy = projectile.position.y - (minion.position.y + minion.size.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < gravityRadius && distance > 0) {
        const pullX = (dx / distance) * pullStrength;
        const pullY = (dy / distance) * pullStrength;
        minion.position.x += pullX;
        minion.position.y += pullY;
      }
    }
  }

  activateNuke() {
    // Nuke powerup - destroy all visible enemies with massive explosion
    console.log('💥 Enemies before nuke:', this.enemies.length, 'Boss alive:', this.boss?.isAlive);
    let enemiesDestroyed = 0;

    // Destroy all regular enemies
    for (const enemy of this.enemies) {
      if (enemy.isAlive) {
        enemy.hit();
        if (!enemy.isAlive) {
          enemiesDestroyed++;
          this.stats.score += Math.floor(enemy.points * this.scoreMultiplier);
          this.stats.enemiesDestroyed++;
          this.registerKill(enemy.points);
          const xpReward = enemy.type === 'heavy' ? 25 : enemy.type === 'fast' ? 15 : 10;
          this.awardXP(xpReward);
          this.createExplosion(
            enemy.position.x + enemy.size.width / 2,
            enemy.position.y + enemy.size.height / 2
          );
          this.spawnDebrisParticles(
            enemy.position.x + enemy.size.width / 2,
            enemy.position.y + enemy.size.height / 2,
            enemy.color
          );
        }
      }
    }

    // Destroy all boss minions
    for (const minion of this.bossMinions) {
      if (minion.isAlive) {
        minion.hit();
        if (!minion.isAlive) {
          enemiesDestroyed++;
          this.stats.score += Math.floor(minion.points * this.scoreMultiplier);
          this.stats.enemiesDestroyed++;
          this.registerKill(minion.points);
          this.awardXP(15);
          this.createExplosion(
            minion.position.x + minion.size.width / 2,
            minion.position.y + minion.size.height / 2
          );
          this.spawnDebrisParticles(
            minion.position.x + minion.size.width / 2,
            minion.position.y + minion.size.height / 2,
            minion.color
          );
        }
      }
    }

    // Damage boss with phase-based scaling
    if (this.boss && this.boss.isAlive) {
      // Phase-based damage: earlier phases take more damage
      // Phase 1 (100-75% HP): 10% max health damage
      // Phase 2 (75-50% HP): 8% max health damage
      // Phase 3 (50-25% HP): 6% max health damage
      // Phase 4 (25-0% HP): 5% max health damage
      let damagePercent: number;
      switch (this.boss.phase) {
        case 'phase1':
          damagePercent = 0.10; // 10%
          break;
        case 'phase2':
          damagePercent = 0.08; // 8%
          break;
        case 'phase3':
          damagePercent = 0.06; // 6%
          break;
        case 'phase4':
          damagePercent = 0.05; // 5%
          break;
      }

      const damage = Math.floor(this.boss.maxHealth * damagePercent);
      this.boss.hit(damage);
      this.audioManager.playSound('boss_hit', 0.6);
      this.hapticManager.onBossHit();

      // Create explosion at boss center
      this.createExplosion(
        this.boss.position.x + this.boss.size.width / 2,
        this.boss.position.y + this.boss.size.height / 2
      );

      // Check if boss died from nuke
      if (!this.boss.isAlive) {
        this.bossDefeated();
      }
    }

    // Massive screen shake
    this.addScreenShake(35);

    // White flash effect
    this.hitFlashAlpha = 0.7;
  }

  private bossDefeated(): void {
    if (!this.boss) return;

    // Reset adaptive difficulty on boss victory
    this.onBossVictory();

    // Play victory sounds and haptic
    this.audioManager.playSound('boss_death', 0.9);
    this.audioManager.playMusic('victory_theme', false);
    this.hapticManager.onBossDefeat();

    // Award points and stats
    this.stats.score += Math.floor(this.boss.points * 5 * this.scoreMultiplier); // 5x score + multiplier
    this.stats.enemiesDestroyed++;
    this.registerKill(this.boss.points * 5); // Track combo (boss counts!)
    this.awardXP(200); // Boss XP

    // Visual effects
    this.createExplosion(
      this.boss.position.x + this.boss.size.width / 2,
      this.boss.position.y + this.boss.size.height / 2
    );
    this.addScreenShake(25);
    this.spawnDebrisParticles(
      this.boss.position.x + this.boss.size.width / 2,
      this.boss.position.y + this.boss.size.height / 2,
      '#dc2626'
    );

    // Guaranteed power-up (better drops from bosses - include new powerups)
    const types: Array<PowerUpType> = [
      'plasma', 'rapid', 'shield', 'slowmo',
      'homing', 'laser', 'freeze', 'piercing', 'multiplier'
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUp = new PowerUpEntity(
      this.boss.position.x + this.boss.size.width / 2 - 20,
      this.boss.position.y + this.boss.size.height / 2,
      type
    );
    if (this.assets) {
      const imageMap: Partial<Record<PowerUpType, HTMLImageElement>> = {
        plasma: this.assets.powerUpPlasma,
        rapid: this.assets.powerUpRapid,
        shield: this.assets.powerUpShield,
        slowmo: this.assets.powerUpSlowmo
      };
      if (imageMap[type]) {
        powerUp.setImage(imageMap[type]!);
      }
    }
    this.powerUps.push(powerUp);

    // Kill all remaining minions when boss dies (prevents wave stall)
    for (const minion of this.bossMinions) {
      if (minion.isAlive) {
        minion.isAlive = false;
        // Create small explosion for each minion
        this.createExplosion(
          minion.position.x + minion.size.width / 2,
          minion.position.y + minion.size.height / 2
        );
      }
    }
    this.bossMinions = [];

    // Set victory state
    this.bossState.bossActive = false;
    this.bossState.bossHealth = 0;
    this.bossState.bossVictoryTimer = 120; // 2 second victory pause
    this.state = 'bossVictory';

    // Progression tracking for boss defeat
    this.awardStardust(100, 'boss_defeat');
    this.achievementManager.trackBossDefeat();
    // Update module slots after boss defeat
    this.moduleManager.updateSlotUnlocks(this.stats.level, this.achievementManager.getProgress().bossesDefeated + 1);

    // Reset consecutive game overs on boss victory (player is progressing)
    this.consecutiveGameOvers = 0;
    this.upgradeHintShownStruggle = false;
  }

  createImpactParticles(x: number, y: number, color: string) {
    // PERF: Throttle spawning when particle count is high
    const spawnMultiplier = this.getParticleSpawnMultiplier();
    if (spawnMultiplier === 0) return;

    // Drastically reduced particles for mobile performance
    const baseCount = this.isMobile ? 3 : 8;
    const particleCount = Math.max(1, Math.floor(baseCount * spawnMultiplier));
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
    // PERF: Throttle spawning when particle count is high
    const spawnMultiplier = this.getParticleSpawnMultiplier();
    if (spawnMultiplier === 0) return;

    // Drastically reduced particles for mobile performance
    const baseCount = this.isMobile ? 6 : 18;
    const particleCount = Math.max(2, Math.floor(baseCount * spawnMultiplier));
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

  /**
   * Enhanced directional debris - particles burst opposite to bullet direction
   * 1E: Kill Burst with directional particles
   */
  spawnDirectionalDebris(x: number, y: number, color: string, bulletVx: number, bulletVy: number, enemyType: 'basic' | 'fast' | 'heavy' = 'basic') {
    // PERF: Throttle spawning when particle count is high
    const spawnMultiplier = this.getParticleSpawnMultiplier();
    if (spawnMultiplier === 0) return;

    // Calculate opposite direction from bullet
    const bulletAngle = Math.atan2(bulletVy, bulletVx);
    const oppositeAngle = bulletAngle + Math.PI; // Opposite direction

    // Enemy-type specific settings (1F: Death Enhancements)
    let baseParticleCount: number;
    let speedMultiplier: number;
    let sizeMultiplier: number;
    let spreadAngle: number; // How wide the burst spreads

    switch (enemyType) {
      case 'heavy':
        // Heavy enemies: larger, slower particles, wider spread
        baseParticleCount = this.isMobile ? 10 : 24;
        speedMultiplier = 0.7;
        sizeMultiplier = 1.8;
        spreadAngle = Math.PI * 0.8; // Wide spread
        break;
      case 'fast':
        // Fast enemies: quick, scattered particles, narrow burst
        baseParticleCount = this.isMobile ? 8 : 20;
        speedMultiplier = 1.5;
        sizeMultiplier = 0.7;
        spreadAngle = Math.PI * 0.4; // Narrow, focused burst
        break;
      default:
        // Basic enemies: balanced
        baseParticleCount = this.isMobile ? 6 : 16;
        speedMultiplier = 1.0;
        sizeMultiplier = 1.0;
        spreadAngle = Math.PI * 0.6;
    }

    // Apply throttle multiplier
    const particleCount = Math.max(3, Math.floor(baseParticleCount * spawnMultiplier));

    // Color palette includes enemy color prominently
    const colors = [color, color, '#ffffff', '#ff6600', '#ffaa00'];

    for (let i = 0; i < particleCount; i++) {
      // Particles spread from opposite direction with some variance
      const angleVariance = (Math.random() - 0.5) * spreadAngle;
      const angle = oppositeAngle + angleVariance;
      const speed = (2 + Math.random() * 5) * speedMultiplier;

      const particleColor = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // Slight upward bias
        size: (2 + Math.random() * 4) * sizeMultiplier,
        color: particleColor,
        alpha: 1,
        decay: this.isMobile ? 0.04 : 0.02,
        lifetime: 0,
        maxLifetime: this.isMobile ? 35 : 55
      });
    }

    // Add a few bright "spark" particles at impact point
    const sparkCount = this.isMobile ? 2 : 4;
    for (let i = 0; i < sparkCount; i++) {
      const sparkAngle = oppositeAngle + (Math.random() - 0.5) * 0.5;
      const sparkSpeed = 4 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(sparkAngle) * sparkSpeed,
        vy: Math.sin(sparkAngle) * sparkSpeed,
        size: 1 + Math.random() * 2,
        color: '#ffffff',
        alpha: 1,
        decay: this.isMobile ? 0.1 : 0.06,
        lifetime: 0,
        maxLifetime: this.isMobile ? 15 : 25
      });
    }
  }

  /**
   * Boss phase transition radial explosion (1E)
   */
  spawnBossPhaseParticles(x: number, y: number) {
    // PERF: Throttle spawning when particle count is high
    const spawnMultiplier = this.getParticleSpawnMultiplier();
    if (spawnMultiplier === 0) return;

    const baseCount = this.isMobile ? 20 : 40;
    const particleCount = Math.max(8, Math.floor(baseCount * spawnMultiplier));
    const colors = ['#dc2626', '#f97316', '#fbbf24', '#ffffff', '#a855f7'];

    for (let i = 0; i < particleCount; i++) {
      // Radial explosion - particles go in all directions evenly
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      const particleColor = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: particleColor,
        alpha: 1,
        decay: this.isMobile ? 0.025 : 0.015,
        lifetime: 0,
        maxLifetime: this.isMobile ? 50 : 70
      });
    }

    // Inner ring of bright particles (also throttled)
    const innerBaseCount = this.isMobile ? 8 : 16;
    const innerCount = Math.max(4, Math.floor(innerBaseCount * spawnMultiplier));
    for (let i = 0; i < innerCount; i++) {
      const angle = (i / innerCount) * Math.PI * 2 + Math.PI / innerCount;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 3,
        color: '#ffffff',
        alpha: 1,
        decay: this.isMobile ? 0.03 : 0.02,
        lifetime: 0,
        maxLifetime: this.isMobile ? 40 : 60
      });
    }
  }

  /**
   * 1G: Near-Miss Feedback - sparks and notification when projectile nearly hits player
   */
  triggerNearMiss(projectileX: number, projectileY: number) {
    // Set cooldown to prevent spam (60 frames = 1 second at 60fps)
    this.nearMissTimer = 60;

    // Award score bonus
    this.stats.score += 25;

    // Show "CLOSE CALL!" floating text
    this.addComboNotification('CLOSE CALL!', '#22d3ee', 1.0);

    // Light haptic pulse
    this.hapticManager.onNearMiss();

    // Subtle cyan flash around player
    const playerCenterX = this.player.position.x + this.player.size.width / 2;
    const playerCenterY = this.player.position.y + this.player.size.height / 2;

    // Spawn near-miss sparks in direction of projectile
    const sparkCount = this.isMobile ? 4 : 8;
    const angle = Math.atan2(projectileY - playerCenterY, projectileX - playerCenterX);

    for (let i = 0; i < sparkCount; i++) {
      const sparkAngle = angle + (Math.random() - 0.5) * 1.2;
      const sparkSpeed = 3 + Math.random() * 4;
      this.particles.push({
        x: playerCenterX,
        y: playerCenterY,
        vx: Math.cos(sparkAngle) * sparkSpeed,
        vy: Math.sin(sparkAngle) * sparkSpeed,
        size: 2 + Math.random() * 3,
        color: '#22d3ee', // Cyan sparks
        alpha: 1,
        decay: this.isMobile ? 0.08 : 0.05,
        lifetime: 0,
        maxLifetime: this.isMobile ? 20 : 30
      });
    }

    // Brief cyan ring around player
    const ringParticles = this.isMobile ? 6 : 12;
    for (let i = 0; i < ringParticles; i++) {
      const ringAngle = (i / ringParticles) * Math.PI * 2;
      const ringSpeed = 2;
      this.particles.push({
        x: playerCenterX,
        y: playerCenterY,
        vx: Math.cos(ringAngle) * ringSpeed,
        vy: Math.sin(ringAngle) * ringSpeed,
        size: 2,
        color: '#22d3ee',
        alpha: 0.8,
        decay: this.isMobile ? 0.1 : 0.06,
        lifetime: 0,
        maxLifetime: this.isMobile ? 15 : 25
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
      // === JUICE: Exit flow state when combo resets ===
      if (this.stats.combo >= 25 && this.timeDilationTarget === 1.2) {
        this.timeDilationTarget = 1.0; // Return to normal speed
      }
      this.stats.combo = 0;
    }

    this.lastKillTime = now;
    this.stats.combo++;

    // === JUICE: Enter flow state at 25x combo (1.2x speedup) ===
    if (this.stats.combo === 25) {
      this.timeDilationTarget = 1.2; // Subtle speedup for "flow state"
      this.addComboNotification('FLOW STATE!', '#06b6d4', 1.5);
    }

    // Track max combo
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo;
    }

    // Show combo notification at milestones
    if (this.stats.combo === 3) {
      this.hintManager.onFirstCombo(); // First combo hint
    } else if (this.stats.combo === 5) {
      this.addComboNotification('NICE! x5', '#22d3ee', 1.2);
      this.stats.score += Math.floor(50 * this.scoreMultiplier);
    } else if (this.stats.combo === 10) {
      this.addComboNotification('GREAT! x10', '#fbbf24', 1.4);
      this.stats.score += Math.floor(100 * this.scoreMultiplier);
      this.addScreenShake(10);
      // === JUICE: Hit stop at combo milestone ===
      this.triggerHitStop(3, true); // Bypass cooldown for milestone
      this.triggerCameraZoom(1.04);
    } else if (this.stats.combo === 15 && !this.has15ComboReward) {
      // 15 Combo Life Reward (one-time per game)
      this.has15ComboReward = true;

      // Play combo milestone sound
      this.audioManager.playSound('combo_milestone', 0.7);

      // Award +1 life (can exceed max health!)
      this.stats.lives++;
      this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

      // Celebration
      this.addComboNotification('EPIC 15 COMBO!\n+1 LIFE REWARD!', '#ff6600', 2.0);
      this.stats.score += Math.floor(500 * this.scoreMultiplier);
      this.addScreenShake(25);
      // === JUICE: Hit stop at 15x combo ===
      this.triggerHitStop(4, true); // Bypass cooldown for milestone
      this.triggerCameraZoom(1.05);
      this.triggerChromaticAberration(0.4);
    } else if (this.stats.combo === 20) {
      this.addComboNotification('AMAZING! x20', '#ec4899', 1.6);
      this.stats.score += Math.floor(250 * this.scoreMultiplier);
      this.addScreenShake(15);
      // === JUICE: Hit stop at 20x combo ===
      this.triggerHitStop(3, true); // Bypass cooldown for milestone
      this.triggerCameraZoom(1.04);
    } else if (this.stats.combo === 30 && !this.has30ComboReward) {
      // 30 Combo Life Reward (one-time per game)
      this.has30ComboReward = true;

      // Play combo milestone sound
      this.audioManager.playSound('combo_milestone', 0.7);

      // Award +1 life (can exceed max health!)
      this.stats.lives++;
      this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

      // Epic celebration
      this.addComboNotification('INSANE 30 COMBO!\n+1 LIFE REWARD!', '#a855f7', 2.3);
      this.stats.score += Math.floor(1000 * this.scoreMultiplier);
      this.addScreenShake(28);
      // === JUICE: Hit stop at 30x combo ===
      this.triggerHitStop(5, true); // Bypass cooldown for milestone
      this.triggerCameraZoom(1.06);
      this.triggerChromaticAberration(0.5);
    } else if (this.stats.combo === 50 && !this.has50ComboReward) {
      // 50 Combo Life Reward (one-time per game)
      this.has50ComboReward = true;

      // Play combo milestone sound
      this.audioManager.playSound('combo_milestone', 0.7);

      // Award +1 life (can exceed max health for legendary achievement!)
      this.stats.lives++;
      this.stats.maxHealth = Math.max(this.stats.maxHealth, this.stats.lives);

      // Legendary celebration
      this.addComboNotification('LEGENDARY 50 COMBO!\n+1 LIFE REWARD!', '#ff00ff', 2.5);
      this.stats.score += Math.floor(2000 * this.scoreMultiplier);
      this.addScreenShake(30);
      // === JUICE: Maximum hit stop at 50x combo ===
      this.triggerHitStop(6, true); // Bypass cooldown for legendary milestone
      this.triggerCameraZoom(1.08);
      this.triggerChromaticAberration(0.7);
      this.triggerTimeDilation(0.4, 30); // Slow-mo celebration
    } else if (this.stats.combo % 25 === 0 && this.stats.combo > 50) {
      this.addComboNotification(`UNSTOPPABLE! x${this.stats.combo}`, '#ff6600', 2.2);
      this.stats.score += Math.floor(1000 * this.scoreMultiplier);
      this.addScreenShake(25);
    }

    // Progression tracking
    this.achievementManager.trackKill();
    this.achievementManager.trackCombo(this.stats.combo);

    // Earn Stardust for combo milestones (one-time per session)
    if (this.stats.combo === 15 && this.has15ComboReward) {
      this.awardStardust(25, 'combo_15x');
    } else if (this.stats.combo === 30 && this.has30ComboReward) {
      this.awardStardust(50, 'combo_30x');
    } else if (this.stats.combo === 50 && this.has50ComboReward) {
      this.awardStardust(100, 'combo_50x');
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

    // PERF: Throttle spawning when particle count is high
    const spawnMultiplier = this.getParticleSpawnMultiplier();
    if (spawnMultiplier === 0) return;

    // Reduced particle burst from screen edges (Option 1 optimization)
    const baseParticleCount = this.isMobile ? isMilestone ? 20 : 16 : isMilestone ? 40 : 32;
    const particleCount = Math.max(8, Math.floor(baseParticleCount * spawnMultiplier));
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
          decay: this.isMobile ? 0.015 : 0.01, // Faster decay on mobile
          lifetime: 0,
          maxLifetime: this.isMobile ? 120 : 150 // Shorter lifetime on mobile (2s vs 2.5s)
        });
      }
    });

    // Reduced center burst for milestones (Option 1 optimization)
    if (isMilestone) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const centerCount = Math.max(6, Math.floor((this.isMobile ? 15 : 30) * spawnMultiplier));

      for (let i = 0; i < centerCount; i++) {
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
          decay: this.isMobile ? 0.008 : 0.006, // Faster decay on mobile
          lifetime: 0,
          maxLifetime: this.isMobile ? 150 : 180 // Shorter lifetime on mobile
        });
      }
    }
  }

  hitPlayer() {
    // Don't take damage if invulnerable, shield is active, or invincibility powerup is active
    if (this.player.invulnerable || this.player.shieldActive || this.player.invincibilityActive) {
      return;
    }

    // Lose a life
    this.stats.lives--;

    // Show low health hint when down to 1 life
    if (this.stats.lives === 1) {
      this.hintManager.onLowHealth();
    }

    // Lifesteal superpower (Dark Matter) - convert damage to score bonus
    const superpower = this.cosmeticManager.getActiveSuperpower();
    if (superpower.type === 'lifesteal' && superpower.value) {
      // 10% of damage taken converts to score bonus (damage = 1 life lost, bonus = 100 points)
      const scoreBonus = Math.floor(100 * (superpower.value / 100));
      this.stats.score += scoreBonus;
      // Visual feedback for lifesteal
      this.createImpactParticles(this.player.position.x + this.player.size.width / 2, this.player.position.y, '#6366f1');
    }

    // Reset combo on hit
    // === JUICE: Exit flow state when hit ===
    if (this.stats.combo >= 25 && this.timeDilationTarget === 1.2) {
      this.timeDilationTarget = 1.0; // Return to normal speed
    }
    this.stats.combo = 0;

    // SCREEN SHAKE - Intense shake on hit
    this.addScreenShake(25);

    // RED FLASH - Screen flash on hit
    this.hitFlashAlpha = 0.4;

    // PARTICLE BURST - Explosion at player position (throttled)
    const spawnMultiplier = this.getParticleSpawnMultiplier();
    const burstColors = ['#ff0000', '#ff4500', '#ff6347', '#ffa500', '#ffff00'];
    const baseParticleCount = this.isMobile ? 20 : 30;
    const particleCount = spawnMultiplier === 0 ? 0 : Math.max(8, Math.floor(baseParticleCount * spawnMultiplier));

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

    // Track boss death for adaptive difficulty
    if (this.bossState.isBossWave && this.boss && this.boss.isAlive) {
      this.onBossDeath();
    }

    // Play game over sound, theme, and haptic
    this.audioManager.playSound('game_over', 0.7);
    this.audioManager.playMusic('game_over_theme', false);
    this.hapticManager.onGameOver();

    // Submit to leaderboard
    const leaderboardResult = this.leaderboardManager.submitScore(this.stats);
    console.log('📊 Leaderboard submission:', leaderboardResult);

    // Dispatch event for UI notification if made any leaderboard
    if (leaderboardResult.isHighScore || leaderboardResult.isHighestWave || leaderboardResult.isBestCombo) {
      window.dispatchEvent(new CustomEvent('leaderboard-entry', {
        detail: leaderboardResult
      }));
    }

    // Track final score for achievements
    this.achievementManager.trackScore(this.stats.score);

    // Track consecutive game overs for upgrade hint
    this.consecutiveGameOvers++;

    // Show upgrade hint after 3 consecutive deaths to help struggling players
    if (this.consecutiveGameOvers >= 3 && !this.upgradeHintShownStruggle) {
      this.upgradeHintShownStruggle = true;
      // Use HintManager for prominent in-game hint (shows on next game start)
      this.hintManager.onPlayerStruggling();
      // Also dispatch event for UI toast on game over screen
      window.dispatchEvent(new CustomEvent('upgrade-suggestion', {
        detail: {
          message: 'Struggling? Try upgrading your ship in the SHOP!',
          consecutiveDeaths: this.consecutiveGameOvers
        }
      }));
    }
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

    // Asteroid wave completion is handled in updateAsteroids() - don't interfere
    if (this.asteroidWaveActive) {
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
    // Play wave complete sound and haptic
    this.audioManager.playSound('wave_complete', 0.6);
    this.hapticManager.onWaveComplete();

    // Reset boss victory timer when advancing waves
    this.bossState.bossVictoryTimer = 0;

    // Switch back to gameplay music after boss victory
    if (this.bossState.isBossWave) {
      this.audioManager.playMusic('gameplay_theme', true);

      // Show upgrade hints after boss 1 and 2 to help players discover shop
      // At this point, wave hasn't incremented yet, so wave 5 = boss 1, wave 10 = boss 2
      const bossNumber = this.stats.wave / 5;
      // Use HintManager for more prominent, longer-lasting hints
      // Small delay so hint appears after wave transition UI settles
      setTimeout(() => {
        this.hintManager.onBossDefeated(bossNumber);
      }, 800);
    }

    this.stats.wave++;

    // Save checkpoint as the NEW wave (the one player is about to play)
    // This way, dying on wave 21 restarts at 21, not back to boss wave 20
    this.lastCheckpoint = this.stats.wave;
    this.saveCheckpoint();
    this.audioManager.playSound('checkpoint_reached', 0.5);
    console.log(`✅ Checkpoint saved at Wave ${this.lastCheckpoint}`);

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
    this.awardStardust(10, 'wave_complete');
    this.achievementManager.trackWave(this.stats.wave);
    this.checkWaveMilestone(this.stats.wave);

    // Reset consecutive game overs on wave completion (player is progressing)
    if (this.consecutiveGameOvers > 0) {
      this.consecutiveGameOvers = 0;
      this.upgradeHintShownStruggle = false;
    }

    // Track perfect wave (completed previous wave without damage)
    if (!this.tookDamageThisWave && this.stats.wave > 1) {
      this.achievementManager.trackPerfectWave();
      console.log(`✨ Perfect Wave ${this.stats.wave - 1}! No damage taken.`);
    }

    // Reset damage flag for next wave
    this.tookDamageThisWave = false;

    // Auto-shield superpower (Diamond Elite) - start each wave with shield
    const superpower = this.cosmeticManager.getActiveSuperpower();
    if (superpower.type === 'auto_shield' && superpower.value) {
      this.player.shieldActive = true;
      this.player.shieldDuration = superpower.value * 60; // Convert seconds to frames
      this.audioManager.playSound('powerup_shield_activate', 0.4);
    }

    // Grant invulnerability at wave start
    this.player.invulnerable = true;
    this.player.invulnerabilityTimer = this.isMobile ? 45 : 60; // 0.75s mobile, 1.0s desktop

    // Performance optimization: Clear dead enemies to prevent array bloat
    this.enemies = [];
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
      this.awardStardust(milestones[wave], `wave_${wave}_milestone`);
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
          streak: rewardCheck.streak,
          comebackBonus: rewardCheck.comebackBonus
        }
      }));

      const bonusMsg = rewardCheck.comebackBonus?.available
        ? ` (Comeback: ${rewardCheck.comebackBonus.streakRecovery}% recovery)`
        : '';
      console.log(`🎁 Daily Reward Available: Day ${rewardCheck.day} (Streak: ${rewardCheck.streak})${bonusMsg}`);
    } else {
      console.log(`✅ Daily reward already claimed today. Current streak: ${rewardCheck.streak}`);
    }
  }

  update() {
    // Calculate delta time for frame-rate independent movement
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / (1000 / this.targetFPS);
    this.lastFrameTime = currentTime;

    // === HIT STOP: Freeze game logic but keep rendering ===
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      // Still update visual effects during hit stop
      this.updateJuiceEffects(deltaTime);
      return; // Skip all game logic this frame
    }

    // === UPDATE JUICE EFFECTS ===
    this.updateJuiceEffects(deltaTime);

    // Update FPS counter
    this.fpsFrameCount++;
    if (currentTime - this.fpsLastTime >= 1000) {
      this.currentFPS = this.fpsFrameCount;
      this.fpsFrameCount = 0;
      this.fpsLastTime = currentTime;
    }

    // Performance optimization: Periodic cleanup of dead enemies to prevent array bloat
    this.frameCount++;
    if (this.frameCount % 120 === 0) { // Every 2 seconds at 60fps
      const beforeCount = this.enemies.length;
      this.enemies = this.enemies.filter(e => e.isAlive);
      const removed = beforeCount - this.enemies.length;
      if (removed > 0) {
        console.log(`🧹 Cleaned up ${removed} dead enemies (${this.enemies.length} remaining)`);
      }
    }

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
        // PERF: Simple multiplication instead of Math.pow() - much faster
        p.size *= 0.97;
        p.vy += 0.1 * clampedDelta;
      });
      this.particles = this.particles.filter((p) => p.alpha > 0 && p.lifetime < p.maxLifetime);
      this.enforcePerformanceLimits();
      this.updateScreenShake();
      this.checkCollisions();
      this.checkWaveComplete();
      return;
    }

    if (this.state !== 'playing') return;

    // Update tutorial hints
    this.hintManager.update();

    // Update animated cosmetics (rainbow, galaxy skins)
    this.cosmeticManager.update();

    const timeScale = this.slowMotionActive ? 0.5 : 1; // 50% speed for balanced slow-mo effect

    if (this.slowMotionDuration > 0) {
      this.slowMotionDuration -= clampedDelta;
      if (this.slowMotionDuration <= 0) {
        this.slowMotionActive = false;
      }
    }

    // Score multiplier countdown
    if (this.scoreMultiplierDuration > 0) {
      this.scoreMultiplierDuration -= clampedDelta;
      if (this.scoreMultiplierDuration <= 0) {
        this.scoreMultiplier = 1;
      }
    }

    this.handleInput();

    // Update player - use asteroid mode physics when in asteroid wave
    if (this.asteroidWaveActive && this.player.asteroidModeActive) {
      this.player.updateAsteroidMode(clampedDelta * timeScale);
    } else {
      this.player.update();
    }

    if (this.bossState.isBossWave) {
      this.updateBoss(clampedDelta * timeScale);
    } else if (this.asteroidWaveActive) {
      this.updateAsteroids(clampedDelta * timeScale);
    } else {
      this.updateEnemies(clampedDelta * timeScale);
    }

    this.enemyFire();
    this.spawnPowerUp();
    this.updateScreenShake();

    // Update projectiles with delta time
    // Player projectiles: normal speed (not affected by slow-mo)
    // Enemy projectiles: slowed down by timeScale
    this.projectiles = this.projectiles.filter((p) => {
      if (!p.isActive) return false;
      const projectileTimeScale = p.isPlayerProjectile ? 1 : timeScale;
      const updates = projectileTimeScale * clampedDelta;
      for (let i = 0; i < Math.floor(updates); i++) {
        p.update();
        // Apply gravity pull to enemies if gravity bullets are active
        if (p.gravity && p.isPlayerProjectile) {
          this.applyGravityPull(p);
        }
      }
      if (updates % 1 > 0) {
        p.update();
        if (p.gravity && p.isPlayerProjectile) {
          this.applyGravityPull(p);
        }
      }
      return p.position.y > -20 && p.position.y < this.canvas.height + 20;
    });

    // Update power-ups
    this.powerUps = this.powerUps.filter((p) => {
      if (!p.isActive) return false;
      p.update();
      return p.position.y < this.canvas.height + 50;
    });

    // Magnet effect - attract powerups to player
    if (this.player.magnetActive) {
      for (const powerUp of this.powerUps) {
        if (!powerUp.isActive) continue;

        const dx = this.player.position.x + this.player.size.width / 2 - (powerUp.position.x + powerUp.size.width / 2);
        const dy = this.player.position.y + this.player.size.height / 2 - (powerUp.position.y + powerUp.size.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) { // Magnet range: 200 pixels
          const pullStrength = 3;
          powerUp.velocity.x = (dx / distance) * pullStrength;
          powerUp.velocity.y = (dy / distance) * pullStrength;
        }
      }
    }

    // Update explosions
    this.explosions.forEach((e) => e.update());
    this.explosions = this.explosions.filter((e) => !e.isDone());

    // Update particles with delta time and timeScale for slow-mo effect
    this.particles.forEach((p) => {
      const deltaWithScale = clampedDelta * timeScale;
      p.x += p.vx * deltaWithScale;
      p.y += p.vy * deltaWithScale;
      p.alpha -= p.decay * clampedDelta; // Alpha fades at normal rate
      p.lifetime += clampedDelta; // Lifetime counts at normal rate
      // PERF: Simple multiplication instead of Math.pow() - much faster
      p.size *= 0.97;
      p.vy += 0.1 * deltaWithScale; // Gravity
    });
    this.particles = this.particles.filter((p) => p.alpha > 0 && p.lifetime < p.maxLifetime);

    // Enforce particle limit to prevent performance issues
    this.enforcePerformanceLimits();

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
      // === JUICE: Exit flow state when combo times out ===
      if (this.stats.combo >= 25 && this.timeDilationTarget === 1.2) {
        this.timeDilationTarget = 1.0; // Return to normal speed
      }
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

    // Update laser beam
    if (this.player.laserActive) {
      // Create continuous beam from player to top of screen
      this.laserBeam = {
        active: true,
        startX: this.player.position.x + this.player.size.width / 2,
        startY: this.player.position.y,
        endX: this.player.position.x + this.player.size.width / 2,
        endY: 0
      };

      // Check laser collision with all enemies
      for (const enemy of this.enemies) {
        if (!enemy.isAlive) continue;
        const beamX = this.laserBeam.startX;
        // Check if beam intersects enemy hitbox
        if (beamX >= enemy.position.x && beamX <= enemy.position.x + enemy.size.width) {
          if (enemy.position.y <= this.player.position.y) {
            enemy.hit();
            if (!enemy.isAlive) {
              // Handle enemy death
              this.stats.score += Math.floor(enemy.points * this.scoreMultiplier);
              this.stats.enemiesDestroyed++;
              this.registerKill(enemy.points);
              const xpReward = enemy.type === 'heavy' ? 25 : enemy.type === 'fast' ? 15 : 10;
              this.awardXP(xpReward);
              this.createExplosion(
                enemy.position.x + enemy.size.width / 2,
                enemy.position.y + enemy.size.height / 2
              );
              this.spawnDebrisParticles(
                enemy.position.x + enemy.size.width / 2,
                enemy.position.y + enemy.size.height / 2,
                enemy.color
              );
            }
          }
        }
      }

      // Check laser collision with boss minions
      for (const minion of this.bossMinions) {
        if (!minion.isAlive) continue;
        const beamX = this.laserBeam.startX;
        if (beamX >= minion.position.x && beamX <= minion.position.x + minion.size.width) {
          if (minion.position.y <= this.player.position.y) {
            minion.hit();
            if (!minion.isAlive) {
              this.stats.score += Math.floor(minion.points * this.scoreMultiplier);
              this.stats.enemiesDestroyed++;
              this.registerKill(minion.points);
              this.awardXP(15);
              this.createExplosion(
                minion.position.x + minion.size.width / 2,
                minion.position.y + minion.size.height / 2
              );
              this.spawnDebrisParticles(
                minion.position.x + minion.size.width / 2,
                minion.position.y + minion.size.height / 2,
                minion.color
              );
            }
          }
        }
      }

      // Check laser collision with boss
      if (this.boss && this.boss.isAlive) {
        const beamX = this.laserBeam.startX;
        if (beamX >= this.boss.position.x && beamX <= this.boss.position.x + this.boss.size.width) {
          if (this.boss.position.y <= this.player.position.y) {
            this.boss.hit();
            this.audioManager.playSound('boss_hit', 0.5);
            this.hapticManager.onBossHit();
            if (!this.boss.isAlive) {
              this.bossDefeated();
            }
          }
        }
      }
    } else {
      this.laserBeam = null;
    }

    this.checkCollisions();
    this.checkWaveComplete();
  }

  render() {
    this.ctx.save();
    this.ctx.translate(this.screenShake.x, this.screenShake.y);

    // === JUICE: Camera zoom effect ===
    if (this.cameraZoom !== 1.0) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      this.ctx.translate(centerX, centerY);
      this.ctx.scale(this.cameraZoom, this.cameraZoom);
      this.ctx.translate(-centerX, -centerY);
    }

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

    // Slow-mo overlay with enhanced effect - OPTIMIZED: use pre-rendered pattern
    if (this.slowMotionActive) {
      this.ctx.fillStyle = 'rgba(100, 50, 200, 0.15)';
      this.ctx.fillRect(-this.screenShake.x, -this.screenShake.y, this.canvas.width, this.canvas.height);

      // Use pre-rendered scanline pattern instead of drawing 270+ lines per frame
      if (this.scanlinePattern) {
        this.ctx.fillStyle = this.scanlinePattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    // Render particles (background layer) - OPTIMIZED: single save/restore, reduced shadow
    if (this.particles.length > 0) {
      this.ctx.save();
      // Reduced shadow blur for better performance (was 15 + size*2)
      this.ctx.shadowBlur = 8;

      for (const p of this.particles) {
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Only draw bright core for freshest particles (PERF: reduced from 0.7 to 0.9 to minimize extra draws)
        if (p.alpha > 0.9) {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.globalAlpha = (p.alpha - 0.5) * 0.4;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
      this.ctx.restore();
    }

    // Render entities with layering
    this.powerUps.forEach((p) => p.render(this.ctx));

    // FIXED: Pass filter directly to player render method to ensure it's applied inside save/restore block
    const skinFilter = this.cosmeticManager.getProcessedFilter();
    // Use asteroid mode rendering when in asteroid wave (rotated ship)
    if (this.asteroidWaveActive && this.player.asteroidModeActive) {
      this.player.renderAsteroidMode(this.ctx, this.assets?.shieldEffect, skinFilter);
    } else {
      this.player.render(this.ctx, this.assets?.shieldEffect, skinFilter);
    }

    // OPTIMIZED: Only render alive enemies (skip dead ones)
    for (const enemy of this.enemies) {
      if (enemy.isAlive) enemy.render(this.ctx);
    }

    // Render asteroids (if asteroid wave active)
    for (const asteroid of this.asteroids) {
      if (asteroid.isAlive) asteroid.render(this.ctx);
    }

    // Render asteroid wave timer (if active)
    if (this.asteroidWaveActive && this.asteroidWaveTimer > 0) {
      const timerSeconds = Math.ceil(this.asteroidWaveTimer / 60);
      this.ctx.save();
      this.ctx.fillStyle = '#22d3ee';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#22d3ee';
      this.ctx.font = 'bold 18px "Space Grotesk"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`ASTEROID FIELD: ${timerSeconds}s`, this.canvas.width / 2, 30);

      // Asteroid count
      const asteroidCount = this.asteroids.length;
      this.ctx.font = '14px "Space Grotesk"';
      this.ctx.fillStyle = '#a855f7';
      this.ctx.fillText(`${asteroidCount} asteroids remaining`, this.canvas.width / 2, 50);

      // Control hints (show for first few seconds or continuously on mobile)
      const showHints = timerSeconds > 50 || this.isMobile;
      if (showHints) {
        if (this.isMobile) {
          // MOBILE: Draw visual touch zone indicators at bottom of screen
          const zoneY = this.canvas.height - 80;
          const zoneWidth = this.canvas.width / 3;
          const zoneHeight = 60;

          // Left zone - Rotate Left
          this.ctx.fillStyle = 'rgba(236, 72, 153, 0.3)'; // Pink
          this.ctx.fillRect(0, zoneY, zoneWidth, zoneHeight);
          this.ctx.strokeStyle = '#ec4899';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(0, zoneY, zoneWidth, zoneHeight);

          // Middle zone - Thrust
          this.ctx.fillStyle = 'rgba(34, 211, 238, 0.3)'; // Cyan
          this.ctx.fillRect(zoneWidth, zoneY, zoneWidth, zoneHeight);
          this.ctx.strokeStyle = '#22d3ee';
          this.ctx.strokeRect(zoneWidth, zoneY, zoneWidth, zoneHeight);

          // Right zone - Rotate Right
          this.ctx.fillStyle = 'rgba(168, 85, 247, 0.3)'; // Purple
          this.ctx.fillRect(zoneWidth * 2, zoneY, zoneWidth, zoneHeight);
          this.ctx.strokeStyle = '#a855f7';
          this.ctx.strokeRect(zoneWidth * 2, zoneY, zoneWidth, zoneHeight);

          // Zone labels
          this.ctx.font = 'bold 16px "Space Grotesk"';
          this.ctx.fillStyle = '#ec4899';
          this.ctx.fillText('↺ LEFT', zoneWidth / 2, zoneY + 35);
          this.ctx.fillStyle = '#22d3ee';
          this.ctx.fillText('⬆ THRUST', zoneWidth * 1.5, zoneY + 35);
          this.ctx.fillStyle = '#a855f7';
          this.ctx.fillText('↻ RIGHT', zoneWidth * 2.5, zoneY + 35);

          // Instruction text
          this.ctx.font = '14px "Space Grotesk"';
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          this.ctx.fillText('TAP zones to control • Auto-fires while touching', this.canvas.width / 2, zoneY - 10);
        } else {
          // Desktop controls hint
          this.ctx.font = '14px "Space Grotesk"';
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          this.ctx.fillText('← → Rotate | ↑ Thrust | ↓ Brake | SPACE Fire', this.canvas.width / 2, 70);
        }
      }
      this.ctx.restore();
    }

    // Render minion warning trails BEFORE minions for visual layering
    for (const minion of this.bossMinions) {
      if (!minion.isAlive) continue;
      const minionWithBehavior = minion as Enemy & { behaviorType?: string };
      const behavior = minionWithBehavior.behaviorType || 'dive';

      // Only show warning trail for dive behavior when aligned and about to dive
      if (behavior === 'dive') {
        const playerCenterX = this.player.position.x + this.player.size.width / 2;
        const minionCenterX = minion.position.x + minion.size.width / 2;
        const horizontalDist = Math.abs(playerCenterX - minionCenterX);
        const playerTopY = this.player.position.y;
        const minionBottomY = minion.position.y + minion.size.height;
        const distAbovePlayer = playerTopY - minionBottomY;

        // Show warning trail when minion is aligned and about to dive
        if (horizontalDist < 50 && distAbovePlayer > 20 && distAbovePlayer < 120) {
          this.ctx.save();
          // Pulsing warning line
          const pulse = Math.sin(Date.now() * 0.02) * 0.3 + 0.5;
          this.ctx.strokeStyle = `rgba(255, 170, 0, ${pulse})`;
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([8, 8]);
          this.ctx.beginPath();
          this.ctx.moveTo(minionCenterX, minionBottomY);
          this.ctx.lineTo(minionCenterX, this.player.position.y + this.player.size.height / 2);
          this.ctx.stroke();

          // Warning target indicator at player position
          this.ctx.fillStyle = `rgba(255, 100, 0, ${pulse * 0.6})`;
          this.ctx.beginPath();
          this.ctx.arc(minionCenterX, this.player.position.y, 15, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }

    // Render minions
    for (const minion of this.bossMinions) {
      if (minion.isAlive) minion.render(this.ctx);
    }
    if (this.boss && this.boss.isAlive) {
      this.boss.render(this.ctx);
    }
    this.projectiles.forEach((projectile) => projectile.render(this.ctx));

    // Render laser beam
    if (this.laserBeam && this.laserBeam.active) {
      this.ctx.save();

      // Outer glow
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 8;
      this.ctx.shadowBlur = 30;
      this.ctx.shadowColor = '#ef4444';
      this.ctx.globalAlpha = 0.3;
      this.ctx.beginPath();
      this.ctx.moveTo(this.laserBeam.startX, this.laserBeam.startY);
      this.ctx.lineTo(this.laserBeam.endX, this.laserBeam.endY);
      this.ctx.stroke();

      // Middle beam
      this.ctx.strokeStyle = '#f87171';
      this.ctx.lineWidth = 4;
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = '#f87171';
      this.ctx.globalAlpha = 0.6;
      this.ctx.beginPath();
      this.ctx.moveTo(this.laserBeam.startX, this.laserBeam.startY);
      this.ctx.lineTo(this.laserBeam.endX, this.laserBeam.endY);
      this.ctx.stroke();

      // Core beam (bright white)
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#ffffff';
      this.ctx.globalAlpha = 0.9;
      this.ctx.beginPath();
      this.ctx.moveTo(this.laserBeam.startX, this.laserBeam.startY);
      this.ctx.lineTo(this.laserBeam.endX, this.laserBeam.endY);
      this.ctx.stroke();

      this.ctx.restore();
    }

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

      // Position: top-center, below wave - made smaller
      const fontSize = this.isMobile ? 10 : 14;
      const x = this.canvas.width / 2;
      const y = this.isMobile ? 72 : 90;

      this.ctx.font = `bold ${fontSize}px 'Space Grotesk', monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';

      // Reduced pulse - even less movement
      const pulse = 1 + Math.sin(Date.now() / 300) * 0.03;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.scale(pulse, pulse);
      this.ctx.translate(-x, -y);

      // Fill with color based on combo size
      let color = '#fbbf24'; // Default yellow
      if (this.stats.combo >= 50) color = '#a855f7'; // Purple for legendary
      else if (this.stats.combo >= 20) color = '#ec4899'; // Pink for amazing
      else if (this.stats.combo >= 10) color = '#fbbf24'; // Yellow for great

      // Reduced glow - much subtler
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = color;

      // Stroke - thinner
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.lineWidth = 1.5;
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

    // Render FPS counter if enabled
    if (this.settings.showFPS) {
      this.ctx.save();
      const fontSize = this.isMobile ? 12 : 14;
      this.ctx.font = `bold ${fontSize}px 'Space Grotesk', monospace`;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';

      // Position in top-left corner with padding
      const x = 10;
      const y = 10;

      // Color based on FPS (green = good, yellow = okay, red = bad)
      let fpsColor = '#22c55e'; // Green for 50+
      if (this.currentFPS < 30) {
        fpsColor = '#ef4444'; // Red for < 30
      } else if (this.currentFPS < 50) {
        fpsColor = '#fbbf24'; // Yellow for 30-49
      }

      // Background for readability
      const text = `FPS: ${this.currentFPS}`;
      const metrics = this.ctx.measureText(text);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.fillRect(x - 4, y - 2, metrics.width + 8, fontSize + 6);

      // FPS text with glow
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = fpsColor;
      this.ctx.fillStyle = fpsColor;
      this.ctx.fillText(text, x, y);

      this.ctx.restore();
    }

    // Render tutorial hints
    this.hintManager.render(this.ctx, this.canvas.width, this.canvas.height);

    // === JUICE: Chromatic aberration overlay effect ===
    // Creates RGB split effect on impacts by drawing colored overlays at the edges
    if (this.chromaticAberration > 0.01) {
      const intensity = this.chromaticAberration;
      const offset = intensity * 8; // Max 8px offset at full intensity

      this.ctx.save();
      this.ctx.globalCompositeOperation = 'screen';

      // Red channel shift (left)
      this.ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.15})`;
      this.ctx.fillRect(-offset, 0, this.canvas.width, this.canvas.height);

      // Blue channel shift (right)
      this.ctx.fillStyle = `rgba(0, 0, 255, ${intensity * 0.15})`;
      this.ctx.fillRect(offset, 0, this.canvas.width, this.canvas.height);

      // Vignette-style edge darkening for extra impact
      const vignette = this.ctx.createRadialGradient(
        this.canvas.width / 2, this.canvas.height / 2, 0,
        this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.3})`);
      this.ctx.globalCompositeOperation = 'multiply';
      this.ctx.fillStyle = vignette;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

    // Apply module HP boost
    const moduleHPBoost = this.moduleManager.getEffectValue('max_hp_boost');
    if (moduleHPBoost > 0) {
      this.stats.maxHealth += moduleHPBoost;
      this.stats.lives += moduleHPBoost;
    }

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
    this.resetJuiceEffects(); // Reset all juice effects on game reset
    this.lastPowerUpSpawn = 0;
    // Reset new powerup properties
    this.scoreMultiplier = 1;
    this.scoreMultiplierDuration = 0;
    this.laserBeam = null;
    this.has15ComboReward = false;
    this.has30ComboReward = false;
    this.has50ComboReward = false;
    this.tookDamageThisWave = false;
    this.boss = null;
    this.bossMinions = [];
    this.asteroids = [];
    this.asteroidWaveActive = false;
    this.asteroidWaveTimer = 0;
    this.asteroidIntroTimer = 0;
    this.currentFormation = 'grid';
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
      teleportCooldown: 0,
      chargeActive: false,
      chargeTelegraphTimer: 0,
      chargeDirection: 1,
      chargeStartX: 0,
      bombsActive: []
    };
    // Apply movement speed boost from superpower
    const superpower = this.cosmeticManager.getActiveSuperpower();
    let playerSpeed = this.config.playerSpeed;
    if (superpower.type === 'movement_speed_boost' && superpower.value) {
      playerSpeed = playerSpeed * (1 + superpower.value / 100);
    }

    this.player = new Player(this.canvas.width, this.canvas.height, playerSpeed);

    // Move spaceship up in portrait mode for better visibility
    if (this.isMobile && this.canvas.height > this.canvas.width) {
      this.player.position.y = this.canvas.height - this.player.size.height - 50; // 50px from bottom instead of 30px
    }

    if (this.assets) this.player.setImage(this.assets.playerShip);

    // Grant invulnerability at game start / checkpoint continuation
    this.player.invulnerable = true;
    this.player.invulnerabilityTimer = this.isMobile ? 45 : 60; // 0.75s mobile, 1.0s desktop

    this.initEnemies();

    // Track new game started for achievements
    this.achievementManager.trackGamePlayed();
    this.achievementManager.trackScore(0); // Reset for new game

    // Start gameplay music
    this.audioManager.playMusic('gameplay_theme', true);

    // Show tutorial hints for new players
    this.hintManager.onGameStart();

    // Notify UI about active ship and superpower (for visual feedback)
    const activeSkin = this.cosmeticManager.getActiveSkin();
    const activeSuperpower = this.cosmeticManager.getActiveSuperpower();
    if (activeSuperpower.type !== 'none') {
      window.dispatchEvent(new CustomEvent('superpower-active', {
        detail: {
          shipName: activeSkin.name,
          superpower: activeSuperpower
        }
      }));
    }
  }

  resetFromWave1() {
    // Clear checkpoint and start from wave 1
    this.lastCheckpoint = 0;
    this.saveCheckpoint();
    console.log(`🔄 Starting fresh from Wave 1`);
    this.reset();
  }

  /**
   * DEBUG: Skip to a specific wave for testing formations
   * Usage in browser console: window.debugSkipToWave(18)
   *
   * Formation availability by wave:
   * - Waves 1-5: Grid only
   * - Waves 6-10: Grid (70%) + Chevron/V (30%)
   * - Waves 11-15: Grid (50%) + Chevron (30%) + Spiral (20%)
   * - Waves 16-25: Grid (30%) + Chevron (25%) + Spiral (25%) + Swarm (20%)
   * - Waves 26+: All formations including Pincer (15%) + Diamond (10%)
   *
   * Special waves:
   * - 3, 8, 13, 18, 23...: Asteroid waves (wave % 5 === 3)
   * - 5, 10, 15, 20, 25...: Boss waves (wave % 5 === 0)
   */
  debugSkipToWave(targetWave: number) {
    if (targetWave < 1) {
      console.warn('❌ Wave must be at least 1');
      return;
    }

    console.log(`🎮 DEBUG: Skipping to Wave ${targetWave}`);
    this.stats.wave = targetWave;
    this.enemies = [];
    this.boss = null;
    this.bossMinions = [];
    this.asteroids = [];
    this.asteroidWaveActive = false;
    this.projectiles = [];
    this.powerUps = [];

    // Grant some lives for testing
    this.stats.lives = Math.max(this.stats.lives, 10);

    // Notify what type of wave this is
    if (targetWave % 5 === 0) {
      console.log(`👹 This is a BOSS wave!`);
    } else if (targetWave % 5 === 3) {
      console.log(`☄️ This is an ASTEROID wave!`);
    } else {
      console.log(`👾 Regular enemy wave - formation will be randomly selected`);
    }

    this.initEnemies();
    this.gameState = 'playing';
  }

  saveCheckpoint() {
    try {
      localStorage.setItem('alienInvasion_checkpoint', this.lastCheckpoint.toString());
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
    }
  }

  loadCheckpoint(): number {
    try {
      const checkpoint = localStorage.getItem('alienInvasion_checkpoint');
      return checkpoint ? parseInt(checkpoint, 10) : 0;
    } catch (error) {
      console.error('Failed to load checkpoint:', error);
      return 0;
    }
  }

  // Performance optimization: Create scanline pattern once instead of drawing 270+ lines per frame
  private createScanlinePattern(): CanvasPattern | null {
    try {
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 4;
      patternCanvas.height = 4;
      const patternCtx = patternCanvas.getContext('2d');
      if (!patternCtx) return null;

      // Create scanline effect: transparent top, semi-transparent line at bottom
      patternCtx.fillStyle = 'rgba(100, 50, 200, 0.1)';
      patternCtx.fillRect(0, 3, 4, 1);

      return this.ctx.createPattern(patternCanvas, 'repeat');
    } catch (error) {
      console.warn('Failed to create scanline pattern:', error);
      return null;
    }
  }

  // Performance management - enforce limits to prevent freezing
  enforcePerformanceLimits() {
    const particleOverage = this.particles.length - this.MAX_PARTICLES;
    const projectileOverage = this.projectiles.length - this.MAX_PROJECTILES;
    const explosionOverage = this.explosions.length - this.MAX_EXPLOSIONS;

    // Remove oldest particles if over limit
    if (particleOverage > 0) {
      this.particles.splice(0, particleOverage);
      console.warn(`⚠️ Particle limit reached! Removed ${particleOverage} oldest particles (${this.particles.length}/${this.MAX_PARTICLES})`);
    }

    // Remove oldest projectiles if over limit
    if (projectileOverage > 0) {
      this.projectiles.splice(0, projectileOverage);
      console.warn(`⚠️ Projectile limit reached! Removed ${projectileOverage} oldest projectiles (${this.projectiles.length}/${this.MAX_PROJECTILES})`);
    }

    // Remove oldest explosions if over limit
    if (explosionOverage > 0) {
      this.explosions.splice(0, explosionOverage);
      console.warn(`⚠️ Explosion limit reached! Removed ${explosionOverage} oldest explosions (${this.explosions.length}/${this.MAX_EXPLOSIONS})`);
    }

    // Log performance metrics every 5 seconds
    this.performanceLogTimer++;
    if (this.performanceLogTimer >= 300) { // 60 FPS * 5 seconds
      this.performanceLogTimer = 0;
      console.log(`📊 Performance: Particles: ${this.particles.length}/${this.MAX_PARTICLES}, Projectiles: ${this.projectiles.length}/${this.MAX_PROJECTILES}, Explosions: ${this.explosions.length}/${this.MAX_EXPLOSIONS}, Enemies: ${this.enemies.length}`);
    }
  }

  /**
   * PERF: Returns a spawn multiplier based on current particle count
   * - 1.0 when below 60% capacity (normal spawning)
   * - 0.5 when between 60-85% capacity (reduced spawning)
   * - 0.25 when above 85% capacity (heavy reduction)
   * - 0.0 when at max capacity (skip spawning entirely)
   */
  getParticleSpawnMultiplier(): number {
    const usage = this.particles.length / this.MAX_PARTICLES;
    if (usage >= 1.0) return 0;
    if (usage >= this.PARTICLE_THROTTLE_HEAVY) return 0.25;
    if (usage >= this.PARTICLE_THROTTLE_START) return 0.5;
    return 1.0;
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

      // Play level up sound
      this.audioManager.playSound('level_up', 0.7);

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
    this.awardStardust(5, `level_${this.stats.level}`);

    // Update module slots based on new level
    this.moduleManager.updateSlotUnlocks(this.stats.level, this.achievementManager.getProgress().bossesDefeated);

    // Trigger celebration
    if (this.levelUpCallback) {
      this.levelUpCallback(this.stats.level, upgradeText);
    }

    // Add screen shake
    this.addScreenShake(15);

    // === JUICE: Hit stop on level up ===
    this.triggerHitStop(4, true); // Bypass cooldown for level up
    this.triggerCameraZoom(1.05);
    this.triggerChromaticAberration(0.4);

    // Spawn burst particles at player
    this.spawnLevelUpParticles(
      this.player.position.x + this.player.size.width / 2,
      this.player.position.y + this.player.size.height / 2
    );
  }

  /**
   * Award stardust with module boost applied
   */
  awardStardust(amount: number, source: string) {
    const moduleStardustBoost = this.moduleManager.getEffectValue('stardust_boost');
    const boostedAmount = Math.ceil(amount * (1 + moduleStardustBoost / 100));
    this.currencyManager.earnStardust(boostedAmount, source);
  }

  spawnLevelUpParticles(x: number, y: number) {
    // PERF: Throttle spawning when particle count is high
    const spawnMultiplier = this.getParticleSpawnMultiplier();
    if (spawnMultiplier === 0) return;

    // Reduced level up burst for better performance (Option 1 optimization)
    const ringCount = this.isMobile ? 2 : 3;
    for (let ring = 0; ring < ringCount; ring++) {
      const baseParticlesInRing = this.isMobile ? 8 + ring * 4 : 15 + ring * 5;
      const particlesInRing = Math.max(4, Math.floor(baseParticlesInRing * spawnMultiplier));
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
          decay: this.isMobile ? 0.02 : 0.015,
          lifetime: 0,
          maxLifetime: this.isMobile ? 80 : 100
        });
      }
    }
  }

  getEnemyDifficultyMultiplier(): number {
    // 2% stronger per player level
    return 1 + (this.stats.level - 1) * 0.02;
  }

  // Adaptive difficulty system methods
  private loadAdaptiveDifficulty() {
    try {
      const stored = localStorage.getItem(this.ADAPTIVE_DIFFICULTY_KEY);
      this.consecutiveBossDeaths = stored ? parseInt(stored, 10) : 0;
      if (this.consecutiveBossDeaths > 0) {
        console.log(`🎮 Adaptive difficulty: ${this.consecutiveBossDeaths} consecutive boss deaths loaded`);
      }
    } catch (e) {
      this.consecutiveBossDeaths = 0;
    }
  }

  private saveAdaptiveDifficulty() {
    try {
      localStorage.setItem(this.ADAPTIVE_DIFFICULTY_KEY, this.consecutiveBossDeaths.toString());
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Called when player dies during boss fight
  onBossDeath() {
    this.consecutiveBossDeaths++;
    this.saveAdaptiveDifficulty();
    console.log(`🎮 Boss death recorded. Consecutive deaths: ${this.consecutiveBossDeaths}`);
  }

  // Called when player defeats boss
  onBossVictory() {
    if (this.consecutiveBossDeaths > 0) {
      console.log(`🎮 Boss defeated! Resetting adaptive difficulty (was: ${this.consecutiveBossDeaths} deaths)`);
      this.consecutiveBossDeaths = 0;
      this.saveAdaptiveDifficulty();
    }
  }

  // Get adaptive difficulty multipliers
  // Returns { speedMultiplier, delayMultiplier, extraPowerUps }
  getAdaptiveDifficultyModifiers() {
    // Get base difficulty from settings
    const difficultyConfig = DIFFICULTY_CONFIGS[this.settings.difficulty];
    let speedMultiplier = difficultyConfig.speedMultiplier;
    let delayMultiplier = difficultyConfig.delayMultiplier;
    let extraPowerUps = 0;

    // Apply adaptive difficulty on top of settings
    if (this.consecutiveBossDeaths >= 2) {
      if (this.consecutiveBossDeaths === 2) {
        // After 2 deaths: additional -10% speed, +20% delay
        speedMultiplier *= 0.9;
        delayMultiplier *= 1.2;
      } else {
        // After 3+ deaths: additional -20% speed, +40% delay, +1 power-up per phase
        speedMultiplier *= 0.8;
        delayMultiplier *= 1.4;
        extraPowerUps = 1;
      }
    }

    return { speedMultiplier, delayMultiplier, extraPowerUps };
  }

  getActivePowerUps() {
    return {
      plasma: { active: this.player.plasmaActive, duration: this.player.plasmaDuration },
      rapid: { active: this.player.rapidActive, duration: this.player.rapidDuration },
      shield: { active: this.player.shieldActive, duration: this.player.shieldDuration },
      slowmo: { active: this.slowMotionActive, duration: this.slowMotionDuration },
      homing: { active: this.player.homingActive, duration: this.player.homingDuration },
      laser: { active: this.player.laserActive, duration: this.player.laserDuration },
      invincibility: { active: this.player.invincibilityActive, duration: this.player.invincibilityDuration },
      freeze: { active: this.player.freezeActive, duration: this.player.freezeDuration },
      magnet: { active: this.player.magnetActive, duration: this.player.magnetDuration },
      multiplier: { active: this.scoreMultiplier > 1, duration: this.scoreMultiplierDuration }
    };
  }

  // ============================================================================
  // JUICE EFFECTS SYSTEM
  // ============================================================================

  /**
   * Update all juice effects (called every frame, even during hit stop)
   */
  updateJuiceEffects(deltaTime: number): void {
    // Decay chromatic aberration
    if (this.chromaticAberration > 0) {
      this.chromaticAberration *= 0.9; // Decay by 10% per frame
      if (this.chromaticAberration < 0.01) {
        this.chromaticAberration = 0;
      }
    }

    // Lerp time dilation towards target
    if (this.timeDilation !== this.timeDilationTarget) {
      const lerpSpeed = 0.15;
      this.timeDilation += (this.timeDilationTarget - this.timeDilation) * lerpSpeed;
      if (Math.abs(this.timeDilation - this.timeDilationTarget) < 0.01) {
        this.timeDilation = this.timeDilationTarget;
      }
    }

    // Lerp camera zoom towards target
    if (this.cameraZoom !== this.cameraZoomTarget) {
      const lerpSpeed = 0.12;
      this.cameraZoom += (this.cameraZoomTarget - this.cameraZoom) * lerpSpeed;
      if (Math.abs(this.cameraZoom - this.cameraZoomTarget) < 0.005) {
        this.cameraZoom = this.cameraZoomTarget;
      }
    }

    // Countdown near-miss timer
    if (this.nearMissTimer > 0) {
      this.nearMissTimer -= deltaTime;
    }

    // Countdown hit stop cooldown (prevents rapid-fire stutter)
    if (this.hitStopCooldown > 0) {
      this.hitStopCooldown--;
    }
  }

  /**
   * Trigger hit stop (frame freeze) for dramatic moments
   * @param frames Number of frames to freeze (2-4 recommended)
   * @param bypassCooldown Set to true for important events (player hit, boss, combos)
   */
  triggerHitStop(frames: number, bypassCooldown: boolean = false): void {
    // Regular kills respect cooldown to prevent rapid-fire stutter (laser, etc.)
    if (!bypassCooldown && this.hitStopCooldown > 0) {
      return; // Skip hit stop during cooldown
    }
    // Only apply hit stop if not already active or if this is stronger
    if (frames > this.hitStopFrames) {
      this.hitStopFrames = frames;
      // Set cooldown for regular kills (18 frames = ~300ms at 60fps)
      if (!bypassCooldown) {
        this.hitStopCooldown = 18;
      }
    }
  }

  /**
   * Trigger chromatic aberration (RGB split effect)
   * @param intensity Intensity of the effect (0-1, where 1 is strong)
   */
  triggerChromaticAberration(intensity: number): void {
    // Take the maximum of current and new intensity
    this.chromaticAberration = Math.max(this.chromaticAberration, Math.min(intensity, 1));
  }

  /**
   * Trigger camera zoom pulse for impact moments
   * @param targetZoom Target zoom level (1.0 = normal, 1.02-1.05 recommended)
   */
  triggerCameraZoom(targetZoom: number): void {
    // Only zoom in further, not out
    if (targetZoom > this.cameraZoomTarget) {
      this.cameraZoomTarget = targetZoom;
      // Immediately start returning to normal after a brief hold
      setTimeout(() => {
        this.cameraZoomTarget = 1.0;
      }, 50); // 50ms hold at peak zoom
    }
  }

  /**
   * Trigger time dilation for dramatic slow/speed effects
   * @param targetSpeed Target time scale (0.3 = slow, 1.0 = normal, 1.2 = fast)
   * @param duration Duration in frames before returning to normal
   */
  triggerTimeDilation(targetSpeed: number, duration: number): void {
    this.timeDilationTarget = targetSpeed;
    // Return to normal speed after duration
    setTimeout(() => {
      this.timeDilationTarget = 1.0;
    }, duration * (1000 / 60)); // Convert frames to ms
  }

  /**
   * Reset all juice effects (called on game reset)
   */
  resetJuiceEffects(): void {
    this.hitStopFrames = 0;
    this.hitStopCooldown = 0;
    this.chromaticAberration = 0;
    this.timeDilation = 1.0;
    this.timeDilationTarget = 1.0;
    this.cameraZoom = 1.0;
    this.cameraZoomTarget = 1.0;
    this.nearMissTimer = 0;
  }

  cleanup() {
    if (this.autoFireInterval) {
      clearTimeout(this.autoFireInterval);
    }
  }
}// Build trigger: 1768059093
// Build trigger: 1768114971
