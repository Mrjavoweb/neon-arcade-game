import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Music, Zap, Smartphone, Eye, Lightbulb, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSettingsManager } from '@/lib/game/settings/SettingsManager';
import { GameSettings, ParticleQuality, ControlSensitivity } from '@/lib/game/settings/SettingsTypes';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function SettingsOverlay({ isOpen, onClose, isMobile }: SettingsOverlayProps) {
  const settingsManager = getSettingsManager();
  const [settings, setSettings] = useState<GameSettings>(settingsManager.getSettings());

  useEffect(() => {
    if (isOpen) {
      setSettings(settingsManager.getSettings());
    }
  }, [isOpen]);

  const updateSetting = <K extends keyof GameSettings,>(key: K, value: GameSettings[K]) => {
    settingsManager.updateSetting(key, value);
    setSettings(settingsManager.getSettings());
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default values?')) {
      settingsManager.resetToDefaults();
      setSettings(settingsManager.getSettings());
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}>

      <motion.div
        className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-2 border-cyan-400 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ boxShadow: '0 0 40px rgba(34, 211, 238, 0.5)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-3xl md:text-4xl font-black text-cyan-400 font-['Sora']"
            style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>
            SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
            aria-label="Close">
            <X size={28} />
          </button>
        </div>

        {/* Visual Settings */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-pink-400 mb-3 font-['Space_Grotesk'] flex items-center gap-2">
            <Eye size={20} />
            Visual Settings
          </h3>

          {/* Screen Shake Toggle */}
          <SettingToggle
            icon={<Zap size={18} />}
            label="Screen Shake"
            description="Camera shake on impacts and explosions"
            value={settings.screenShake}
            onChange={(value) => updateSetting('screenShake', value)} />


          {/* Particle Quality */}
          <SettingSelect
            icon={<Zap size={18} />}
            label="Particle Effects"
            description="Visual effect quality (affects performance)"
            value={settings.particleQuality}
            options={[
            { value: 'low', label: 'Low (Best Performance)' },
            { value: 'medium', label: 'Medium (Balanced)' },
            { value: 'high', label: 'High (Max Quality)' }]
            }
            onChange={(value) => updateSetting('particleQuality', value as ParticleQuality)} />


          {/* Show FPS */}
          <SettingToggle
            icon={<Eye size={18} />}
            label="Show FPS Counter"
            description="Display frame rate in top-left corner"
            value={settings.showFPS}
            onChange={(value) => updateSetting('showFPS', value)} />

        </div>

        {/* Audio Settings */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-pink-400 mb-3 font-['Space_Grotesk'] flex items-center gap-2">
            <Volume2 size={20} />
            Audio Settings
          </h3>

          {/* Sound Effects */}
          <SettingToggle
            icon={settings.soundEffects ? <Volume2 size={18} /> : <VolumeX size={18} />}
            label="Sound Effects"
            description="Weapon fire, explosions, and game sounds"
            value={settings.soundEffects}
            onChange={(value) => updateSetting('soundEffects', value)}
            badge="Coming Soon" />


          {/* Music */}
          <SettingToggle
            icon={<Music size={18} />}
            label="Background Music"
            description="Epic space battle soundtrack"
            value={settings.music}
            onChange={(value) => updateSetting('music', value)}
            badge="Coming Soon" />

        </div>

        {/* Mobile-Only Settings */}
        {isMobile &&
        <div className="mb-6">
            <h3 className="text-xl font-bold text-pink-400 mb-3 font-['Space_Grotesk'] flex items-center gap-2">
              <Smartphone size={20} />
              Touch Controls
            </h3>

            {/* Touch Sensitivity */}
            <SettingSelect
            icon={<Smartphone size={18} />}
            label="Control Sensitivity"
            description="How responsive touch controls feel"
            value={settings.touchSensitivity}
            options={[
            { value: 'low', label: 'Low (Slower)' },
            { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'High (Faster)' }]
            }
            onChange={(value) => updateSetting('touchSensitivity', value as ControlSensitivity)} />


            {/* Haptic Feedback */}
            <SettingToggle
            icon={<Zap size={18} />}
            label="Haptic Feedback"
            description="Vibration on hits and damage"
            value={settings.hapticFeedback}
            onChange={(value) => updateSetting('hapticFeedback', value)}
            badge="Coming Soon" />

          </div>
        }

        {/* UI Settings */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-pink-400 mb-3 font-['Space_Grotesk'] flex items-center gap-2">
            <Lightbulb size={20} />
            Interface
          </h3>

          {/* Tutorial Hints */}
          <SettingToggle
            icon={<Lightbulb size={18} />}
            label="Tutorial Hints"
            description="Show helpful tips and tutorials"
            value={settings.showTutorialHints}
            onChange={(value) => updateSetting('showTutorialHints', value)} />

        </div>

        {/* Reset Button */}
        <div className="pt-4 border-t border-cyan-400/30">
          <button
            onClick={handleReset}
            className="w-full px-6 py-3 bg-red-500/30 hover:bg-red-500/50 text-white font-bold rounded-lg border border-red-400 transition-all font-['Space_Grotesk'] flex items-center justify-center gap-2">
            <RotateCcw size={18} />
            Reset to Defaults
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-3 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all font-['Space_Grotesk']"
          style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}>
          Done
        </button>
      </motion.div>
    </motion.div>);

}

// Toggle Setting Component
interface SettingToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  badge?: string;
}

function SettingToggle({ icon, label, description, value, onChange, badge }: SettingToggleProps) {
  return (
    <div className="mb-4 p-4 bg-black/30 rounded-lg border border-cyan-400/20 hover:border-cyan-400/40 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-cyan-400 mt-1">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-white font-bold font-['Space_Grotesk']">{label}</div>
              {badge &&
              <span className="text-[0.65rem] px-2 py-0.5 bg-yellow-500/20 border border-yellow-400/50 rounded text-yellow-300 font-['Space_Grotesk']">
                  {badge}
                </span>
              }
            </div>
            <div className="text-sm text-cyan-200/70 font-['Space_Grotesk']">{description}</div>
          </div>
        </div>
        <button
          onClick={() => onChange(!value)}
          className={`relative w-12 h-6 rounded-full transition-all ${
          value ? 'bg-cyan-500' : 'bg-gray-600'}`
          }
          style={{
            boxShadow: value ? '0 0 10px rgba(34, 211, 238, 0.5)' : 'none'
          }}>
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            value ? 'translate-x-6' : 'translate-x-0.5'}`
            } />

        </button>
      </div>
    </div>);

}

// Select Setting Component
interface SettingSelectProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: string;
  options: {value: string;label: string;}[];
  onChange: (value: string) => void;
}

function SettingSelect({ icon, label, description, value, options, onChange }: SettingSelectProps) {
  return (
    <div className="mb-4 p-4 bg-black/30 rounded-lg border border-cyan-400/20 hover:border-cyan-400/40 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-cyan-400 mt-1">{icon}</div>
        <div className="flex-1">
          <div className="text-white font-bold font-['Space_Grotesk']">{label}</div>
          <div className="text-sm text-cyan-200/70 font-['Space_Grotesk']">{description}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((option) =>
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-lg font-bold font-['Space_Grotesk'] text-sm transition-all ${
          value === option.value ?
          'bg-cyan-500 text-black border-2 border-cyan-400' :
          'bg-gray-700/50 text-white border-2 border-gray-600 hover:border-cyan-400/50'}`
          }
          style={{
            boxShadow: value === option.value ? '0 0 10px rgba(34, 211, 238, 0.5)' : 'none'
          }}>
            {option.label}
          </button>
        )}
      </div>
    </div>);

}