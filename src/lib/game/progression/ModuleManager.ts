import {
  Module,
  ModuleId,
  ModuleTier,
  ModuleCategory,
  ModuleEffectType,
  PlayerModules,
  MODULE_CAPS,
  STORAGE_KEYS
} from './ProgressionTypes';
import { CurrencyManager } from './CurrencyManager';
import { AchievementManager } from './AchievementManager';
import { getAudioManager } from '../audio/AudioManager';

/**
 * ModuleManager - Manages ship modules for meaningful progression
 *
 * Features:
 * - 21 modules across 3 categories (Offensive/Defensive/Utility)
 * - 4 tiers: Basic, Advanced, Elite, Legendary
 * - Achievement-gated unlocks
 * - 3 module slots (unlocked progressively)
 * - Balance caps to prevent overpowered builds
 */
export class ModuleManager {
  private modules: Map<ModuleId, Module>;
  private playerModules: PlayerModules;
  private currencyManager: CurrencyManager;
  private achievementManager: AchievementManager;

  // Cached computed effects
  private cachedEffects: Map<ModuleEffectType, number> | null = null;

  constructor(currencyManager: CurrencyManager, achievementManager: AchievementManager) {
    this.currencyManager = currencyManager;
    this.achievementManager = achievementManager;
    this.modules = new Map();
    this.initializeModules();
    this.playerModules = this.loadFromStorage();
    console.log('🔧 ModuleManager initialized - Owned:', this.playerModules.ownedModules.length, 'Equipped:', this.playerModules.equippedModules);
  }

  // ============================================================================
  // MODULE DEFINITIONS (21 Total)
  // ============================================================================

