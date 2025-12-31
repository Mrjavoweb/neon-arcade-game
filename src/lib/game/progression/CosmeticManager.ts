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
        unlocked: true
      },

      // ========================================================================
      // COMMON TIER (600 Stardust each)
      // ========================================================================
      {
        id: 'red_phoenix',
        name: 'Red Phoenix',
        description: 'Blazing red war machine. High damage potential, built for aggressive combat.',
        tier: 'common',
        price: 600,
        filter: 'hue-rotate(170deg) saturate(150%)', // Cyan to Red: 190° + 170° = 360° = 0° (red)
        bulletColor: '#ff6b6b',
        unlocked: false
      },
      {
        id: 'green_viper',
        name: 'Green Viper',
        description: 'Toxic green striker. Fast fire rate, perfect for rapid-fire builds.',
        tier: 'common',
        price: 600,
        filter: 'hue-rotate(290deg) saturate(130%)', // Cyan to Green: 190° + 290° = 480° = 120° (green)
        bulletColor: '#51cf66',
        unlocked: false
      },
      {
        id: 'purple_shadow',
        name: 'Purple Shadow',
        description: 'Mysterious purple phantom. Stealth-focused design, ideal for evasive tactics.',
        tier: 'common',
        price: 600,
        filter: 'hue-rotate(80deg) saturate(140%)', // Cyan to Purple: 190° + 80° = 270° (purple/magenta)
        bulletColor: '#a855f7',
        unlocked: false
      },

      // ========================================================================
      // RARE TIER (1500 Stardust each)
      // ========================================================================
      {
        id: 'gold_elite',
        name: 'Gold Elite',
        description: 'Prestigious golden champion. Premium durability, bonus shield capacity.',
        tier: 'rare',
        price: 1500,
        filter: 'hue-rotate(220deg) saturate(200%) brightness(130%)', // Cyan to Gold: 190° + 220° = 410° = 50° (gold/yellow)
        bulletColor: '#ffd700',
        unlocked: false
      },
      {
        id: 'cyan_frost',
        name: 'Cyan Frost',
        description: 'Icy cyan predator. Freezing projectiles, slows enemy movement.',
        tier: 'rare',
        price: 1500,
        filter: 'hue-rotate(180deg) saturate(120%) brightness(110%)',
        bulletColor: '#06b6d4',
        unlocked: false
      },

      // ========================================================================
      // EPIC TIER (3000 Stardust each)
      // ========================================================================
      {
        id: 'rainbow_streak',
        name: 'Rainbow Streak',
        description: 'Shifting rainbow spectrum. Color-shifting projectiles, all-element damage.',
        tier: 'epic',
        price: 3000,
        filter: 'hue-rotate(var(--rainbow-hue)) saturate(200%)', // Dynamic!
        bulletColor: 'rainbow', // Special flag for dynamic color
        unlocked: false
      },
      {
        id: 'dark_matter',
        name: 'Dark Matter',
        description: 'Void-black assassin. Absorbs damage, converts to energy shields.',
        tier: 'epic',
        price: 3000,
        filter: 'brightness(30%) contrast(150%)',
        bulletColor: '#6366f1',
        unlocked: false
      },
      {
        id: 'solar_flare',
        name: 'Solar Flare',
        description: 'Burning sun incarnate. Explosive rounds, area-of-effect damage.',
        tier: 'epic',
        price: 3000,
        filter: 'hue-rotate(30deg) saturate(300%) brightness(150%)',
        bulletColor: '#ff8c00',
        unlocked: false
      },

      // ========================================================================
      // LEGENDARY TIER (5000+ Stardust)
      // ========================================================================
      {
        id: 'cosmic_void',
        name: 'Cosmic Void',
        description: 'Galaxy swirl phenomenon. Gravity well bullets, pulls enemies together.',
        tier: 'legendary',
        price: 5000,
        filter: 'hue-rotate(var(--galaxy-hue)) contrast(150%) saturate(150%)', // Dynamic!
        bulletColor: 'galaxy', // Special flag for dynamic color
        unlocked: false
      },
      {
        id: 'diamond_elite',
        name: 'Diamond Elite',
        description: 'Crystalline perfection. Ultimate defense, reflects enemy projectiles.',
        tier: 'legendary',
        price: 7500,
        filter: 'grayscale(100%) brightness(200%) contrast(150%)',
        bulletColor: '#e0e7ff',
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
