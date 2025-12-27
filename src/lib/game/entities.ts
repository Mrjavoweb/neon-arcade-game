import { Position, Size, Velocity } from './types';

export class Player {
  position: Position;
  size: Size;
  velocity: Velocity;
  color: string;
  speed: number;
  canvasWidth: number;
  sprite: HTMLImageElement | null;

  constructor(canvasWidth: number, canvasHeight: number, speed: number, sprite?: HTMLImageElement) {
    this.size = { width: 50, height: 50 };
    this.position = {
      x: canvasWidth / 2 - this.size.width / 2,
      y: canvasHeight - this.size.height - 20
    };
    this.velocity = { x: 0, y: 0 };
    this.color = '#22d3ee'; // cyan
    this.speed = speed;
    this.canvasWidth = canvasWidth;
    this.sprite = sprite || null;
  }

  update() {
    this.position.x += this.velocity.x;
    // Clamp position
    this.position.x = Math.max(0, Math.min(this.canvasWidth - this.size.width, this.position.x));
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    if (this.sprite && this.sprite.complete) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      ctx.drawImage(this.sprite, this.position.x, this.position.y, this.size.width, this.size.height);
    } else {
      // Fallback rendering
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.moveTo(this.position.x + this.size.width / 2, this.position.y);
      ctx.lineTo(this.position.x, this.position.y + this.size.height);
      ctx.lineTo(this.position.x + this.size.width, this.position.y + this.size.height);
      ctx.closePath();
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
}

export class Enemy {
  position: Position;
  size: Size;
  color: string;
  isAlive: boolean;
  points: number;
  sprite: HTMLImageElement | null;

  constructor(x: number, y: number, sprite?: HTMLImageElement) {
    this.position = { x, y };
    this.size = { width: 45, height: 45 };
    this.color = '#ec4899'; // pink
    this.isAlive = true;
    this.points = 10;
    this.sprite = sprite || null;
  }

  update(dx: number, dy: number) {
    this.position.x += dx;
    this.position.y += dy;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.isAlive) return;

    ctx.save();

    if (this.sprite && this.sprite.complete) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
      ctx.drawImage(this.sprite, this.position.x, this.position.y, this.size.width, this.size.height);
    } else {
      // Fallback rendering
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
      ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.position.x + 5, this.position.y + 5, this.size.width - 10, this.size.height - 10);
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
    this.isAlive = false;
  }
}

export class Projectile {
  position: Position;
  size: Size;
  velocity: Velocity;
  color: string;
  isActive: boolean;
  isPlayerProjectile: boolean;

  constructor(x: number, y: number, isPlayerProjectile: boolean, speed: number) {
    this.position = { x, y };
    this.size = { width: 4, height: 15 };
    this.velocity = { x: 0, y: isPlayerProjectile ? -speed : speed };
    this.color = isPlayerProjectile ? '#22d3ee' : '#f87171'; // cyan or red
    this.isActive = true;
    this.isPlayerProjectile = isPlayerProjectile;
  }

  update() {
    this.position.y += this.velocity.y;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
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

export class Explosion {
  position: Position;
  size: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
  sprite: HTMLImageElement | null;
  frame: number;
  maxFrames: number;

  constructor(x: number, y: number, color: string, sprite?: HTMLImageElement) {
    this.position = { x, y };
    this.size = 10;
    this.color = color;
    this.lifetime = 0;
    this.maxLifetime = 15;
    this.sprite = sprite || null;
    this.frame = 0;
    this.maxFrames = 8;
  }

  update() {
    this.lifetime++;
    this.size += 3;
    this.frame = Math.floor(this.lifetime / this.maxLifetime * this.maxFrames);
  }

  render(ctx: CanvasRenderingContext2D) {
    const alpha = 1 - this.lifetime / this.maxLifetime;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.sprite && this.sprite.complete) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      const drawSize = this.size * 2;
      ctx.drawImage(
        this.sprite,
        this.position.x - drawSize / 2,
        this.position.y - drawSize / 2,
        drawSize,
        drawSize
      );
    } else {
      // Fallback rendering
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  isDone(): boolean {
    return this.lifetime >= this.maxLifetime;
  }
}