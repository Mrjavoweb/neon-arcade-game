import { useNavigate, useLocation } from 'react-router-dom';
import { useGameEngine } from '@/contexts/GameEngineContext';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, Lock } from 'lucide-react';
import { GameEngine } from '@/lib/game/GameEngine';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rewards: {
    stardust?: number;
    lives?: number;
    maxHealth?: number;
  };
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  category: 'combat' | 'survival' | 'mastery' | 'collection' | 'special';
}

interface AchievementProgress {
  totalAchievements: number;
  unlockedAchievements: number;
  totalStardust: number;
  categories: Record<string, { total: number; unlocked: number }>;
}

export default function AchievementsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { engine: contextEngine, setEngine } = useGameEngine();
  const [localEngine, setLocalEngine] = useState<GameEngine | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress>({
    totalAchievements: 0,
    unlockedAchievements: 0,
    totalStardust: 0,
    categories: {}
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'combat' | 'survival' | 'mastery' | 'collection' | 'special'>('all');

  // Use context engine if available, otherwise local engine
  const engine = contextEngine || localEngine;

  // Get return path from location state, default to /game
  const returnPath = (location.state as { from?: string })?.from || '/game';

  // Initialize local engine if context engine doesn't exist
  useEffect(() => {
    if (!contextEngine && !localEngine) {
      console.log('🏆 AchievementsPage: Creating local engine instance');
      const tempCanvas = document.createElement('canvas');
      const newEngine = new GameEngine(tempCanvas, false);
      setLocalEngine(newEngine);
      // Also try to set it in context for persistence
      setEngine(newEngine);
    }
  }, [contextEngine, localEngine, setEngine]);

  useEffect(() => {
    if (engine) {
      const achievementsData = engine.achievementManager.getAllAchievements();
      const progressData = engine.achievementManager.getProgress();

      setAchievements(achievementsData);
      setProgress({
        totalAchievements: progressData.totalAchievements || 0,
        unlockedAchievements: progressData.unlockedAchievements || 0,
        totalStardust: progressData.totalStardust || 0,
        categories: progressData.categories || {}
      });
    }
  }, [engine]);

  const handleBack = () => {
    navigate(returnPath, { state: { returnedFrom: 'achievements' } });
  };

  if (!engine) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0014] to-[#1a0a2e] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    const statusMatch =
      filterStatus === 'all' ||
      (filterStatus === 'unlocked' && achievement.isUnlocked) ||
      (filterStatus === 'locked' && !achievement.isUnlocked);

    const categoryMatch = filterCategory === 'all' || achievement.category === filterCategory;

    return statusMatch && categoryMatch;
  });

  // Difficulty colors
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'from-green-500 to-emerald-600';
      case 'medium':
        return 'from-blue-500 to-cyan-600';
      case 'hard':
        return 'from-purple-500 to-pink-600';
      case 'extreme':
        return 'from-orange-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Category icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'combat':
        return '⚔️';
      case 'survival':
        return '🛡️';
      case 'mastery':
        return '👑';
      case 'collection':
        return '📦';
      case 'special':
        return '⭐';
      default:
        return '🏆';
    }
  };

  const completionPercent = progress.totalAchievements > 0
    ? Math.round((progress.unlockedAchievements / progress.totalAchievements) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0014] to-[#1a0a2e] text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-yellow-400/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600/60 to-orange-600/60 hover:from-yellow-500/70 hover:to-orange-500/70 border-2 border-yellow-400/60 rounded-lg transition-all font-['Space_Grotesk'] font-bold shadow-lg shadow-yellow-500/30">
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Game</span>
            </button>

            <h1
              className="text-3xl md:text-4xl font-black font-['Sora'] text-yellow-400"
              style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.8)' }}>
              🏆 ACHIEVEMENTS
            </h1>

            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-400/40 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div className="text-right">
                <div className="text-xs text-yellow-300 font-['Space_Grotesk']">Progress</div>
                <div className="text-xl font-bold text-yellow-200">
                  {progress.unlockedAchievements}/{progress.totalAchievements}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-400/40 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">🏆</div>
              <div>
                <div className="text-sm text-yellow-300 font-['Space_Grotesk']">Completion</div>
                <div className="text-3xl font-bold text-yellow-400">{completionPercent}%</div>
              </div>
            </div>
            <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                style={{ width: `${completionPercent}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-400/40 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">💎</div>
              <div>
                <div className="text-sm text-purple-300 font-['Space_Grotesk']">Total Stardust Earned</div>
                <div className="text-3xl font-bold text-purple-200">{progress.totalStardust.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-orange-400/40 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⭐</div>
              <div>
                <div className="text-sm text-orange-300 font-['Space_Grotesk']">Extreme Achievements</div>
                <div className="text-3xl font-bold text-orange-200">
                  {achievements.filter((a) => a.difficulty === 'extreme' && a.isUnlocked).length}/
                  {achievements.filter((a) => a.difficulty === 'extreme').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-bold transition-all font-['Space_Grotesk'] ${
                filterStatus === 'all'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
              }`}>
              All
            </button>
            <button
              onClick={() => setFilterStatus('unlocked')}
              className={`px-4 py-2 rounded-lg font-bold transition-all font-['Space_Grotesk'] ${
                filterStatus === 'unlocked'
                  ? 'bg-green-500 text-black'
                  : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
              }`}>
              Unlocked
            </button>
            <button
              onClick={() => setFilterStatus('locked')}
              className={`px-4 py-2 rounded-lg font-bold transition-all font-['Space_Grotesk'] ${
                filterStatus === 'locked'
                  ? 'bg-gray-500 text-black'
                  : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
              }`}>
              Locked
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['all', 'combat', 'survival', 'mastery', 'collection', 'special'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat as typeof filterCategory)}
                className={`px-4 py-2 rounded-lg font-bold transition-all font-['Space_Grotesk'] ${
                  filterCategory === cat
                    ? 'bg-cyan-500 text-black'
                    : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                }`}>
                {cat === 'all' ? 'All' : getCategoryIcon(cat) + ' ' + cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => {
            const difficultyColor = getDifficultyColor(achievement.difficulty);

            return (
              <motion.div
                key={achievement.id}
                className={`bg-gradient-to-br rounded-xl p-5 border-2 transition-all ${
                  achievement.isUnlocked
                    ? 'from-yellow-900/40 to-orange-900/40 border-yellow-400/60'
                    : 'from-gray-900/40 to-gray-800/40 border-gray-600/40'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}>

                <div className="flex items-start gap-3 mb-3">
                  {/* Icon */}
                  <div
                    className={`text-4xl ${achievement.isUnlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.isUnlocked ? achievement.icon : <Lock className="w-10 h-10 text-gray-500" />}
                  </div>

                  {/* Name and Difficulty */}
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-bold mb-1 font-['Sora'] ${
                        achievement.isUnlocked ? 'text-yellow-300' : 'text-gray-400'
                      }`}>
                      {achievement.name}
                    </h3>
                    <div
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r ${difficultyColor} text-white`}>
                      {achievement.difficulty.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-sm mb-3 font-['Space_Grotesk'] ${
                    achievement.isUnlocked ? 'text-cyan-200' : 'text-gray-500'
                  }`}>
                  {achievement.description}
                </p>

                {/* Progress Bar (for locked achievements) */}
                {!achievement.isUnlocked && achievement.progress && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>
                        {achievement.progress.current}/{achievement.progress.target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{
                          width: `${Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Rewards */}
                <div className="flex items-center gap-3 flex-wrap">
                  {achievement.rewards.stardust && (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        achievement.isUnlocked ? 'bg-purple-500/30' : 'bg-gray-700/50'
                      }`}>
                      <span>💎</span>
                      <span className="text-sm font-bold">+{achievement.rewards.stardust}</span>
                    </div>
                  )}
                  {achievement.rewards.lives && (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        achievement.isUnlocked ? 'bg-red-500/30' : 'bg-gray-700/50'
                      }`}>
                      <span>❤️</span>
                      <span className="text-sm font-bold">+{achievement.rewards.lives}</span>
                    </div>
                  )}
                  {achievement.rewards.maxHealth && (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        achievement.isUnlocked ? 'bg-yellow-500/30' : 'bg-gray-700/50'
                      }`}>
                      <span>💪</span>
                      <span className="text-sm font-bold">+{achievement.rewards.maxHealth}</span>
                    </div>
                  )}
                </div>

                {/* Unlock date */}
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div className="mt-3 pt-3 border-t border-yellow-400/20">
                    <p className="text-xs text-yellow-300/60 font-['Space_Grotesk']">
                      Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-400 font-['Space_Grotesk']">No achievements found with current filters</p>
          </div>
        )}

        {/* Bottom Back Button */}
        <div className="mt-8 mb-8 text-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600/60 to-orange-600/60 hover:from-yellow-500/70 hover:to-orange-500/70 border-2 border-yellow-400/60 rounded-lg transition-all font-['Space_Grotesk'] font-bold shadow-lg shadow-yellow-500/30 mx-auto">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Game</span>
          </button>
        </div>
      </div>
    </div>
  );
}
