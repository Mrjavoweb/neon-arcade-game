// HapticManager - Handles vibration feedback for mobile devices
import { getSettingsManager } from '../settings/SettingsManager';

// Haptic feedback patterns (duration in milliseconds)
export type HapticPattern =
  | 'light'      // Quick tap - UI interactions
  | 'medium'     // Standard feedback - collecting items
  | 'heavy'      // Strong feedback - player hit, explosions
  | 'success'    // Achievement, level complete
  | 'warning'    // Low health warning
  | 'error'      // Death, game over
  | 'double'     // Double tap pattern
  | 'triple';    // Triple tap pattern

// Pattern definitions: single number = duration, array = pattern [vibrate, pause, vibrate, ...]
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [30, 50, 30, 50, 50],
  warning: [20, 30, 20],
  error: [100, 50, 100],
  double: [20, 40, 20],
  triple: [15, 30, 15, 30, 15],
};

export class HapticManager {
  private enabled: boolean = true;
  private isSupported: boolean = false;
  private isMobile: boolean = false;

  constructor() {
    // Check if vibration API is supported
    this.isSupported = 'vibrate' in navigator;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Load settings
    const settingsManager = getSettingsManager();
    const settings = settingsManager.getSettings();
    this.enabled = settings.hapticFeedback;

    // Listen for settings changes
    window.addEventListener('settings-changed', ((event: CustomEvent) => {
      this.enabled = event.detail.settings.hapticFeedback;
      console.log('📳 HapticManager: Settings updated, enabled:', this.enabled);
    }) as EventListener);

    console.log('📳 HapticManager initialized', {
      supported: this.isSupported,
      mobile: this.isMobile,
      enabled: this.enabled
    });
  }

  // ============================================================================
  // CORE VIBRATION
  // ============================================================================

  /**
   * Trigger a haptic feedback pattern
   */
  vibrate(pattern: HapticPattern): void {
    if (!this.canVibrate()) return;

    try {
      const vibrationPattern = HAPTIC_PATTERNS[pattern];
      navigator.vibrate(vibrationPattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger a custom vibration pattern
   * @param pattern Duration in ms, or array of [vibrate, pause, vibrate, ...]
   */
  vibrateCustom(pattern: number | number[]): void {
    if (!this.canVibrate()) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Custom haptic feedback failed:', error);
    }
  }

  /**
   * Stop any ongoing vibration
   */
  stop(): void {
    if (!this.isSupported) return;

    try {
      navigator.vibrate(0);
    } catch (error) {
      // Ignore errors when stopping
    }
  }

  // ============================================================================
  // GAME-SPECIFIC HAPTIC EVENTS
  // ============================================================================

  /**
   * Player collected a power-up
   */
  onPowerUpCollect(): void {
    this.vibrate('medium');
  }

  /**
   * Player was hit/damaged
   */
  onPlayerHit(): void {
    this.vibrate('heavy');
  }

  /**
   * Player died
   */
  onPlayerDeath(): void {
    this.vibrate('error');
  }

  /**
   * Enemy was destroyed
   */
  onEnemyKill(): void {
    this.vibrate('light');
  }

  /**
   * 1G: Near-miss feedback - lighter haptic than enemy kill
   */
  onNearMiss(): void {
    this.vibrate('light');
  }

  /**
   * Boss was hit
   */
  onBossHit(): void {
    this.vibrate('medium');
  }

  /**
   * Boss was defeated
   */
  onBossDefeat(): void {
    this.vibrate('success');
  }

  /**
   * Wave completed
   */
  onWaveComplete(): void {
    this.vibrate('double');
  }

  /**
   * Achievement unlocked
   */
  onAchievement(): void {
    this.vibrate('success');
  }

  /**
   * Low health warning
   */
  onLowHealth(): void {
    this.vibrate('warning');
  }

  /**
   * Game over
   */
  onGameOver(): void {
    this.vibrate('error');
  }

  /**
   * UI button press
   */
  onButtonPress(): void {
    this.vibrate('light');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if vibration can be triggered
   */
  private canVibrate(): boolean {
    return this.isSupported && this.isMobile && this.enabled;
  }

  /**
   * Check if haptic feedback is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if device supports haptic feedback
   */
  isHapticSupported(): boolean {
    return this.isSupported && this.isMobile;
  }

  /**
   * Toggle haptic feedback on/off
   */
  toggle(): boolean {
    this.enabled = !this.enabled;

    // Update settings
    const settingsManager = getSettingsManager();
    settingsManager.updateSetting('hapticFeedback', this.enabled);

    return this.enabled;
  }

  /**
   * Set haptic feedback enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance
let hapticManagerInstance: HapticManager | null = null;

export function getHapticManager(): HapticManager {
  if (!hapticManagerInstance) {
    hapticManagerInstance = new HapticManager();
  }
  return hapticManagerInstance;
}
