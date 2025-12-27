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
  }

  setImage(img: HTMLImageElement) {
    this.image = img;
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

    // Generate engine trail particles
    if (Math.random() < 0.6) {
      this.engineParticles.push({
        x: this.position.x + this.size.width / 2 + (Math.random() - 0.5) * 20,
        y: this.position.y + this.size.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 2 + Math.random() * 2,
        size: 2 + Math.random() * 3,
        color: this.shieldActive ? '#a855f7' : '#22d3ee',
        alpha: 0.8,
        decay: 0.03,
        lifetime: 0,
        maxLifetime: 30
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

  render(ctx: CanvasRenderingContext2D, shieldImage?: HTMLImageElement) {
    // Render engine particles first
    this.engineParticles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();

    // Level glow indicator
    const glowIntensity = 15 + this.level * 2;
    const glowColor = this.level >= 10 ? '#a855f7' :
    this.level >= 7 ? '#f59e0b' :
    this.level >= 4 ? '#22d3ee' : '#10b981';

    if (this.image) {
      // Draw sprite with level-based glow
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = this.shieldActive ? '#a855f7' : glowColor;
      ctx.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.size.width,
        this.size.height
      );
    } else {
      // Fallback triangle
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

  activateShield() {
    this.shieldActive = true;
    this.shieldDuration = 600; // 10 seconds at 60fps
  }

  activatePlasma() {
    this.plasmaActive = true;
    this.plasmaDuration = 450; // 7.5 seconds
  }

  activateRapid() {
    this.rapidActive = true;
    this.rapidDuration = 450;
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

  constructor(x: number, y: number, wave: number) {
    this.position = { x, y };
    this.isAlive = true;
    this.wobbleOffset = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.08;
    this.moveSpeed = 2;
    this.moveDirection = 1;
    this.phase = 'phase1';
    this.flashTimer = 0;

    // Scale with wave difficulty
    const healthMultiplier = 1 + Math.floor(wave / 5) * 0.5;
    this.size = { width: 120, height: 120 }; // 2.5-3x normal alien
    this.color = '#dc2626';
    this.points = 500;
    this.health = Math.floor(100 * healthMultiplier); // Scaled for 60-90s fight
    this.maxHealth = this.health;
  }

  setImage(img: HTMLImageElement) {
    this.image = img;
  }

  update(canvasWidth: number) {
    // Horizontal movement
    this.position.x += this.moveSpeed * this.moveDirection;

    // Bounce at edges
    if (this.position.x <= 0 || this.position.x + this.size.width >= canvasWidth) {
      this.moveDirection *= -1;
    }

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

    ctx.save();
    ctx.translate(wobble, 0);

    // Flash effect when hit
    if (this.flashTimer > 0 && Math.floor(this.flashTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Glow based on phase
    const phaseColors = {
      phase1: '#dc2626',
      phase2: '#f97316',
      phase3: '#eab308',
      phase4: '#a855f7'
    };

    if (this.image) {
      ctx.shadowBlur = 30 + Math.sin(Date.now() / 100) * 10;
      ctx.shadowColor = phaseColors[this.phase];

      ctx.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.size.width,
        this.size.height
      );
    } else {
      ctx.fillStyle = phaseColors[this.phase];
      ctx.shadowBlur = 30;
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

  constructor(x: number, y: number, type: 'basic' | 'heavy' | 'fast' = 'basic') {
    this.position = { x, y };
    this.type = type;
    this.isAlive = true;
    this.wobbleOffset = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.05 + Math.random() * 0.05;

    switch (type) {
      case 'heavy':
        this.size = { width: 45, height: 45 };
        this.color = '#f97316';
        this.points = 30;
        this.health = 2;
        this.maxHealth = 2;
        break;
      case 'fast':
        this.size = { width: 32, height: 32 };
        this.color = '#eab308';
        this.points = 20;
        this.health = 1;
        this.maxHealth = 1;
        break;
      default:
        this.size = { width: 40, height: 40 };
        this.color = '#ec4899';
        this.points = 10;
        this.health = 1;
        this.maxHealth = 1;
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

    ctx.save();
    ctx.translate(wobble, 0);

    if (this.image) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;

      // Flash red if damaged
      if (this.health < this.maxHealth) {
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 50) * 0.3;
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
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
      ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    }

    // Health bar for bosses and heavy
    if (this.maxHealth > 1) {
      const barWidth = this.size.width;
      const barHeight = 4;
      const healthPercent = this.health / this.maxHealth;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(this.position.x, this.position.y - 10, barWidth, barHeight);

      ctx.fillStyle = healthPercent > 0.5 ? '#10b981' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(this.position.x, this.position.y - 10, barWidth * healthPercent, barHeight);
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

  constructor(x: number, y: number, isPlayerProjectile: boolean, speed: number) {
    this.position = { x, y };
    this.size = { width: 4, height: 15 };
    this.velocity = { x: 0, y: isPlayerProjectile ? -speed : speed };
    this.color = isPlayerProjectile ? '#22d3ee' : '#f87171';
    this.isActive = true;
    this.isPlayerProjectile = isPlayerProjectile;
    this.trailParticles = [];
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
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render projectile
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);

    // Bright core
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(this.position.x + 1, this.position.y + 3, this.size.width - 2, this.size.height - 6);
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

  constructor(x: number, y: number, spriteSheet?: HTMLImageElement) {
    this.position = { x, y };
    this.frame = 0;
    this.maxFrames = 8; // 8 frames in explosion sprite sheet
    this.frameWidth = 64; // Assuming 512x64 sprite sheet (8 frames)
    this.frameHeight = 64;
    this.spriteSheet = spriteSheet;
    this.scale = 0.8 + Math.random() * 0.4;
    this.rotation = Math.random() * Math.PI * 2;
  }

  update() {
    this.frame += 0.5; // Slower animation
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.spriteSheet) return;

    const currentFrame = Math.floor(this.frame);
    if (currentFrame >= this.maxFrames) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);

    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff6600';

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
    this.velocity = { x: 0, y: 1.5 };
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

    const pulse = 1 + Math.sin(this.pulseOffset) * 0.15;
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

    if (this.image) {
      ctx.shadowBlur = 25;
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
      ctx.shadowBlur = 20;
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