  private initializeModules(): void {
    const moduleDefinitions: Module[] = [
      // ========================================================================
      // OFFENSIVE MODULES (8 total)
      // ========================================================================

      // Quick Trigger line (Fire Rate)
      {
        id: 'quick_trigger_1',
        name: 'Quick Trigger I',
        description: 'Enhanced firing mechanisms for faster shots.',
        icon: '🔫',
        tier: 'basic',
        category: 'offensive',
        price: 200,
        effect: {
          type: 'fire_rate_boost',
          value: 5,
          description: '+5% Fire Rate'
        },
        achievementCountRequired: 0,
        owned: false
      },
      {
        id: 'quick_trigger_2',
        name: 'Quick Trigger II',
        description: 'Advanced trigger system for rapid fire.',
        icon: '🔫',
        tier: 'advanced',
        category: 'offensive',
        price: 600,
        effect: {
          type: 'fire_rate_boost',
          value: 12,
          description: '+12% Fire Rate'
        },
        achievementCountRequired: 10,
        owned: false
      },
      {
        id: 'quick_trigger_3',
        name: 'Quick Trigger III',
        description: 'Military-grade firing enhancement.',
        icon: '🔫',
        tier: 'elite',
        category: 'offensive',
        price: 1500,
        effect: {
          type: 'fire_rate_boost',
          value: 20,
          description: '+20% Fire Rate'
        },
        achievementCountRequired: 20,
        owned: false
      },

      // Impact Rounds line (Damage)
      {
        id: 'impact_rounds_1',
        name: 'Impact Rounds I',
        description: 'High-impact ammunition for more damage.',
        icon: '💥',
        tier: 'basic',
        category: 'offensive',
        price: 250,
        effect: {
          type: 'damage_boost',
          value: 10,
          description: '+10% Damage'
        },
        achievementCountRequired: 0,
        owned: false
      },
      {
        id: 'impact_rounds_2',
        name: 'Impact Rounds II',
        description: 'Armor-piercing rounds with increased penetration.',
        icon: '💥',
        tier: 'advanced',
        category: 'offensive',
        price: 750,
        effect: {
          type: 'damage_boost',
          value: 20,
          description: '+20% Damage'
        },
        achievementCountRequired: 10,
        owned: false
      },
      {
        id: 'impact_rounds_3',
        name: 'Impact Rounds III',
        description: 'Experimental heavy ordnance.',
        icon: '💥',
        tier: 'elite',
        category: 'offensive',
        price: 1800,
        effect: {
          type: 'damage_boost',
          value: 35,
          description: '+35% Damage'
        },
        achievementCountRequired: 20,
        owned: false
      },

      // Special Offensive
      {
        id: 'boss_buster',
        name: 'Boss Buster',
        description: 'Specialized anti-boss ammunition.',
        icon: '👾',
        tier: 'elite',
        category: 'offensive',
        price: 2000,
        effect: {
          type: 'boss_damage_boost',
          value: 50,
          description: '+50% Damage to Bosses'
        },
        achievementCountRequired: 20,
        specificAchievement: 'boss_slayer',
        owned: false
      },
      {
        id: 'chain_lightning',
        name: 'Chain Lightning',
        description: 'Kills chain to nearby enemies.',
        icon: '⚡',
        tier: 'legendary',
        category: 'offensive',
        price: 3500,
        effect: {
          type: 'chain_lightning',
          value: 3, // Max 3 chains
          description: 'Kills chain to 3 nearby enemies'
        },
        achievementCountRequired: 25,
        specificAchievement: 'combo_legend',
        owned: false
      },

      // ========================================================================
      // DEFENSIVE MODULES (7 total)
      // ========================================================================

      // Reinforced Hull line (HP)
      {
        id: 'reinforced_hull_1',
        name: 'Reinforced Hull I',
        description: 'Basic armor plating.',
        icon: '🛡️',
        tier: 'basic',
        category: 'defensive',
        price: 300,
        effect: {
          type: 'max_hp_boost',
          value: 1,
          description: '+1 Max HP'
        },
        achievementCountRequired: 0,
        owned: false
      },
      {
        id: 'reinforced_hull_2',
        name: 'Reinforced Hull II',
        description: 'Advanced composite armor.',
        icon: '🛡️',
        tier: 'advanced',
        category: 'defensive',
        price: 800,
        effect: {
          type: 'max_hp_boost',
          value: 2,
          description: '+2 Max HP'
        },
        achievementCountRequired: 10,
        owned: false
      },
      {
        id: 'reinforced_hull_3',
        name: 'Reinforced Hull III',
        description: 'Military-grade titanium plating.',
        icon: '🛡️',
        tier: 'elite',
        category: 'defensive',
        price: 2000,
        effect: {
          type: 'max_hp_boost',
          value: 3,
          description: '+3 Max HP'
        },
        achievementCountRequired: 20,
        owned: false
      },

      // Shield Boost line
      {
        id: 'shield_boost_1',
        name: 'Shield Boost I',
        description: 'Extended shield generator capacity.',
        icon: '🔋',
        tier: 'basic',
        category: 'defensive',
        price: 250,
        effect: {
          type: 'shield_duration_boost',
          value: 15,
          description: '+15% Shield Duration'
        },
        achievementCountRequired: 0,
        owned: false
      },
      {
        id: 'shield_boost_2',
        name: 'Shield Boost II',
        description: 'Advanced energy shields.',
        icon: '🔋',
        tier: 'advanced',
        category: 'defensive',
        price: 700,
        effect: {
          type: 'shield_duration_boost',
          value: 30,
          description: '+30% Shield Duration'
        },
        achievementCountRequired: 10,
        owned: false
      },

      // Special Defensive
      {
        id: 'emergency_shield',
        name: 'Emergency Shield',
        description: 'Auto-activates shield when at 1 HP.',
        icon: '🆘',
        tier: 'legendary',
        category: 'defensive',
        price: 3000,
        effect: {
          type: 'emergency_shield',
          value: 1, // Once per game
          description: 'Auto-shield at 1 HP (1x per game)'
        },
        achievementCountRequired: 25,
        specificAchievement: 'survivor',
        owned: false
      },
      {
        id: 'phase_shift',
        name: 'Phase Shift',
        description: 'Brief invulnerability on near-miss.',
        icon: '👻',
        tier: 'legendary',
        category: 'defensive',
        price: 4000,
        effect: {
          type: 'phase_shift',
          value: 18, // 0.3 seconds at 60fps
          description: '0.3s invuln on near-miss'
        },
        achievementCountRequired: 25,
        specificAchievement: 'iron_will',
        owned: false
      },

      // ========================================================================
      // UTILITY MODULES (6 total)
      // ========================================================================

      // Magnet line (Power-up attract)
      {
        id: 'magnet_1',
        name: 'Magnet I',
        description: 'Increases power-up attraction range.',
        icon: '🧲',
        tier: 'basic',
        category: 'utility',
        price: 200,
        effect: {
          type: 'powerup_attract_boost',
          value: 20,
          description: '+20% Power-up Attract Range'
        },
        achievementCountRequired: 0,
        owned: false
      },
      {
        id: 'magnet_2',
        name: 'Magnet II',
        description: 'Advanced magnetic field generator.',
        icon: '🧲',
        tier: 'advanced',
        category: 'utility',
        price: 500,
        effect: {
          type: 'powerup_attract_boost',
          value: 40,
          description: '+40% Power-up Attract Range'
        },
        achievementCountRequired: 10,
        owned: false
      },

      // Lucky Star line (Drop rate)
      {
        id: 'lucky_star_1',
        name: 'Lucky Star I',
        description: 'Increases power-up drop chance.',
        icon: '🍀',
        tier: 'basic',
        category: 'utility',
        price: 350,
        effect: {
          type: 'powerup_drop_boost',
          value: 10,
          description: '+10% Power-up Drop Rate'
        },
        achievementCountRequired: 0,
        owned: false
      },
      {
        id: 'lucky_star_2',
        name: 'Lucky Star II',
        description: 'Fortune favors the bold.',
        icon: '🍀',
        tier: 'elite',
        category: 'utility',
        price: 1200,
        effect: {
          type: 'powerup_drop_boost',
          value: 25,
          description: '+25% Power-up Drop Rate'
        },
        achievementCountRequired: 20,
        owned: false
      },

      // Stardust Hunter line
      {
        id: 'stardust_hunter_1',
        name: 'Stardust Hunter I',
        description: 'Increases Stardust earned from kills.',
        icon: '💎',
        tier: 'advanced',
        category: 'utility',
        price: 800,
        effect: {
          type: 'stardust_boost',
          value: 15,
          description: '+15% Stardust Earned'
        },
        achievementCountRequired: 10,
        owned: false
      },
      {
        id: 'stardust_hunter_2',
        name: 'Stardust Hunter II',
        description: 'Expert cosmic treasure collector.',
        icon: '💎',
        tier: 'elite',
        category: 'utility',
        price: 2000,
        effect: {
          type: 'stardust_boost',
          value: 30,
          description: '+30% Stardust Earned'
        },
        achievementCountRequired: 20,
        owned: false
      },

      // Special Utility
      {
        id: 'combo_keeper',
        name: 'Combo Keeper',
        description: 'Combo does not reset on hit (once per game).',
        icon: '🔥',
        tier: 'legendary',
        category: 'utility',
        price: 3500,
        effect: {
          type: 'combo_keeper',
          value: 1, // Once per game
          description: 'Combo survives 1 hit'
        },
        achievementCountRequired: 25,
        specificAchievement: 'combo_legend',
        owned: false
      }
    ];

    moduleDefinitions.forEach(module => {
      this.modules.set(module.id, module);
    });
  }

