import { Position, Size, Velocity, Particle, PowerUp } from './types';

export class Player {
  position: Position;
  size: Size;
  velocity: Velocity;
  color: string;
  speed: number;
  canvasWidth: number;
  image?: HTMLImageElement;
  shieldActive: boolean;
  shieldDuration: number;
  plasmaActive: boolean;
  plasmaDuration: number;
  rapidActive: boolean;
  rapidDuration: number;
  engineParticles: Particle[];
  level: number;
  invulnerable: boolean;
  invulnerabilityTimer: number;
  private filteredImageCache: Map<string, HTMLCanvasElement> = new Map();
  private _fallbackWarningShown: boolean = false;

  constructor(canvasWidth: number, canvasHeight: number, speed: number) {
    this.size = { width: 50, height: 50 };
    this.level = 1;
    this.position = {
      x: canvasWidth / 2 - this.size.width / 2,
      y: canvasHeight - this.size.height - 30
    };
    this.velocity = { x: 0, y: 0 };
    this.color = '#22d3ee';
    this.speed = speed;
    this.canvasWidth = canvasWidth;
    this.shieldActive = false;
    this.shieldDuration = 0;
    this.plasmaActive = false;
    this.plasmaDuration = 0;
    this.rapidActive = false;
    this.rapidDuration = 0;
    this.engineParticles = [];
    this.invulnerable = false;
    this.invulnerabilityTimer = 0;
  }

