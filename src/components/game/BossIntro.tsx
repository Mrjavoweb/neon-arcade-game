import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface BossIntroProps {
  wave: number;
  show: boolean;
}

export default function BossIntro({ wave, show }: BossIntroProps) {
  if (!show) return null;

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>

      <motion.div
        className="text-center"
        initial={{ scale: 0.5, y: 50, opacity: 0 }}
        animate={{
          scale: [0.5, 1.1, 1, 1, 0.8],
          y: [50, -10, 0, 0, -20],
          opacity: [0, 1, 1, 1, 0]
        }}
        transition={{
          duration: 1.8,
          times: [0, 0.3, 0.5, 0.8, 1],
          ease: "easeOut"
        }}>

        <motion.div
          className="text-5xl md:text-7xl font-black font-['Sora'] text-red-500 mb-4"
          style={{
            textShadow: '0 0 40px rgba(220, 38, 38, 1), 0 0 80px rgba(220, 38, 38, 0.5)',
            filter: 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.8))'
          }}>
          BOSS WAVE
        </motion.div>
        
        <motion.div
          className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-cyan-400"
          style={{
            textShadow: '0 0 20px rgba(34, 211, 238, 0.8)',
            filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.6))'
          }}>
          Wave {wave}
        </motion.div>
      </motion.div>

      {/* Warning stripes - slightly transparent */}
      <motion.div
        className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500/70 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />

      <motion.div
        className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500/70 to-transparent"
        animate={{ x: ['200%', '-100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />

    </motion.div>);

}