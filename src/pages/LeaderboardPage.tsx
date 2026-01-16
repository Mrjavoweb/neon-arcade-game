import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Trophy, Award, Target, Calendar, ArrowLeft, Trash2 } from 'lucide-react';
import StarfieldBackground from '@/components/StarfieldBackground';
import { getLeaderboardManager } from '@/lib/game/leaderboard/LeaderboardManager';
import {
  LeaderboardEntry,
  LeaderboardCategory } from
'@/lib/game/leaderboard/LeaderboardTypes';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('highScores');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const categories = [
  { id: 'highScores' as LeaderboardCategory, label: 'High Scores', icon: Trophy, color: 'text-yellow-400' },
  { id: 'highestWaves' as LeaderboardCategory, label: 'Highest Wave', icon: Target, color: 'text-cyan-400' },
  { id: 'bestCombos' as LeaderboardCategory, label: 'Best Combo', icon: Award, color: 'text-purple-400' }];


  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory]);

  const loadLeaderboard = () => {
    const manager = getLeaderboardManager();
    const data = manager.getLeaderboard(selectedCategory);
    setLeaderboard(data);
  };

  const handleClearLeaderboard = () => {
    const manager = getLeaderboardManager();
    manager.clearLeaderboard();
    loadLeaderboard();
    setShowClearConfirm(false);
  };

  const handleBack = () => {
    const from = (location.state as {from?: string;})?.from || '/';
    navigate(from, { state: { returnedFrom: 'leaderboard' } });
  };

  const getMedalColor = (rank: number) => {
    if (rank === 0) return 'from-yellow-500 to-yellow-600'; // Gold
    if (rank === 1) return 'from-gray-300 to-gray-400'; // Silver
    if (rank === 2) return 'from-orange-600 to-orange-700'; // Bronze
    return 'from-gray-700 to-gray-800';
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  const getValueDisplay = (entry: LeaderboardEntry, category: LeaderboardCategory) => {
    switch (category) {
      case 'highScores':
        return entry.score.toLocaleString();
      case 'highestWaves':
        return `Wave ${entry.wave}`;
      case 'bestCombos':
        return `${entry.maxCombo}x Combo`;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0014]">
      <StarfieldBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center p-4 sm:p-8">
        {/* Header */}
        <motion.div
          className="w-full max-w-4xl mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}>

          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-['Space_Grotesk']">Back</span>
          </button>

          <div className="flex items-center justify-between">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 font-['Sora']">
              Leaderboard
            </h1>

            {leaderboard.length > 0 &&
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border-2 border-red-400/40 rounded-lg text-red-400 hover:bg-red-600/30 transition-all">
                <Trash2 className="w-4 h-4" />
                <span className="font-['Space_Grotesk'] hidden sm:inline">Clear</span>
              </button>
            }
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          className="w-full max-w-4xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>

          <div className="flex gap-2 sm:gap-4 bg-black/40 border-2 border-cyan-400/20 rounded-lg p-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-lg font-['Space_Grotesk'] font-bold transition-all ${
                  isActive ?
                  'bg-gradient-to-br from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/50' :
                  'bg-black/20 text-gray-400 hover:text-white hover:bg-black/40'}`
                  }>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : category.color}`} />
                  <span className="hidden sm:inline">{category.label}</span>
                </button>);

            })}
          </div>
        </motion.div>

        {/* Leaderboard Entries */}
        <motion.div
          className="w-full max-w-4xl space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}>

          {leaderboard.length === 0 ?
          <div className="text-center py-16 bg-black/40 border-2 border-gray-700/40 rounded-xl">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-xl text-gray-400 font-['Space_Grotesk']">
                No entries yet. Play to set your first record!
              </p>
            </div> :

          leaderboard.map((entry, index) =>
          <motion.div
            key={entry.id}
            className={`bg-gradient-to-br ${getMedalColor(index)} border-2 ${
            index < 3 ? 'border-yellow-400/40' : 'border-gray-600/40'} rounded-xl p-4 shadow-lg`
            }
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}>

                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="text-3xl font-black w-12 text-center">
                    {getRankDisplay(index)}
                  </div>

                  {/* Main Value */}
                  <div className="flex-1">
                    <div className="text-2xl font-black text-white font-['Sora']">
                      {getValueDisplay(entry, selectedCategory)}
                    </div>
                    <div className="text-sm text-gray-300 font-['Space_Grotesk'] flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Wave {entry.wave}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {entry.maxCombo}x
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="hidden md:flex items-center gap-2 text-gray-300 font-['Space_Grotesk'] text-sm">
                    <Calendar className="w-4 h-4" />
                    {entry.date}
                  </div>
                </div>
              </motion.div>
          )
          }
        </motion.div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm &&
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
            className="bg-gradient-to-br from-gray-900 to-black border-2 border-red-400/40 rounded-xl p-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}>

              <h3 className="text-2xl font-black text-red-400 mb-4 font-['Sora']">
                Clear Leaderboard?
              </h3>
              <p className="text-gray-300 font-['Space_Grotesk'] mb-6">
                This will permanently delete all your leaderboard entries. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-['Space_Grotesk'] font-bold transition-all">
                  Cancel
                </button>
                <button
                onClick={handleClearLeaderboard}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-['Space_Grotesk'] font-bold transition-all shadow-lg shadow-red-500/50">
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        }
      </div>
    </div>);

}