  setImage(img: HTMLImageElement) {
    if (!img) {
      console.error('❌ Player.setImage called with null/undefined image');
      return;
    }
    if (!img.complete || img.naturalWidth === 0) {
      console.warn('⚠️ Player image not fully loaded:', {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        src: img.src?.substring(0, 60)
      });
    }
    this.image = img;
    console.log('✅ Player image set successfully:', {
      size: `${img.width}x${img.height}`,
      complete: img.complete
    });
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.x = Math.max(0, Math.min(this.canvasWidth - this.size.width, this.position.x));

    // Update power-ups
    if (this.shieldDuration > 0) {
      this.shieldDuration--;
      if (this.shieldDuration <= 0) this.shieldActive = false;
    }
    if (this.plasmaDuration > 0) {
      this.plasmaDuration--;
      if (this.plasmaDuration <= 0) this.plasmaActive = false;
    }
    if (this.rapidDuration > 0) {
      this.rapidDuration--;
      if (this.rapidDuration <= 0) this.rapidActive = false;
    }

    // Update invulnerability
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer <= 0) this.invulnerable = false;
    }

    // Generate enhanced engine trail particles
    if (Math.random() < 0.7) {
      const colors = this.shieldActive ? ['#a855f7', '#c084fc', '#ffffff'] : ['#22d3ee', '#06b6d4', '#ffffff'];
      this.engineParticles.push({
        x: this.position.x + this.size.width / 2 + (Math.random() - 0.5) * 25,
        y: this.position.y + this.size.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 2 + Math.random() * 3,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        decay: 0.025,
        lifetime: 0,
        maxLifetime: 35
      });
    }

    // Update engine particles
    this.engineParticles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.lifetime++;
      p.size *= 0.97;
    });
    this.engineParticles = this.engineParticles.filter((p) => p.alpha > 0 && p.lifetime < p.maxLifetime);
  }

  render(ctx: CanvasRenderingContext2D, shieldImage?: HTMLImageElement, skinFilter?: string) {
    // Render enhanced engine particles first
    this.engineParticles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 20 + p.size * 2;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Add bright core
      if (p.alpha > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = (p.alpha - 0.5) * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    ctx.save();

    // CRITICAL FIX: Apply filter here, inside the save/restore block
    if (skinFilter && skinFilter !== 'none' && skinFilter !== 'undefined') {
      ctx.filter = skinFilter;
    } else {
      // Explicitly set to 'none' if no filter
      ctx.filter = 'none';
    }

    // Invulnerability flashing effect
    if (this.invulnerable) {
      const flashAlpha = Math.sin(Date.now() / 50) * 0.5 + 0.5; // Flash between 0.5 and 1.0
      ctx.globalAlpha = flashAlpha;
    }

    // Level glow indicator
    const glowIntensity = 15 + this.level * 2;
    const glowColor = this.level >= 10 ? '#a855f7' :
    this.level >= 7 ? '#f59e0b' :
    this.level >= 4 ? '#22d3ee' : '#10b981';

    if (this.image && this.image.complete && this.image.naturalWidth > 0) {
      // Draw sprite with level-based glow
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = this.shieldActive ? '#a855f7' : glowColor;

      // WORKAROUND: Use offscreen canvas to apply filter to image
      if (skinFilter && skinFilter !== 'none') {
        try {
          // Check cache first
          let filteredCanvas = this.filteredImageCache.get(skinFilter);

          if (!filteredCanvas) {
            // Create offscreen canvas with filter applied
            filteredCanvas = document.createElement('canvas');
            filteredCanvas.width = this.image.width;
            filteredCanvas.height = this.image.height;
            const offscreenCtx = filteredCanvas.getContext('2d');

            if (!offscreenCtx) {
              throw new Error('Failed to get offscreen context');
            }

            // Apply filter and draw image to offscreen canvas
            offscreenCtx.filter = skinFilter;
            offscreenCtx.drawImage(this.image, 0, 0);

            // Cache it for better performance
            this.filteredImageCache.set(skinFilter, filteredCanvas);
          }

          // Draw the filtered canvas
          ctx.drawImage(
            filteredCanvas,
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height
          );
        } catch (error) {
          // Fallback to direct image drawing if filter fails
          console.warn('Filter rendering failed, using direct image:', error);
          ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height
          );
        }
      } else {
        // No filter - draw original image
        ctx.drawImage(
          this.image,
          this.position.x,
          this.position.y,
          this.size.width,
          this.size.height
        );
      }
    } else {
      // Fallback triangle (only used if image fails to load)
      if (!this._fallbackWarningShown) {
        console.warn('⚠️ Using fallback triangle for player ship - image not loaded', {
          hasImage: !!this.image,
          imageComplete: this.image?.complete,
          imageNaturalWidth: this.image?.naturalWidth
        });
        this._fallbackWarningShown = true;
      }
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowIntensity;
      ctx.beginPath();
      ctx.moveTo(this.position.x + this.size.width / 2, this.position.y);
      ctx.lineTo(this.position.x, this.position.y + this.size.height);
      ctx.lineTo(this.position.x + this.size.width, this.position.y + this.size.height);
      ctx.closePath();
      ctx.fill();
    }

    // Level badge
    if (this.level > 1) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(this.position.x + this.size.width - 10, this.position.y + 10, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = glowColor;
      ctx.shadowBlur = 5;
      ctx.shadowColor = glowColor;
      ctx.font = 'bold 12px "Space Grotesk"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.level.toString(), this.position.x + this.size.width - 10, this.position.y + 10);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    // Shield overlay
    if (this.shieldActive && shieldImage) {
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.2;
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#a855f7';
      ctx.drawImage(
        shieldImage,
        this.position.x - 15,
        this.position.y - 15,
        this.size.width + 30,
        this.size.height + 30
      );
    }

    ctx.restore();
  }

  getBounds() {
    return {
      left: this.position.x,
      right: this.position.x + this.size.width,
      top: this.position.y,
      bottom: this.position.y + this.size.height
    };
  }

  moveLeft() {
    this.velocity.x = -this.speed;
  }

  moveRight() {
    this.velocity.x = this.speed;
  }

  stop() {
    this.velocity.x = 0;
  }

  setPosition(x: number) {
    this.position.x = Math.max(0, Math.min(this.canvasWidth - this.size.width, x - this.size.width / 2));
  }

  activateShield(bonusDuration: number = 0, percentBoost: number = 0) {
    this.shieldActive = true;
    let baseDuration = 480; // 8 seconds at 60fps (balanced from 10s)
    if (percentBoost > 0) {
      baseDuration = baseDuration * (1 + percentBoost / 100);
    }
    this.shieldDuration = baseDuration + bonusDuration;
  }

  activatePlasma(bonusDuration: number = 0) {
    this.plasmaActive = true;
    this.plasmaDuration = 420 + bonusDuration; // 7 seconds + bonus
  }

  activateRapid(bonusDuration: number = 0) {
    this.rapidActive = true;
    this.rapidDuration = 420 + bonusDuration; // 7 seconds + bonus
  }
}

