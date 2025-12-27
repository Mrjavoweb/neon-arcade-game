import { Player, Enemy, Boss, Projectile, ExplosionAnimation, PowerUpEntity } from './entities';
import { GameState, GameStats, GameConfig, Particle, SpriteAssets, BossState } from './types';

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
  slowMotionActive: boolean;
  slowMotionDuration: number;
  lastPowerUpSpawn: number;
  powerUpSpawnRate: number;
  bossState: BossState;
  levelUpCallback?: (level: number, upgrade: string) => void;
  pendingLevelUp: boolean;

  constructor(canvas: HTMLCanvasElement, isMobile: boolean) {
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
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.slowMotionActive = false;
    this.slowMotionDuration = 0;
    this.lastPowerUpSpawn = 0;
    this.powerUpSpawnRate = 15000; // 15 seconds
    this.pendingLevelUp = false;

    this.stats = {
      score: 0,
      lives: 3,
      wave: 1,
      enemiesDestroyed: 0,
      xp: 0,
      level: 1,
      maxHealth: 3,
      fireRateBonus: 0,
      movementSpeedBonus: 0
    };

    this.config = {
      playerSpeed: 7,
      projectileSpeed: 10,
      enemySpeed: 0.8,
      enemyFireRate: 2000,
      enemyDescendAmount: 20,
      initialLives: 3
    };

    this.enemySpeed = this.config.enemySpeed;
    this.enemyFireRate = this.config.enemyFireRate;

    this.player = new Player(canvas.width, canvas.height, this.config.playerSpeed);
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

    this.initEnemies();
    this.setupControls();
  }

  async loadAssets(): Promise<void> {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
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
      explosion,
      powerUpPlasma,
      powerUpRapid,
      powerUpShield,
      powerUpSlowmo,
      shieldEffect] =
      await Promise.all([
      loadImage('/assets/f3b62150-4a75-4f79-a287-beb738d7988f.webp'),
      loadImage('/assets/95d93858-1da2-4410-bc6d-7c97a81a2690.webp'),
      loadImage('/assets/b6b8921b-cb05-4c7c-9637-17e8f8199206.webp'),
      loadImage('/assets/0ee5fdad-b7fc-40b7-b71b-5785189cd229.webp'),
      loadImage('/assets/038a876a-d68c-4444-b8b0-2ae9ab25580c.webp'),
      loadImage('/assets/bf008940-7261-4765-8c6d-32086670999c.webp'),
      loadImage('/assets/652b9540-094e-4c3a-b9b9-64f112b28744.webp'),
      loadImage('/assets/30aacb08-5108-4c70-8580-1823f93620ed.webp'),
      loadImage('/assets/c52e69ca-3469-4246-88ce-38a9fde77993.webp'),
      loadImage('/assets/f825721c-8221-4dff-919b-1365add27ab7.webp'),
      loadImage('/assets/969a16ba-05c1-4406-8632-b5809c2e3b85.webp')]
      );

      this.assets = {
        playerShip,
        alienBasic,
        alienHeavy,
        alienFast,
        bossAlien,
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
      this.bossState.bossIntroTimer = 120; // 2 seconds intro (auto-dismiss)
      // Keep game state as 'playing' - don't block gameplay
      this.slowMotionActive = false; // Don't slow down during intro
      this.slowMotionDuration = 0;

      this.boss = new Boss(this.canvas.width / 2 - 60, -150, wave);
      if (this.assets) this.boss.setImage(this.assets.bossAlien);

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

    const rows = Math.min(5 + Math.floor(wave / 3), 7);
    const cols = 8;
    const enemyWidth = 40;
    const enemyHeight = 40;
    const padding = 15;
    const offsetX = (this.canvas.width - cols * (enemyWidth + padding)) / 2;
    const offsetY = Math.max(80, this.canvas.height * 0.1);

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
        this.projectiles.push(projectile);
      });
    } else {
      const projectile = new Projectile(
        this.player.position.x + this.player.size.width / 2 - 2,
        this.player.position.y,
        true,
        this.config.projectileSpeed
      );
      this.projectiles.push(projectile);
    }
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

  spawnPowerUp() {
    const now = Date.now();
    if (now - this.lastPowerUpSpawn < this.powerUpSpawnRate) return;
    if (Math.random() < 0.3) return; // 30% chance

    this.lastPowerUpSpawn = now;

    const types: Array<'plasma' | 'rapid' | 'shield' | 'slowmo'> = ['plasma', 'rapid', 'shield', 'slowmo'];
    const type = types[Math.floor(Math.random() * types.length)];
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

  updateBoss() {
    if (!this.boss || !this.boss.isAlive) return;

    // Boss intro - descend slowly (non-blocking)
    if (this.bossState.bossIntroTimer > 0) {
      this.bossState.bossIntroTimer--;
      if (this.boss.position.y < 80) {
        this.boss.position.y += 0.7;
      }
      // Don't return - allow boss to start attacking during descent
    }

    this.boss.update(this.canvas.width);
    this.bossState.bossHealth = this.boss.health;
    this.bossState.bossPhase = this.boss.phase;

    // Boss attacks
    const now = Date.now();
    const attackDelay = this.boss.phase === 'phase4' ? 800 :
    this.boss.phase === 'phase3' ? 1200 :
    this.boss.phase === 'phase2' ? 1600 : 2000;

    if (now - this.bossState.lastAttackTime > attackDelay) {
      this.bossState.lastAttackTime = now;
      this.executeBossAttack();
    }

    // Update minions
    this.bossMinions = this.bossMinions.filter((m) => m.isAlive);
    this.bossMinions.forEach((minion) => {
      minion.update(this.enemySpeed * this.enemyDirection * 0.5, 0);
    });

    // Teleport cooldown
    if (this.bossState.teleportCooldown > 0) {
      this.bossState.teleportCooldown--;
    }
  }

  executeBossAttack() {
    if (!this.boss) return;

    // Choose attack pattern based on phase
    const patterns: Array<'spread' | 'laser' | 'teleport' | 'summon'> = ['spread'];

    if (this.boss.phase === 'phase2' || this.boss.phase === 'phase3' || this.boss.phase === 'phase4') {
      patterns.push('laser');
    }
    if (this.boss.phase === 'phase3' || this.boss.phase === 'phase4') {
      if (this.bossState.teleportCooldown === 0) patterns.push('teleport');
    }
    if (this.boss.phase === 'phase4') {
      if (this.bossMinions.length < 4) patterns.push('summon', 'summon'); // Higher chance
    }

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
      case 'summon':
        this.bossSummonMinions();
        break;
    }
  }

  bossSpreadShot() {
    if (!this.boss) return;

    const angles = this.boss.phase === 'phase4' ? 9 :
    this.boss.phase === 'phase3' ? 7 : 5;
    const spread = Math.PI / 3;
    const startAngle = Math.PI / 2 - spread / 2;

    for (let i = 0; i < angles; i++) {
      const angle = startAngle + spread * i / (angles - 1);
      const projectile = new Projectile(
        this.boss.position.x + this.boss.size.width / 2,
        this.boss.position.y + this.boss.size.height,
        false,
        8
      );
      projectile.velocity.x = Math.cos(angle) * 8;
      projectile.velocity.y = Math.sin(angle) * 8;
      projectile.color = '#ff0000';
      this.projectiles.push(projectile);
    }
  }

  bossLaserBeam() {
    if (!this.boss) return;

    // Create vertical laser beam
    for (let i = 0; i < 20; i++) {
      const projectile = new Projectile(
        this.boss.position.x + this.boss.size.width / 2 - 10 + (Math.random() - 0.5) * 20,
        this.boss.position.y + this.boss.size.height + i * 10,
        false,
        12
      );
      projectile.size.width = 8;
      projectile.size.height = 20;
      projectile.color = '#ff6600';
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

    this.bossState.teleportCooldown = 300; // 5 second cooldown
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
      if (this.boss && this.boss.isAlive && this.bossState.bossIntroTimer === 0) {
        if (this.checkCollision(projectile.getBounds(), this.boss.getBounds())) {
          projectile.deactivate();
          this.boss.hit(1);

          if (!this.boss.isAlive) {
            // Boss defeated!
            this.stats.score += this.boss.points * 5; // 5x score
            this.stats.enemiesDestroyed++;
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
            this.bossState.bossVictoryTimer = 120; // 2 second victory pause
            this.state = 'bossVictory';
          } else {
            this.createImpactParticles(this.boss.position.x + this.boss.size.width / 2, this.boss.position.y + this.boss.size.height / 2, '#ffff00');
            this.addScreenShake(5);
          }
          break;
        }
      }
    }

    // Enemy projectiles vs player
    if (!this.player.shieldActive) {
      for (const projectile of this.projectiles) {
        if (!projectile.isActive || projectile.isPlayerProjectile) continue;

        if (this.checkCollision(projectile.getBounds(), this.player.getBounds())) {
          projectile.deactivate();
          this.hitPlayer();
          this.createExplosion(
            this.player.position.x + this.player.size.width / 2,
            this.player.position.y + this.player.size.height / 2
          );
          this.addScreenShake(12);
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
        this.slowMotionDuration = 300; // 5 seconds
        break;
    }
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
  }

  createExplosion(x: number, y: number) {
    if (this.assets) {
      this.explosions.push(new ExplosionAnimation(x, y, this.assets.explosion));
    }
  }

  createImpactParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.PI * 2 * i / 15;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        decay: 0.05,
        lifetime: 0,
        maxLifetime: 30
      });
    }
  }

  spawnDebrisParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color,
        alpha: 1,
        decay: 0.02,
        lifetime: 0,
        maxLifetime: 60
      });
    }
  }

  createCollectParticles(x: number, y: number) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: '#10b981',
        alpha: 1,
        decay: 0.04,
        lifetime: 0,
        maxLifetime: 40
      });
    }
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
    // Boss wave completion
    if (this.bossState.isBossWave) {
      if (this.boss && !this.boss.isAlive && this.bossMinions.filter((m) => m.isAlive).length === 0) {
        if (this.bossState.bossVictoryTimer > 0) {
          this.bossState.bossVictoryTimer--;
          return;
        }
        this.nextWave();
      }
      return;
    }

    // Normal wave completion
    const aliveEnemies = this.enemies.filter((e) => e.isAlive);
    if (aliveEnemies.length === 0) {
      this.nextWave();
    }
  }

  nextWave() {
    this.stats.wave++;
    this.enemySpeed += 0.3;
    this.enemyFireRate = Math.max(1000, this.enemyFireRate - 200);
    this.initEnemies();
    this.projectiles = [];
  }

  update() {
    // Handle boss victory state
    if (this.state === 'bossVictory') {
      if (this.bossState.bossVictoryTimer > 0) {
        this.bossState.bossVictoryTimer--;
      }
      this.player.update();
      this.powerUps.forEach((p) => p.update());
      this.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.lifetime++;
        p.size *= 0.97;
        p.vy += 0.1;
      });
      this.particles = this.particles.filter((p) => p.alpha > 0 && p.lifetime < p.maxLifetime);
      this.updateScreenShake();
      this.checkCollisions();
      this.checkWaveComplete();
      return;
    }

    if (this.state !== 'playing') return;

    const timeScale = this.slowMotionActive ? 0.5 : 1;

    if (this.slowMotionDuration > 0) {
      this.slowMotionDuration--;
      if (this.slowMotionDuration <= 0) this.slowMotionActive = false;
    }

    this.handleInput();
    this.player.update();

    if (this.bossState.isBossWave) {
      this.updateBoss();
    } else {
      this.updateEnemies();
    }

    this.enemyFire();
    this.spawnPowerUp();
    this.updateScreenShake();

    // Update projectiles
    this.projectiles = this.projectiles.filter((p) => {
      if (!p.isActive) return false;
      for (let i = 0; i < timeScale; i++) p.update();
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

    // Update particles
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.lifetime++;
      p.size *= 0.97;
      p.vy += 0.1; // Gravity
    });
    this.particles = this.particles.filter((p) => p.alpha > 0 && p.lifetime < p.maxLifetime);

    this.checkCollisions();
    this.checkWaveComplete();
  }

  render() {
    this.ctx.save();
    this.ctx.translate(this.screenShake.x, this.screenShake.y);

    // Clear canvas
    this.ctx.fillStyle = '#0a0014';
    this.ctx.fillRect(-this.screenShake.x, -this.screenShake.y, this.canvas.width, this.canvas.height);

    // Slow-mo overlay
    if (this.slowMotionActive) {
      this.ctx.fillStyle = 'rgba(100, 50, 200, 0.1)';
      this.ctx.fillRect(-this.screenShake.x, -this.screenShake.y, this.canvas.width, this.canvas.height);
    }

    // Render particles (background layer)
    this.particles.forEach((p) => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Render entities
    this.powerUps.forEach((p) => p.render(this.ctx));
    this.player.render(this.ctx, this.assets?.shieldEffect);
    this.enemies.forEach((enemy) => enemy.render(this.ctx));
    this.bossMinions.forEach((minion) => minion.render(this.ctx));
    if (this.boss && this.boss.isAlive) {
      this.boss.render(this.ctx);
    }
    this.projectiles.forEach((projectile) => projectile.render(this.ctx));
    this.explosions.forEach((explosion) => explosion.render(this.ctx));

    this.ctx.restore();
  }

  reset() {
    this.stats = {
      score: 0,
      lives: 3,
      wave: 1,
      enemiesDestroyed: 0,
      xp: 0,
      level: 1,
      maxHealth: 3,
      fireRateBonus: 0,
      movementSpeedBonus: 0
    };
    this.fireDelay = 300;
    this.config.playerSpeed = 7;
    this.enemySpeed = this.config.enemySpeed;
    this.enemyFireRate = this.config.enemyFireRate;
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
    if (this.assets) this.player.setImage(this.assets.playerShip);
    this.initEnemies();
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
        // +1 max health
        this.stats.maxHealth++;
        this.stats.lives = Math.min(this.stats.lives + 1, this.stats.maxHealth);
        upgradeText = '+1 Max Health';
        break;
    }

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
    for (let i = 0; i < 50; i++) {
      const angle = Math.PI * 2 * i / 50;
      const speed = 3 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: ['#fbbf24', '#f59e0b', '#a855f7', '#22d3ee'][Math.floor(Math.random() * 4)],
        alpha: 1,
        decay: 0.02,
        lifetime: 0,
        maxLifetime: 80
      });
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