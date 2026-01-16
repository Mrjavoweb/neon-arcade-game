import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import StarfieldBackground from '@/components/StarfieldBackground';
import NeonButton from '@/components/NeonButton';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PWAInstallButton from '@/components/PWAInstallButton';
import SettingsOverlay from '@/components/game/SettingsOverlay';
import SoundToggleButton from '@/components/game/SoundToggleButton';
import LandscapePrompt from '@/components/LandscapePrompt';
import DailyRewardPopup from '@/components/game/DailyRewardPopup';
import ChallengeWidget from '@/components/game/ChallengeWidget';
import ChallengeModal from '@/components/game/ChallengeModal';
import { useGameEngine } from '@/contexts/GameEngineContext';
import { GameEngine } from '@/lib/game/GameEngine';
import { getAudioManager } from '@/lib/game/audio/AudioManager';
import { useOrientationLock } from '@/hooks/useOrientationLock';
import { DailyReward, ComebackBonus, MilestoneReward } from '@/lib/game/progression/ProgressionTypes';

export default function HomePage() {
  const navigate = useNavigate();
  const { engine, setEngine } = useGameEngine();
  const [stardust, setStardust] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [isMobile] = useState(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  const [isPortrait, setIsPortrait] = useState(() => window.innerWidth <= window.innerHeight);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [dailyReward, setDailyReward] = useState<{
    day: number;
    reward: DailyReward;
    streak: number;
    comebackBonus?: ComebackBonus;
    milestonesUnlocked?: MilestoneReward[];
    nextMilestone?: MilestoneReward & { progress: number };
  } | null>(null);

  // Check orientation and fullscreen status
  useEffect(() => {
    const checkOrientation = () => {
      const newIsPortrait = window.innerWidth <= window.innerHeight;
      setIsPortrait(newIsPortrait);

      // Reset prompt dismissed state when rotating to landscape
      if (!newIsPortrait && promptDismissed) {
        setPromptDismissed(false);
      }
    };

    const checkFullscreen = () => {
      const newIsFullscreen = !!document.fullscreenElement;
      setIsFullscreen(newIsFullscreen);

      // Reset prompt dismissed state when entering fullscreen
      if (newIsFullscreen && promptDismissed) {
        setPromptDismissed(false);
      }
    };

    checkOrientation();
    checkFullscreen();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    document.addEventListener('fullscreenchange', checkFullscreen);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      document.removeEventListener('fullscreenchange', checkFullscreen);
    };
  }, [promptDismissed]);

  // Initialize game engine for persistence
  useEffect(() => {
    let currentEngine = engine;

    if (!engine) {
      // Create a temporary canvas for game engine initialization
      const tempCanvas = document.createElement('canvas');
      const newEngine = new GameEngine(tempCanvas, false);
      setEngine(newEngine);
      setStardust(newEngine.currencyManager.getStardust());
      currentEngine = newEngine;

      // Dispatch event to notify components that engine is ready
      window.dispatchEvent(new CustomEvent('engine-ready', { detail: { engine: newEngine } }));

      // Preload assets in background so they're ready when user clicks Play
      newEngine.loadAssets().catch(err => console.warn('Background asset preload:', err));

      // Check for daily reward on homepage (only show once per session)
      if (newEngine.dailyRewardManager.shouldShowPopup()) {
        const rewardCheck = newEngine.dailyRewardManager.checkReward();
        if (rewardCheck.available && rewardCheck.reward) {
          // Mark as shown so it doesn't appear again this session
          newEngine.dailyRewardManager.markPopupShownThisSession();
          setDailyReward({
            day: rewardCheck.day,
            reward: rewardCheck.reward,
            streak: rewardCheck.streak,
            comebackBonus: rewardCheck.comebackBonus,
            nextMilestone: newEngine.dailyRewardManager.getNextMilestone()
          });
        }
      }
    } else {
      setStardust(engine.currencyManager.getStardust());

      // Check for daily reward if engine already exists (only show once per session)
      if (engine.dailyRewardManager.shouldShowPopup()) {
        const rewardCheck = engine.dailyRewardManager.checkReward();
        if (rewardCheck.available && rewardCheck.reward) {
          // Mark as shown so it doesn't appear again this session
          engine.dailyRewardManager.markPopupShownThisSession();
          setDailyReward({
            day: rewardCheck.day,
            reward: rewardCheck.reward,
            streak: rewardCheck.streak,
            comebackBonus: rewardCheck.comebackBonus,
            nextMilestone: engine.dailyRewardManager.getNextMilestone()
          });
        }
      }
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

  // Handle daily reward claim
  const handleClaimDailyReward = useCallback(() => {
    const currentEngine = engine;
    if (currentEngine) {
      const result = currentEngine.dailyRewardManager.claimReward();
      if (result.success) {
        setStardust(currentEngine.currencyManager.getStardust());
        // Clear the session flag since reward was successfully claimed
        currentEngine.dailyRewardManager.clearPopupShownFlag();
        // Don't update dailyReward state here - let DailyRewardPopup handle closing via its internal setTimeout
        // Updating state here causes re-render which can reset the popup's internal "claimed" state
      }
    }
  }, [engine]);

  // Stable callback for closing daily reward popup - prevents useEffect re-triggers
  const handleCloseDailyReward = useCallback(() => {
    setDailyReward(null);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Animated starfield background */}
      <StarfieldBackground />

      {/* PWA Install Prompt - hide when daily reward is showing to avoid z-index conflicts */}
      {!dailyReward && <PWAInstallPrompt />}

      {/* Sound Toggle Button */}
      <SoundToggleButton variant="homepage" />

      {/* Main content - Two-column landscape layout */}
      <div className="relative z-10 flex flex-col landscape:flex-row lg:flex-row h-screen px-4 py-2 landscape:overflow-y-auto landscape:overflow-x-hidden">

        {/* LEFT COLUMN - Navigation (stacks on mobile/portrait) */}
        <div className="flex flex-col justify-center items-center landscape:items-start lg:items-start landscape:w-3/5 lg:w-3/5 landscape:pr-4 lg:pr-6">

          {/* Hero Section */}
          <motion.div
            className="text-center landscape:text-left lg:text-left mb-2"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}>

            {/* Game Title */}
            <motion.h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black mb-1"
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
              className="text-sm lg:text-base text-cyan-300"
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
              className="mb-2 px-3 py-1.5 bg-yellow-500/20 border-2 border-yellow-400/60 rounded-lg max-w-md"
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

          {/* Buttons - 3x2 Grid for landscape, stacked on mobile */}
          <motion.div
            className="w-full max-w-md lg:max-w-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <NeonButton onClick={() => navigate('/game')}>
                ▶ PLAY
              </NeonButton>

              <NeonButton onClick={() => navigate('/shop', { state: { from: '/' } })}>
                🛍️ SHOP
              </NeonButton>

              <NeonButton onClick={() => navigate('/achievements', { state: { from: '/' } })}>
                🏆 ACHIEVE
              </NeonButton>

              <NeonButton onClick={() => navigate('/leaderboard', { state: { from: '/' } })}>
                📊 RANKS
              </NeonButton>

              <NeonButton onClick={() => navigate('/guide', { state: { from: '/' } })}>
                📖 GUIDE
              </NeonButton>

              <NeonButton onClick={() => setShowSettings(true)}>
                ⚙️ SETTINGS
              </NeonButton>
            </div>

            {/* Install PWA - Text link instead of button */}
            <div className="mt-3 text-center landscape:text-left lg:text-left">
              <PWAInstallButton variant="text" />
            </div>
          </motion.div>

          {/* Footer Credits */}
          <motion.div
            className="mt-3 text-center landscape:text-left lg:text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}>
            <p
              className="text-[0.6rem] text-gray-500"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <a href="https://aliens.digitalpalapp.com" className="hover:text-cyan-400 transition-colors duration-300" rel="noopener">DigitalPal Apps</a> • 60fps • Desktop & Mobile
            </p>
          </motion.div>
        </div>

        {/* RIGHT COLUMN - Stats & Challenges (below buttons on mobile) */}
        <div className="flex flex-col justify-center items-center landscape:w-2/5 lg:w-2/5 landscape:pl-4 lg:pl-6 mt-3 landscape:mt-0 lg:mt-0 landscape:max-h-screen landscape:overflow-y-auto">

          {/* Stardust Display */}
          <motion.div
            className="px-4 py-1.5 bg-purple-900/50 border-2 border-purple-400 rounded-xl mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="text-purple-300 font-bold flex items-center gap-2 text-sm"
                 style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.8)' }}>
              <span>💎</span>
              <span>{stardust.toLocaleString()} Stardust</span>
            </div>
          </motion.div>

          {/* Challenge Widget - Full width in right column */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <ChallengeWidget engine={engine} onViewAll={() => setShowChallengeModal(true)} />
          </motion.div>
        </div>

        {/* Settings Overlay */}
        <SettingsOverlay
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          isMobile={isMobile} />
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

      {/* Landscape/Fullscreen Prompt for Mobile */}
      {isMobile && (
        <LandscapePrompt
          isVisible={(isPortrait || !isFullscreen) && !promptDismissed}
          onDismiss={() => setPromptDismissed(true)}
        />
      )}

      {/* Daily Reward Popup */}
      <AnimatePresence>
        {dailyReward && (
          <DailyRewardPopup
            day={dailyReward.day}
            reward={dailyReward.reward}
            streak={dailyReward.streak}
            onClaim={handleClaimDailyReward}
            onClose={handleCloseDailyReward}
            comebackBonus={dailyReward.comebackBonus}
            milestonesUnlocked={dailyReward.milestonesUnlocked}
            nextMilestone={dailyReward.nextMilestone}
          />
        )}
      </AnimatePresence>

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        engine={engine}
      />
    </div>);

}