export class Boss {
  position: Position;
  size: Size;
  color: string;
  isAlive: boolean;
  points: number;
  image?: HTMLImageElement;
  health: number;
  maxHealth: number;
  wobbleOffset: number;
  wobbleSpeed: number;
  moveSpeed: number;
  moveDirection: number;
  phase: 'phase1' | 'phase2' | 'phase3' | 'phase4';
  flashTimer: number;
  targetX: number;
  smoothing: number;

  constructor(x: number, y: number, wave: number) {
    this.position = { x, y };
    this.targetX = x;
    this.smoothing = 0.15;
    this.isAlive = true;
    this.wobbleOffset = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.08;
    this.phase = 'phase1';
    this.flashTimer = 0;

    // Scale with wave difficulty - progressive scaling for sustained challenge
    // Wave 5: 60 HP | Wave 10: 90 HP | Wave 15: 126 HP | Wave 20: 168 HP
    const bossNumber = Math.floor(wave / 5); // 1st boss, 2nd boss, 3rd boss...
    const healthMultiplier = 1 + (bossNumber - 1) * 0.5; // +50% per boss encounter

    // Movement speed increases with each boss encounter
    this.moveSpeed = 2 + (bossNumber - 1) * 0.3; // Boss 1: 2.0 | Boss 2: 2.3 | Boss 3: 2.6
    this.moveDirection = 1;

    this.size = { width: 120, height: 120 }; // 2.5-3x normal alien
    this.color = '#dc2626';
    this.points = 500 + (bossNumber - 1) * 250; // Points scale with difficulty
    this.health = Math.floor(60 * healthMultiplier);
    this.maxHealth = this.health;
  }

  setImage(img: HTMLImageElement) {
    this.image = img;
  }

  update(canvasWidth: number) {
    // Smooth horizontal movement with lerp
    this.targetX += this.moveSpeed * this.moveDirection;

    // Bounce at edges
    if (this.targetX <= 0 || this.targetX + this.size.width >= canvasWidth) {
      this.moveDirection *= -1;
      this.targetX = Math.max(0, Math.min(canvasWidth - this.size.width, this.targetX));
    }

    // Smooth interpolation to target
    this.position.x += (this.targetX - this.position.x) * this.smoothing;

    this.wobbleOffset += this.wobbleSpeed;

    if (this.flashTimer > 0) {
      this.flashTimer--;
    }

    // Update phase based on health
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent <= 0.25) this.phase = 'phase4';else
    if (healthPercent <= 0.5) this.phase = 'phase3';else
    if (healthPercent <= 0.75) this.phase = 'phase2';
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.isAlive) return;

    const wobble = Math.sin(this.wobbleOffset) * 5;
    const breathe = 1 + Math.sin(this.wobbleOffset * 0.5) * 0.05;

    ctx.save();
    ctx.translate(wobble, 0);

    // Glow based on phase
    const phaseColors = {
      phase1: '#dc2626',
      phase2: '#06b6d4',
      phase3: '#eab308',
      phase4: '#a855f7'
    };

    const phaseGlowIntensity = {
      phase1: 35,
      phase2: 40,
      phase3: 45,
      phase4: 55
    };

    // Flash effect when hit
    if (this.flashTimer > 0 && Math.floor(this.flashTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Apply breathing scale
    ctx.translate(this.position.x + this.size.width / 2, this.position.y + this.size.height / 2);
    ctx.scale(breathe, breathe);
    ctx.translate(-(this.position.x + this.size.width / 2), -(this.position.y + this.size.height / 2));

    if (this.image) {
      // Subtle glow effect without creating a frame
      ctx.shadowBlur = 20;
      ctx.shadowColor = phaseColors[this.phase];

      ctx.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.size.width,
        this.size.height
      );
    } else {
      // Fallback if no image - draw colored rectangle
      ctx.fillStyle = phaseColors[this.phase];
      ctx.shadowBlur = phaseGlowIntensity[this.phase];
      ctx.shadowColor = phaseColors[this.phase];
      ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    }

    ctx.restore();
  }

  getBounds() {
    return {
      left: this.position.x,
      right: this.position.x + this.size.width,
      top: this.position.y,
      bottom: this.position.y + this.size.height
    };
  }

  hit(damage: number = 1) {
    this.health -= damage;
    this.flashTimer = 15;
    if (this.health <= 0) {
      this.isAlive = false;
    }
  }

  getHealthPercent(): number {
    return this.health / this.maxHealth;
  }
}