  // ============================================================================
  // PUBLIC API - QUERIES
  // ============================================================================

  /**
   * Get all modules with unlock/owned status
   */
  getAllModules(): Module[] {
    const unlockedCount = this.achievementManager.getUnlockedAchievements().length;
    return Array.from(this.modules.values()).map(module => ({
      ...module,
      owned: this.playerModules.ownedModules.includes(module.id)
    }));
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: ModuleCategory): Module[] {
    return this.getAllModules().filter(m => m.category === category);
  }

  /**
   * Get modules by tier
   */
  getModulesByTier(tier: ModuleTier): Module[] {
    return this.getAllModules().filter(m => m.tier === tier);
  }

  /**
   * Get owned modules
   */
  getOwnedModules(): Module[] {
    return this.getAllModules().filter(m => m.owned);
  }

  /**
   * Get equipped modules
   */
  getEquippedModules(): Module[] {
    return this.playerModules.equippedModules
      .map(id => this.modules.get(id))
      .filter((m): m is Module => m !== undefined);
  }

  /**
   * Get a specific module by ID
   */
  getModule(id: ModuleId): Module | undefined {
    const module = this.modules.get(id);
    if (!module) return undefined;
    return {
      ...module,
      owned: this.playerModules.ownedModules.includes(id)
    };
  }

  /**
   * Check if a module is available for purchase
   */
  canPurchaseModule(id: ModuleId): { canPurchase: boolean; reason?: string } {
    const module = this.modules.get(id);
    if (!module) {
      return { canPurchase: false, reason: 'Module not found' };
    }

    if (this.playerModules.ownedModules.includes(id)) {
      return { canPurchase: false, reason: 'Already owned' };
    }

    const unlockedCount = this.achievementManager.getUnlockedAchievements().length;
    if (unlockedCount < module.achievementCountRequired) {
      return {
        canPurchase: false,
        reason: `Requires ${module.achievementCountRequired} achievements (have ${unlockedCount})`
      };
    }

    if (module.specificAchievement) {
      const achievement = this.achievementManager.getAchievementById(module.specificAchievement);
      if (!achievement?.unlocked) {
        const achievementName = achievement?.name || module.specificAchievement;
        return {
          canPurchase: false,
          reason: `Requires "${achievementName}" achievement`
        };
      }
    }

    if (!this.currencyManager.canAfford(module.price)) {
      return {
        canPurchase: false,
        reason: `Need ${module.price} Stardust (have ${this.currencyManager.getStardust()})`
      };
    }

    return { canPurchase: true };
  }

