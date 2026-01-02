import { Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAudioManager } from '@/lib/game/audio/AudioManager';

export default function SoundToggleButton() {
  const audioManager = getAudioManager();
  const [isEnabled, setIsEnabled] = useState(audioManager.isAnyAudioEnabled());

  // Detect landscape orientation and mobile
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLandscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight;

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      setIsEnabled(audioManager.isAnyAudioEnabled());
    };

    window.addEventListener('settings-changed', handleSettingsChange);
    return () => window.removeEventListener('settings-changed', handleSettingsChange);
  }, [audioManager]);

  const handleToggle = () => {
    const result = audioManager.toggleAllAudio();
    setIsEnabled(result.sfx || result.music);

    // Play a confirmation sound if enabling
    if (result.sfx) {
      audioManager.playSound('ui_button_click', 0.5);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`absolute z-50 pointer-events-auto ${
        isMobile && isLandscape
          ? 'top-1 right-[30%]'
          : 'top-2 right-[28%] sm:top-4 sm:right-[26%]'
      }`}
      style={{
        paddingTop: isMobile && !isLandscape ? 'max(env(safe-area-inset-top, 0.5rem), 0.5rem)' : undefined,
        transform: 'translateX(50%)'
      }}
      aria-label={isEnabled ? 'Mute audio' : 'Unmute audio'}>

      <div
        className={`bg-black/60 backdrop-blur-sm border-2 transition-all hover:scale-110 ${
          isEnabled
            ? 'border-cyan-400/60 hover:bg-black/80 hover:border-cyan-400'
            : 'border-red-400/60 hover:bg-black/80 hover:border-red-400'
        } rounded-lg ${
          isMobile && isLandscape ? 'p-1.5' : 'p-2 sm:p-3'
        }`}
        style={{
          boxShadow: isEnabled
            ? '0 0 15px rgba(34, 211, 238, 0.3)'
            : '0 0 15px rgba(239, 68, 68, 0.3)'
        }}>

        {/* Sound icon */}
        {isEnabled ? (
          <Volume2
            className={`${
              isMobile && isLandscape ? 'w-3 h-3' : 'w-4 h-4 sm:w-6 sm:h-6'
            } text-cyan-400`}
            style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))' }}
          />
        ) : (
          <VolumeX
            className={`${
              isMobile && isLandscape ? 'w-3 h-3' : 'w-4 h-4 sm:w-6 sm:h-6'
            } text-red-400`}
            style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))' }}
          />
        )}
      </div>
    </button>
  );
}