export class Enemy {
  position: Position;
  size: Size;
  color: string;
  isAlive: boolean;
  points: number;
  type: 'basic' | 'heavy' | 'fast';
  image?: HTMLImageElement;
  health: number;
  maxHealth: number;
  wobbleOffset: number;
  wobbleSpeed: number;
  speedMultiplier: number; // Movement speed modifier based on type

  constructor(x: number, y: number, type: 'basic' | 'heavy' | 'fast' = 'basic', difficultyMultiplier: number = 1) {
    this.position = { x, y };
    this.type = type;
    this.isAlive = true;
    this.wobbleOffset = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.05 + Math.random() * 0.05;

    switch (type) {
      case 'heavy':
        this.size = { width: 45, height: 45 };
        this.color = '#f97316';
        this.points = Math.floor(30 * difficultyMultiplier);
        this.health = Math.ceil(2 * difficultyMultiplier);
        this.maxHealth = this.health;
        this.speedMultiplier = 0.7; // Heavy enemies move 30% slower
        break;
      case 'fast':
        this.size = { width: 32, height: 32 };
        this.color = '#eab308';
        this.points = Math.floor(20 * difficultyMultiplier);
        this.health = Math.max(1, Math.floor(1 * difficultyMultiplier));
        this.maxHealth = this.health;
        this.speedMultiplier = 1.4; // Fast enemies move 40% faster
        break;
      default:
        this.size = { width: 40, height: 40 };
        this.color = '#ec4899';
        this.points = Math.floor(10 * difficultyMultiplier);
        this.health = Math.max(1, Math.floor(1 * difficultyMultiplier));
        this.maxHealth = this.health;
        this.speedMultiplier = 1.0; // Basic enemies move at base speed
    }
  }

  setImage(img: HTMLImageElement) {
    this.image = img;
  }

  update(dx: number, dy: number) {
    this.position.x += dx;
    this.position.y += dy;
    this.wobbleOffset += this.wobbleSpeed;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.isAlive) return;

    const wobble = Math.sin(this.wobbleOffset) * 3;
    const float = Math.sin(this.wobbleOffset * 0.7) * 2;

    ctx.save();
    ctx.translate(wobble, float);

    // Enhanced glow based on type
    const glowIntensity = this.type === 'heavy' ? 25 : this.type === 'fast' ? 18 : 20;

    if (this.image) {
      ctx.shadowBlur = glowIntensity + Math.sin(Date.now() / 100) * 5;
      ctx.shadowColor = this.color;

      // Flash effect if damaged
      if (this.health < this.maxHealth) {
        const flashAlpha = 0.6 + Math.sin(Date.now() / 50) * 0.4;
        ctx.globalAlpha = flashAlpha;

        // Add red tint when damaged
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff0000';
      }

      ctx.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.size.width,
        this.size.height
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = this.color;
      ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    }

