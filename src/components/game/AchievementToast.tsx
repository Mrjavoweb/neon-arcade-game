import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface AchievementToastProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
    rewards: {
      stardust?: number;
      lives?: number;
      maxHealth?: number;
    };
    difficulty: string;
  };
  onComplete: () => void;
}

export default function AchievementToast({ achievement, onComplete }: AchievementToastProps) {
  useEffect(() => {
    // Auto-dismiss after 2.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Difficulty color mapping
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':return 'from-green-500 to-emerald-600';
      case 'medium':return 'from-blue-500 to-cyan-600';
      case 'hard':return 'from-purple-500 to-pink-600';
      case 'extreme':return 'from-orange-500 to-red-600';
      case 'hidden':return 'from-yellow-500 via-amber-500 to-orange-500';
      default:return 'from-gray-500 to-gray-600';
    }
  };

  const difficultyColor = getDifficultyColor(achievement.difficulty);

  return (
    <motion.div
      className="pointer-events-none"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}>

      <div className={`bg-gradient-to-r ${difficultyColor} border border-white/30 rounded-md px-2 py-1 shadow-lg flex items-center gap-1.5`}
      style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>

        {/* Icon */}
        <span className="text-lg flex-shrink-0">{achievement.icon}</span>

        {/* Name and Rewards in single line */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-white whitespace-nowrap">
          <span className="font-['Sora']" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}>
            {achievement.name}
          </span>
          {achievement.rewards.stardust && <span>💎+{achievement.rewards.stardust}</span>}
          {achievement.rewards.lives && <span>❤️+{achievement.rewards.lives}</span>}
          {achievement.rewards.maxHealth && <span>💪+{achievement.rewards.maxHealth}</span>}
        </div>
      </div>

      {/* Particle burst effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1, delay: 0.2 }}>

        {Array.from({ length: 12 }).map((_, i) =>
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-yellow-300"
          style={{
            transformOrigin: 'center',
            left: '50%',
            top: '50%'
          }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos(i / 12 * Math.PI * 2) * 80,
            y: Math.sin(i / 12 * Math.PI * 2) * 80
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.02,
            ease: 'easeOut'
          }} />

        )}
      </motion.div>
    </motion.div>);

}