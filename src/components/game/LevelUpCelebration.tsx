import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LevelUpCelebrationProps {
  level: number;
  upgrade: string;
  onComplete: () => void;
}

export default function LevelUpCelebration({ level, upgrade, onComplete }: LevelUpCelebrationProps) {
  const [particles, setParticles] = useState<Array<{x: number;y: number;delay: number;}>>([]);


  useEffect(() => {
    // Generate random particle positions
    const newParticles = Array.from({ length: 15 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.3
    }));
    setParticles(newParticles);

    // Auto-dismiss after 1 second
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="absolute inset-0 z-30 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}>

      {/* Screen flash */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-purple-500/30 to-cyan-400/30"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }} />


      {/* Particles */}
      {particles.map((particle, i) =>
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-yellow-400"
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          boxShadow: '0 0 10px rgba(251, 191, 36, 0.8)'
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0],
          y: [0, -50]
        }}
        transition={{
          duration: 1,
          delay: particle.delay,
          ease: 'easeOut'
        }} />

      )}

      {/* Level up banner - Compact, top-center over combo scores */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
        initial={{ scale: 0, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}>

        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 border-2 border-yellow-300 rounded-lg px-4 py-1.5 shadow-xl">
          <motion.div
            className="text-center"
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 0.3,
              repeat: 1,
              ease: 'easeInOut'
            }}>

            <div
              className="text-base font-black text-white font-['Sora'] inline"
              style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.8)' }}>

              LEVEL {level}
            </div>
            <span className="text-sm text-yellow-900 ml-2 font-['Space_Grotesk']">
              {upgrade}
            </span>

          </motion.div>
        </div>
      </motion.div>

      {/* Radial burst effect */}
      <motion.div
        className="absolute top-4 right-4 z-0 flex items-center justify-center w-48 h-48"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8 }}>

        {Array.from({ length: 12 }).map((_, i) =>
        <motion.div
          key={i}
          className="absolute w-1 h-16 bg-gradient-to-b from-yellow-400 to-transparent"
          style={{
            transformOrigin: 'center',
            rotate: `${i * 30}deg`
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: [0, 1, 0] }}
          transition={{
            duration: 0.6,
            delay: i * 0.03,
            ease: 'easeOut'
          }} />

        )}
      </motion.div>
    </motion.div>);

}