// HintManager - Shows contextual tutorial hints during gameplay
import { getSettingsManager } from '../settings/SettingsManager';

export interface GameHint {
  id: string;
  message: string;
  condition: string; // Description of when to show
  priority: number;  // Higher = more important
  showOnce: boolean; // Only show once per session
  duration: number;  // How long to display (ms)
}

// Define all tutorial hints
const HINTS: GameHint[] = [
  // Early game hints
  {
    id: 'welcome',
    message: 'Welcome! Destroy aliens to earn points and Stardust!',
    condition: 'Game start',
    priority: 10,
    showOnce: true,
    duration: 4000,
  },
  {
    id: 'controls_desktop',
    message: 'Use Arrow Keys or WASD to move, Spacebar to shoot',
    condition: 'Desktop first game',
    priority: 9,
    showOnce: true,
    duration: 4000,
  },
  {
    id: 'controls_mobile',
    message: 'Touch and drag to move - Auto-fire is enabled!',
    condition: 'Mobile first game',
    priority: 9,
    showOnce: true,
    duration: 4000,
  },
  {
    id: 'powerup_first',
    message: 'Collect power-ups for special abilities!',
    condition: 'First power-up spawns',
    priority: 8,
    showOnce: true,
    duration: 3500,
  },
  {
    id: 'shield_tip',
    message: 'Shield makes you invincible - save it for tough spots!',
    condition: 'First shield collected',
    priority: 7,
    showOnce: true,
    duration: 3500,
  },
  {
    id: 'combo_start',
    message: 'Kill enemies quickly to build combos for bonus points!',
    condition: 'First 3-kill combo',
    priority: 6,
    showOnce: true,
    duration: 3500,
  },
  {
    id: 'boss_incoming',
    message: 'BOSS INCOMING! Focus fire and dodge attacks!',
    condition: 'First boss wave',
    priority: 10,
    showOnce: true,
    duration: 4000,
  },
  {
    id: 'stardust_earned',
    message: 'Stardust earned! Visit the Shop for new ships!',
    condition: 'After first game with stardust',
    priority: 5,
    showOnce: true,
    duration: 3500,
  },
  {
    id: 'low_health',
    message: 'Low health! Play defensively and grab power-ups!',
    condition: 'Health drops to 1',
    priority: 8,
    showOnce: false, // Can show multiple times
    duration: 3000,
  },
  {
    id: 'wave_5',
    message: 'Wave 5 - Boss every 5 waves! Get ready!',
    condition: 'Reaching wave 5',
    priority: 7,
    showOnce: true,
    duration: 3500,
  },
  {
    id: 'laser_tip',
    message: 'LASER! Hold Spacebar for continuous beam!',
    condition: 'First laser power-up',
    priority: 8,
    showOnce: true,
    duration: 3500,
  },
  {
    id: 'nuke_tip',
    message: 'NUKE! Destroys all enemies on screen!',
    condition: 'First nuke power-up',
    priority: 8,
    showOnce: true,
    duration: 3000,
  },
  {
    id: 'extra_life',
    message: 'EXTRA LIFE! Ultra rare - you got lucky!',
    condition: 'First extra life',
    priority: 9,
    showOnce: true,
    duration: 3000,
  },
  // Upgrade/Shop awareness hints
  {
    id: 'upgrade_boss1',
    message: 'Great job! Visit the SHOP to upgrade your ship!',
    condition: 'After defeating boss 1',
    priority: 7,
    showOnce: true,
    duration: 5000,
  },
  {
    id: 'upgrade_boss2',
    message: 'MODULES unlocked! Check the SHOP for upgrades!',
    condition: 'After defeating boss 2',
    priority: 8,
    showOnce: true,
    duration: 5000,
  },
  {
    id: 'upgrade_struggle',
    message: 'Struggling? Upgrade your ship in the SHOP!',
    condition: 'After 3 consecutive deaths',
    priority: 9,
    showOnce: true,
    duration: 5000,
  },
];

export class HintManager {
  private enabled: boolean = true;
  private shownHints: Set<string> = new Set();
  private currentHint: GameHint | null = null;
  private hintStartTime: number = 0;
  private hintAlpha: number = 0;
  private lowHealthShownThisLife: boolean = false;
  private isMobile: boolean = false;

  constructor(isMobile: boolean = false) {
    this.isMobile = isMobile;

    // Load settings
    const settingsManager = getSettingsManager();
    const settings = settingsManager.getSettings();
    this.enabled = settings.showTutorialHints;

    // Load shown hints from localStorage
    this.loadShownHints();

    // Listen for settings changes
    window.addEventListener('settings-changed', ((event: CustomEvent) => {
      this.enabled = event.detail.settings.showTutorialHints;
      console.log('💡 HintManager: Settings updated, enabled:', this.enabled);
    }) as EventListener);

    console.log('💡 HintManager initialized', { enabled: this.enabled, isMobile: this.isMobile });
  }

