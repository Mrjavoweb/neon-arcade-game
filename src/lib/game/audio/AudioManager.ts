// AudioManager - Handles all game audio playback with settings integration
import { getSettingsManager } from '../settings/SettingsManager';

// Sound effect identifiers
export type SoundEffect =
  // Player
  | 'player_shoot'
  | 'player_hit'
  | 'player_death'
  | 'player_powerup_collect'
  // Enemy
  | 'enemy_shoot'
  | 'enemy_hit'
  | 'enemy_death'
  | 'enemy_spawn'
  // Boss
  | 'boss_spawn'
  | 'boss_attack_laser'
  | 'boss_attack_missile'
  | 'boss_hit'
  | 'boss_phase_change'
  | 'boss_death'
  // Power-ups
  | 'powerup_shield_activate'
  | 'powerup_rapid_fire'
  | 'powerup_plasma'
  | 'powerup_slowmo'
  // UI & Progression
  | 'ui_button_click'
  | 'ui_button_hover'
  | 'level_up'
  | 'achievement_unlock'
  | 'wave_complete'
  | 'checkpoint_reached'
  // Ambient
  | 'combo_milestone'
  | 'warning_low_health'
  | 'game_over';

// Background music identifiers
export type BackgroundMusic =
  | 'menu_theme'
  | 'gameplay_theme'
  | 'boss_battle_theme'
  | 'game_over_theme'
  | 'victory_theme'
  | 'ambient_space';

// Audio asset paths (will be populated when audio files are added)
const SOUND_PATHS: Record<SoundEffect, string> = {
  // Player
  player_shoot: '/sounds/sfx/player_shoot.mp3',
  player_hit: '/sounds/sfx/player_hit.mp3',
  player_death: '/sounds/sfx/player_death.mp3',
  player_powerup_collect: '/sounds/sfx/player_powerup_collect.mp3',
  // Enemy
  enemy_shoot: '/sounds/sfx/enemy_shoot.mp3',
  enemy_hit: '/sounds/sfx/enemy_hit.mp3',
  enemy_death: '/sounds/sfx/enemy_death.mp3',
  enemy_spawn: '/sounds/sfx/enemy_spawn.mp3',
  // Boss
  boss_spawn: '/sounds/sfx/boss_spawn.mp3',
  boss_attack_laser: '/sounds/sfx/boss_attack_laser.mp3',
  boss_attack_missile: '/sounds/sfx/boss_attack_missile.mp3',
  boss_hit: '/sounds/sfx/boss_hit.mp3',
  boss_phase_change: '/sounds/sfx/boss_phase_change.mp3',
  boss_death: '/sounds/sfx/boss_death.mp3',
  // Power-ups
  powerup_shield_activate: '/sounds/sfx/powerup_shield_activate.mp3',
  powerup_rapid_fire: '/sounds/sfx/powerup_rapid_fire.mp3',
  powerup_plasma: '/sounds/sfx/powerup_plasma.mp3',
  powerup_slowmo: '/sounds/sfx/powerup_slowmo.mp3',
  // UI & Progression
  ui_button_click: '/sounds/sfx/ui_button_click.mp3',
  ui_button_hover: '/sounds/sfx/ui_button_hover.mp3',
  level_up: '/sounds/sfx/level_up.mp3',
  achievement_unlock: '/sounds/sfx/achievement_unlock.mp3',
  wave_complete: '/sounds/sfx/wave_complete.mp3',
  checkpoint_reached: '/sounds/sfx/checkpoint_reached.mp3',
  // Ambient
  combo_milestone: '/sounds/sfx/combo_milestone.mp3',
  warning_low_health: '/sounds/sfx/warning_low_health.mp3',
  game_over: '/sounds/sfx/game_over.mp3',
};

const MUSIC_PATHS: Record<BackgroundMusic, string> = {
  menu_theme: '/sounds/music/menu_theme.mp3',
  gameplay_theme: '/sounds/music/gameplay_theme.mp3',
  boss_battle_theme: '/sounds/music/boss_battle_theme.mp3',
  game_over_theme: '/sounds/music/game_over_theme.mp3',
  victory_theme: '/sounds/music/victory_theme.mp3',
  ambient_space: '/sounds/music/ambient_space.mp3',
};

export class AudioManager {
  private soundEffects: Map<SoundEffect, HTMLAudioElement> = new Map();
  private musicTracks: Map<BackgroundMusic, HTMLAudioElement> = new Map();
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicId: BackgroundMusic | null = null;
  private soundEffectsEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterVolume: number = 1.0;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.5;
  private loopingSound: HTMLAudioElement | null = null; // For warning sounds