  /**
   * Get number of unlocked slots
   */
  getSlotsUnlocked(): number {
    return this.playerModules.slotsUnlocked;
  }

  /**
   * Check slot unlock status based on player level and boss kills
   */
  updateSlotUnlocks(playerLevel: number, bossesDefeated: number): void {
    let slots = 0;

    // Slot 1: Level 3 OR first boss defeated
    if (playerLevel >= 3 || bossesDefeated >= 1) {
      slots = 1;
    }

    // Slot 2: Level 5
    if (playerLevel >= 5) {
      slots = 2;
    }

    // Slot 3: Level 10
    if (playerLevel >= 10) {
      slots = 3;
    }

    if (slots !== this.playerModules.slotsUnlocked) {
      this.playerModules.slotsUnlocked = slots;
      this.saveToStorage();

      window.dispatchEvent(new CustomEvent('module-slot-unlocked', {
        detail: { slots }
      }));
    }
  }

  // ============================================================================
  // PUBLIC API - ACTIONS
  // ============================================================================

  /**
   * Purchase a module
   */
  purchaseModule(id: ModuleId): { success: boolean; message: string } {
    const check = this.canPurchaseModule(id);
    if (!check.canPurchase) {
      return { success: false, message: check.reason || 'Cannot purchase' };
    }

    const module = this.modules.get(id)!;

    if (this.currencyManager.spendStardust(module.price, `module_${id}`)) {
      this.playerModules.ownedModules.push(id);
      this.invalidateCache();
      this.saveToStorage();

      const audioManager = getAudioManager();
      audioManager.playSound('achievement_unlock', 0.5);

      window.dispatchEvent(new CustomEvent('module-purchased', {
        detail: { module }
      }));

      return { success: true, message: `Purchased ${module.name}!` };
    }

    return { success: false, message: 'Purchase failed' };
  }

  /**
   * Equip a module to a slot
   */
  equipModule(id: ModuleId, slot: number): { success: boolean; message: string } {
    if (slot < 0 || slot >= this.playerModules.slotsUnlocked) {
      return { success: false, message: `Slot ${slot + 1} not unlocked` };
    }

    if (!this.playerModules.ownedModules.includes(id)) {
      return { success: false, message: 'Module not owned' };
    }

    const module = this.modules.get(id);
    if (!module) {
      return { success: false, message: 'Module not found' };
    }

    // Check if same module type is already equipped in another slot
    const currentEquipped = this.getEquippedModules();
    for (let i = 0; i < currentEquipped.length; i++) {
      if (i !== slot && currentEquipped[i].effect.type === module.effect.type) {
        return {
          success: false,
          message: `Cannot equip multiple ${module.effect.type.replace(/_/g, ' ')} modules`
        };
      }
    }

    // Ensure equipped array is the right size
    while (this.playerModules.equippedModules.length < this.playerModules.slotsUnlocked) {
      this.playerModules.equippedModules.push('' as ModuleId);
    }

    this.playerModules.equippedModules[slot] = id;
    this.invalidateCache();
    this.saveToStorage();

    window.dispatchEvent(new CustomEvent('module-equipped', {
      detail: { module, slot }
    }));

    return { success: true, message: `Equipped ${module.name} to slot ${slot + 1}` };
  }

  /**
   * Unequip a module from a slot
   */
  unequipModule(slot: number): { success: boolean; message: string } {
    if (slot < 0 || slot >= this.playerModules.equippedModules.length) {
      return { success: false, message: 'Invalid slot' };
    }

    const moduleId = this.playerModules.equippedModules[slot];
    if (!moduleId) {
      return { success: false, message: 'Slot is empty' };
    }

    this.playerModules.equippedModules[slot] = '' as ModuleId;
    this.invalidateCache();
    this.saveToStorage();

    window.dispatchEvent(new CustomEvent('module-unequipped', {
      detail: { slot }
    }));

    return { success: true, message: 'Module unequipped' };
  }

  // ============================================================================
  // PUBLIC API - COMPUTED EFFECTS
  // ============================================================================

  /**
   * Get total effect value for a specific type (with caps applied)
   */
  getEffectValue(type: ModuleEffectType): number {
    if (!this.cachedEffects) {
      this.computeEffects();
    }
    return this.cachedEffects?.get(type) || 0;
  }

