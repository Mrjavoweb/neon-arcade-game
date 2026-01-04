import GameHUD from '@/components/game/GameHUD';
import GameOverlay from '@/components/game/GameOverlay';
import SettingsOverlay from '@/components/game/SettingsOverlay';
import BossHealthBar from '@/components/game/BossHealthBar';
import BossIntro from '@/components/game/BossIntro';
import PauseButton from '@/components/game/PauseButton';
import SoundToggleButton from '@/components/game/SoundToggleButton';
import LevelUpCelebration from '@/components/game/LevelUpCelebration';
import AchievementToast from '@/components/game/AchievementToast';
import DailyRewardPopup from '@/components/game/DailyRewardPopup';
import LandscapePrompt from '@/components/LandscapePrompt';
import { useGameEngine } from '@/contexts/GameEngineContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';
import { GameState, GameStats, BossState } from '@/lib/game/types';
import { Achievement, DailyReward, MilestoneReward, ComebackBonus } from '@/lib/game/progression/ProgressionTypes';
import { AnimatePresence } from 'framer-motion';
import { useOrientationLock } from '@/hooks/useOrientationLock';

export default function GamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setEngine } = useGameEngine();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number>();
  const [isMobile] = useState(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  // Enforce landscape orientation on mobile
  const { shouldShowPrompt } = useOrientationLock(true);
  const [gameState, setGameState] = useState<{
    state: GameState;
    stats: GameStats;
    bossState: BossState;
    activePowerUps?: any;
  }>({
    state: 'playing',
    stats: {
      score: 0,
      lives: 3,
      wave: 1,
      enemiesDestroyed: 0,
      xp: 0,
      level: 1,
      maxHealth: 3,
      fireRateBonus: 0,
      movementSpeedBonus: 0
    },
    bossState: {
      isBossWave: false,
      bossActive: false,
      bossHealth: 0,
      bossMaxHealth: 0,
      bossPhase: 'phase1',
      bossIntroTimer: 0,
      bossVictoryTimer: 0,
      lastAttackTime: 0,
      attackPattern: 'spread',
      teleportCooldown: 0
    }
  });

  // Progression state
  const [stardust, setStardust] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, upgrade: '' });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyReward, setDailyReward] = useState<{
    day: number;
    reward: DailyReward;
    streak: number;
    comebackBonus?: ComebackBonus;
    milestonesUnlocked?: MilestoneReward[];
    nextMilestone?: MilestoneReward & { progress: number };
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const dailyRewardClaimedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Set initial canvas size BEFORE creating engine
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(canvas, isMobile);
    engineRef.current = engine;
    setEngine(engine); // Set in context for other pages

    // Expose engine to window for debugging
    (window as any).engine = engine;

    // Set level up callback - Disabled to avoid blocking gameplay
    // engine.setLevelUpCallback((level: number, upgrade: string) => {
    //   setLevelUpData({ level, upgrade });
    //   setShowLevelUp(true);
    // });

    // Listen for currency changes
    const handleCurrencyChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.balance !== undefined) {
        console.log('🎮 GamePage: currency-changed event received. New balance:', customEvent.detail.balance);
        setStardust(customEvent.detail.balance);
      }
    };
    window.addEventListener('currency-changed', handleCurrencyChange);

    // Listen for achievement unlocks
    const handleAchievementUnlock = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🎮 GamePage: achievement-unlocked event received:', customEvent.detail);
      if (customEvent.detail?.achievement) {
        console.log('🎮 GamePage: Adding achievement to toast queue:', customEvent.detail.achievement);
        setAchievements(prev => [...prev, customEvent.detail.achievement]);
      } else {
        console.warn('🎮 GamePage: achievement-unlocked event has no achievement in detail:', customEvent.detail);
      }
    };
    console.log('🎮 GamePage: Registering achievement-unlocked event listener');
    window.addEventListener('achievement-unlocked', handleAchievementUnlock);

    // Listen for daily reward available
    const handleDailyRewardAvailable = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.reward) {
        // Get next milestone info
        const nextMilestone = engine.dailyRewardManager.getNextMilestone();

        setDailyReward({
          day: customEvent.detail.day,
          reward: customEvent.detail.reward,
          streak: customEvent.detail.streak,
          comebackBonus: customEvent.detail.comebackBonus,
          milestonesUnlocked: customEvent.detail.milestonesUnlocked,
          nextMilestone
        });

        // Pause the game when daily reward popup appears
        if (engine.state === 'playing') {
          engine.state = 'paused';
          console.log('🎁 Game paused for daily reward popup');
        }
      }
    };
    window.addEventListener('daily-reward-available', handleDailyRewardAvailable);

    // Initialize stardust from game engine
    const initialStardust = engine.currencyManager.getStardust();
    console.log('🎮 GamePage: Initializing stardust from GameEngine:', initialStardust);
    setStardust(initialStardust);

    // Handle resize events
    const resizeCanvas = () => {
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;
      const wasPortrait = oldHeight > oldWidth;
      const isNowLandscape = window.innerWidth > window.innerHeight;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // CRITICAL: Update player's canvasWidth to match new canvas dimensions
      // This fixes movement restriction bug (player stuck on left half)
      if (engine.player) {
        engine.player.canvasWidth = canvas.width;
      }

      // If we just switched from portrait to landscape, reinitialize enemies and pause game
      // This fixes alien spacing issues from portrait initialization
      if (wasPortrait && isNowLandscape && engine.state === 'playing') {
        console.log('🔄 Orientation changed from portrait to landscape - reinitializing and pausing');

        // Pause the game when rotating to landscape (better UX)
        engine.state = 'paused';

        // Reinitialize enemies for current wave without advancing wave counter
        engine.initEnemies();

        // Clear projectiles to avoid weird positions
        engine.projectiles = [];

        // Reset player to center bottom
        if (engine.player) {
          engine.player.position.x = canvas.width / 2 - engine.player.size.width / 2;
          engine.player.position.y = canvas.height - 100;
        }
      } else {
        // Normal resize - just scale existing positions
        // Update player position to maintain relative position
        if (engine.player) {
          engine.player.position.x = engine.player.position.x / oldWidth * canvas.width;
          engine.player.position.y = engine.player.position.y / oldHeight * canvas.height;
        }

        // Update enemy positions to maintain relative positions
        if (engine.enemies) {
          engine.enemies.forEach((enemy) => {
            if (enemy.isAlive) {
              enemy.position.x = enemy.position.x / oldWidth * canvas.width;
              enemy.position.y = enemy.position.y / oldHeight * canvas.height;
            }
          });
        }

        // Update boss position if active
        if (engine.boss && engine.boss.isAlive) {
          engine.boss.position.x = engine.boss.position.x / oldWidth * canvas.width;
          engine.boss.position.y = engine.boss.position.y / oldHeight * canvas.height;
        }
      }
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    const init = async () => {
      await engine.loadAssets();

      const gameLoop = () => {
        engine.update();

        // Update player level display
        if (engine.player) {
          engine.player.level = engine.stats.level;
        }

        engine.render();

        setGameState({
          state: engine.state,
          stats: { ...engine.stats },
          bossState: { ...engine.bossState },
          activePowerUps: engine.getActivePowerUps()
        });

        animationFrameRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoop();

      // Check for daily reward AFTER assets loaded and game loop started
      // This ensures enemies are properly initialized before pausing
      engine.checkDailyReward();
    };

    init();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('currency-changed', handleCurrencyChange);
      window.removeEventListener('achievement-unlocked', handleAchievementUnlock);
      window.removeEventListener('daily-reward-available', handleDailyRewardAvailable);
      engine.cleanup();
    };
  }, [isMobile]);

  // Keep game paused when returning from shop/achievements/guide/leaderboard
  useEffect(() => {
    const returnedFrom = (location.state as { returnedFrom?: string })?.returnedFrom;
    if (returnedFrom && (returnedFrom === 'shop' || returnedFrom === 'achievements' || returnedFrom === 'guide' || returnedFrom === 'leaderboard')) {
      // Ensure game stays paused when returning
      if (engineRef.current && engineRef.current.state !== 'paused') {
        engineRef.current.togglePause();
      }
    }
  }, [location.state]);

  const handlePause = () => {
    engineRef.current?.togglePause();
  };

  const handleResume = () => {
    engineRef.current?.togglePause();
  };

  const handleRestart = () => {
    engineRef.current?.reset();
  };

  const handleRestartFromWave1 = () => {
    engineRef.current?.resetFromWave1();
  };

  const handleMainMenu = () => {
    navigate('/');
  };

  const handleSkipBossIntro = () => {
    if (engineRef.current) {
      engineRef.current.bossState.bossIntroTimer = 0;
      engineRef.current.state = 'playing';
      engineRef.current.slowMotionActive = false;
    }
  };

  const handleClaimDailyReward = () => {
    if (engineRef.current) {
      const result = engineRef.current.dailyRewardManager.claimReward();
      if (result.success && result.reward) {
        // Set flag to trigger video when popup closes
        dailyRewardClaimedRef.current = true;
        console.log('🎁 Daily reward claimed, flag set to trigger video');

        // Update popup state with milestones if any were unlocked
        if (result.milestonesUnlocked && result.milestonesUnlocked.length > 0) {
          setDailyReward(prev => prev ? {
            ...prev,
            milestonesUnlocked: result.milestonesUnlocked
          } : null);
        }
        console.log('Daily reward claimed:', result.reward);
        if (result.milestonesUnlocked && result.milestonesUnlocked.length > 0) {
          console.log('🎉 Milestones unlocked:', result.milestonesUnlocked);
        }
      }
    }
  };

  const handleCloseDailyReward = () => {
    console.log('🎁 Daily reward popup closing, claimed flag:', dailyRewardClaimedRef.current);
    setDailyReward(null);

    // Resume game with invulnerability shield if reward was claimed
    if (dailyRewardClaimedRef.current) {
      console.log('🎁 Resuming game after daily reward claimed');

      // Wait 1 second before resuming with invulnerability
      setTimeout(() => {
        if (engineRef.current && engineRef.current.state === 'paused') {
          // Apply 1.5s invulnerability shield (90 frames at 60fps)
          if (engineRef.current.player) {
            engineRef.current.player.invulnerable = true;
            engineRef.current.player.invulnerabilityTimer = 90;
            console.log('🛡️ Applied 1.5s invulnerability shield after daily reward');
          }

          // Resume game
          engineRef.current.state = 'playing';
          console.log('🎮 Game resumed after daily reward');
        }

        // Reset daily reward claimed flag
        dailyRewardClaimedRef.current = false;
      }, 1000); // 1 second delay
    } else {
      // If popup was closed without claiming, resume game
      console.log('🎁 Daily reward not claimed, resuming game normally');
      if (engineRef.current && engineRef.current.state === 'paused') {
        engineRef.current.state = 'playing';
        console.log('🎁 Game resumed after daily reward popup closed');
      }
    }
  };

  const handleShop = () => {
    // Pause the game before navigating
    if (engineRef.current && engineRef.current.state !== 'paused') {
      engineRef.current.togglePause();
    }
    navigate('/shop', { state: { from: '/game' } });
  };

  const handleAchievements = () => {
    // Pause the game before navigating
    if (engineRef.current && engineRef.current.state !== 'paused') {
      engineRef.current.togglePause();
    }
    navigate('/achievements', { state: { from: '/game' } });
  };

  const handleGuide = () => {
    // Pause the game before navigating
    if (engineRef.current && engineRef.current.state !== 'paused') {
      engineRef.current.togglePause();
    }
    navigate('/guide', { state: { from: '/game' } });
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleLeaderboard = () => {
    // Pause the game before navigating
    if (engineRef.current && engineRef.current.state !== 'paused') {
      engineRef.current.togglePause();
    }
    navigate('/leaderboard', { state: { from: '/game' } });
  };

  return (
    <div className="relative w-full h-screen bg-[#0a0014] overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full" />


        <GameHUD stats={gameState.stats} stardust={stardust} activePowerUps={gameState.activePowerUps} />

        <SoundToggleButton />
        <PauseButton onPause={handlePause} />

        <BossHealthBar
          show={gameState.bossState.bossActive}
          health={gameState.bossState.bossHealth}
          maxHealth={gameState.bossState.bossMaxHealth}
          phase={gameState.bossState.bossPhase} />


        {/* <BossIntro show={gameState.bossState.bossIntroTimer > 0} wave={gameState.stats.wave} /> */}

        <GameOverlay
          state={gameState.state}
          stats={gameState.stats}
          onResume={handleResume}
          onRestart={handleRestart}
          onRestartFromWave1={handleRestartFromWave1}
          onMainMenu={handleMainMenu}
          onGuide={handleGuide}
          onShop={handleShop}
          onAchievements={handleAchievements}
          onSettings={handleSettings}
          onLeaderboard={handleLeaderboard}
          lastCheckpoint={engineRef.current?.lastCheckpoint} />

        {/* Settings Overlay */}
        <SettingsOverlay
          isOpen={showSettings}
          onClose={handleCloseSettings}
          isMobile={isMobile} />

      {/* Boss intro */}
      {gameState.state === 'bossIntro' && (
        <BossIntro wave={gameState.stats.wave} onSkip={handleSkipBossIntro} />
      )}

      {/* Level Up Celebration */}
      <AnimatePresence>
        {showLevelUp && (
          <LevelUpCelebration
            level={levelUpData.level}
            upgrade={levelUpData.upgrade}
            onComplete={() => setShowLevelUp(false)}
          />
        )}
      </AnimatePresence>

      {/* Achievement Toasts - Single row above combo scores */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        <AnimatePresence mode="popLayout">
          {achievements.slice(0, 3).map((achievement) => (
            <AchievementToast
              key={achievement.id}
              achievement={achievement}
              onComplete={() => {
                setAchievements(prev => prev.filter(a => a.id !== achievement.id));
              }}
            />
          ))}
        </AnimatePresence>
      </div>

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

      {/* Landscape Orientation Enforcement (Mobile Only) */}
      <LandscapePrompt isVisible={shouldShowPrompt} />

    </div>);

}