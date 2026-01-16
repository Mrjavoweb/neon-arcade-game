import { Position, Size, Velocity, Particle, PowerUp, PowerUpType } from './types';

// ============================================================================
// FORMATION TYPES
// ============================================================================

export type FormationType = 'grid' | 'v_formation' | 'spiral' | 'swarm' | 'pincer' | 'diamond';

export interface FormationConfig {
  type: FormationType;
  enemyCount: number;
  speedModifier: number;
  difficultyOffset: number; // Percentage difficulty adjustment
}

// Formation spawn weights by wave range
export function getAvailableFormations(wave: number): { type: FormationType; weight: number }[] {
  if (wave <= 5) {
    // Learning phase: Grid only
    return [{ type: 'grid', weight: 100 }];
  } else if (wave <= 10) {
    // Introduce V-Formation
    return [
      { type: 'grid', weight: 70 },
      { type: 'v_formation', weight: 30 }
    ];
  } else if (wave <= 15) {
    // Add Spiral
    return [
      { type: 'grid', weight: 50 },
      { type: 'v_formation', weight: 30 },
      { type: 'spiral', weight: 20 }
    ];
  } else if (wave <= 25) {
    // Add Swarm
    return [
      { type: 'grid', weight: 30 },
      { type: 'v_formation', weight: 25 },
      { type: 'spiral', weight: 25 },
      { type: 'swarm', weight: 20 }
    ];
  } else {
    // All formations available
    return [
      { type: 'grid', weight: 20 },
      { type: 'v_formation', weight: 20 },
      { type: 'spiral', weight: 20 },
      { type: 'swarm', weight: 15 },
      { type: 'pincer', weight: 15 },
      { type: 'diamond', weight: 10 }
    ];
  }
}

// Select a random formation based on weights
export function selectFormation(wave: number): FormationType {
  const formations = getAvailableFormations(wave);
  const totalWeight = formations.reduce((sum, f) => sum + f.weight, 0);
  let random = Math.random() * totalWeight;

  for (const formation of formations) {
    random -= formation.weight;
    if (random <= 0) {
      return formation.type;
    }
  }

  return 'grid'; // Fallback
}

export class Player {
  position: Position;
  size: Size;
  velocity: Velocity;
  color: string;
  speed: number;
  canvasWidth: number;
  image?: HTMLImageElement;
  // Original powerups
  shieldActive: boolean;
  shieldDuration: number;
  plasmaActive: boolean;
  plasmaDuration: number;
  rapidActive: boolean;
  rapidDuration: number;
  // New powerups
  homingActive: boolean;
  homingDuration: number;
  laserActive: boolean;
  laserDuration: number;
  invincibilityActive: boolean;
  invincibilityDuration: number;
  freezeActive: boolean;
  freezeDuration: number;
  piercingActive: boolean;
  piercingDuration: number;
  // Other properties
  engineParticles: Particle[];
  level: number;
  invulnerable: boolean;
  invulnerabilityTimer: number;
  private filteredImageCache: Map<string, HTMLCanvasElement> = new Map();
  private _fallbackWarningShown: boolean = false;

  // Asteroid mode properties (classic Asteroids-style controls)
  asteroidModeActive: boolean;
  rotation: number; // Ship rotation in radians (0 = facing up)
  thrustVelocity: Velocity; // Momentum-based velocity
  canvasHeight: number;
  rotationSpeed: number; // How fast ship rotates
  thrustPower: number; // Acceleration when thrusting
  friction: number; // Deceleration when not thrusting
  maxSpeed: number; // Maximum velocity magnitude
  private savedPosition: Position | null; // To restore position after asteroid wave

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
    // Original powerups
    this.shieldActive = false;
    this.shieldDuration = 0;
    this.plasmaActive = false;
    this.plasmaDuration = 0;
    this.rapidActive = false;
    this.rapidDuration = 0;
    // New powerups
    this.homingActive = false;
    this.homingDuration = 0;
    this.laserActive = false;
    this.laserDuration = 0;
    this.invincibilityActive = false;
    this.invincibilityDuration = 0;
    this.freezeActive = false;
    this.freezeDuration = 0;
    this.piercingActive = false;
    this.piercingDuration = 0;
    // Other properties
    this.engineParticles = [];
    this.invulnerable = false;
    this.invulnerabilityTimer = 0;

