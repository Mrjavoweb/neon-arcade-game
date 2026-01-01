# 🎮 New Powerup System - Implementation Plan

## Overview
Expanding from 4 powerups to 12 total powerups with full gameplay integration.

---

## ✅ Part 1: Foundation (COMPLETED)

### What Was Done:
- ✅ Created `PowerUpType` union type with all 12 powerup types
- ✅ Updated `PowerUpEntity` class constructor and render method
- ✅ Added all Player class properties (homingActive, laserActive, etc.)
- ✅ Created Player activation methods for all new powerups
- ✅ Updated Player.update() to handle new powerup timers
- ✅ Defined colors for all new powerups
- ✅ Verified build compiles successfully

### Files Modified:
- `src/lib/game/types.ts` - PowerUpType definition
- `src/lib/game/entities.ts` - Player & PowerUpEntity classes

---

## 🔄 Part 2: GameEngine Integration (TO DO NEXT)

### 2.1 Update GameEngine Properties
**File:** `src/lib/game/GameEngine.ts`

Add to GameEngine class:
```typescript
// New powerup state properties
scoreMultiplier: number;
scoreMultiplierDuration: number;
laserBeam: {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} | null;
```

Initialize in constructor:
```typescript
this.scoreMultiplier = 1;
this.scoreMultiplierDuration = 0;
this.laserBeam = null;
```

### 2.2 Update activatePowerUp Method
**File:** `src/lib/game/GameEngine.ts` (line ~1463)

Change signature:
```typescript
activatePowerUp(type: PowerUpType) {
```

Add new cases:
```typescript
case 'homing':
  this.player.activateHoming(bonusDuration);
  this.audioManager.playSound('powerup_collect', 0.6); // Use existing sound for now
  break;

case 'laser':
  this.player.activateLaser(bonusDuration);
  this.audioManager.playSound('powerup_collect', 0.6);
  break;

case 'invincibility':
  this.player.activateInvincibility(bonusDuration);
  this.audioManager.playSound('powerup_shield_activate', 0.7);
  break;

case 'freeze':
  this.player.activateFreeze(bonusDuration);
  this.audioManager.playSound('powerup_collect', 0.6);
  break;

case 'nuke':
  this.activateNuke();
  this.audioManager.playSound('boss_death', 0.8); // Big explosion sound
  break;

case 'extralife':
  this.stats.lives++;
  this.audioManager.playSound('powerup_collect', 0.8);
  break;

case 'multiplier':
  this.scoreMultiplier = 2;
  this.scoreMultiplierDuration = 360; // 6 seconds
  this.audioManager.playSound('powerup_collect', 0.7);
  break;

case 'magnet':
  this.player.activateMagnet(bonusDuration);
  this.audioManager.playSound('powerup_collect', 0.6);
  break;
```

### 2.3 Update Spawn System with Rarity Tiers
**File:** `src/lib/game/GameEngine.ts` (spawnPowerUp method, line ~970)

```typescript
spawnPowerUp() {
  // ... existing spawn checks ...

  // Rarity-based spawn system
  const rand = Math.random();
  let type: PowerUpType;

  // Common (60% total)
  if (rand < 0.25) {
    type = 'rapid';      // 25%
  } else if (rand < 0.45) {
    type = 'plasma';     // 20%
  } else if (rand < 0.60) {
    type = 'shield';     // 15%
  }
  // Uncommon (25% total)
  else if (rand < 0.70) {
    type = 'magnet';     // 10%
  } else if (rand < 0.78) {
    type = 'slowmo';     // 8%
  } else if (rand < 0.85) {
    type = 'homing';     // 7%
  }
  // Rare (12% total)
  else if (rand < 0.90) {
    type = 'freeze';     // 5%
  } else if (rand < 0.94) {
    type = 'multiplier'; // 4%
  } else if (rand < 0.97) {
    type = 'laser';      // 3%
  }
  // Legendary (3% total)
  else if (rand < 0.985) {
    type = 'invincibility'; // 1.5%
  } else if (rand < 0.995) {
    type = 'nuke';       // 1%
  } else {
    type = 'extralife';  // 0.5%
  }

  // ... rest of spawn logic ...
}
```

