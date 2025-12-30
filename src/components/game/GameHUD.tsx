import { GameStats } from '@/lib/game/types';

interface GameHUDProps {
  stats: GameStats;
}

export default function GameHUD({ stats }: GameHUDProps) {
  // Detect landscape orientation
  const isLandscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      <div className={`flex justify-between items-start text-white font-['Space_Grotesk'] ${
      isLandscape ? 'p-0.5' : 'p-1 sm:p-2'}`
      }
      style={{
        paddingTop: isLandscape ? '20px' : 'max(env(safe-area-inset-top, 0.25rem), 0.25rem)',
        fontSize: 'clamp(0.65rem, 2vw, 0.875rem)'
      }}>
        {/* Left side - Score */}
        <div className="text-left">
          <div className={`text-cyan-400 font-bold tracking-wider ${
          isLandscape ? 'text-[0.5rem]' : 'text-[0.6rem] sm:text-xs'}`
          }>SCORE</div>
          <div className={`font-bold ${
          isLandscape ? 'text-xs' : 'text-sm sm:text-lg md:text-2xl'}`
          } style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.8)' }}>
            {stats.score.toString().padStart(6, '0')}
          </div>
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

        {/* Right side - Lives */}
        <div className="text-right">
          <div className={`text-yellow-400 font-bold tracking-wider ${
          isLandscape ? 'text-[0.5rem]' : 'text-[0.6rem] sm:text-xs'}`
          }>HEALTH</div>
          <div className={`flex justify-end flex-wrap ${
          isLandscape ? 'gap-0.5 mt-0 max-w-[60px]' : 'gap-0.5 sm:gap-1 mt-0.5 max-w-[90px] sm:max-w-[120px]'}`
          }>
            {Array.from({ length: stats.maxHealth }).map((_, i) =>
            <div
              key={i}
              className={`rounded-sm transition-all ${
              isLandscape ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'} ${

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