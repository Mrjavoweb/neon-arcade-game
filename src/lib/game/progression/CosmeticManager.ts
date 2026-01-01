import { ShipSkin, ShipSkinId, PlayerCosmetics, STORAGE_KEYS } from './ProgressionTypes';
import { CurrencyManager } from './CurrencyManager';

/**
 * CosmeticManager - Manages ship skins and cosmetics
 *
 * Features:
 * - 11 ship skins (1 default + 10 purchasable)
 * - CSS filter-based coloring (no new assets needed!)
 * - Purchase system integrated with currency
 * - Animated effects (rainbow, galaxy)
 */
export class CosmeticManager {
  private cosmetics: PlayerCosmetics;
  private currencyManager: CurrencyManager;
  private skins: Map<ShipSkinId, ShipSkin>;

  // For animated skins
  private rainbowHue: number = 0;
  private galaxyHue: number = 0;

  constructor(currencyManager: CurrencyManager) {
    this.currencyManager = currencyManager;
    this.skins = new Map();
    this.initializeSkins();
    this.cosmetics = this.loadFromStorage();
    console.log('🎨 CosmeticManager initialized - Active:', this.cosmetics.activeSkin, 'Owned:', this.cosmetics.ownedSkins);
  }

  // ============================================================================
  // SKIN DEFINITIONS (11 Total)
  // ============================================================================

