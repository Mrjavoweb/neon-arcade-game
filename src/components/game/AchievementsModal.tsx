import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Achievement, AchievementProgress } from '@/lib/game/progression/ProgressionTypes';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  progress: AchievementProgress;
}

type FilterType = 'all' | 'unlocked' | 'locked';
type CategoryType = 'all' | 'combat' | 'survival' | 'mastery' | 'collection';

export default function AchievementsModal({ isOpen, onClose, achievements, progress }: AchievementsModalProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryType>('all');

  if (!isOpen) return null;

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    // Filter by unlock status
    if (filter === 'unlocked' && !achievement.unlocked) return false;
    if (filter === 'locked' && achievement.unlocked) return false;

    // Filter by category
    if (category !== 'all' && achievement.category !== category) return false;

    return true;
  });

  // Difficulty color mapping
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':return { bg: 'from-green-500 to-emerald-600', border: 'border-green-400', text: 'text-green-400' };
      case 'medium':return { bg: 'from-blue-500 to-cyan-600', border: 'border-blue-400', text: 'text-blue-400' };
      case 'hard':return { bg: 'from-purple-500 to-pink-600', border: 'border-purple-400', text: 'text-purple-400' };
      case 'extreme':return { bg: 'from-orange-500 to-red-600', border: 'border-red-400', text: 'text-red-400' };
      case 'hidden':return { bg: 'from-yellow-500 via-amber-500 to-orange-500', border: 'border-yellow-400', text: 'text-yellow-400' };
      default:return { bg: 'from-gray-500 to-gray-600', border: 'border-gray-400', text: 'text-gray-400' };
    }
  };

  // Get progress for trackable achievements
  const getProgressValue = (achievement: Achievement): {current: number;target: number;} | null => {
    const req = achievement.requirement;
    let current = 0;

    switch (req.type) {
      case 'kills':
        current = progress.totalKills;
        break;
      case 'bosses':
        current = progress.bossesDefeated;
        break;
      case 'waves':
        current = progress.maxWaveReached;
        break;
      case 'combo':
        current = progress.maxComboReached;
        break;
      case 'score':
        current = progress.highestScore;
        break;
      case 'powerups':
        current = progress.powerUpsCollected;
        break;
      case 'level':
        current = progress.maxLevel;
        break;
      case 'games':
        current = progress.gamesPlayed;
        break;
      case 'perfect_waves':
        current = progress.perfectWaves;
        break;
      case 'custom':
        // Handle custom achievements
        if (achievement.id === 'clutch_master') current = progress.clutchWins;else
        if (achievement.id === 'perfect_boss') current = progress.perfectBosses;else
        if (achievement.id === 'shield_master') current = progress.shieldsUsed;else
        if (achievement.id === 'plasma_expert') current = progress.plasmaUsed;else
        if (achievement.id === 'rapid_master') current = progress.rapidUsed;else
        if (achievement.id === 'slowmo_expert') current = progress.slowmoUsed;else
        return null;
        break;
      default:
        return null;
    }

    return { current: Math.min(current, req.target), target: req.target };
  };

  // Stats summary
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercent = Math.round(unlockedCount / totalCount * 100);
  const totalStardust = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + (a.rewards.stardust || 0), 0);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}>

        <motion.div
          className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 border-2 border-cyan-400 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{ boxShadow: '0 0 40px rgba(34, 211, 238, 0.5)' }}>

          {/* Header */}
          <div className="bg-black/30 border-b border-cyan-400/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-3xl font-black text-cyan-400 font-['Sora']"
                style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>
                Achievements
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-cyan-400 text-2xl font-bold transition-colors">
                ✕
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-black/40 rounded-lg p-3 border border-cyan-400/30">
                <div className="text-cyan-400 text-xs font-bold font-['Space_Grotesk']">COMPLETION</div>
                <div className="text-white text-2xl font-black">{completionPercent}%</div>
                <div className="text-cyan-200/70 text-xs">{unlockedCount}/{totalCount} unlocked</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 border border-yellow-400/30">
                <div className="text-yellow-400 text-xs font-bold font-['Space_Grotesk']">STARDUST</div>
                <div className="text-white text-2xl font-black">💎 {totalStardust}</div>
                <div className="text-yellow-200/70 text-xs">Total earned</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 border border-purple-400/30">
                <div className="text-purple-400 text-xs font-bold font-['Space_Grotesk']">RAREST</div>
                <div className="text-white text-2xl font-black">{achievements.filter((a) => a.difficulty === 'extreme' && a.unlocked).length}</div>
                <div className="text-purple-200/70 text-xs">Extreme cleared</div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              {/* Status Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all font-['Space_Grotesk'] ${
                  filter === 'all' ?
                  'bg-cyan-500 text-black' :
                  'bg-black/40 text-white border border-cyan-400/30 hover:bg-cyan-500/20'}`
                  }>
                  All
                </button>
                <button
                  onClick={() => setFilter('unlocked')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all font-['Space_Grotesk'] ${
                  filter === 'unlocked' ?
                  'bg-green-500 text-black' :
                  'bg-black/40 text-white border border-green-400/30 hover:bg-green-500/20'}`
                  }>
                  Unlocked
                </button>
                <button
                  onClick={() => setFilter('locked')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all font-['Space_Grotesk'] ${
                  filter === 'locked' ?
                  'bg-gray-500 text-black' :
                  'bg-black/40 text-white border border-gray-400/30 hover:bg-gray-500/20'}`
                  }>
                  Locked
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCategory('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all font-['Space_Grotesk'] ${
                  category === 'all' ?
                  'bg-purple-500 text-black' :
                  'bg-black/40 text-white border border-purple-400/30 hover:bg-purple-500/20'}`
                  }>
                  All Categories
                </button>
                <button
                  onClick={() => setCategory('combat')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all font-['Space_Grotesk'] ${
                  category === 'combat' ?
                  'bg-red-500 text-black' :
                  'bg-black/40 text-white border border-red-400/30 hover:bg-red-500/20'}`
                  }>
                  ⚔️ Combat
                </button>
                <button
                  onClick={() => setCategory('survival')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all font-['Space_Grotesk'] ${
                  category === 'survival' ?
                  'bg-blue-500 text-black' :
                  'bg-black/40 text-white border border-blue-400/30 hover:bg-blue-500/20'}`
                  }>
                  🛡️ Survival
                </button>
                <button
                  onClick={() => setCategory('mastery')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all font-['Space_Grotesk'] ${
                  category === 'mastery' ?
                  'bg-yellow-500 text-black' :
                  'bg-black/40 text-white border border-yellow-400/30 hover:bg-yellow-500/20'}`
                  }>
                  👑 Mastery
                </button>
                <button
                  onClick={() => setCategory('collection')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all font-['Space_Grotesk'] ${
                  category === 'collection' ?
                  'bg-green-500 text-black' :
                  'bg-black/40 text-white border border-green-400/30 hover:bg-green-500/20'}`
                  }>
                  ⚡ Collection
                </button>
              </div>
            </div>
          </div>

          {/* Achievement Grid */}
          <div className="overflow-y-auto max-h-[calc(90vh-320px)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAchievements.map((achievement) => {
                const colors = getDifficultyColor(achievement.difficulty);
                const progressData = getProgressValue(achievement);
                const isLocked = !achievement.unlocked;

                return (
                  <motion.div
                    key={achievement.id}
                    className={`bg-black/40 rounded-lg p-4 border-2 ${colors.border} ${
                    isLocked ? 'opacity-60' : ''}`
                    }
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isLocked ? 0.6 : 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      boxShadow: isLocked ? 'none' : `0 0 15px ${colors.border.replace('border-', 'rgba(').replace('-400', ', 0.3)')}`
                    }}>

                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`text-4xl flex-shrink-0 ${isLocked ? 'grayscale' : ''}`}>
                        {isLocked && achievement.name === '???' ? '🔒' : achievement.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Name & Difficulty */}
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-black text-sm font-['Sora'] ${colors.text}`}>
                            {achievement.name}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded bg-gradient-to-r ${colors.bg} text-white font-bold`}>
                            {achievement.difficulty.toUpperCase()}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-white/80 mb-2 font-['Space_Grotesk']">
                          {achievement.description}
                        </p>

                        {/* Progress Bar (if not unlocked and trackable) */}
                        {!achievement.unlocked && progressData &&
                        <div className="mb-2">
                            <div className="flex justify-between text-xs text-white/60 mb-1">
                              <span>Progress</span>
                              <span>{progressData.current}/{progressData.target}</span>
                            </div>
                            <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                              <div
                              className={`h-full bg-gradient-to-r ${colors.bg} transition-all duration-300`}
                              style={{ width: `${progressData.current / progressData.target * 100}%` }} />

                            </div>
                          </div>
                        }

                        {/* Rewards */}
                        <div className="flex items-center gap-2 text-xs font-bold">
                          {achievement.rewards.stardust &&
                          <span className="text-yellow-400">💎 +{achievement.rewards.stardust}</span>
                          }
                          {achievement.rewards.lives &&
                          <span className="text-red-400">❤️ +{achievement.rewards.lives}</span>
                          }
                          {achievement.rewards.maxHealth &&
                          <span className="text-green-400">💪 +{achievement.rewards.maxHealth}</span>
                          }
                        </div>

                        {/* Unlock Date */}
                        {achievement.unlocked && achievement.unlockedDate &&
                        <div className="text-xs text-cyan-300/60 mt-1 font-['Space_Grotesk']">
                            Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}
                          </div>
                        }
                      </div>
                    </div>
                  </motion.div>);

              })}
            </div>

            {/* Empty State */}
            {filteredAchievements.length === 0 &&
            <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-white/60 font-['Space_Grotesk']">
                  No achievements found with current filters
                </div>
              </div>
            }
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>);

}