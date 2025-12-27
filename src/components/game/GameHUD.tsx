import { GameStats } from '@/lib/game/types';

interface GameHUDProps {
  stats: GameStats;
}

export default function GameHUD({ stats }: GameHUDProps) {
  const xpPerLevel = 500;
  const xpProgress = (stats.xp / xpPerLevel) * 100;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex justify-between items-start p-4 text-white font-['Space_Grotesk']">
        {/* Left side - Score & Level */}
        <div className="text-left space-y-3">
          <div>
            <div className="text-cyan-400 text-sm font-bold tracking-wider">SCORE</div>
            <div className="text-2xl md:text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.8)' }}>
              {stats.score.toString().padStart(6, '0')}
            </div>
          </div>
          
          {/* Level indicator */}
          <div className="bg-black/50 border-2 border-yellow-400 rounded-lg p-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-black text-lg border-2 border-yellow-300"
                style={{ boxShadow: '0 0 15px rgba(251, 191, 36, 0.6)' }}
              >
                {stats.level}
              </div>
              <div className="text-left">
                <div className="text-yellow-400 text-xs font-bold">LEVEL</div>
                <div className="text-white text-sm">+{stats.fireRateBonus}% FR / +{stats.movementSpeedBonus}% MS</div>
              </div>
            </div>
            
            {/* XP Bar */}
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-yellow-300">XP</span>
                <span className="text-xs text-yellow-300">{stats.xp}/{xpPerLevel}</span>
              </div>
              <div className="w-full h-3 bg-black/50 border border-yellow-400/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 transition-all duration-300"
                  style={{
                    width: `${xpProgress}%`,
                    boxShadow: '0 0 10px rgba(251, 191, 36, 0.8)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center - Wave */}
        <div className="text-center">
          <div className="text-pink-400 text-sm font-bold tracking-wider">WAVE</div>
          <div className="text-2xl md:text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}>
            {stats.wave}
          </div>
        </div>

        {/* Right side - Lives */}
        <div className="text-right">
          <div className="text-yellow-400 text-sm font-bold tracking-wider">HEALTH</div>
          <div className="flex gap-2 justify-end mt-1 flex-wrap max-w-[120px]">
            {Array.from({ length: stats.maxHealth }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-sm transition-all ${
                  i < stats.lives 
                    ? 'bg-yellow-400' 
                    : 'bg-gray-600/50 border border-gray-500'
                }`}
                style={{
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                  boxShadow: i < stats.lives ? '0 0 10px rgba(251, 191, 36, 0.8)' : 'none'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}