    // Enhanced health bar for heavy enemies
    if (this.maxHealth > 1) {
      const barWidth = this.size.width;
      const barHeight = 5;
      const healthPercent = this.health / this.maxHealth;

      // Background with glow
      ctx.shadowBlur = 5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(this.position.x, this.position.y - 12, barWidth, barHeight);

      // Health bar with gradient
      const healthColor = healthPercent > 0.5 ? '#10b981' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.shadowBlur = 8;
      ctx.shadowColor = healthColor;
      ctx.fillStyle = healthColor;
      ctx.fillRect(this.position.x, this.position.y - 12, barWidth * healthPercent, barHeight);

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.position.x, this.position.y - 12, barWidth, barHeight);
    }

    ctx.restore();
  }

  getBounds() {
    return {
      left: this.position.x,
      right: this.position.x + this.size.width,
      top: this.position.y,
      bottom: this.position.y + this.size.height
    };
  }

  hit() {
    this.health--;
    if (this.health <= 0) {
      this.isAlive = false;
    }
  }
}

export class Projectile {
  position: Position;
  size: Size;
  velocity: Velocity;
  color: string;
  isActive: boolean;
  isPlayerProjectile: boolean;
  trailParticles: Particle[];
  damage: number; // 1 = 1 life, 2 = 2 lives, 999 = instant kill
  piercing: boolean; // Piercing shots - penetrate first enemy
  explosive: boolean; // Explosive rounds - create explosion on impact
  gravity: boolean; // Gravity bullets - pull enemies
  piercedEnemies: number; // Track how many enemies this bullet has pierced

  constructor(x: number, y: number, isPlayerProjectile: boolean, speed: number, damage: number = 999) {
    this.position = { x, y };
    this.size = { width: 4, height: 15 };
    this.velocity = { x: 0, y: isPlayerProjectile ? -speed : speed };
    this.color = isPlayerProjectile ? '#22d3ee' : '#f87171';
    this.isActive = true;
    this.isPlayerProjectile = isPlayerProjectile;
    this.trailParticles = [];
    this.damage = damage;
    this.piercing = false;
    this.explosive = false;
    this.gravity = false;
    this.piercedEnemies = 0;
  }

  update() {
    this.position.y += this.velocity.y;

    // Trail particles
    if (Math.random() < 0.4) {
      this.trailParticles.push({
        x: this.position.x + this.size.width / 2,
        y: this.position.y + this.size.height / 2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: this.isPlayerProjectile ? 2 : -2,
        size: 2 + Math.random() * 2,
        color: this.color,
        alpha: 0.6,
        decay: 0.04,
        lifetime: 0,
        maxLifetime: 20
      });
    }

    this.trailParticles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.lifetime++;
      p.size *= 0.95;
    });
    this.trailParticles = this.trailParticles.filter((p) => p.alpha > 0 && p.lifetime < p.maxLifetime);
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;

    // Render trail
    this.trailParticles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render projectile with enhanced glow
    ctx.save();

    // Outer glow
    ctx.shadowBlur = 25;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);

    // Inner glow
    ctx.shadowBlur = 15;
    ctx.fillStyle = this.isPlayerProjectile ? '#ffffff' : '#ff6666';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(this.position.x + 0.5, this.position.y + 2, this.size.width - 1, this.size.height - 4);

    // Bright core
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.6;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'white';
    ctx.fillRect(this.position.x + 1, this.position.y + 4, this.size.width - 2, this.size.height - 8);
    ctx.restore();
  }

  getBounds() {
    return {
      left: this.position.x,
      right: this.position.x + this.size.width,
      top: this.position.y,
      bottom: this.position.y + this.size.height
    };
  }

  deactivate() {
    this.isActive = false;
  }
}

export class ExplosionAnimation {
  position: Position;
  frame: number;
  maxFrames: number;
  frameWidth: number;
  frameHeight: number;
  spriteSheet?: HTMLImageElement;
  scale: number;
  rotation: number;
  isMobile: boolean;

