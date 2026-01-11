import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { DailyReward, MilestoneReward, ComebackBonus } from '@/lib/game/progression/ProgressionTypes';

interface DailyRewardPopupProps {
  day: number;
  reward: DailyReward;
  streak: number;
  onClaim: () => void;
  onClose: () => void;
  comebackBonus?: ComebackBonus;
  milestonesUnlocked?: MilestoneReward[];
  nextMilestone?: MilestoneReward & { progress: number };
}

export default function DailyRewardPopup({
  day,
  reward,
  streak,
  onClaim,
  onClose,
  comebackBonus,
  milestonesUnlocked,
  nextMilestone
}: DailyRewardPopupProps) {
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    if (claimed) return; // Prevent double-click
    setClaimed(true);
    onClaim();
  };

  // Auto-close after claiming - using useEffect to ensure proper cleanup
  useEffect(() => {
    if (!claimed) return;

    const closeDelay = milestonesUnlocked && milestonesUnlocked.length > 0 ? 3000 : 1500;
    console.log('🎁 Daily reward claimed, closing in', closeDelay, 'ms');

    const closeTimer = setTimeout(() => {
      console.log('🎁 Closing daily reward popup');
      onClose();
    }, closeDelay);

    return () => clearTimeout(closeTimer);
  }, [claimed, milestonesUnlocked, onClose]);

  const handleBackdropClick = () => {
    // Only allow closing via backdrop after claiming
    if (claimed) {
      onClose();
    }
  };

  // Get base rewards for calendar view (will show multiplied values)
  const baseAllDays = [
    { day: 1, stardust: 50, lives: 1 },
    { day: 2, stardust: 100 },
    { day: 3, stardust: 75, maxHealth: 1 },
    { day: 4, stardust: 150 },
    { day: 5, stardust: 100, powerUp: 'shield' },
    { day: 6, stardust: 200 },
    { day: 7, stardust: 300, lives: 2, special: 'weeklyBonus' }
  ];

  // Apply week multiplier to calendar if available
  const weekMultiplier = reward.weekMultiplier || 1.0;
  const allDays = baseAllDays.map(d => ({
    ...d,
    stardust: d.stardust ? Math.floor(d.stardust * weekMultiplier) : undefined
  }));

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
      />

      {/* Popup */}
      <motion.div
        className="fixed inset-0 z-[101] flex items-center justify-center p-1 sm:p-4 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div
          className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 border-2 sm:border-4 border-cyan-400 rounded-2xl sm:rounded-3xl p-1.5 sm:p-6 max-w-3xl w-full shadow-2xl pointer-events-auto"
          style={{ boxShadow: '0 0 50px rgba(34, 211, 238, 0.5)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-0.5 sm:mb-3">
            <motion.div
              className="text-lg sm:text-4xl mb-0"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
            >
              🎁
            </motion.div>
            <h2 className="text-sm sm:text-xl font-black text-white font-['Sora'] mb-0"
                style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>
              DAILY REWARD
            </h2>
            <div className="text-cyan-300 text-[0.65rem] sm:text-xs font-['Space_Grotesk']">
              Day {day} • {streak} Day Streak 🔥
            </div>
            {weekMultiplier > 1.0 && (
              <motion.div
                className="mt-0.5 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full inline-block"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <span className="text-white font-black text-[0.6rem] sm:text-xs">
                  🚀 {weekMultiplier}x WEEK BONUS!
                </span>
              </motion.div>
            )}
          </div>

          {/* Comeback Bonus Banner */}
          {comebackBonus && comebackBonus.available && (
            <motion.div
              className="mb-0.5 sm:mb-2 p-0.5 sm:p-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg border border-green-300"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}
            >
              <div className="text-white font-bold text-[0.65rem] sm:text-xs text-center mb-0">
                🎉 WELCOME BACK!
              </div>
              <div className="text-white text-[0.55rem] sm:text-[0.65rem] text-center">
                {comebackBonus.streakRecovery}% streak recovered • +{comebackBonus.bonusStardust} 💎 bonus
              </div>
            </motion.div>
          )}

          {/* 7-Day Calendar */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5 mb-1 sm:mb-3">
            {allDays.map((d) => (
              <div
                key={d.day}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs transition-all ${
                  d.day === day
                    ? 'border-yellow-400 bg-yellow-400/20 scale-110'
                    : d.day < day
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 bg-gray-800/30'
                }`}
              >
                <div className={`text-[0.6rem] font-bold ${
                  d.day === day ? 'text-yellow-300' : d.day < day ? 'text-green-300' : 'text-gray-400'
                }`}>
                  D{d.day}
                </div>
                {d.day === day ? (
                  <div className="text-lg">⭐</div>
                ) : d.day < day ? (
                  <div className="text-lg">✓</div>
                ) : (
                  <div className="text-sm opacity-50">💎</div>
                )}
              </div>
            ))}
          </div>

          {/* Today's Reward */}
          <motion.div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-1 sm:p-3 mb-1 sm:mb-3 text-center"
            animate={claimed ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="text-white/80 text-[0.55rem] sm:text-[0.65rem] font-bold tracking-widest mb-0.5">
              TODAY'S REWARD
            </div>
            <div className="flex flex-wrap gap-0.5 sm:gap-1.5 justify-center items-center">
              {reward.stardust && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-base sm:text-3xl">💎</span>
                  <div>
                    <div className="text-sm sm:text-xl font-black text-white">+{reward.stardust}</div>
                    <div className="text-[0.55rem] sm:text-xs text-white/80">Stardust</div>
                  </div>
                </div>
              )}
              {reward.lives && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-2xl">❤️</span>
                  <div>
                    <div className="text-xs sm:text-base font-black text-white">+{reward.lives}</div>
                    <div className="text-[0.55rem] sm:text-xs text-white/80">Lives</div>
                  </div>
                </div>
              )}
              {reward.maxHealth && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-2xl">💪</span>
                  <div>
                    <div className="text-xs sm:text-base font-black text-white">+{reward.maxHealth}</div>
                    <div className="text-[0.55rem] sm:text-xs text-white/80">Max HP</div>
                  </div>
                </div>
              )}
              {reward.powerUp && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-2xl">🛡️</span>
                  <div>
                    <div className="text-xs sm:text-base font-black text-white">Shield</div>
                    <div className="text-[0.55rem] sm:text-xs text-white/80">Power-Up</div>
                  </div>
                </div>
              )}
              {reward.special === 'weeklyBonus' && (
                <div className="text-yellow-300 text-[0.65rem] sm:text-sm font-bold mt-1">
                  🎉 WEEKLY BONUS! 🎉
                </div>
              )}
            </div>
          </motion.div>

          {/* Claim Button */}
          {!claimed ? (
            <button
              onClick={handleClaim}
              className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-gray-900 font-black text-xs sm:text-base py-1.5 sm:py-2 rounded-lg hover:scale-105 transition-transform font-['Sora']"
              style={{ boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)' }}
            >
              CLAIM REWARD
            </button>
          ) : (
            <motion.div
              className="w-full bg-green-500 text-white font-black text-xs sm:text-base py-1.5 sm:py-2 rounded-lg text-center font-['Sora']"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              ✓ CLAIMED!
            </motion.div>
          )}

          {/* Milestone Celebration */}
          {claimed && milestonesUnlocked && milestonesUnlocked.length > 0 && (
            <motion.div
              className="mt-1 sm:mt-2 p-1 sm:p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg border border-yellow-400"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.8)' }}
            >
              <div className="text-center">
                <div className="text-lg sm:text-2xl mb-0.5">🏆</div>
                <div className="text-white font-black text-xs sm:text-sm mb-0.5">
                  MILESTONE REACHED!
                </div>
                {milestonesUnlocked.map((milestone, idx) => (
                  <div key={milestone.id} className="text-white text-[0.65rem] sm:text-xs mb-0.5">
                    <div className="font-bold">{milestone.description}</div>
                    <div className="text-yellow-300">
                      +{milestone.stardust.toLocaleString()} 💎
                      {milestone.lives && ` • +${milestone.lives} ❤️`}
                      {milestone.maxHealth && ` • +${milestone.maxHealth} 💪`}
                      {milestone.cosmetic && ` • Ship Unlocked!`}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Next Milestone Progress */}
          {!claimed && nextMilestone && (
            <div className="mt-1 sm:mt-2 p-1 sm:p-1.5 bg-black/30 rounded-lg border border-purple-400/30">
              <div className="text-purple-300 text-[0.6rem] sm:text-[0.7rem] font-bold mb-0.5">
                Next: {nextMilestone.description}
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="flex-1 bg-gray-700 rounded-full h-1 sm:h-1.5">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 sm:h-1.5 rounded-full transition-all"
                    style={{ width: `${nextMilestone.progress}%` }}
                  />
                </div>
                <div className="text-purple-300 text-[0.6rem] sm:text-[0.7rem] font-bold">
                  {nextMilestone.progress}%
                </div>
              </div>
              <div className="text-gray-400 text-[0.55rem] sm:text-[0.6rem] mt-0.5">
                {Math.ceil(nextMilestone.totalLogins - (nextMilestone.totalLogins * nextMilestone.progress / 100))} logins to go
              </div>
            </div>
          )}

          {/* Come back tomorrow message */}
          {claimed && (
            <motion.div
              className="text-center text-cyan-300 text-sm mt-4 font-['Space_Grotesk']"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Come back tomorrow for Day {(day % 7) + 1}!
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Confetti particles on claim */}
      {claimed && (
        <motion.div className="fixed inset-0 z-[102] pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: ['#22d3ee', '#a855f7', '#fbbf24', '#f472b6'][i % 4],
                left: '50%',
                top: '50%'
              }}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.02,
                ease: 'easeOut'
              }}
            />
          ))}
        </motion.div>
      )}
    </>
  );
}