  private loadShownHints(): void {
    try {
      const stored = localStorage.getItem('alienInvasion_shownHints');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.shownHints = new Set(parsed);
      }
    } catch (error) {
      console.warn('Failed to load shown hints:', error);
    }
  }

  private saveShownHints(): void {
    try {
      localStorage.setItem('alienInvasion_shownHints', JSON.stringify([...this.shownHints]));
    } catch (error) {
      console.warn('Failed to save shown hints:', error);
    }
  }

  // ============================================================================
  // TRIGGER HINTS
  // ============================================================================

  triggerHint(hintId: string): void {
    if (!this.enabled) return;

    const hint = HINTS.find(h => h.id === hintId);
    if (!hint) return;

    // Check if hint was already shown (for showOnce hints)
    if (hint.showOnce && this.shownHints.has(hintId)) return;

    // Don't interrupt higher priority hints
    if (this.currentHint && this.currentHint.priority > hint.priority) return;

    // Show the hint
    this.currentHint = hint;
    this.hintStartTime = performance.now();
    this.hintAlpha = 0;

    // Mark as shown
    if (hint.showOnce) {
      this.shownHints.add(hintId);
      this.saveShownHints();
    }

    console.log('💡 Showing hint:', hintId, hint.message);
  }

  // Convenience methods for common triggers
  onGameStart(): void {
    this.triggerHint('welcome');
    // Show controls hint after welcome
    setTimeout(() => {
      this.triggerHint(this.isMobile ? 'controls_mobile' : 'controls_desktop');
    }, 4500);
  }

  onFirstPowerUp(): void {
    this.triggerHint('powerup_first');
  }

  onShieldCollected(): void {
    this.triggerHint('shield_tip');
  }

  onLaserCollected(): void {
    this.triggerHint('laser_tip');
  }

  onNukeCollected(): void {
    this.triggerHint('nuke_tip');
  }

  onExtraLifeCollected(): void {
    this.triggerHint('extra_life');
  }

  onFirstCombo(): void {
    this.triggerHint('combo_start');
  }

  onBossWave(): void {
    this.triggerHint('boss_incoming');
  }

  onWave5(): void {
    this.triggerHint('wave_5');
  }

  onLowHealth(): void {
    if (!this.lowHealthShownThisLife) {
      this.triggerHint('low_health');
      this.lowHealthShownThisLife = true;
    }
  }

  onPlayerDeath(): void {
    // Reset low health flag so it can show again next life
    this.lowHealthShownThisLife = false;
  }

  onStardustEarned(): void {
    this.triggerHint('stardust_earned');
  }

  onBossDefeated(bossNumber: number): void {
    if (bossNumber === 1) {
      this.triggerHint('upgrade_boss1');
    } else if (bossNumber === 2) {
      this.triggerHint('upgrade_boss2');
    }
  }

  onPlayerStruggling(): void {
    this.triggerHint('upgrade_struggle');
  }

  // ============================================================================
  // UPDATE & RENDER
  // ============================================================================

  update(): void {
    if (!this.currentHint) return;

    const elapsed = performance.now() - this.hintStartTime;
    const fadeInTime = 300;
    const fadeOutStart = this.currentHint.duration - 500;

    // Calculate alpha for fade in/out
    if (elapsed < fadeInTime) {
      this.hintAlpha = elapsed / fadeInTime;
    } else if (elapsed > fadeOutStart) {
      this.hintAlpha = Math.max(0, 1 - (elapsed - fadeOutStart) / 500);
    } else {
      this.hintAlpha = 1;
    }

    // Clear hint when duration is over
    if (elapsed >= this.currentHint.duration) {
      this.currentHint = null;
      this.hintAlpha = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.currentHint || this.hintAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.hintAlpha;

    // Position: bottom center, above HUD
    const fontSize = this.isMobile ? 14 : 18;
    ctx.font = `bold ${fontSize}px 'Space Grotesk', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const x = canvasWidth / 2;
    const y = canvasHeight - (this.isMobile ? 80 : 100);

    // Background pill
    const text = this.currentHint.message;
    const metrics = ctx.measureText(text);
    const padding = 12;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = fontSize + padding * 1.5;

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    const radius = bgHeight / 2;
    ctx.roundRect(x - bgWidth / 2, y - bgHeight, bgWidth, bgHeight, radius);
    ctx.fill();

    // Border glow
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon
    const iconX = x - metrics.width / 2 - 20;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('💡', iconX, y - padding / 2);

    // Text with glow
    ctx.font = `bold ${fontSize}px 'Space Grotesk', monospace`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#22d3ee';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x + 10, y - padding / 2);

    ctx.restore();
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  isEnabled(): boolean {
    return this.enabled;
  }

  hasHint(): boolean {
    return this.currentHint !== null;
  }

  clearHint(): void {
    this.currentHint = null;
    this.hintAlpha = 0;
  }

  resetAllHints(): void {
    this.shownHints.clear();
    this.saveShownHints();
    console.log('💡 All hints reset');
  }
}

// Singleton instance
let hintManagerInstance: HintManager | null = null;

export function getHintManager(isMobile: boolean = false): HintManager {
  if (!hintManagerInstance) {
    hintManagerInstance = new HintManager(isMobile);
  }
  return hintManagerInstance;
}

export function resetHintManager(): void {
  hintManagerInstance = null;
}
