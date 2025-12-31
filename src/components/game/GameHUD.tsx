import { GameStats } from '@/lib/game/types';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameHUDProps {
  stats: GameStats;
  stardust?: number;
}

export default function GameHUD({ stats, stardust = 0 }: GameHUDProps) {
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
        isLandscape ? 'p-0.5' : 'p-1 sm:p-2'
      }`}
           style={{
             paddingTop: isLandscape ? '20px' : 'max(env(safe-area-inset-top, 0.25rem), 0.25rem)',
             fontSize: 'clamp(0.65rem, 2vw, 0.875rem)'
           }}>
        {/* Left side - Score & Stardust */}
        <div className="text-left">
          <div className={`text-cyan-400 font-bold tracking-wider ${
            isLandscape ? 'text-[0.5rem]' : 'text-[0.6rem] sm:text-xs'
          }`}>SCORE</div>
          <div className={`font-bold ${
            isLandscape ? 'text-xs' : 'text-sm sm:text-lg md:text-2xl'
          }`} style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.8)' }}>
            {stats.score.toString().padStart(6, '0')}
          </div>

          {/* Stardust Display */}
          <div className={`mt-1 relative ${isLandscape ? 'mt-0.5' : 'mt-1'}`}>
            <div className={`text-purple-400 font-bold tracking-wider ${
              isLandscape ? 'text-[0.4rem]' : 'text-[0.5rem] sm:text-[0.6rem]'
            }`}>STARDUST</div>
            <div className={`font-bold text-purple-300 flex items-center gap-1 ${
              isLandscape ? 'text-[0.65rem]' : 'text-xs sm:text-sm'
            }`} style={{ textShadow: '0 0 8px rgba(192, 132, 252, 0.8)' }}>
              <span className="inline-block">💎</span>
              <span>{stardust.toLocaleString()}</span>
            </div>

            {/* Floating +Stardust animation */}
            <AnimatePresence>
              {stardustEarned !== null && (
                <motion.div
                  className={`absolute font-bold text-purple-300 ${
                    isLandscape ? 'text-[0.6rem] left-8' : 'text-xs sm:text-sm left-10'
                  }`}
                  style={{
                    textShadow: '0 0 10px rgba(192, 132, 252, 1)',
                    top: '50%'
                  }}
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: -20, scale: 1 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                >
                  +{stardustEarned} 💎
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center - Wave */}
        <div className="text-center">
          <div className={`text-pink-400 font-bold tracking-wider ${
            isLandscape ? 'text-[0.5rem]' : 'text-[0.6rem] sm:text-xs'
          }`}>WAVE</div>
          <div className={`font-bold ${
            isLandscape ? 'text-xs' : 'text-sm sm:text-lg md:text-2xl'
          }`} style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}>
            {stats.wave}
          </div>
        </div>

        {/* Right side - Lives */}
        <div className="text-right">
          <div className={`text-yellow-400 font-bold tracking-wider ${
            isLandscape ? 'text-[0.5rem]' : 'text-[0.6rem] sm:text-xs'
          }`}>HEALTH</div>
          <div className={`flex justify-end flex-wrap ${
            isLandscape ? 'gap-0.5 mt-0 max-w-[60px]' : 'gap-0.5 sm:gap-1 mt-0.5 max-w-[90px] sm:max-w-[120px]'
          }`}>
            {Array.from({ length: stats.maxHealth }).map((_, i) =>
            <div
              key={i}
              className={`rounded-sm transition-all ${
                isLandscape ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'
              } ${
              i < stats.lives ?
              'bg-yellow-400' :
              'bg-gray-600/50 border border-gray-500'}`
              }
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                boxShadow: i < stats.lives ? '0 0 10px rgba(251, 191, 36, 0.8)' : 'none'
              }} />

            )}
          </div>
        </div>
      </div>
    </div>);

}