### 2.4 Update Boss Powerup Drops
**File:** `src/lib/game/GameEngine.ts` (checkCollisions, line ~1369)

```typescript
const types: Array<PowerUpType> = [
  'plasma', 'rapid', 'shield', 'slowmo',
  'homing', 'laser', 'freeze', 'magnet'
];
```

---

## 🎯 Part 3: Powerup Logic Implementation (TO DO)

### 3.1 Homing Missiles
**Where:** `src/lib/game/entities.ts` - Projectile class

Add to Projectile:
```typescript
homing: boolean;
target: Enemy | null;
```

In Projectile.update():
```typescript
if (this.homing && this.target && this.target.isAlive) {
  // Calculate direction to target
  const dx = (this.target.position.x + this.target.size.width / 2) - this.position.x;
  const dy = (this.target.position.y + this.target.size.height / 2) - this.position.y;
  const angle = Math.atan2(dy, dx);

  // Adjust velocity toward target (slight homing, not perfect tracking)
  const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
  this.velocity.x += Math.cos(angle) * 0.3;
  this.velocity.y += Math.sin(angle) * 0.3;

  // Normalize to maintain speed
  const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
  this.velocity.x = (this.velocity.x / currentSpeed) * speed;
  this.velocity.y = (this.velocity.y / currentSpeed) * speed;
}
```

In GameEngine.fire():
```typescript
if (this.player.homingActive) {
  projectile.homing = true;
  // Find nearest enemy
  let nearestEnemy = null;
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
  projectile.target = nearestEnemy;
}
```

### 3.2 Laser Beam
**Where:** `src/lib/game/GameEngine.ts`

In GameEngine.update():
```typescript
// Update laser beam
if (this.player.laserActive && this.keys.has(' ')) {
  // Create continuous beam from player
  this.laserBeam = {
    active: true,
    startX: this.player.position.x + this.player.size.width / 2,
    startY: this.player.position.y,
    endX: this.player.position.x + this.player.size.width / 2,
    endY: 0 // Top of screen
  };

  // Check laser collision with all enemies
  for (const enemy of this.enemies) {
    if (!enemy.isAlive) continue;
    const beamX = this.laserBeam.startX;
    if (beamX >= enemy.position.x && beamX <= enemy.position.x + enemy.size.width) {
      if (enemy.position.y <= this.player.position.y) {
        enemy.hit();
        if (!enemy.isAlive) {
          // Handle enemy death
        }
      }
    }
  }
} else {
  this.laserBeam = null;
}
```

In GameEngine.render():
```typescript
// Render laser beam
if (this.laserBeam && this.laserBeam.active) {
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 4;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(this.laserBeam.startX, this.laserBeam.startY);
  ctx.lineTo(this.laserBeam.endX, this.laserBeam.endY);
  ctx.stroke();
  ctx.restore();
}
```

### 3.3 Freeze Ray
**Where:** `src/lib/game/GameEngine.ts`

In Enemy.update():
```typescript
update(isFrozen: boolean = false) {
  if (isFrozen) {
    return; // Don't move or update when frozen
  }
  // ... rest of update logic
}
```

In GameEngine.update():
```typescript
// Update enemies with freeze check
for (const enemy of this.enemies) {
  enemy.update(this.player.freezeActive);
}
```

### 3.4 Nuke/Bomb
**Where:** `src/lib/game/GameEngine.ts`

Add method:
```typescript
activateNuke() {
  // Destroy all visible enemies
  for (const enemy of this.enemies) {
    if (enemy.isAlive) {
      enemy.hit();
      if (!enemy.isAlive) {
        this.stats.score += enemy.points;
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

  // Screen shake effect
  this.addScreenShake(30);

  // Flash effect
  this.hitFlashAlpha = 0.6;
}
```

### 3.5 Magnet
**Where:** `src/lib/game/GameEngine.ts`

