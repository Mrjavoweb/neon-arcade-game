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
    const newParticles = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.3
    }));
    setParticles(newParticles);

    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
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

      {/* Level up banner */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotateZ: -180 }}
        animate={{ scale: 1, rotateZ: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}>

        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 border-4 border-yellow-300 rounded-2xl p-6 shadow-2xl">
          <motion.div
            className="text-center"
            animate={{
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 0.5,
              repeat: 2,
              ease: 'easeInOut'
            }}>

            <div
              className="text-5xl md:text-6xl font-black text-white font-['Sora'] mb-2"
              style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.8)' }}>

              LEVEL UP!
            </div>
            <div className="text-3xl md:text-4xl font-bold text-yellow-900 mb-2">
              Level {level}
            </div>
            <div className="text-lg md:text-xl text-white font-['Space_Grotesk']">
              {upgrade}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Radial burst effect */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8 }}>

        {Array.from({ length: 12 }).map((_, i) =>
        <motion.div
          key={i}
          className="absolute w-1 h-20 bg-gradient-to-b from-yellow-400 to-transparent"
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