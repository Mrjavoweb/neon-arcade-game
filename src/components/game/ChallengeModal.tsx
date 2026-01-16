import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Challenge, ChallengeData } from '@/lib/game/progression/ProgressionTypes';
import { GameEngine } from '@/lib/game/GameEngine';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: GameEngine | null;
}

export default function ChallengeModal({ isOpen, onClose, engine }: ChallengeModalProps) {
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  useEffect(() => {
    let engineRef = engine;

    const loadData = (eng?: GameEngine | null) => {
      const targetEngine = eng || engineRef;
      if (targetEngine?.challengeManager) {
        setChallengeData(targetEngine.challengeManager.getChallengeData());
      }
    };

    loadData();

    // Listen for engine-ready event as a backup
    const handleEngineReady = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.engine) {
        engineRef = customEvent.detail.engine;
        loadData(customEvent.detail.engine);
      }
    };

    window.addEventListener('engine-ready', handleEngineReady);

    return () => {
      window.removeEventListener('engine-ready', handleEngineReady);
    };
  }, [engine, isOpen]);

  const handleClaimBonus = () => {
    if (!engine?.challengeManager) return;

    const result = engine.challengeManager.claimDailyBonus();
    if (result.success) {
      setBonusClaimed(true);
      setChallengeData(engine.challengeManager.getChallengeData());

      // Auto-close after delay
      setTimeout(() => {
        setBonusClaimed(false);
        onClose();
      }, 2000);
    }
  };

  if (!challengeData) return null;

  const dailyChallenges = challengeData.dailyChallenges;
  const weeklyChallenge = challengeData.weeklyChallenge;
  const canClaimBonus = engine?.challengeManager.canClaimDailyBonus();

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'from-green-500 to-emerald-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'hard': return 'from-red-500 to-pink-500';
      case 'weekly': return 'from-purple-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getDifficultyBorder = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'border-green-400/50';
      case 'medium': return 'border-yellow-400/50';
      case 'hard': return 'border-red-400/50';
      case 'weekly': return 'border-purple-400/50';
      default: return 'border-gray-400/50';
    }
  };

  const getDifficultyLabel = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'EASY';
      case 'medium': return 'MEDIUM';
      case 'hard': return 'HARD';
      case 'weekly': return 'WEEKLY';
      default: return difficulty.toUpperCase();
    }
  };

  const renderChallenge = (challenge: Challenge, index: number) => {
    const progress = Math.min(100, (challenge.current / challenge.target) * 100);
    const isComplete = challenge.completed;

    return (
      <motion.div
        key={challenge.id}
        className={`p-2 sm:p-3 rounded-xl border-2 ${getDifficultyBorder(challenge.difficulty)} ${
          isComplete
            ? 'bg-green-500/20'
            : 'bg-black/40'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded text-[0.55rem] sm:text-[0.65rem] font-black bg-gradient-to-r ${getDifficultyColor(challenge.difficulty)} text-white`}>
              {getDifficultyLabel(challenge.difficulty)}
            </span>
            {isComplete && (
              <span className="text-green-400 text-sm">✓</span>
            )}
          </div>
          <span className={`text-[0.65rem] sm:text-xs font-bold ${
            isComplete ? 'text-green-400' : 'text-cyan-400'
          }`}>
            {isComplete ? 'COMPLETED' : `+${challenge.reward} 💎`}
          </span>
        </div>

        {/* Description */}
        <div className={`text-xs sm:text-sm font-medium mb-2 ${
          isComplete ? 'text-green-200 line-through' : 'text-white'
        }`}>
          {challenge.description}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${getDifficultyColor(challenge.difficulty)}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[0.55rem] sm:text-[0.65rem] text-gray-400">
            Progress
          </span>
          <span className="text-[0.55rem] sm:text-[0.65rem] text-gray-300 font-bold">
            {challenge.current.toLocaleString()}/{challenge.target.toLocaleString()}
          </span>
        </div>
      </motion.div>
    );
  };

  const getTimeUntilReset = (type: 'daily' | 'weekly'): string => {
    const now = new Date();
    let resetTime: Date;

    if (type === 'daily') {
      resetTime = new Date(now);
      resetTime.setHours(24, 0, 0, 0); // Midnight
    } else {
      // Next Monday
      const dayOfWeek = now.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      resetTime = new Date(now);
      resetTime.setDate(now.getDate() + daysUntilMonday);
      resetTime.setHours(0, 0, 0, 0);
    }

    const diff = resetTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (type === 'weekly') {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div
              className="bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 border-2 sm:border-4 border-cyan-400 rounded-2xl sm:rounded-3xl p-2 sm:p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto"
              style={{ boxShadow: '0 0 50px rgba(34, 211, 238, 0.5)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🎯</span>
                  <div>
                    <h2 className="text-sm sm:text-lg font-black text-white font-['Sora']"
                        style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>
                      CHALLENGES
                    </h2>
                    <div className="text-[0.55rem] sm:text-[0.65rem] text-cyan-300">
                      Complete challenges to earn rewards!
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white text-xl transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Daily Challenges Section */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">📅</span>
                    <span className="text-[0.65rem] sm:text-xs font-bold text-cyan-300 uppercase">
                      Daily Challenges
                    </span>
                  </div>
                  <span className="text-[0.55rem] sm:text-[0.65rem] text-gray-400">
                    Resets in {getTimeUntilReset('daily')}
                  </span>
                </div>

                <div className="space-y-2">
                  {dailyChallenges.map((challenge, index) => renderChallenge(challenge, index))}
                </div>
              </div>

              {/* Daily Bonus */}
              {canClaimBonus && !bonusClaimed && (
                <motion.button
                  onClick={handleClaimBonus}
                  className="w-full p-2 sm:p-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-xl mb-3"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.6)' }}
                >
                  <div className="text-gray-900 font-black text-sm sm:text-base">
                    🎁 CLAIM DAILY BONUS
                  </div>
                  <div className="text-gray-800 text-[0.65rem] sm:text-xs font-bold">
                    All 3 challenges complete! +300 💎
                  </div>
                </motion.button>
              )}

              {bonusClaimed && (
                <motion.div
                  className="w-full p-2 sm:p-3 bg-green-500 rounded-xl mb-3 text-center"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <div className="text-white font-black text-sm sm:text-base">
                    ✓ BONUS CLAIMED!
                  </div>
                  <div className="text-white/80 text-[0.65rem] sm:text-xs">
                    +300 💎 added to your balance
                  </div>
                </motion.div>
              )}

              {/* Weekly Challenge Section */}
              {weeklyChallenge && (
                <div className="border-t border-purple-400/30 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🏆</span>
                      <span className="text-[0.65rem] sm:text-xs font-bold text-purple-300 uppercase">
                        Weekly Challenge
                      </span>
                    </div>
                    <span className="text-[0.55rem] sm:text-[0.65rem] text-gray-400">
                      Resets in {getTimeUntilReset('weekly')}
                    </span>
                  </div>

                  {renderChallenge(weeklyChallenge, 4)}
                </div>
              )}

              {/* Stats */}
              <div className="mt-3 pt-2 border-t border-gray-600/30 flex justify-between text-[0.55rem] sm:text-[0.65rem] text-gray-400">
                <span>Total Completed: {challengeData.totalChallengesCompleted}</span>
                {challengeData.currentStreak > 0 && (
                  <span className="text-orange-400">
                    🔥 {challengeData.currentStreak} day streak
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Confetti on bonus claim */}
          {bonusClaimed && (
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
      )}
    </AnimatePresence>
  );
}