In GameEngine.update() (powerup update section):
```typescript
// Magnet effect - attract powerups to player
if (this.player.magnetActive) {
  for (const powerUp of this.powerUps) {
    if (!powerUp.isActive) continue;

    const dx = this.player.position.x - powerUp.position.x;
    const dy = this.player.position.y - powerUp.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 200) { // Magnet range
      const pullStrength = 2;
      powerUp.velocity.x = (dx / distance) * pullStrength;
      powerUp.velocity.y = (dy / distance) * pullStrength;
    }
  }
}
```

### 3.6 Invincibility
**Where:** `src/lib/game/GameEngine.ts`

In hitPlayer():
```typescript
hitPlayer() {
  // Don't take damage if invulnerable, shield is active, OR invincibility is active
  if (this.player.invulnerable || this.player.shieldActive || this.player.invincibilityActive) {
    return;
  }
  // ... rest of method
}
```

In checkCollisions() (enemy projectiles vs player):
```typescript
if (!this.player.shieldActive && !this.player.invulnerable && !this.player.invincibilityActive) {
  // ... collision logic
}
```

### 3.7 Score Multiplier
**Where:** `src/lib/game/GameEngine.ts`

Update in GameEngine.update():
```typescript
// Score multiplier countdown
if (this.scoreMultiplierDuration > 0) {
  this.scoreMultiplierDuration--;
  if (this.scoreMultiplierDuration <= 0) {
    this.scoreMultiplier = 1;
  }
}
```

Modify all score additions:
```typescript
this.stats.score += (enemy.points * this.scoreMultiplier);
```

---

## 📝 Part 4: Documentation & Polish (TO DO)

### 4.1 Update Game Guide
**File:** `src/pages/GuidePage.tsx`

Add new powerups section:
```markdown
### Power-Ups (12 Types)

**Common:**
- 🟣 Plasma Shot - Fires 3 bullets in a spread
- 🔵 Rapid Fire - Doubles fire rate
- 🟢 Shield - Temporary invulnerability

**Uncommon:**
- 🟠 Slow Motion - Slows down time
- 🔷 Magnet - Attracts all powerups
- 🌸 Homing Missiles - Bullets track enemies

**Rare:**
- ❄️ Freeze Ray - Freezes all enemies
- 💜 Score Multiplier - 2x score
- 🔴 Laser Beam - Continuous piercing beam

**Legendary:**
- ⭐ Invincibility - Complete invulnerability
- 💥 Nuke - Destroys all on-screen enemies
- ❤️ Extra Life - Adds +1 life (0.5% drop rate)
```

### 4.2 Add Achievement Tracking
Update `AchievementManager.ts` to track new powerup usage.

### 4.3 Sound Effects
Consider adding unique sounds for:
- Homing missile lock-on
- Laser beam activation/loop
- Freeze effect
- Nuke explosion
- Magnet attraction
- Score multiplier activation
- Invincibility activation

---

## 🧪 Testing Checklist

- [ ] All 12 powerups spawn correctly with proper rarity
- [ ] Homing missiles track nearest enemy
- [ ] Laser beam damages all enemies in line
- [ ] Freeze stops enemy movement and attacks
- [ ] Nuke destroys all visible enemies
- [ ] Extra Life increases life count
- [ ] Score Multiplier doubles all score gains
- [ ] Magnet attracts nearby powerups
- [ ] Invincibility prevents all damage
- [ ] Powerups work with ship superpowers (duration boosts)
- [ ] Boss drops include new powerup types
- [ ] Game Guide updated with all powerup info
- [ ] Build compiles without errors
- [ ] No performance issues with new powerups
- [ ] Mobile/PWA compatibility verified

---

## 📊 Implementation Time Estimate

- Part 2 (GameEngine Integration): ~1-2 hours
- Part 3 (Powerup Logic): ~2-3 hours
- Part 4 (Documentation & Polish): ~30 minutes
- **Total: 3.5-5.5 hours**

---

## 🚀 Next Steps

1. Review this plan
2. Start with Part 2: GameEngine Integration
3. Implement Part 3: Powerup Logic (one at a time)
4. Complete Part 4: Documentation
5. Full testing pass
6. Commit and push to GitHub

---

**Status:** Part 1 complete, ready to proceed with Part 2
**Last Updated:** 2026-01-02