  private initializeSkins(): void {
    const skinDefinitions: ShipSkin[] = [
      // ========================================================================
      // DEFAULT (Always Unlocked)
      // ========================================================================
      {
        id: 'default',
        name: 'Default',
        description: 'Your trusty cyan defender. Balanced stats and reliable firepower.',
        tier: 'default',
        price: 0,
        filter: 'none',
        bulletColor: '#22d3ee',
        superpower: {
          type: 'none',
          name: 'Standard Configuration',
          description: 'No special abilities - learn the basics'
        },
        unlocked: true
      },

      // ========================================================================
      // COMMON TIER (600 Stardust each)
      // ========================================================================
      {
        id: 'red_phoenix',
        name: 'Red Phoenix',
        description: 'Blazing war machine with enhanced firing mechanisms.',
        tier: 'common',
        price: 600,
        filter: 'hue-rotate(170deg) saturate(150%)', // Cyan to Red: 190° + 170° = 360° = 0° (red)
        bulletColor: '#ff6b6b',
        superpower: {
          type: 'fire_rate_boost',
          name: 'Enhanced Firing System',
          description: '+10% Fire Rate',
          value: 10
        },
        unlocked: false
      },
      {
        id: 'green_viper',
        name: 'Green Viper',
        description: 'Nimble striker with boosted thrusters.',
        tier: 'common',
        price: 600,
        filter: 'hue-rotate(290deg) saturate(130%)', // Cyan to Green: 190° + 290° = 480° = 120° (green)
        bulletColor: '#51cf66',
        superpower: {
          type: 'movement_speed_boost',
          name: 'Boosted Thrusters',
          description: '+15% Movement Speed',
          value: 15
        },
        unlocked: false
      },
      {
        id: 'purple_shadow',
        name: 'Purple Shadow',
        description: 'Phantom with reinforced shield generators.',
        tier: 'common',
        price: 600,
        filter: 'hue-rotate(80deg) saturate(140%)', // Cyan to Purple: 190° + 80° = 270° (purple/magenta)
        bulletColor: '#a855f7',
        superpower: {
          type: 'shield_duration_boost',
          name: 'Reinforced Shields',
          description: '+20% Shield Duration',
          value: 20
        },
        unlocked: false
      },

      // ========================================================================
      // RARE TIER (1500 Stardust each)
      // ========================================================================
      {
        id: 'gold_elite',
        name: 'Gold Elite',
        description: 'Elite destroyer with twin plasma cannons.',
        tier: 'rare',
        price: 1500,
        filter: 'hue-rotate(220deg) saturate(200%) brightness(130%)', // Cyan to Gold: 190° + 220° = 410° = 50° (gold/yellow)
        bulletColor: '#ffd700',
        superpower: {
          type: 'dual_guns',
          name: 'Twin Plasma Cannons',
          description: 'Fires 2 bullets side-by-side',
          value: 2
        },
        unlocked: false
      },
      {
        id: 'cyan_frost',
        name: 'Cyan Frost',
        description: 'Frost predator with armor-piercing rounds.',
        tier: 'rare',
        price: 1500,
        filter: 'hue-rotate(180deg) saturate(120%) brightness(110%)',
        bulletColor: '#06b6d4',
        superpower: {
          type: 'piercing_shots',
          name: 'Armor-Piercing Rounds',
          description: 'Bullets penetrate first enemy',
          value: 1
        },
        unlocked: false
      },

      // ========================================================================
      // EPIC TIER (3000 Stardust each)
      // ========================================================================
      {
        id: 'rainbow_streak',
        name: 'Rainbow Streak',
        description: 'Rainbow spectrum ship with multi-barrel arsenal.',
        tier: 'epic',
        price: 3000,
        filter: 'hue-rotate(var(--rainbow-hue)) saturate(200%)', // Dynamic!
        bulletColor: 'rainbow', // Special flag for dynamic color
        superpower: {
          type: 'triple_shot',
          name: 'Multi-Barrel Arsenal',
          description: 'Always fires 3 bullets (without powerup!)',
          value: 3
        },
        unlocked: false
      },
      {
        id: 'dark_matter',
        name: 'Dark Matter',
        description: 'Void assassin that feeds on destruction.',
        tier: 'epic',
        price: 3000,
        filter: 'brightness(30%) contrast(150%)',
        bulletColor: '#6366f1',
        superpower: {
          type: 'lifesteal',
          name: 'Damage Absorption',
          description: '10% of damage taken converts to score bonus',
          value: 10
        },
        unlocked: false
      },
      {
        id: 'solar_flare',
        name: 'Solar Flare',
        description: 'Solar incarnate with explosive ordnance.',
        tier: 'epic',
        price: 3000,
        filter: 'hue-rotate(30deg) saturate(300%) brightness(150%)',
        bulletColor: '#ff8c00',
        superpower: {
          type: 'explosive_rounds',
          name: 'Explosive Ordnance',
          description: 'Bullets explode on impact (small AoE)',
          value: 30
        },
        unlocked: false
      },

      // ========================================================================
      // LEGENDARY TIER (5000+ Stardust)
      // ========================================================================
      {
        id: 'cosmic_void',
        name: 'Cosmic Void',
        description: 'Galaxy phenomenon with gravitational weapons + extended powerups.',
        tier: 'legendary',
        price: 5000,
        filter: 'hue-rotate(var(--galaxy-hue)) contrast(150%) saturate(150%)', // Dynamic!
        bulletColor: 'galaxy', // Special flag for dynamic color
        superpower: {
          type: 'gravity_bullets',
          name: 'Gravitational Weapons',
          description: 'Bullets pull enemies slightly + All powerups last +3 seconds',
          value: 3
        },
        unlocked: false
      },
      {
        id: 'diamond_elite',
        name: 'Diamond Elite',
        description: 'Crystalline perfection with auto-regenerating barriers.',
        tier: 'legendary',
        price: 7500,
        filter: 'grayscale(100%) brightness(200%) contrast(150%)',
        bulletColor: '#e0e7ff',
        superpower: {
          type: 'auto_shield',
          name: 'Auto-Regenerating Shields',
          description: 'Start each wave with 3-second auto-shield',
          value: 3,
          duration: 180
        },
        unlocked: false
      }
    ];

    skinDefinitions.forEach(skin => {
      this.skins.set(skin.id, skin);
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get all skins with unlock status
   */
  getAllSkins(): ShipSkin[] {
    const loadedCosmetics = this.cosmetics;
    return Array.from(this.skins.values()).map(skin => ({
      ...skin,
      unlocked: loadedCosmetics.ownedSkins.includes(skin.id)
    }));
  }

  /**
   * Get owned skins only
   */
  getOwnedSkins(): ShipSkin[] {
    return this.getAllSkins().filter(skin => skin.unlocked);
  }

  /**
   * Get currently active skin
   */
  getActiveSkin(): ShipSkin {
    const skin = this.skins.get(this.cosmetics.activeSkin);
    if (!skin) return this.skins.get('default')!;
    return skin;
  }

  /**
   * Get active ship's superpower
   */
  getActiveSuperpower() {
    const skin = this.getActiveSkin();
    return skin.superpower || {
      type: 'none',
      name: 'No Superpower',
      description: 'Standard ship configuration'
    };
  }

  /**
   * Purchase a skin
   */
  purchaseSkin(skinId: ShipSkinId): { success: boolean; message: string } {
    const skin = this.skins.get(skinId);

    if (!skin) {
      return { success: false, message: 'Skin not found' };
    }

    if (this.cosmetics.ownedSkins.includes(skinId)) {
      return { success: false, message: 'Already owned' };
    }

    if (!this.currencyManager.canAfford(skin.price)) {
      return {
        success: false,
        message: `Need ${skin.price} 💎 Stardust (have ${this.currencyManager.getStardust()})`
      };
    }

    // Purchase skin
    if (this.currencyManager.spendStardust(skin.price, `skin_${skinId}`)) {
      this.cosmetics.ownedSkins.push(skinId);
      this.saveToStorage();

      window.dispatchEvent(new CustomEvent('skin-purchased', {
        detail: { skin }
      }));

      return { success: true, message: `Unlocked ${skin.name}!` };
    }

    return { success: false, message: 'Purchase failed' };
  }

  /**
   * Equip a skin
   */
  equipSkin(skinId: ShipSkinId): { success: boolean; message: string } {
    if (!this.cosmetics.ownedSkins.includes(skinId)) {
      return { success: false, message: 'Skin not owned' };
    }

    this.cosmetics.activeSkin = skinId;
    this.saveToStorage();

    window.dispatchEvent(new CustomEvent('skin-equipped', {
      detail: { skinId }
    }));

    return { success: true, message: `Equipped ${this.skins.get(skinId)?.name}` };
  }

  /**
   * Update animated skin effects (call from game loop)
   */
  update(): void {
    // Rotate rainbow hue
    this.rainbowHue = (this.rainbowHue + 2) % 360;

    // Slower galaxy rotation
    this.galaxyHue = (this.galaxyHue + 0.5) % 360;
  }

  /**
   * Get processed filter string (with dynamic values replaced)
   */
  getProcessedFilter(): string {
    const skin = this.getActiveSkin();
    let filter = skin.filter;

    // Replace dynamic hue variables
    if (skin.id === 'rainbow_streak') {
      filter = filter.replace('var(--rainbow-hue)', `${this.rainbowHue}deg`);
    } else if (skin.id === 'cosmic_void') {
      filter = filter.replace('var(--galaxy-hue)', `${this.galaxyHue}deg`);
    }

    return filter;
  }

  /**
   * Apply skin filter to canvas context
   */
  applySkinFilter(ctx: CanvasRenderingContext2D): void {
    const filter = this.getProcessedFilter();
    ctx.filter = filter;
  }

  /**
   * Get bullet color for active skin
   */
  getBulletColor(): string {
    const skin = this.getActiveSkin();

    if (skin.bulletColor === 'rainbow') {
      // Return dynamic rainbow color
      return `hsl(${this.rainbowHue}, 100%, 60%)`;
    } else if (skin.bulletColor === 'galaxy') {
      // Return dynamic galaxy color (purple-blue shift)
      return `hsl(${240 + (this.galaxyHue * 0.3)}, 80%, 60%)`;
    }

    return skin.bulletColor || '#22d3ee';
  }

  /**
   * Reset filter (call after rendering ship)
   */
  resetFilter(ctx: CanvasRenderingContext2D): void {
    ctx.filter = 'none';
  }

  /**
   * Check if player owns a skin
   */
  ownsSkin(skinId: ShipSkinId): boolean {
    return this.cosmetics.ownedSkins.includes(skinId);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COSMETICS, JSON.stringify(this.cosmetics));
    } catch (error) {
      console.error('Failed to save cosmetics:', error);
    }
  }

  private loadFromStorage(): PlayerCosmetics {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COSMETICS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          activeSkin: parsed.activeSkin || 'default',
          ownedSkins: parsed.ownedSkins || ['default']
        };
      }
    } catch (error) {
      console.error('Failed to load cosmetics:', error);
    }

    return {
      activeSkin: 'default',
      ownedSkins: ['default']
    };
  }

  // ============================================================================
  // DEBUG METHODS
  // ============================================================================

  debugUnlockAllSkins(): void {
    if (import.meta.env.DEV) {
      this.cosmetics.ownedSkins = Array.from(this.skins.keys());
      this.saveToStorage();
      console.log('🎮 DEBUG: Unlocked all skins');
    }
  }

  debugPrintStatus(): void {
    if (import.meta.env.DEV) {
      const owned = this.getOwnedSkins().length;
      const total = this.skins.size;
      console.log('🎨 Cosmetic Status:', {
        activeSkin: this.cosmetics.activeSkin,
        ownedSkins: `${owned}/${total}`,
        skins: this.cosmetics.ownedSkins
      });
    }
  }
}
