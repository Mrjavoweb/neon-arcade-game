import { GameStats } from '@/lib/game/types';

interface GameHUDProps {
  stats: GameStats;
}

export default function GameHUD({ stats }: GameHUDProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex justify-between items-center p-4 text-white font-['Space_Grotesk']">
        {/* Score */}
        <div className="text-left">
          <div className="text-cyan-400 text-sm font-bold tracking-wider">SCORE</div>
          <div className="text-2xl md:text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.8)' }}>
            {stats.score.toString().padStart(6, '0')}
          </div>
        </div>

        {/* Wave */}
        <div className="text-center">
          <div className="text-pink-400 text-sm font-bold tracking-wider">WAVE</div>
          <div className="text-2xl md:text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}>
            {stats.wave}
          </div>
        </div>

        {/* Lives */}
        <div className="text-right">
          <div className="text-yellow-400 text-sm font-bold tracking-wider">LIVES</div>
          <div className="flex gap-2 justify-end mt-1">
            {Array.from({ length: stats.lives }).map((_, i) =>
            <div
              key={i}
              className="w-6 h-6 bg-yellow-400 rounded-sm"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                boxShadow: '0 0 10px rgba(251, 191, 36, 0.8)'
              }} />

            )}
          </div>
        </div>
      </div>
    </div>);

}