  constructor(x: number, y: number, spriteSheet?: HTMLImageElement, isMobile: boolean = false) {
    this.position = { x, y };
    this.frame = 0;
    this.maxFrames = 8; // 8 frames in explosion sprite sheet
    this.frameWidth = 64; // Assuming 512x64 sprite sheet (8 frames)
    this.frameHeight = 64;
    this.spriteSheet = spriteSheet;
    this.isMobile = isMobile;

    // Much smaller explosions, especially on mobile
    if (isMobile) {
      this.scale = 0.3 + Math.random() * 0.15; // Mobile: 0.3-0.45x scale (was 0.8-1.2x)
    } else {
      this.scale = 0.4 + Math.random() * 0.2; // Desktop: 0.4-0.6x scale (was 0.8-1.2x)
    }
    this.rotation = Math.random() * Math.PI * 2;
  }

  update() {
    this.frame += 0.75; // Faster animation for quicker fade (was 0.5)
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.spriteSheet) return;

    const currentFrame = Math.floor(this.frame);
    if (currentFrame >= this.maxFrames) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);

    // Reduced glow effect - less obtrusive
    const fadeProgress = this.frame / this.maxFrames;
    const glowIntensity = this.isMobile ?
    15 * (1 - fadeProgress) // Mobile: subtle glow (was 40)
    : 20 * (1 - fadeProgress); // Desktop: slightly more glow (was 40)

    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = '#ff6600';

    // Reduce opacity as animation progresses for smoother fade
    ctx.globalAlpha = 1 - fadeProgress * 0.3; // Slight transparency increase

    // Add second glow layer - but lighter
    ctx.globalCompositeOperation = 'screen';

    ctx.drawImage(
      this.spriteSheet,
      currentFrame * this.frameWidth,
      0,
      this.frameWidth,
      this.frameHeight,
      -32, -32,
      64, 64
    );

    ctx.restore();
  }

  isDone(): boolean {
    return this.frame >= this.maxFrames;
  }
}

export class PowerUpEntity implements PowerUp {
  position: Position;
  size: Size;
  velocity: Velocity;
  type: 'plasma' | 'rapid' | 'shield' | 'slowmo';
  isActive: boolean;
  image?: HTMLImageElement;
  rotation: number;
  pulseOffset: number;

  constructor(x: number, y: number, type: 'plasma' | 'rapid' | 'shield' | 'slowmo') {
    this.position = { x, y };
    this.size = { width: 35, height: 35 };
    this.velocity = { x: 0, y: 2.75 };
    this.type = type;
    this.isActive = true;
    this.rotation = 0;
    this.pulseOffset = Math.random() * Math.PI * 2;
  }

  setImage(img: HTMLImageElement) {
    this.image = img;
  }

  update() {
    this.position.y += this.velocity.y;
    this.rotation += 0.05;
    this.pulseOffset += 0.1;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;

    const pulse = 1 + Math.sin(this.pulseOffset) * 0.2;
    const glowPulse = 30 + Math.sin(this.pulseOffset * 2) * 10;
    const colors = {
      plasma: '#a855f7',
      rapid: '#22d3ee',
      shield: '#10b981',
      slowmo: '#f59e0b'
    };

    ctx.save();
    ctx.translate(this.position.x + this.size.width / 2, this.position.y + this.size.height / 2);
    ctx.rotate(this.rotation);
    ctx.scale(pulse, pulse);

    // Outer glow ring
    ctx.shadowBlur = glowPulse;
    ctx.shadowColor = colors[this.type];
    ctx.strokeStyle = colors[this.type];
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, this.size.width / 2 + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (this.image) {
      ctx.shadowBlur = glowPulse;
      ctx.shadowColor = colors[this.type];
      ctx.drawImage(
        this.image,
        -this.size.width / 2,
        -this.size.height / 2,
        this.size.width,
        this.size.height
      );
    } else {
      ctx.fillStyle = colors[this.type];
      ctx.shadowBlur = glowPulse;
      ctx.shadowColor = colors[this.type];
      ctx.beginPath();
      ctx.arc(0, 0, this.size.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  getBounds() {
    return {
      left: this.position.x,
      right: this.position.x + this.size.width,
      top: this.position.y,
      bottom: this.position.y + this.size.height
    };
  }

  deactivate() {
    this.isActive = false;
  }
}