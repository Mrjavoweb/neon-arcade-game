import { motion } from 'framer-motion';
import { GameState, GameStats } from '@/lib/game/types';

interface GameOverlayProps {
  state: GameState;
  stats: GameStats;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOverlay({ state, stats, onResume, onRestart, onMainMenu }: GameOverlayProps) {
  if (state === 'playing') return null;

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-2 border-cyan-400 rounded-xl p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ boxShadow: '0 0 40px rgba(34, 211, 238, 0.5)' }}
      >
        {state === 'paused' && (
          <div className="text-center">
            <h2 
              className="text-4xl md:text-5xl font-black mb-6 text-cyan-400 font-['Sora']"
              style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}
            >
              PAUSED
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={onResume}
                className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all font-['Space_Grotesk']"
                style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}
              >
                Resume Game
              </button>
              
              <button
                onClick={onMainMenu}
                className="w-full px-6 py-3 bg-pink-500/30 hover:bg-pink-500/50 text-white font-bold rounded-lg border border-pink-400 transition-all font-['Space_Grotesk']"
              >
                Main Menu
              </button>
            </div>

            <div className="mt-6 text-sm text-blue-200 font-['Space_Grotesk']">
              Press <span className="text-cyan-400 font-bold">P</span> to resume
            </div>
          </div>
        )}

        {state === 'gameOver' && (
          <div className="text-center">
            <h2 
              className="text-4xl md:text-5xl font-black mb-4 text-pink-400 font-['Sora']"
              style={{ textShadow: '0 0 20px rgba(236, 72, 153, 0.8)' }}
            >
              GAME OVER
            </h2>
            
            <div className="mb-6 space-y-2 font-['Space_Grotesk']">
              <div className="text-2xl text-cyan-300">
                Final Score: <span className="font-bold text-cyan-400">{stats.score}</span>
              </div>
              <div className="text-lg text-blue-200">
                Wave Reached: <span className="font-bold">{stats.wave}</span>
              </div>
              <div className="text-lg text-blue-200">
                Enemies Destroyed: <span className="font-bold">{stats.enemiesDestroyed}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onRestart}
                className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all font-['Space_Grotesk']"
                style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}
              >
                Play Again
              </button>
              
              <button
                onClick={onMainMenu}
                className="w-full px-6 py-3 bg-pink-500/30 hover:bg-pink-500/50 text-white font-bold rounded-lg border border-pink-400 transition-all font-['Space_Grotesk']"
              >
                Main Menu
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
