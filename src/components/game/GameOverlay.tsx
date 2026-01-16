import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GameState, GameStats } from '@/lib/game/types';
import PWAInstallButton from '@/components/PWAInstallButton';

interface GameOverlayProps {
  state: GameState;
  stats: GameStats;
  onResume: () => void;
  onRestart: () => void;
  onRestartFromWave1?: () => void;
  onMainMenu: () => void;
  onShop?: () => void;
  onAchievements?: () => void;
  onGuide?: () => void;
  onSettings?: () => void;
  onLeaderboard?: () => void;
  lastCheckpoint?: number;
}

export default function GameOverlay({ state, stats, onResume, onRestart, onRestartFromWave1, onMainMenu, onShop, onAchievements, onGuide, onSettings, onLeaderboard, lastCheckpoint }: GameOverlayProps) {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (state === 'playing') return null;

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}>

      <motion.div
        className={`bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-2 border-cyan-400 rounded-xl w-full mx-4 ${
        isLandscape ?
        'max-w-5xl p-4 max-h-[90vh] overflow-y-auto' :
        'max-w-md p-8'}`
        }
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ boxShadow: '0 0 40px rgba(34, 211, 238, 0.5)' }}>

        {state === 'paused' &&
        <div className="text-center">
            <h2
            className={`font-black text-cyan-400 font-['Sora'] ${
            isLandscape ? 'text-2xl mb-3' : 'text-4xl md:text-5xl mb-6'}`
            }
            style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>

              PAUSED
            </h2>

            <div className={isLandscape ? 'grid grid-cols-3 gap-2' : 'space-y-3'}>
              <button
              onClick={onResume}
              className={`w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }
              style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}>

                Resume Game
              </button>

              {onShop &&
            <button
              onClick={onShop}
              className={`w-full bg-purple-500/30 hover:bg-purple-500/50 text-white font-bold rounded-lg border border-purple-400 transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }>

                  🛍️ Shop
                </button>
            }

              {onAchievements &&
            <button
              onClick={onAchievements}
              className={`w-full bg-yellow-500/30 hover:bg-yellow-500/50 text-white font-bold rounded-lg border border-yellow-400 transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }>

                  🏆 Achievements
                </button>
            }

              {onLeaderboard &&
            <button
              onClick={onLeaderboard}
              className={`w-full bg-cyan-500/30 hover:bg-cyan-500/50 text-white font-bold rounded-lg border border-cyan-400 transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }>

                  📊 Leaderboard
                </button>
            }

              {onGuide &&
            <button
              onClick={onGuide}
              className={`w-full bg-blue-500/30 hover:bg-blue-500/50 text-white font-bold rounded-lg border border-blue-400 transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }>

                  📖 Guide
                </button>
            }

              {onSettings &&
            <button
              onClick={onSettings}
              className={`w-full bg-gray-500/30 hover:bg-gray-500/50 text-white font-bold rounded-lg border border-gray-400 transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }>

                  ⚙️ Settings
                </button>
            }

              <button
              onClick={onMainMenu}
              className={`w-full bg-pink-500/30 hover:bg-pink-500/50 text-white font-bold rounded-lg border border-pink-400 transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }>

                Main Menu
              </button>
            </div>

            {!isLandscape &&
          <>
                {/* PWA Install Button */}
                <div className="mt-4 flex justify-center">
                  <PWAInstallButton />
                </div>

                <div className="mt-6 text-sm text-blue-200 font-['Space_Grotesk']">
                  Press <span className="text-cyan-400 font-bold">P</span> to resume
                </div>
              </>
          }
          </div>
        }

        {state === 'bossVictory' &&
        <div className="text-center">
            <h2
            className="text-4xl md:text-5xl font-black mb-4 text-yellow-400 font-['Sora'] animate-pulse"
            style={{ textShadow: '0 0 30px rgba(251, 191, 36, 1)' }}>

              BOSS DEFEATED!
            </h2>

            <div className="mb-6 font-['Space_Grotesk'] text-cyan-300 text-lg">
              Preparing next wave...
            </div>
          </div>
        }

        {state === 'gameOver' &&
        <div className="text-center">
            <h2
            className={`font-black text-pink-400 font-['Sora'] ${
            isLandscape ? 'text-2xl mb-2' : 'text-4xl md:text-5xl mb-4'}`
            }
            style={{ textShadow: '0 0 20px rgba(236, 72, 153, 0.8)' }}>

              GAME OVER
            </h2>

            {/* Checkpoint indicator */}
            {lastCheckpoint && lastCheckpoint > 0 &&
          <div className={`bg-yellow-500/20 border border-yellow-400 rounded-lg ${
          isLandscape ? 'mb-2 px-3 py-1' : 'mb-4 px-4 py-2'}`
          }>
              <div className={`text-yellow-400 font-bold font-['Space_Grotesk'] ${
            isLandscape ? 'text-xs' : 'text-sm'}`
            }>
                ✅ Checkpoint Saved!
              </div>
              <div className={`text-cyan-300 font-['Space_Grotesk'] ${
            isLandscape ? 'text-[0.6rem]' : 'text-xs'}`
            }>
                You'll continue from Wave {lastCheckpoint}
              </div>
            </div>
          }

            <div className={`font-['Space_Grotesk'] ${
          isLandscape ? 'mb-2 space-y-1' : 'mb-6 space-y-2'}`
          }>
              <div className={`text-cyan-300 ${
            isLandscape ? 'text-lg' : 'text-2xl'}`
            }>
                Final Score: <span className="font-bold text-cyan-400">{stats.score}</span>
              </div>
              <div className={`flex items-center justify-center gap-2 ${
            isLandscape ? 'my-1' : 'my-3'}`
            }>
                <div
                className={`rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-black border-2 border-yellow-300 ${
                isLandscape ? 'w-8 h-8 text-lg' : 'w-12 h-12 text-2xl'}`
                }
                style={{ boxShadow: '0 0 15px rgba(251, 191, 36, 0.6)' }}>

                  {stats.level}
                </div>
                <div className="text-left">
                  <div className={`text-yellow-400 font-bold ${
                isLandscape ? 'text-sm' : ''}`
                }>Level {stats.level}</div>
                  <div className={`text-blue-200 ${
                isLandscape ? 'text-xs' : 'text-sm'}`
                }>Max Health: {stats.maxHealth}</div>
                </div>
              </div>
              <div className={`grid grid-cols-2 gap-2 ${
            isLandscape ? 'text-xs' : 'text-sm'}`
            }>
                <div className={`bg-black/30 rounded border border-cyan-400/30 ${
              isLandscape ? 'p-1' : 'p-2'}`
              }>
                  <div className={`text-cyan-400 font-bold ${
                isLandscape ? 'text-[0.65rem]' : ''}`
                }>Wave</div>
                  <div className={`text-white ${
                isLandscape ? 'text-sm' : 'text-lg'}`
                }>{stats.wave}</div>
                  {!isLandscape && <div className="text-cyan-200/70 text-[0.65rem] mt-0.5">Difficulty level</div>}
                </div>
                <div className={`bg-black/30 rounded border border-pink-400/30 ${
              isLandscape ? 'p-1' : 'p-2'}`
              }>
                  <div className={`text-pink-400 font-bold ${
                isLandscape ? 'text-[0.65rem]' : ''}`
                }>Kills</div>
                  <div className={`text-white ${
                isLandscape ? 'text-sm' : 'text-lg'}`
                }>{stats.enemiesDestroyed}</div>
                  {!isLandscape && <div className="text-pink-200/70 text-[0.65rem] mt-0.5">Enemies defeated</div>}
                </div>
                <div className={`bg-black/30 rounded border border-yellow-400/30 ${
              isLandscape ? 'p-1' : 'p-2'}`
              }>
                  <div className={`text-yellow-400 font-bold ${
                isLandscape ? 'text-[0.65rem]' : ''}`
                }>Fire Rate</div>
                  <div className={`text-white ${
                isLandscape ? 'text-sm' : 'text-lg'}`
                }>+{stats.fireRateBonus}%</div>
                  {!isLandscape && <div className="text-yellow-200/70 text-[0.65rem] mt-0.5">Weapon speed</div>}
                </div>
                <div className={`bg-black/30 rounded border border-purple-400/30 ${
              isLandscape ? 'p-1' : 'p-2'}`
              }>
                  <div className={`text-purple-400 font-bold ${
                isLandscape ? 'text-[0.65rem]' : ''}`
                }>Speed</div>
                  <div className={`text-white ${
                isLandscape ? 'text-sm' : 'text-lg'}`
                }>+{stats.movementSpeedBonus}%</div>
                  {!isLandscape && <div className="text-purple-200/70 text-[0.65rem] mt-0.5">Ship mobility</div>}
                </div>
              </div>
            </div>

            <div className={isLandscape ? 'grid grid-cols-2 gap-2' : 'space-y-3'}>
              <button
              onClick={onRestart}
              className={`w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }
              style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}>

                {lastCheckpoint && lastCheckpoint > 0 ? `Continue Wave ${lastCheckpoint}` : 'Play Again'}
              </button>

              {lastCheckpoint && lastCheckpoint > 0 && onRestartFromWave1 &&
            <button
              onClick={onRestartFromWave1}
              className={`w-full bg-green-500/30 hover:bg-green-500/50 text-white font-bold rounded-lg border border-green-400 transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }>

                  🔄 {isLandscape ? 'Fresh Start' : 'Start Fresh from Wave 1'}
                </button>
            }

              {onLeaderboard &&
            <button
              onClick={onLeaderboard}
              className={`w-full bg-cyan-500/30 hover:bg-cyan-500/50 text-white font-bold rounded-lg border border-cyan-400 transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }>

                  📊 {isLandscape ? 'Leaderboard' : 'View Leaderboard'}
                </button>
            }

              <button
              onClick={onMainMenu}
              className={`w-full bg-pink-500/30 hover:bg-pink-500/50 text-white font-bold rounded-lg border border-pink-400 transition-all font-['Space_Grotesk'] ${
              isLandscape ? 'px-3 py-2 text-sm' : 'px-6 py-3'}`
              }>

                Main Menu
              </button>
            </div>
          </div>
        }
      </motion.div>
    </motion.div>);

}