  /**
   * Get all active effects (for display)
   */
  getAllActiveEffects(): Map<ModuleEffectType, number> {
    if (!this.cachedEffects) {
      this.computeEffects();
    }
    return new Map(this.cachedEffects);
  }

  /**
   * Check if player has emergency shield available (for one-time use)
   */
  hasEmergencyShield(): boolean {
    return this.playerModules.equippedModules.includes('emergency_shield');
  }

  /**
   * Check if player has combo keeper available (for one-time use)
   */
  hasComboKeeper(): boolean {
    return this.playerModules.equippedModules.includes('combo_keeper');
  }

  /**
   * Check if player has phase shift module
   */
  hasPhaseShift(): boolean {
    return this.playerModules.equippedModules.includes('phase_shift');
  }

  /**
   * Check if player has chain lightning module
   */
  hasChainLightning(): boolean {
    return this.playerModules.equippedModules.includes('chain_lightning');
  }

  /**
   * Get chain lightning max chains
   */
  getChainLightningChains(): number {
    if (!this.hasChainLightning()) return 0;
    const module = this.modules.get('chain_lightning');
    return module?.effect.value || 0;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private computeEffects(): void {
    this.cachedEffects = new Map();

    const equipped = this.getEquippedModules();

    for (const module of equipped) {
      const currentValue = this.cachedEffects.get(module.effect.type) || 0;
      this.cachedEffects.set(module.effect.type, currentValue + module.effect.value);
    }

    // Apply caps
    const caps: Partial<Record<ModuleEffectType, number>> = {
      'damage_boost': MODULE_CAPS.MAX_DAMAGE_BONUS,
      'boss_damage_boost': MODULE_CAPS.MAX_DAMAGE_BONUS,
      'max_hp_boost': MODULE_CAPS.MAX_HP_BONUS,
      'fire_rate_boost': MODULE_CAPS.MAX_FIRE_RATE_BONUS,
      'shield_duration_boost': MODULE_CAPS.MAX_SHIELD_DURATION_BONUS,
      'stardust_boost': MODULE_CAPS.MAX_STARDUST_BONUS,
      'powerup_drop_boost': MODULE_CAPS.MAX_POWERUP_DROP_BONUS,
      'powerup_attract_boost': MODULE_CAPS.MAX_POWERUP_ATTRACT_BONUS,
    };

    for (const [effectType, maxValue] of Object.entries(caps)) {
      const currentValue = this.cachedEffects.get(effectType as ModuleEffectType);
      if (currentValue !== undefined && currentValue > maxValue) {
        this.cachedEffects.set(effectType as ModuleEffectType, maxValue);
      }
    }
  }

  private invalidateCache(): void {
    this.cachedEffects = null;
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(this.playerModules));
    } catch (error) {
      console.error('Failed to save modules:', error);
    }
  }

  private loadFromStorage(): PlayerModules {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MODULES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ownedModules: parsed.ownedModules || [],
          equippedModules: parsed.equippedModules || [],
          slotsUnlocked: parsed.slotsUnlocked || 0
        };
      }
    } catch (error) {
      console.error('Failed to load modules:', error);
    }

    return {
      ownedModules: [],
      equippedModules: [],
      slotsUnlocked: 0
    };
  }

  // ============================================================================
  // DEBUG METHODS
  // ============================================================================

  debugUnlockAllModules(): void {
    if (import.meta.env.DEV) {
      this.playerModules.ownedModules = Array.from(this.modules.keys());
      this.playerModules.slotsUnlocked = 3;
      this.invalidateCache();
      this.saveToStorage();
      console.log('🔧 DEBUG: Unlocked all modules');
    }
  }

  debugResetModules(): void {
    if (import.meta.env.DEV) {
      this.playerModules = {
        ownedModules: [],
        equippedModules: [],
        slotsUnlocked: 0
      };
      this.invalidateCache();
      this.saveToStorage();
      console.log('🔧 DEBUG: Reset all modules');
    }
  }

  debugPrintStatus(): void {
    if (import.meta.env.DEV) {
      const owned = this.playerModules.ownedModules.length;
      const total = this.modules.size;
      console.log('🔧 Module Status:', {
        owned: `${owned}/${total}`,
        slotsUnlocked: this.playerModules.slotsUnlocked,
        equipped: this.playerModules.equippedModules,
        activeEffects: Object.fromEntries(this.getAllActiveEffects())
      });
    }
  }
}
