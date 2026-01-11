import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameEngine } from '@/lib/game/GameEngine';
import { GameState, GameStats, BossState } from '@/lib/game/types';
import { Achievement, DailyReward, MilestoneReward, ComebackBonus } from '@/lib/game/progression/ProgressionTypes';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';
import BossHealthBar from './BossHealthBar';
import BossIntro from './BossIntro';
import LevelUpCelebration from './LevelUpCelebration';
import AchievementToast from './AchievementToast';
import DailyRewardPopup from './DailyRewardPopup';
import ShopModal from './ShopModal';
import { AnimatePresence } from 'framer-motion';

interface GameCanvasProps {
  isMobile: boolean;
}

export default function GameCanvas({ isMobile }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<GameState>('playing');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    lives: 3,
    wave: 1,
    enemiesDestroyed: 0,
    xp: 0,
    level: 1,
    maxHealth: 3,
    fireRateBonus: 0,
    movementSpeedBonus: 0
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, upgrade: '' });
  const [stardust, setStardust] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyReward, setDailyReward] = useState<{
    day: number;
    reward: DailyReward;
    streak: number;
    comebackBonus?: ComebackBonus;
    milestonesUnlocked?: MilestoneReward[];
    nextMilestone?: MilestoneReward & { progress: number };
  } | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [bossState, setBossState] = useState<BossState>({
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
  });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Reinitialize game engine if it exists
      if (gameEngineRef.current) {
        const oldStats = gameEngineRef.current.stats;
        const oldState = gameEngineRef.current.state;
        const oldPlayer = gameEngineRef.current.player;
        const wasPlaying = oldState === 'playing';

        gameEngineRef.current.cleanup();

        gameEngineRef.current = new GameEngine(canvas, isMobile);
        gameEngineRef.current.stats = oldStats;
        gameEngineRef.current.state = oldState;

        // Restore player position if it existed
        if (oldPlayer && gameEngineRef.current.player) {
          gameEngineRef.current.player.position.x = oldPlayer.position.x;
          gameEngineRef.current.player.position.y = oldPlayer.position.y;
          gameEngineRef.current.player.invulnerable = oldPlayer.invulnerable;
          gameEngineRef.current.player.invulnerabilityTimer = oldPlayer.invulnerabilityTimer;
        }

        gameEngineRef.current.loadAssets();

        // Regenerate enemy grid with proper spacing for new orientation
        if (wasPlaying && gameEngineRef.current.enemies.length === 0) {
          gameEngineRef.current.createEnemyWave(oldStats.wave);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize game engine with assets
    const initGame = async () => {
      console.log('🎮 GameCanvas: initGame starting...');
      gameEngineRef.current = new GameEngine(canvas, isMobile);
      console.log('🎮 GameCanvas: GameEngine created');

      // Set level up callback
      gameEngineRef.current.setLevelUpCallback((level: number, upgrade: string) => {
        setLevelUpData({ level, upgrade });
        setShowLevelUp(true);
      });

      // Listen for currency changes
      const handleCurrencyChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.balance !== undefined) {
          console.log('🎮 GameCanvas: currency-changed event received. New balance:', customEvent.detail.balance);
          setStardust(customEvent.detail.balance);
        }
      };
      window.addEventListener('currency-changed', handleCurrencyChange);

      // Listen for achievement unlocks
      const handleAchievementUnlock = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.achievement) {
          setAchievements(prev => [...prev, customEvent.detail.achievement]);
        }
      };
      window.addEventListener('achievement-unlocked', handleAchievementUnlock);

      // Listen for daily reward available
      const handleDailyRewardAvailable = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.reward) {
          // Get next milestone info
          const nextMilestone = gameEngineRef.current?.dailyRewardManager.getNextMilestone();

          setDailyReward({
            day: customEvent.detail.day,
            reward: customEvent.detail.reward,
            streak: customEvent.detail.streak,
            comebackBonus: customEvent.detail.comebackBonus,
            milestonesUnlocked: customEvent.detail.milestonesUnlocked,
            nextMilestone
          });
        }
      };
      window.addEventListener('daily-reward-available', handleDailyRewardAvailable);

      // Initialize stardust from game engine
      const initialStardust = gameEngineRef.current.currencyManager.getStardust();
      console.log('🎮 GameCanvas: Initializing stardust from GameEngine:', initialStardust);
      setStardust(initialStardust);

      // Load assets with progress tracking BEFORE checking daily reward
      await gameEngineRef.current.loadAssets((progress) => {
        setLoadingProgress(progress);
      });

      setIsLoading(false);

      // Check for daily reward AFTER assets are loaded
      gameEngineRef.current.checkDailyReward();

      if (!mounted) return;

      // Game loop
      const gameLoop = () => {
        const engine = gameEngineRef.current;
        if (!engine) return;

        engine.update();
        engine.render();

        // Update React state
        setGameState(engine.state);
        setStats({ ...engine.stats });
        setBossState({ ...engine.bossState });

        animationFrameRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoop();
    };

    initGame();

    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gameEngineRef.current) {
        gameEngineRef.current.cleanup();
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isMobile]);

  const handleResume = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.state = 'playing';
    }
  };

  const handleRestart = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.reset();
    }
  };

  const handleMainMenu = () => {
    navigate('/');
  };

  const handlePause = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.togglePause();
    }
  };

  const handleSkipBossIntro = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.bossState.bossIntroTimer = 0;
      gameEngineRef.current.state = 'playing';
      gameEngineRef.current.slowMotionActive = false;
    }
  };

  const handleClaimDailyReward = () => {
    if (gameEngineRef.current) {
      const result = gameEngineRef.current.dailyRewardManager.claimReward();
      if (result.success && result.reward) {
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

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0014]">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ touchAction: 'none' }} />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-black text-cyan-400 mb-8 font-['Sora'] animate-pulse"
                style={{ textShadow: '0 0 30px rgba(34, 211, 238, 0.8)' }}>
              ALIEN INVASION
            </h2>

            {/* Progress Bar */}
            <div className="w-64 md:w-96 h-4 bg-black/50 rounded-full overflow-hidden border-2 border-cyan-400/50 mb-4">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 ease-out"
                style={{
                  width: `${loadingProgress}%`,
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)'
                }}
              />
            </div>

            <p className="text-cyan-300 font-['Space_Grotesk'] text-lg">
              Loading Assets... {Math.floor(loadingProgress)}%
            </p>
          </div>
        </div>
      )}

      {/* Only show game UI when not loading */}
      {!isLoading && (
        <>
          <GameHUD stats={stats} stardust={stardust} />

          {/* Boss health bar */}
          {bossState.bossActive &&
          <BossHealthBar
            health={bossState.bossHealth}
            maxHealth={bossState.bossMaxHealth}
            phase={bossState.bossPhase} />

          }
        </>
      )}

      {/* Only show game overlays when not loading */}
      {!isLoading && (
        <>
          {/* Boss intro */}
          {gameState === 'bossIntro' &&
          <BossIntro wave={stats.wave} onSkip={handleSkipBossIntro} />
          }

          {/* Level Up Celebration */}
          <AnimatePresence>
            {showLevelUp &&
            <LevelUpCelebration
              level={levelUpData.level}
              upgrade={levelUpData.upgrade}
              onComplete={() => setShowLevelUp(false)} />

            }
          </AnimatePresence>

          {/* Achievement Toasts */}
          <AnimatePresence>
            {achievements.map((achievement, index) => (
              <div key={achievement.id} style={{ top: `${5 + index * 11}rem` }} className="fixed right-0 z-50">
                <AchievementToast
                  achievement={achievement}
                  onComplete={() => {
                    setAchievements(prev => prev.filter(a => a.id !== achievement.id));
                  }}
                />
              </div>
            ))}
          </AnimatePresence>

          {/* Daily Reward Popup */}
          <AnimatePresence>
            {dailyReward && (
              <DailyRewardPopup
                day={dailyReward.day}
                reward={dailyReward.reward}
                streak={dailyReward.streak}
                onClaim={handleClaimDailyReward}
                onClose={() => setDailyReward(null)}
                comebackBonus={dailyReward.comebackBonus}
                milestonesUnlocked={dailyReward.milestonesUnlocked}
                nextMilestone={dailyReward.nextMilestone}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* Shop Modal */}
      {gameEngineRef.current && (
        <ShopModal
          isOpen={showShop}
          onClose={() => setShowShop(false)}
          skins={gameEngineRef.current.cosmeticManager.getAllSkins()}
          currentBalance={stardust}
          activeSkinId={gameEngineRef.current.cosmeticManager.getActiveSkin().id}
          onPurchase={(skinId) => gameEngineRef.current!.cosmeticManager.purchaseSkin(skinId)}
          onEquip={(skinId) => gameEngineRef.current!.cosmeticManager.equipSkin(skinId)}
        />
      )}

      {!isLoading && (
        <>
          <GameOverlay
            state={gameState}
            stats={stats}
            onResume={handleResume}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
            onShop={() => setShowShop(true)} />


          {/* Mobile pause button */}
          {isMobile && gameState === 'playing' &&
          <button
            onClick={handlePause}
            className="absolute top-4 right-4 z-10 px-4 py-2 bg-cyan-500/30 border border-cyan-500 rounded-lg text-cyan-300 font-['Space_Grotesk'] font-bold"
        style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.4)' }}>

          PAUSE
        </button>
          }

          {/* Desktop controls hint */}
          {!isMobile && gameState === 'playing' &&
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 text-center text-sm text-blue-300/60 font-['Space_Grotesk']">
              <div>← → Move | SPACE Fire | P Pause</div>
            </div>
          }
        </>
      )}
    </div>);

}