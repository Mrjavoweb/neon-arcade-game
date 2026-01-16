// Settings Manager - Handles saving/loading game settings
import { GameSettings, DEFAULT_SETTINGS } from './SettingsTypes';
import { STORAGE_KEYS } from '../progression/ProgressionTypes';

export class SettingsManager {
  private settings: GameSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  // ============================================================================
  // LOAD / SAVE
  // ============================================================================

  private loadSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings added in updates
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      console.log('💾 Settings saved:', this.settings);

      // Dispatch event so game engine can react to settings changes
      window.dispatchEvent(new CustomEvent('settings-changed', {
        detail: { settings: this.settings }
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  getSetting<K extends keyof GameSettings>(key: K): GameSettings[K] {
    return this.settings[key];
  }

  // ============================================================================
  // SETTERS
  // ============================================================================

  updateSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  updateMultipleSettings(updates: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }

  // ============================================================================
  // DEBUG
  // ============================================================================

  debugPrintSettings(): void {
    console.log('⚙️ Current Settings:', this.settings);
  }
}

// Singleton instance
let settingsManagerInstance: SettingsManager | null = null;

export function getSettingsManager(): SettingsManager {
  if (!settingsManagerInstance) {
    settingsManagerInstance = new SettingsManager();
  }
  return settingsManagerInstance;
}