    // Asteroid mode properties
    this.asteroidModeActive = false;
    this.rotation = -Math.PI / 2; // Start facing up (ship nose points up)
    this.thrustVelocity = { x: 0, y: 0 };
    this.canvasHeight = canvasHeight;
    this.rotationSpeed = 0.08; // Radians per frame
    this.thrustPower = 0.15; // Acceleration per frame
    this.friction = 0.985; // Velocity multiplier per frame (slight drag)
    this.maxSpeed = 6; // Max pixels per frame
    this.savedPosition = null;
  }

  /**
   * Clear the filtered image cache - call this when the skin changes
   * to ensure the new filter is applied fresh
   */
  clearFilterCache(): void {
    this.filteredImageCache.clear();
    console.log('🎨 Player filter cache cleared');
  }

  setImage(img: HTMLImageElement) {
    if (!img) {
      console.error('❌ Player.setImage called with null/undefined image');
      return;
    }
    // Clear filter cache when new image is set to ensure correct colors
    this.filteredImageCache.clear();
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

    // Update power-ups (original)
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

    // Update power-ups (new)
    if (this.homingDuration > 0) {
      this.homingDuration--;
      if (this.homingDuration <= 0) this.homingActive = false;
    }
    if (this.laserDuration > 0) {
      this.laserDuration--;
      if (this.laserDuration <= 0) this.laserActive = false;
    }
    if (this.invincibilityDuration > 0) {
      this.invincibilityDuration--;
      if (this.invincibilityDuration <= 0) this.invincibilityActive = false;
    }
    if (this.freezeDuration > 0) {
      this.freezeDuration--;
      if (this.freezeDuration <= 0) this.freezeActive = false;
    }
    if (this.piercingDuration > 0) {
      this.piercingDuration--;
      if (this.piercingDuration <= 0) this.piercingActive = false;
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

    // NOTE: Do NOT apply filter to main context here!
    // The filter is applied to an offscreen canvas below (lines 317-338)
    // Applying it here too would cause double-filtering (e.g., Gold → Purple)
    ctx.filter = 'none';

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

    // Invulnerability shield visual (cyan/blue pulsing circle)
    if (this.invulnerable) {
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 100) * 0.3;
      ctx.strokeStyle = '#22d3ee'; // Cyan color
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#22d3ee';

      // Draw pulsing circle around ship
      const centerX = this.position.x + this.size.width / 2;
      const centerY = this.position.y + this.size.height / 2;
      const radius = Math.max(this.size.width, this.size.height) / 2 + 15 + Math.sin(Date.now() / 150) * 5;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Add inner glow
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#22d3ee';
      ctx.fill();

      ctx.restore();
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

  // ============================================================================
  // ASTEROID MODE METHODS (Classic Asteroids-style controls)
  // ============================================================================

  enterAsteroidMode() {
    // Save current position to restore later
    this.savedPosition = { ...this.position };

    // Center ship on screen
    this.position = {
      x: this.canvasWidth / 2 - this.size.width / 2,
      y: this.canvasHeight / 2 - this.size.height / 2
    };

    // Reset rotation to face up
    this.rotation = -Math.PI / 2; // Face up
    this.asteroidModeActive = true;

    // Give a small initial forward thrust so player knows they can move
    // Thrust direction matches ship facing (up)
    this.thrustVelocity = {
      x: Math.cos(this.rotation) * 0.8, // ~0 (facing up)
      y: Math.sin(this.rotation) * 0.8  // ~-0.8 (upward)
    };

    console.log('🚀 Entered Asteroid Mode - Ship centered with initial thrust');
  }

  exitAsteroidMode() {
    // Restore position to bottom of screen
    if (this.savedPosition) {
      this.position = {
        x: this.canvasWidth / 2 - this.size.width / 2, // Center horizontally
        y: this.canvasHeight - this.size.height - 30 // Bottom of screen
      };
    }

    // Reset velocities
    this.thrustVelocity = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.rotation = -Math.PI / 2; // Reset to facing up
    this.asteroidModeActive = false;
    this.savedPosition = null;

    console.log('🚀 Exited Asteroid Mode - Ship restored to bottom');
  }

  rotateLeft(deltaTime: number = 1) {
    this.rotation -= this.rotationSpeed * deltaTime;
  }

  rotateRight(deltaTime: number = 1) {
    this.rotation += this.rotationSpeed * deltaTime;
  }

  thrust(deltaTime: number = 1) {
    // Add velocity in the direction the ship is facing
    this.thrustVelocity.x += Math.cos(this.rotation) * this.thrustPower * deltaTime;
    this.thrustVelocity.y += Math.sin(this.rotation) * this.thrustPower * deltaTime;

    // Clamp to max speed
    const speed = Math.sqrt(this.thrustVelocity.x ** 2 + this.thrustVelocity.y ** 2);
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      this.thrustVelocity.x *= scale;
      this.thrustVelocity.y *= scale;
    }
  }

  brake(deltaTime: number = 1) {
    // Apply stronger friction when braking
    const brakeFriction = 0.92;
    this.thrustVelocity.x *= Math.pow(brakeFriction, deltaTime);
    this.thrustVelocity.y *= Math.pow(brakeFriction, deltaTime);

    // Stop completely if very slow
    const speed = Math.sqrt(this.thrustVelocity.x ** 2 + this.thrustVelocity.y ** 2);
    if (speed < 0.1) {
      this.thrustVelocity.x = 0;
      this.thrustVelocity.y = 0;
    }
  }

  updateAsteroidMode(deltaTime: number = 1) {
    if (!this.asteroidModeActive) return;

    // Apply friction (gradual slowdown)
    this.thrustVelocity.x *= Math.pow(this.friction, deltaTime);
    this.thrustVelocity.y *= Math.pow(this.friction, deltaTime);

    // Update position based on thrust velocity
    this.position.x += this.thrustVelocity.x * deltaTime;
    this.position.y += this.thrustVelocity.y * deltaTime;

    // Screen wrapping (like classic Asteroids)
    if (this.position.x < -this.size.width) {
      this.position.x = this.canvasWidth;
    } else if (this.position.x > this.canvasWidth) {
      this.position.x = -this.size.width;
    }

    if (this.position.y < -this.size.height) {
      this.position.y = this.canvasHeight;
    } else if (this.position.y > this.canvasHeight) {
      this.position.y = -this.size.height;
    }

    // Generate thrust particles when moving
    const speed = Math.sqrt(this.thrustVelocity.x ** 2 + this.thrustVelocity.y ** 2);
    if (speed > 0.5 && Math.random() < 0.5) {
      const thrustAngle = this.rotation + Math.PI; // Opposite to facing direction
      const colors = this.shieldActive ? ['#a855f7', '#c084fc', '#ffffff'] : ['#22d3ee', '#06b6d4', '#f97316'];
      this.engineParticles.push({
        x: this.position.x + this.size.width / 2 + Math.cos(thrustAngle) * 25,
        y: this.position.y + this.size.height / 2 + Math.sin(thrustAngle) * 25,
        vx: Math.cos(thrustAngle) * (2 + Math.random() * 2) + (Math.random() - 0.5) * 0.5,
        vy: Math.sin(thrustAngle) * (2 + Math.random() * 2) + (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        decay: 0.03,
        lifetime: 0,
        maxLifetime: 30
      });
    }

    // Update power-ups and invulnerability (same as normal update)
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
    if (this.homingDuration > 0) {
      this.homingDuration--;
      if (this.homingDuration <= 0) this.homingActive = false;
    }
    if (this.laserDuration > 0) {
      this.laserDuration--;
      if (this.laserDuration <= 0) this.laserActive = false;
    }
    if (this.invincibilityDuration > 0) {
      this.invincibilityDuration--;
      if (this.invincibilityDuration <= 0) this.invincibilityActive = false;
    }
    if (this.freezeDuration > 0) {
      this.freezeDuration--;
      if (this.freezeDuration <= 0) this.freezeActive = false;
    }
    if (this.piercingDuration > 0) {
      this.piercingDuration--;
      if (this.piercingDuration <= 0) this.piercingActive = false;
    }
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer <= 0) this.invulnerable = false;
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

  renderAsteroidMode(ctx: CanvasRenderingContext2D, shieldImage?: HTMLImageElement, skinFilter?: string) {
    // Render engine particles first (in world space, not rotated)
    this.engineParticles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 20 + p.size * 2;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
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

    // Translate to center of ship for rotation
    const centerX = this.position.x + this.size.width / 2;
    const centerY = this.position.y + this.size.height / 2;
    ctx.translate(centerX, centerY);

    // Rotate ship (add 90 degrees because sprite faces up by default)
    ctx.rotate(this.rotation + Math.PI / 2);

    // NOTE: Do NOT apply filter to main context here!
    // The filter is applied to an offscreen canvas below (lines 705+)
    // Applying it here too would cause double-filtering (e.g., Gold → Purple)
    ctx.filter = 'none';

    // Invulnerability flashing
    if (this.invulnerable) {
      const flashAlpha = Math.sin(Date.now() / 50) * 0.5 + 0.5;
      ctx.globalAlpha = flashAlpha;
    }

    // Level glow
    const glowIntensity = 15 + this.level * 2;
    const glowColor = this.level >= 10 ? '#a855f7' :
      this.level >= 7 ? '#f59e0b' :
        this.level >= 4 ? '#22d3ee' : '#10b981';

    if (this.image && this.image.complete && this.image.naturalWidth > 0) {
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = this.shieldActive ? '#a855f7' : glowColor;

      // Use filtered image cache
      if (skinFilter && skinFilter !== 'none') {
        try {
          let filteredCanvas = this.filteredImageCache.get(skinFilter);
          if (!filteredCanvas) {
            filteredCanvas = document.createElement('canvas');
            filteredCanvas.width = this.image.width;
            filteredCanvas.height = this.image.height;
            const offscreenCtx = filteredCanvas.getContext('2d');
            if (!offscreenCtx) throw new Error('Failed to get offscreen context');
            offscreenCtx.filter = skinFilter;
            offscreenCtx.drawImage(this.image, 0, 0);
            this.filteredImageCache.set(skinFilter, filteredCanvas);
          }
          ctx.drawImage(
            filteredCanvas,
            -this.size.width / 2,
            -this.size.height / 2,
            this.size.width,
            this.size.height
          );
        } catch {
          ctx.drawImage(
            this.image,
            -this.size.width / 2,
            -this.size.height / 2,
            this.size.width,
            this.size.height
          );
        }
      } else {
        ctx.drawImage(
          this.image,
          -this.size.width / 2,
          -this.size.height / 2,
          this.size.width,
          this.size.height
        );
      }
    } else {
      // Fallback triangle
      ctx.fillStyle = this.color;
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = glowColor;
      ctx.beginPath();
      ctx.moveTo(0, -this.size.height / 2); // Nose
      ctx.lineTo(-this.size.width / 2, this.size.height / 2); // Left wing
      ctx.lineTo(this.size.width / 2, this.size.height / 2); // Right wing
      ctx.closePath();
      ctx.fill();
    }

    // Level badge (rotated with ship)
    if (this.level > 1) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(this.size.width / 2 - 10, -this.size.height / 2 + 10, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = glowColor;
      ctx.shadowBlur = 5;
      ctx.shadowColor = glowColor;
      ctx.font = 'bold 12px "Space Grotesk"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.level.toString(), this.size.width / 2 - 10, -this.size.height / 2 + 10);
    }

    ctx.restore();

    // Shield overlay (in world space, not rotated)
    if (this.shieldActive && shieldImage) {
      ctx.save();
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
      ctx.restore();
    }

    // Invulnerability shield visual
    if (this.invulnerable) {
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 100) * 0.3;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#22d3ee';
      const radius = Math.max(this.size.width, this.size.height) / 2 + 15 + Math.sin(Date.now() / 150) * 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.restore();
    }
  }

  // Get the direction the ship is facing (for firing bullets)
  getFiringDirection(): Velocity {
    return {
      x: Math.cos(this.rotation),
      y: Math.sin(this.rotation)
    };
  }

  activateShield(bonusDuration: number = 0, percentBoost: number = 0) {
    this.shieldActive = true;
    let baseDuration = 360; // 6 seconds at 60fps (balanced from 8s for better challenge)
    if (percentBoost > 0) {
      baseDuration = baseDuration * (1 + percentBoost / 100);
    }
    this.shieldDuration = baseDuration + bonusDuration;
  }

  activatePlasma(bonusDuration: number = 0, isDualGuns: boolean = false, isBossMode: boolean = false) {
    this.plasmaActive = true;
    // Boss mode: 4 seconds (240 frames), Dual guns: 3s, Normal: 5s (balanced for challenge)
    let baseDuration = isDualGuns ? 180 : 300; // 3 or 5 seconds
    if (isBossMode) baseDuration = 240; // 4 seconds for boss mode
    this.plasmaDuration = baseDuration + bonusDuration;
  }

  activateRapid(bonusDuration: number = 0, isDualGuns: boolean = false, isBossMode: boolean = false) {
    this.rapidActive = true;
    // Boss mode: 4 seconds (240 frames), Dual guns: 3s, Normal: 5s (balanced for challenge)
    let baseDuration = isDualGuns ? 180 : 300; // 3 or 5 seconds
    if (isBossMode) baseDuration = 240; // 4 seconds for boss mode
    this.rapidDuration = baseDuration + bonusDuration;
  }

  activateHoming(bonusDuration: number = 0) {
    this.homingActive = true;
    this.homingDuration = 420 + bonusDuration; // 7 seconds + bonus
  }

  activateLaser(bonusDuration: number = 0) {
    this.laserActive = true;
    this.laserDuration = 240 + bonusDuration; // 4 seconds + bonus (reduced for balance)
  }

  activateInvincibility(bonusDuration: number = 0) {
    this.invincibilityActive = true;
    this.invincibilityDuration = 300 + bonusDuration; // 5 seconds + bonus
  }

  activateFreeze(bonusDuration: number = 0) {
    this.freezeActive = true;
    this.freezeDuration = 240 + bonusDuration; // 4 seconds + bonus
  }

  activatePiercing(bonusDuration: number = 0) {
    this.piercingActive = true;
    this.piercingDuration = 480 + bonusDuration; // 8 seconds + bonus
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

  update(canvasWidth: number, isFrozen: boolean = false, deltaTime: number = 1) {
    // Don't move or change direction when frozen
    if (!isFrozen) {
      // Smooth horizontal movement with lerp (scaled by deltaTime for slow-mo support)
      this.targetX += this.moveSpeed * this.moveDirection * deltaTime;

      // Bounce at edges
      if (this.targetX <= 0 || this.targetX + this.size.width >= canvasWidth) {
        this.moveDirection *= -1;
        this.targetX = Math.max(0, Math.min(canvasWidth - this.size.width, this.targetX));
      }

      // Smooth interpolation to target
      this.position.x += (this.targetX - this.position.x) * this.smoothing * deltaTime;

      this.wobbleOffset += this.wobbleSpeed * deltaTime;
    }

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

  update(dx: number, dy: number, isFrozen: boolean = false) {
    // Don't move when frozen
    if (!isFrozen) {
      this.position.x += dx;
      this.position.y += dy;
    }
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

  hit(damage: number = 1) {
    this.health -= damage;
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
  homing: boolean; // Homing missiles - track enemies
  target: Enemy | null; // Target enemy for homing

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
    this.homing = false;
    this.target = null;
  }

  update() {
    // Homing missile tracking
    if (this.homing && this.target && this.target.isAlive) {
      // Calculate direction to target
      const dx = (this.target.position.x + this.target.size.width / 2) - this.position.x;
      const dy = (this.target.position.y + this.target.size.height / 2) - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Stronger homing for distant targets (especially bosses)
      // Closer = weaker homing (0.5), Farther = stronger homing (1.2)
      const homingStrength = Math.min(1.2, 0.5 + (distance / 300));

      // Adjust velocity toward target
      const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
      this.velocity.x += Math.cos(angle) * homingStrength;
      this.velocity.y += Math.sin(angle) * homingStrength;

      // Normalize to maintain speed
      const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
      this.velocity.x = (this.velocity.x / currentSpeed) * speed;
      this.velocity.y = (this.velocity.y / currentSpeed) * speed;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Trail particles (reduced spawn rate for performance)
    if (Math.random() < 0.2) {
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

    // Piercing bullets - elongated cyan bullets with enhanced trail
    if (this.piercing && this.isPlayerProjectile) {
      ctx.save();

      // Elongated size for piercing bullets
      const piercingHeight = this.size.height * 1.8; // 80% longer

      // Bright cyan outer glow
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#00ffff';
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(this.position.x, this.position.y, this.size.width, piercingHeight);

      // Bright cyan inner glow
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#00ffff';
      ctx.globalAlpha = 0.9;
      ctx.fillRect(this.position.x + 0.5, this.position.y + 2, this.size.width - 1, piercingHeight - 4);

      // Bright white core
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 0.8;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffff';
      ctx.fillRect(this.position.x + 1, this.position.y + 4, this.size.width - 2, piercingHeight - 8);

      ctx.restore();
    } else {
      // Normal projectile rendering
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
  type: PowerUpType;
  isActive: boolean;
  image?: HTMLImageElement;
  rotation: number;
  pulseOffset: number;

  constructor(x: number, y: number, type: PowerUpType) {
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
    const colors: Record<PowerUpType, string> = {
      // Original powerups
      plasma: '#a855f7',      // Purple
      rapid: '#22d3ee',       // Cyan
      shield: '#10b981',      // Green
      slowmo: '#f59e0b',      // Orange
      // New offensive powerups
      homing: '#ec4899',      // Pink (homing missiles)
      laser: '#ef4444',       // Red (laser beam)
      nuke: '#dc2626',        // Dark Red (nuclear bomb)
      // New defensive powerups
      invincibility: '#fbbf24', // Gold (invincibility star)
      freeze: '#60a5fa',      // Blue (freeze ray)
      // New utility powerups
      extralife: '#f87171',   // Light Red (heart/life)
      multiplier: '#a78bfa',  // Violet (score multiplier)
      magnet: '#34d399'       // Teal (magnet)
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
      // Colored circle background
      ctx.fillStyle = colors[this.type];
      ctx.shadowBlur = glowPulse;
      ctx.shadowColor = colors[this.type];
      ctx.beginPath();
      ctx.arc(0, 0, this.size.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Add emoji/symbol labels for new powerups
      const labels: Partial<Record<PowerUpType, string>> = {
        homing: '🌸',
        laser: '🔴',
        nuke: '💥',
        invincibility: '⭐',
        freeze: '❄️',
        extralife: '❤️',
        multiplier: '2×',
        magnet: '🧲'
      };

      const label = labels[this.type];
      if (label) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
      }
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

// ============================================================================
// ASTEROID CLASS (Pre-Boss Special Wave)
// ============================================================================

export type AsteroidSize = 'large' | 'medium' | 'small';

export class Asteroid {
  position: Position;
  velocity: Velocity;
  size: AsteroidSize;
  radius: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  rotation: number;
  rotationSpeed: number;
  points: number;
  canvasWidth: number;
  canvasHeight: number;

  // Visual properties
  glowColor: string;
  vertices: { angle: number; radius: number }[]; // Irregular shape
  pulseOffset: number;
  flashTimer: number;

  constructor(
    x: number,
    y: number,
    size: AsteroidSize,
    canvasWidth: number,
    canvasHeight: number,
    velocity?: Velocity
  ) {
    this.position = { x, y };
    this.size = size;
    this.isAlive = true;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.03;
    this.pulseOffset = Math.random() * Math.PI * 2;
    this.flashTimer = 0;

    // Size-based properties (BALANCED for fun gameplay)
    switch (size) {
      case 'large':
        this.radius = 35; // Smaller for easier maneuvering (was 45)
        this.health = 2;  // 2 hits to destroy (was 3) → splits to 2 medium
        this.points = 100;
        this.glowColor = '#22d3ee'; // Cyan
        break;
      case 'medium':
        this.radius = 22; // Smaller (was 28)
        this.health = 1;  // 1 hit to destroy (was 2) → splits to 2 small
        this.points = 75;
        this.glowColor = '#ec4899'; // Pink
        break;
      case 'small':
        this.radius = 12; // Smaller (was 16)
        this.health = 1;  // 1 hit to destroy → no split
        this.points = 50;
        this.glowColor = '#a855f7'; // Purple
        break;
    }
    this.maxHealth = this.health;

    // Velocity - splits move slightly faster
    if (velocity) {
      // Inherited velocity from split (1.1x faster - gentler than before)
      this.velocity = {
        x: velocity.x * 1.1,
        y: velocity.y * 1.1
      };
    } else {
      // Initial random drift (slower base)
      const speed = 0.8 + Math.random() * 1.0;
      const angle = Math.random() * Math.PI * 2;
      this.velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
    }

    // Generate irregular polygon shape
    this.vertices = [];
    const vertexCount = 8 + Math.floor(Math.random() * 4); // 8-11 vertices
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const radiusVariation = 0.7 + Math.random() * 0.6; // 70-130% of base radius
      this.vertices.push({ angle, radius: radiusVariation });
    }
  }

  update(deltaTime: number = 1, isFrozen: boolean = false) {
    if (!isFrozen) {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      this.rotation += this.rotationSpeed * deltaTime;
    }

    this.pulseOffset += 0.05 * deltaTime;

    if (this.flashTimer > 0) {
      this.flashTimer--;
    }

    // Screen wrapping (classic Asteroids behavior)
    if (this.position.x < -this.radius) {
      this.position.x = this.canvasWidth + this.radius;
    } else if (this.position.x > this.canvasWidth + this.radius) {
      this.position.x = -this.radius;
    }

    if (this.position.y < -this.radius) {
      this.position.y = this.canvasHeight + this.radius;
    } else if (this.position.y > this.canvasHeight + this.radius) {
      this.position.y = -this.radius;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.isAlive) return;

    const pulse = 1 + Math.sin(this.pulseOffset) * 0.05;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.scale(pulse, pulse);

    // Flash effect when hit
    if (this.flashTimer > 0 && Math.floor(this.flashTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Draw asteroid body (dark with glow edge)
    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      const x = Math.cos(v.angle) * this.radius * v.radius;
      const y = Math.sin(v.angle) * this.radius * v.radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Fill with dark color
    ctx.fillStyle = '#1a1a2e';
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.glowColor;
    ctx.fill();

    // Glowing edge
    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.glowColor;
    ctx.stroke();

    // Inner glow lines for detail
    ctx.beginPath();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 1;
    // Draw some internal "cracks"
    for (let i = 0; i < 3; i++) {
      const startV = this.vertices[i * 2 % this.vertices.length];
      const endV = this.vertices[(i * 2 + 4) % this.vertices.length];
      ctx.moveTo(
        Math.cos(startV.angle) * this.radius * startV.radius * 0.5,
        Math.sin(startV.angle) * this.radius * startV.radius * 0.5
      );
      ctx.lineTo(
        Math.cos(endV.angle) * this.radius * endV.radius * 0.5,
        Math.sin(endV.angle) * this.radius * endV.radius * 0.5
      );
    }
    ctx.stroke();

    // Health indicator for large/medium asteroids
    if (this.maxHealth > 1 && this.health < this.maxHealth) {
      ctx.globalAlpha = 1;
      const healthPercent = this.health / this.maxHealth;
      const barWidth = this.radius * 1.5;
      const barHeight = 4;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barWidth / 2, -this.radius - 12, barWidth, barHeight);

      const healthColor = healthPercent > 0.5 ? '#10b981' : '#ef4444';
      ctx.shadowBlur = 5;
      ctx.shadowColor = healthColor;
      ctx.fillStyle = healthColor;
      ctx.fillRect(-barWidth / 2, -this.radius - 12, barWidth * healthPercent, barHeight);
    }

    ctx.restore();
  }

  getBounds() {
    return {
      left: this.position.x - this.radius,
      right: this.position.x + this.radius,
      top: this.position.y - this.radius,
      bottom: this.position.y + this.radius
    };
  }

  hit(damage: number = 1): { destroyed: boolean; splitInto?: Asteroid[] } {
    this.health -= damage;
    this.flashTimer = 15;

    if (this.health <= 0) {
      this.isAlive = false;

      // Split into smaller asteroids
      if (this.size === 'large') {
        return {
          destroyed: true,
          splitInto: this.createSplits('medium', 2)
        };
      } else if (this.size === 'medium') {
        return {
          destroyed: true,
          splitInto: this.createSplits('small', 2)
        };
      }

      // Small asteroid - just destroyed, no split
      return { destroyed: true };
    }

    return { destroyed: false };
  }

  private createSplits(newSize: AsteroidSize, count: number): Asteroid[] {
    const splits: Asteroid[] = [];

    for (let i = 0; i < count; i++) {
      // Split velocity - perpendicular to original, plus some randomness
      const angleOffset = (i === 0 ? -1 : 1) * (Math.PI / 4 + Math.random() * Math.PI / 4);
      const originalAngle = Math.atan2(this.velocity.y, this.velocity.x);
      const newAngle = originalAngle + angleOffset;
      const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);

      const splitVelocity: Velocity = {
        x: Math.cos(newAngle) * speed,
        y: Math.sin(newAngle) * speed
      };

      splits.push(new Asteroid(
        this.position.x + (i === 0 ? -10 : 10),
        this.position.y + (i === 0 ? -10 : 10),
        newSize,
        this.canvasWidth,
        this.canvasHeight,
        splitVelocity
      ));
    }

    return splits;
  }

  // Check collision with a circular entity (player ship approximated as circle)
  checkCircleCollision(otherX: number, otherY: number, otherRadius: number): boolean {
    const dx = this.position.x - otherX;
    const dy = this.position.y - otherY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + otherRadius;
  }
}