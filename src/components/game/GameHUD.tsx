import { GameStats } from '@/lib/game/types';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameHUDProps {
  stats: GameStats;
  stardust?: number;
  activePowerUps?: any;
}

export default function GameHUD({ stats, stardust = 0, activePowerUps }: GameHUDProps) {
  const [stardustEarned, setStardustEarned] = useState<number | null>(null);
  const [prevStardust, setPrevStardust] = useState(stardust);

  // Detect landscape orientation
  const isLandscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight;

  // Animate Stardust changes
  useEffect(() => {
    if (stardust > prevStardust) {
      const earned = stardust - prevStardust;
      setStardustEarned(earned);
      setTimeout(() => setStardustEarned(null), 2000);
    }
    setPrevStardust(stardust);
  }, [stardust, prevStardust]);

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      <div className={`flex justify-between items-start text-white font-['Space_Grotesk'] ${
      isLandscape ? 'p-0.5' : 'p-1 sm:p-2'}`
      }
      style={{
        paddingTop: isLandscape ? '20px' : 'max(env(safe-area-inset-top, 0.25rem), 0.25rem)',
        fontSize: 'clamp(0.65rem, 2vw, 0.875rem)'
      }}>
        {/* Left side - Score & Stardust */}
        <div className="text-left">
          <div className={`text-cyan-400 font-bold tracking-wider ${
          isLandscape ? 'text-[0.5rem]' : 'text-[0.6rem] sm:text-xs'}`
          }>SCORE</div>
          <div className={`font-bold ${
          isLandscape ? 'text-xs' : 'text-sm sm:text-lg md:text-2xl'}`
          } style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.8)' }}>
            {stats.score.toString().padStart(6, '0')}
          </div>

          {/* Stardust Display */}
          <div className={`mt-1 relative ${isLandscape ? 'mt-0.5' : 'mt-1'}`}>
            <div className={`text-purple-400 font-bold tracking-wider ${
            isLandscape ? 'text-[0.5rem]' : 'text-[0.6rem] sm:text-xs'}`
            }>STARDUST</div>
            <div className={`font-bold text-purple-300 flex items-center gap-1 ${
            isLandscape ? 'text-sm' : 'text-sm sm:text-base'}`
            } style={{ textShadow: '0 0 8px rgba(192, 132, 252, 0.8)' }}>
              <span className="inline-block text-base sm:text-lg">💎</span>
              <span>{stardust.toLocaleString()}</span>
            </div>

            {/* Floating +Stardust animation */}
            <AnimatePresence>
              {stardustEarned !== null &&
              <motion.div
                className={`absolute font-bold text-purple-300 ${
                isLandscape ? 'text-[0.6rem] left-8' : 'text-xs sm:text-sm left-10'}`
                }
                style={{
                  textShadow: '0 0 10px rgba(192, 132, 252, 1)',
                  top: '50%'
                }}
                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: 1, y: -20, scale: 1 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}>

                  +{stardustEarned} 💎
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </div>

        {/* Center-Left - Active Power-Ups (Left of Wave) */}
        <div className="flex items-center mr-2">
          <AnimatePresence>
            {activePowerUps &&
            <div className={`flex flex-col gap-1.5 ${
            isLandscape ? 'max-w-[200px]' : 'max-w-[220px]'}`
            }>
                {Object.entries(activePowerUps).map(([key, value]: [string, any]) => {
                if (!value.active) return null;

                const powerUpIcons: Record<string, string> = {
                  plasma: '🟣',
                  rapid: '🔵',
                  shield: '🟢',
                  slowmo: '🟠',
                  homing: '🌸',
                  laser: '🔴',
                  invincibility: '⭐',
                  freeze: '❄️',
                  magnet: '🧲',
                  multiplier: '2×'
                };

                const powerUpNames: Record<string, string> = {
                  plasma: 'Plasma',
                  rapid: 'Rapid',
                  shield: 'Shield',
                  slowmo: 'Slowmo',
                  homing: 'Homing',
                  laser: 'Laser',
                  invincibility: 'Invincible',
                  freeze: 'Freeze',
                  magnet: 'Magnet',
                  multiplier: '2x Score'
                };

                const seconds = Math.ceil(value.duration / 60);
                const isExpiring = seconds <= 2;

                return (
                  <motion.div
                    key={key}
                    initial={{ scale: 0, opacity: 0, x: -20 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      x: 0,
                      backgroundColor: isExpiring ? ['rgba(0, 0, 0, 0.8)', 'rgba(220, 38, 38, 0.9)', 'rgba(0, 0, 0, 0.8)'] : 'rgba(0, 0, 0, 0.8)'
                    }}
                    exit={{ scale: 0, opacity: 0, x: -20 }}
                    transition={{
                      backgroundColor: isExpiring ? {
                        duration: 0.6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : {}
                    }}
                    className={`flex items-center gap-2.5 border-2 rounded-lg backdrop-blur-sm ${
                    isExpiring ? 'border-red-400' : 'border-cyan-400/70'} ${
                    isLandscape ? 'px-3 py-2' : 'px-4 py-2.5'}`}
                    style={{
                      boxShadow: isExpiring ?
                      '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)' :
                      '0 0 12px rgba(34, 211, 238, 0.6)'
                    }}>

                      <div className={`${isLandscape ? 'text-3xl' : 'text-4xl'}`}>
                        {powerUpIcons[key] || '⚡'}
                      </div>
                      <div className="flex flex-col">
                        <div className={`text-cyan-300 font-bold leading-tight ${
                      isLandscape ? 'text-[0.75rem]' : 'text-[0.85rem]'}`
                      }>
                          {powerUpNames[key]}
                        </div>
                        <div className={`text-white font-bold leading-tight ${
                      isLandscape ? 'text-[0.65rem]' : 'text-[0.75rem]'}`
                      }>
                          {seconds}s
                        </div>
                      </div>
                    </motion.div>);

              })}
              </div>
            }
          </AnimatePresence>
        </div>

        {/* Center - Wave */}
        <div className="text-center">
          <div className={`text-pink-400 font-bold tracking-wider ${
          isLandscape ? 'text-[0.5rem]' : 'text-[0.6rem] sm:text-xs'}`
          }>WAVE</div>
          <div className={`font-bold ${
          isLandscape ? 'text-xs' : 'text-sm sm:text-lg md:text-2xl'}`
          } style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}>
            {stats.wave}
          </div>
        </div>

        {/* Center-Right - Game Controls (Pause & Sound) - Placeholder for positioning */}
        <div className="flex items-center gap-2" style={{
          visibility: 'hidden',
          pointerEvents: 'none'
        }}>
          {/* Invisible placeholders to reserve space - actual buttons are positioned absolutely in GamePage */}
          <div className={isLandscape ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} />
          <div className={isLandscape ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} />
        </div>

        {/* Right side - Lives */}
        <div className="text-right">
          <div className={`text-yellow-400 font-bold tracking-wider ${
          isLandscape ? 'text-[0.5rem]' : 'text-[0.6rem] sm:text-xs'}`
          }>HEALTH</div>
          <div className={`flex justify-end flex-wrap ${
          isLandscape ? 'gap-0.5 mt-0 max-w-[70px]' : 'gap-1 sm:gap-1.5 mt-0.5 max-w-[110px] sm:max-w-[140px]'}`
          }>
            {Array.from({ length: stats.maxHealth }).map((_, i) =>
            <div
              key={i}
              className={`rounded-sm transition-all ${
              isLandscape ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} ${

              i < stats.lives ?
              'bg-yellow-400' :
              'bg-gray-600/50 border border-gray-500'}`
              }
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                boxShadow: i < stats.lives ? '0 0 12px rgba(251, 191, 36, 0.9)' : 'none'
              }} />

            )}
          </div>
        </div>
      </div>
    </div>);

}