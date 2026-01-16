import { PlayerCurrency, CurrencyTransaction, STORAGE_KEYS } from './ProgressionTypes';

/**
 * CurrencyManager - Manages all in-game currencies (Stardust, future Gems/Coins)
 *
 * Features:
 * - Earn/spend Stardust
 * - Transaction logging for debugging
 * - localStorage persistence
 * - Future-proof for multiple currencies
 */
export class CurrencyManager {
  private currency: PlayerCurrency;
  private transactions: CurrencyTransaction[] = [];
  private maxTransactionHistory = 100; // Keep last 100 for debugging

  constructor() {
    this.currency = this.loadFromStorage();
    console.log('💰 CurrencyManager initialized - Stardust:', this.currency.stardust);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Earn Stardust from various sources
   */
  earnStardust(amount: number, source: string): void {
    if (amount <= 0) return;

    this.currency.stardust += amount;
    this.currency.lifetimeStardustEarned += amount;

    this.logTransaction('earn', 'stardust', amount, source);
    this.saveToStorage();

    console.log(`💎 Earned ${amount} Stardust from ${source}. New balance: ${this.currency.stardust}`);

    // Trigger visual feedback (handled by GameEngine)
    this.dispatchCurrencyEvent('earned', amount, source);
  }

  /**
   * Spend Stardust on shop items
   */
  spendStardust(amount: number, item: string): boolean {
    if (amount <= 0) return false;
    if (this.currency.stardust < amount) return false;

    this.currency.stardust -= amount;

    this.logTransaction('spend', 'stardust', amount, item);
    this.saveToStorage();

    this.dispatchCurrencyEvent('spent', amount, item);
    return true;
  }

  /**
   * Get current Stardust balance
   */
  getStardust(): number {
    return this.currency.stardust;
  }

  /**
   * Get lifetime Stardust earned (for achievements)
   */
  getLifetimeStardust(): number {
    return this.currency.lifetimeStardustEarned;
  }

  /**
   * Check if player can afford an item
   */
  canAfford(amount: number): boolean {
    return this.currency.stardust >= amount;
  }

  /**
   * Get full currency object (for debug/stats display)
   */
  getCurrency(): Readonly<PlayerCurrency> {
    return { ...this.currency };
  }

  /**
   * Get recent transactions (for debugging)
   */
  getRecentTransactions(count: number = 10): CurrencyTransaction[] {
    return this.transactions.slice(-count);
  }

  /**
   * Reset currency (for testing or prestige system)
   */
  reset(): void {
    this.currency = {
      stardust: 0,
      lifetimeStardustEarned: 0
    };
    this.transactions = [];
    this.saveToStorage();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private logTransaction(
  type: 'earn' | 'spend',
  currency: 'stardust' | 'gems' | 'coins',
  amount: number,
  source: string)
  : void {
    const transaction: CurrencyTransaction = {
      type,
      currency,
      amount,
      source,
      timestamp: Date.now()
    };

    this.transactions.push(transaction);

    // Keep transaction history limited
    if (this.transactions.length > this.maxTransactionHistory) {
      this.transactions = this.transactions.slice(-this.maxTransactionHistory);
    }
  }

  private dispatchCurrencyEvent(action: 'earned' | 'spent', amount: number, source: string): void {
    // Dispatch custom event for UI to listen to
    window.dispatchEvent(new CustomEvent('currency-changed', {
      detail: { action, amount, source, balance: this.currency.stardust }
    }));
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, JSON.stringify(this.currency));
    } catch (error) {
      console.error('Failed to save currency to localStorage:', error);
    }
  }

  private loadFromStorage(): PlayerCurrency {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all required fields exist (migration safety)
        return {
          stardust: parsed.stardust || 0,
          lifetimeStardustEarned: parsed.lifetimeStardustEarned || 0,
          premiumGems: parsed.premiumGems,
          sessionCoins: parsed.sessionCoins
        };
      }
    } catch (error) {
      console.error('Failed to load currency from localStorage:', error);
    }

    // Return default currency
    return {
      stardust: 0,
      lifetimeStardustEarned: 0
    };
  }

  // ============================================================================
  // DEBUG METHODS
  // ============================================================================

  /**
   * Debug: Add Stardust directly (for testing)
   */
  debugAddStardust(amount: number): void {
    if (import.meta.env.DEV) {
      this.earnStardust(amount, 'debug_cheat');
      console.log(`🎮 DEBUG: Added ${amount} 💎 Stardust`);
    }
  }

  /**
   * Debug: Print currency status
   */
  debugPrintStatus(): void {
    if (import.meta.env.DEV) {
      console.log('💰 Currency Status:', {
        current: this.currency.stardust,
        lifetime: this.currency.lifetimeStardustEarned,
        recentTransactions: this.getRecentTransactions(5)
      });
    }
  }
}