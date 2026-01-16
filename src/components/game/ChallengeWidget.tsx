import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Challenge, ChallengeData } from '@/lib/game/progression/ProgressionTypes';
import { GameEngine } from '@/lib/game/GameEngine';

interface ChallengeWidgetProps {
  onViewAll: () => void;
  engine: GameEngine | null;
}

export default function ChallengeWidget({ onViewAll, engine }: ChallengeWidgetProps) {
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let engineRef = engine;

    // Load challenge data when engine becomes available
    const loadData = (eng?: GameEngine | null) => {
      const targetEngine = eng || engineRef;
      if (targetEngine?.challengeManager && mounted) {
        const data = targetEngine.challengeManager.getChallengeData();
        setChallengeData(data);
        setIsLoading(false);
        return true;
      }
      return false;
    };

    // Try to load immediately
    if (!loadData()) {
      // If not available, retry a few times with short delays
      const retryIntervals = [100, 300, 500, 1000, 2000];
      let retryIndex = 0;

      const retry = () => {
        if (!mounted) return;
        if (retryIndex < retryIntervals.length && !loadData()) {
          retryTimeoutId = setTimeout(retry, retryIntervals[retryIndex]);
          retryIndex++;
        }
      };

      retryTimeoutId = setTimeout(retry, retryIntervals[0]);
    }

    // Listen for engine-ready event as a backup (handles race conditions)
    const handleEngineReady = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.engine && mounted) {
        engineRef = customEvent.detail.engine;
        loadData(customEvent.detail.engine);
      }
    };

    // Listen for challenge progress updates
    const handleProgress = () => {
      if (engineRef?.challengeManager && mounted) {
        setChallengeData(engineRef.challengeManager.getChallengeData());
      }
    };

    window.addEventListener('engine-ready', handleEngineReady);
    window.addEventListener('challenge-progress', handleProgress);
    window.addEventListener('challenge-completed', handleProgress);

    return () => {
      mounted = false;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      window.removeEventListener('engine-ready', handleEngineReady);
      window.removeEventListener('challenge-progress', handleProgress);
      window.removeEventListener('challenge-completed', handleProgress);
    };
  }, [engine]);

  // Show loading state or fallback when no data
  if (!challengeData) {
    return (
      <motion.div
        className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-cyan-400/30 rounded-xl p-3 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-base">🎯</span>
          <h3 className="text-xs font-bold text-white font-['Sora']">DAILY CHALLENGES</h3>
        </div>
        <div className="text-[0.65rem] text-gray-400 text-center py-2">
          {isLoading ? 'Loading challenges...' : 'Challenges unavailable'}
        </div>
      </motion.div>
    );
  }

  const dailyChallenges = challengeData.dailyChallenges;
  const weeklyChallenge = challengeData.weeklyChallenge;
  const allDailyCompleted = challengeData.allDailyCompleted;
  const canClaimBonus = allDailyCompleted && !challengeData.dailyBonusClaimed;

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'from-green-500 to-emerald-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'hard': return 'from-red-500 to-pink-500';
      case 'weekly': return 'from-purple-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getDifficultyIcon = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '⭐';
      case 'medium': return '⭐⭐';
      case 'hard': return '⭐⭐⭐';
      case 'weekly': return '🏆';
      default: return '📋';
    }
  };

  const renderChallenge = (challenge: Challenge, index: number) => {
    const progress = Math.min(100, (challenge.current / challenge.target) * 100);
    const isComplete = challenge.completed;

    return (
      <motion.div
        key={challenge.id}
        className={`p-1.5 rounded-lg border ${
          isComplete
            ? 'bg-green-500/20 border-green-400/50'
            : 'bg-black/30 border-gray-600/30'
        }`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[0.6rem]">{getDifficultyIcon(challenge.difficulty)}</span>
            <span className={`text-[0.55rem] font-bold uppercase ${
              isComplete ? 'text-green-300' : 'text-gray-300'
            }`}>
              {challenge.difficulty}
            </span>
          </div>
          <span className={`text-[0.55rem] font-bold ${
            isComplete ? 'text-green-400' : 'text-cyan-400'
          }`}>
            {isComplete ? '✓' : `+${challenge.reward} 💎`}
          </span>
        </div>

        <div className={`text-[0.55rem] mb-0.5 ${
          isComplete ? 'text-green-200 line-through' : 'text-white'
        }`}>
          {challenge.description}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${getDifficultyColor(challenge.difficulty)}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          />
        </div>
        <div className="text-[0.5rem] text-gray-400 mt-0.5 text-right">
          {challenge.current}/{challenge.target}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-cyan-400/30 rounded-xl p-2 w-full landscape:max-h-[70vh] landscape:overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🎯</span>
          <h3 className="text-xs font-bold text-white font-['Sora']"
              style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.6)' }}>
            DAILY CHALLENGES
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-[0.55rem] text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
        >
          VIEW ALL →
        </button>
      </div>

      {/* Daily Challenges */}
      <div className="space-y-1 mb-2">
        {dailyChallenges.map((challenge, index) => renderChallenge(challenge, index))}
      </div>

      {/* Daily Bonus Indicator */}
      {canClaimBonus && (
        <motion.div
          className="p-1.5 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400/50 rounded-lg mb-2"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.6rem] text-yellow-300 font-bold">
              🎁 DAILY BONUS READY!
            </span>
            <span className="text-[0.6rem] text-yellow-400 font-bold">
              +300 💎
            </span>
          </div>
        </motion.div>
      )}

      {/* Weekly Challenge Preview */}
      {weeklyChallenge && (
        <div className="border-t border-purple-400/30 pt-1.5">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm">🏆</span>
            <span className="text-[0.6rem] font-bold text-purple-300 uppercase">
              Weekly Challenge
            </span>
          </div>
          {renderChallenge(weeklyChallenge, 3)}
        </div>
      )}

      {/* Streak Display */}
      {challengeData.currentStreak > 0 && (
        <div className="mt-1.5 text-center">
          <span className="text-[0.55rem] text-orange-400">
            🔥 {challengeData.currentStreak} day streak
          </span>
        </div>
      )}
    </motion.div>
  );
}
