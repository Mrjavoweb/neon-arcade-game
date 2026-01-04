import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StarfieldBackground from '@/components/StarfieldBackground';
import NeonButton from '@/components/NeonButton';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PWAInstallButton from '@/components/PWAInstallButton';
import SettingsOverlay from '@/components/game/SettingsOverlay';
import { useGameEngine } from '@/contexts/GameEngineContext';
import { GameEngine } from '@/lib/game/GameEngine';
import { getAudioManager } from '@/lib/game/audio/AudioManager';

export default function HomePage() {
  const navigate = useNavigate();
  const { engine, setEngine } = useGameEngine();
  const [stardust, setStardust] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile] = useState(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  const [isPortrait, setIsPortrait] = useState(false);

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerWidth <= window.innerHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Initialize game engine for persistence
  useEffect(() => {
    if (!engine) {
      // Create a temporary canvas for game engine initialization
      const tempCanvas = document.createElement('canvas');
      const newEngine = new GameEngine(tempCanvas, false);
      setEngine(newEngine);
      setStardust(newEngine.currencyManager.getStardust());
    } else {
      setStardust(engine.currencyManager.getStardust());
    }

    // Start menu music
    const audioManager = getAudioManager();
    audioManager.playMusic('menu_theme', true);

    // Listen for currency changes
    const handleCurrencyChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.balance !== undefined) {
        setStardust(customEvent.detail.balance);
      }
    };
    window.addEventListener('currency-changed', handleCurrencyChange);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, [engine, setEngine]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Animated starfield background */}
      <StarfieldBackground />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-screen px-4 py-2">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-2 sm:mb-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}>

          {/* Game Title */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 sm:mb-4"
            style={{
              fontFamily: "'Sora', sans-serif",
              background: 'linear-gradient(180deg, #22d3ee 0%, #3b82f6 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 80px rgba(34, 211, 238, 0.5)',
              filter: 'drop-shadow(0 0 40px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 80px rgba(236, 72, 153, 0.4))'
            }}
            animate={{
              filter: [
              'drop-shadow(0 0 40px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 80px rgba(236, 72, 153, 0.4))',
              'drop-shadow(0 0 50px rgba(34, 211, 238, 1)) drop-shadow(0 0 100px rgba(236, 72, 153, 0.6))',
              'drop-shadow(0 0 40px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 80px rgba(236, 72, 153, 0.4))']

            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}>

            ALIEN ATTACK
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-cyan-300"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: '0 0 20px rgba(34, 211, 238, 0.6)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}>

            Defend Earth against the Cosmic Assault
          </motion.p>
        </motion.div>

        {/* Best Experience Notice - Mobile/Portrait Only */}
        {isMobile && isPortrait && (
          <motion.div
            className="mb-2 px-3 py-1.5 bg-yellow-500/20 border-2 border-yellow-400/60 rounded-lg max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)' }}
          >
            <p className="text-yellow-300 font-bold text-xs font-['Space_Grotesk'] text-center"
               style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.6)' }}>
              💡 Best experience on desktop or landscape view
            </p>
          </motion.div>
        )}

        {/* Buttons - Two Row Layout */}
        <motion.div
          className="flex flex-col gap-2 sm:gap-3 max-w-3xl mx-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}>

          {/* First Row: Play, Shop, Achievements */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <NeonButton onClick={() => navigate('/game')}>
              ▶ PLAY GAME
            </NeonButton>

            <NeonButton onClick={() => navigate('/shop', { state: { from: '/' } })}>
              🛍️ SHIP SHOP
            </NeonButton>

            <NeonButton onClick={() => navigate('/achievements', { state: { from: '/' } })}>
              🏆 ACHIEVEMENTS
            </NeonButton>
          </div>

          {/* Second Row: Leaderboard, Game Guide, Settings */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <NeonButton onClick={() => navigate('/leaderboard', { state: { from: '/' } })}>
              📊 LEADERBOARD
            </NeonButton>

            <NeonButton onClick={() => navigate('/guide', { state: { from: '/' } })}>
              📖 GAME GUIDE
            </NeonButton>

            <NeonButton onClick={() => setShowSettings(true)}>
              ⚙️ SETTINGS
            </NeonButton>
          </div>

          {/* Third Row: Install PWA (if available) */}
          <div className="flex justify-center">
            <div className="w-full sm:w-auto">
              <PWAInstallButton />
            </div>
          </div>
        </motion.div>

        {/* Stardust Display */}
        {stardust > 0 && (
          <motion.div
            className="mt-2 sm:mt-3 px-4 py-1.5 bg-purple-900/50 border-2 border-purple-400 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="text-purple-300 font-bold flex items-center gap-2 text-sm sm:text-base"
                 style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.8)' }}>
              <span>💎</span>
              <span>{stardust.toLocaleString()} Stardust</span>
            </div>
          </motion.div>
        )}

        {/* Settings Overlay */}
        <SettingsOverlay
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          isMobile={isMobile} />

        {/* Footer Credits */}
        <motion.div
          className="mt-2 sm:mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}>

          <p

            className="text-[0.65rem] sm:text-xs text-gray-500"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

            <a href="https://aliens.digitalpalapp.com" className="hover:text-cyan-400 transition-colors duration-300" rel="noopener">DigitalPal Apps</a> • Optimized for 60fps • Desktop & Mobile
          </p>
        </motion.div>
      </div>

      {/* Ambient gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"
          style={{
            animation: 'pulse 8s ease-in-out infinite'
          }} />

        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]"
          style={{
            animation: 'pulse 8s ease-in-out infinite 4s'
          }} />

      </div>
    </div>);

}