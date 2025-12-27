import { motion, AnimatePresence } from 'framer-motion';

interface BossIntroProps {
  wave: number;
  onSkip?: () => void;
}

export default function BossIntro({ wave, onSkip }: BossIntroProps) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onSkip}>

      <motion.div
        className="text-center"
        initial={{ scale: 0.5, y: 50, opacity: 0 }}
        animate={{
          scale: [0.5, 1.1, 1],
          y: [50, -10, 0],
          opacity: [0, 1, 1]
        }}
        transition={{
          duration: 0.8,
          times: [0, 0.6, 1],
          ease: "easeOut"
        }}>

        <motion.div
          className="text-5xl md:text-7xl font-black font-['Sora'] text-red-500 mb-4"
          style={{
            textShadow: '0 0 40px rgba(220, 38, 38, 1), 0 0 80px rgba(220, 38, 38, 0.5)'
          }}
          animate={{
            textShadow: [
            '0 0 40px rgba(220, 38, 38, 1), 0 0 80px rgba(220, 38, 38, 0.5)',
            '0 0 60px rgba(220, 38, 38, 1), 0 0 120px rgba(220, 38, 38, 0.8)',
            '0 0 40px rgba(220, 38, 38, 1), 0 0 80px rgba(220, 38, 38, 0.5)']

          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}>

          BOSS WAVE
        </motion.div>
        
        <motion.div
          className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-cyan-400"
          style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}>

          Wave {wave}
        </motion.div>

        <motion.div
          className="mt-6 text-sm md:text-base text-yellow-400/80 font-['Space_Grotesk']"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}>

          Click/Tap to continue
        </motion.div>
      </motion.div>

      {/* Warning stripes */}
      <motion.div
        className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />

      <motion.div
        className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent"
        animate={{ x: ['200%', '-100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />

    </motion.div>);

}