import { motion } from 'framer-motion';

interface BossIntroProps {
  wave: number;
}

export default function BossIntro({ wave }: BossIntroProps) {
  return (
    <motion.div 
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-md pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.5, y: 100, opacity: 0 }}
        animate={{ 
          scale: [0.5, 1.2, 1],
          y: [100, -20, 0],
          opacity: [0, 1, 1]
        }}
        transition={{ 
          duration: 1.5,
          times: [0, 0.6, 1],
          ease: "easeOut"
        }}
      >
        <motion.div
          className="text-6xl md:text-8xl font-black font-['Sora'] text-red-500 mb-4"
          style={{ 
            textShadow: '0 0 40px rgba(220, 38, 38, 1), 0 0 80px rgba(220, 38, 38, 0.5)' 
          }}
          animate={{
            textShadow: [
              '0 0 40px rgba(220, 38, 38, 1), 0 0 80px rgba(220, 38, 38, 0.5)',
              '0 0 60px rgba(220, 38, 38, 1), 0 0 120px rgba(220, 38, 38, 0.8)',
              '0 0 40px rgba(220, 38, 38, 1), 0 0 80px rgba(220, 38, 38, 0.5)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          BOSS WAVE
        </motion.div>
        
        <motion.div
          className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] text-cyan-400"
          style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Wave {wave}
        </motion.div>

        <motion.div
          className="mt-8 text-xl text-yellow-400 font-['Space_Grotesk']"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
          transition={{ duration: 3, delay: 1 }}
        >
          Prepare for battle!
        </motion.div>
      </motion.div>

      {/* Warning stripes */}
      <motion.div
        className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent"
        animate={{ x: ['200%', '-100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}