  constructor() {
    // Load settings
    const settingsManager = getSettingsManager();
    const settings = settingsManager.getSettings();
    this.soundEffectsEnabled = settings.soundEffects;
    this.musicEnabled = settings.music;

    // Listen for settings changes
    window.addEventListener('settings-changed', ((event: CustomEvent) => {
      this.soundEffectsEnabled = event.detail.settings.soundEffects;
      this.musicEnabled = event.detail.settings.music;

      // Stop music if disabled
      if (!this.musicEnabled && this.currentMusic) {
        this.stopMusic();
      }

      console.log('🔊 AudioManager: Settings updated', {
        sfx: this.soundEffectsEnabled,
        music: this.musicEnabled
      });
    }) as EventListener);

    console.log('🔊 AudioManager initialized', {
      sfxEnabled: this.soundEffectsEnabled,
      musicEnabled: this.musicEnabled
    });
  }

  // ============================================================================
  // PRELOAD AUDIO (call this during game initialization)
  // ============================================================================

  preloadSounds(soundsToLoad: SoundEffect[]): void {
    soundsToLoad.forEach(soundId => {
      try {
        const audio = new Audio(SOUND_PATHS[soundId]);
        audio.preload = 'auto';
        audio.volume = this.sfxVolume * this.masterVolume;
        this.soundEffects.set(soundId, audio);
      } catch (error) {
        console.warn(`Failed to preload sound: ${soundId}`, error);
      }
    });
    console.log(`🔊 Preloaded ${soundsToLoad.length} sound effects`);
  }

  preloadMusic(musicToLoad: BackgroundMusic[]): void {
    musicToLoad.forEach(musicId => {
      try {
        const audio = new Audio(MUSIC_PATHS[musicId]);
        audio.preload = 'auto';
        audio.volume = this.musicVolume * this.masterVolume;
        audio.loop = true; // Music tracks loop by default
        this.musicTracks.set(musicId, audio);
      } catch (error) {
        console.warn(`Failed to preload music: ${musicId}`, error);
      }
    });
    console.log(`🔊 Preloaded ${musicToLoad.length} music tracks`);
  }

  // ============================================================================
  // SOUND EFFECTS
  // ============================================================================

  playSound(soundId: SoundEffect, volume: number = 1.0): void {
    if (!this.soundEffectsEnabled) return;

    try {
      let audio = this.soundEffects.get(soundId);

      // Load on-demand if not preloaded
      if (!audio) {
        audio = new Audio(SOUND_PATHS[soundId]);
        this.soundEffects.set(soundId, audio);
      }

      // Clone audio for overlapping sounds (e.g., rapid fire)
      const sound = audio.cloneNode() as HTMLAudioElement;
      sound.volume = volume * this.sfxVolume * this.masterVolume;

      sound.play().catch(error => {
        console.warn(`Failed to play sound: ${soundId}`, error);
      });
    } catch (error) {
      console.warn(`Error playing sound: ${soundId}`, error);
    }
  }

  // Play looping sound (e.g., low health warning)
  playLoopingSound(soundId: SoundEffect, volume: number = 0.5): void {
    if (!this.soundEffectsEnabled) return;

    // Stop existing looping sound
    this.stopLoopingSound();

    try {
      let audio = this.soundEffects.get(soundId);

      if (!audio) {
        audio = new Audio(SOUND_PATHS[soundId]);
        this.soundEffects.set(soundId, audio);
      }

      audio.loop = true;
      audio.volume = volume * this.sfxVolume * this.masterVolume;
      this.loopingSound = audio;

      audio.play().catch(error => {
        console.warn(`Failed to play looping sound: ${soundId}`, error);
      });
    } catch (error) {
      console.warn(`Error playing looping sound: ${soundId}`, error);
    }
  }

  stopLoopingSound(): void {
    if (this.loopingSound) {
      this.loopingSound.pause();
      this.loopingSound.currentTime = 0;
      this.loopingSound.loop = false;
      this.loopingSound = null;
    }
  }

  // ============================================================================
  // BACKGROUND MUSIC
  // ============================================================================

  playMusic(musicId: BackgroundMusic, fadeIn: boolean = true): void {
    if (!this.musicEnabled) return;

    // Don't restart if already playing
    if (this.currentMusicId === musicId && this.currentMusic && !this.currentMusic.paused) {
      return;
    }

    // Stop current music
    if (this.currentMusic) {
      this.stopMusic();
    }

    try {
      let audio = this.musicTracks.get(musicId);

      if (!audio) {
        audio = new Audio(MUSIC_PATHS[musicId]);
        audio.loop = true;
        this.musicTracks.set(musicId, audio);
      }

      this.currentMusic = audio;
      this.currentMusicId = musicId;

      if (fadeIn) {
        audio.volume = 0;
        audio.play().catch(error => {
          console.warn(`Failed to play music: ${musicId}`, error);
        });
        this.fadeInMusic(audio, this.musicVolume * this.masterVolume);
      } else {
        audio.volume = this.musicVolume * this.masterVolume;
        audio.play().catch(error => {
          console.warn(`Failed to play music: ${musicId}`, error);
        });
      }

      console.log(`🎵 Playing music: ${musicId}`);
    } catch (error) {
      console.warn(`Error playing music: ${musicId}`, error);
    }
  }

  stopMusic(fadeOut: boolean = true): void {
    if (!this.currentMusic) return;

    if (fadeOut) {
      this.fadeOutMusic(this.currentMusic, () => {
        if (this.currentMusic) {
          this.currentMusic.pause();
          this.currentMusic.currentTime = 0;
        }
        this.currentMusic = null;
        this.currentMusicId = null;
      });
    } else {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.currentMusicId = null;
    }
  }

  pauseMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
    }
  }

  resumeMusic(): void {
    if (this.currentMusic && this.musicEnabled) {
      this.currentMusic.play().catch(error => {
        console.warn('Failed to resume music', error);
      });
    }
  }

  // ============================================================================
  // FADE EFFECTS
  // ============================================================================

  private fadeInMusic(audio: HTMLAudioElement, targetVolume: number): void {
    const fadeSteps = 50;
    const fadeInterval = 20; // ms
    const volumeStep = targetVolume / fadeSteps;
    let currentStep = 0;

    const fade = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);

      if (currentStep >= fadeSteps || audio.volume >= targetVolume) {
        clearInterval(fade);
      }
    }, fadeInterval);
  }

  private fadeOutMusic(audio: HTMLAudioElement, onComplete: () => void): void {
    const fadeSteps = 30;
    const fadeInterval = 20; // ms
    const initialVolume = audio.volume;
    const volumeStep = initialVolume / fadeSteps;
    let currentStep = 0;

    const fade = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(initialVolume - (volumeStep * currentStep), 0);

      if (currentStep >= fadeSteps || audio.volume <= 0) {
        clearInterval(fade);
        onComplete();
      }
    }, fadeInterval);
  }

  // ============================================================================
  // VOLUME CONTROL
  // ============================================================================

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    // Update all preloaded sounds
    this.soundEffects.forEach(audio => {
      audio.volume = this.sfxVolume * this.masterVolume;
    });
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    // Update current music
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume * this.masterVolume;
    }
    // Update all preloaded music
    this.musicTracks.forEach(audio => {
      audio.volume = this.musicVolume * this.masterVolume;
    });
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.setSfxVolume(this.sfxVolume);
    this.setMusicVolume(this.musicVolume);
  }

  // ============================================================================
  // TOGGLE CONTROLS (for HUD button)
  // ============================================================================

  toggleSoundEffects(): boolean {
    this.soundEffectsEnabled = !this.soundEffectsEnabled;

    // Update settings
    const settingsManager = getSettingsManager();
    settingsManager.updateSetting('soundEffects', this.soundEffectsEnabled);

    // Stop looping sounds if disabled
    if (!this.soundEffectsEnabled) {
      this.stopLoopingSound();
    }

    return this.soundEffectsEnabled;
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;

    // Update settings
    const settingsManager = getSettingsManager();
    settingsManager.updateSetting('music', this.musicEnabled);

    if (!this.musicEnabled) {
      this.stopMusic();
    } else if (this.currentMusicId) {
      this.playMusic(this.currentMusicId);
    }

    return this.musicEnabled;
  }

  // Toggle both SFX and Music
  toggleAllAudio(): { sfx: boolean; music: boolean } {
    const newState = !(this.soundEffectsEnabled && this.musicEnabled);

    this.soundEffectsEnabled = newState;
    this.musicEnabled = newState;

    // Update settings
    const settingsManager = getSettingsManager();
    settingsManager.updateMultipleSettings({
      soundEffects: newState,
      music: newState
    });

    if (!newState) {
      this.stopMusic();
      this.stopLoopingSound();
    }

    return { sfx: this.soundEffectsEnabled, music: this.musicEnabled };
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  isSfxEnabled(): boolean {
    return this.soundEffectsEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isAnyAudioEnabled(): boolean {
    return this.soundEffectsEnabled || this.musicEnabled;
  }

  getCurrentMusic(): BackgroundMusic | null {
    return this.currentMusicId;
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  dispose(): void {
    this.stopMusic(false);
    this.stopLoopingSound();
    this.soundEffects.clear();
    this.musicTracks.clear();
    console.log('🔊 AudioManager disposed');
  }
}

// Singleton instance
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}
