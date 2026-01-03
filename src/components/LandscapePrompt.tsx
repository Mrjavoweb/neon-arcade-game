import { motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';

interface LandscapePromptProps {
  isVisible: boolean;
}

export default function LandscapePrompt({ isVisible }: LandscapePromptProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated rotate icon */}
      <motion.div
        animate={{
          rotate: [0, -90, -90, 0],
          scale: [1, 1.2, 1.2, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-8"
      >
        <RotateCw
          className="w-24 h-24 sm:w-32 sm:h-32 text-cyan-400"
          style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.8))' }}
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-4"
        style={{
          fontFamily: "'Sora', sans-serif",
          background: 'linear-gradient(180deg, #22d3ee 0%, #3b82f6 50%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 40px rgba(34, 211, 238, 0.5)',
          filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.6))'
        }}
        animate={{
          filter: [
            'drop-shadow(0 0 20px rgba(34, 211, 238, 0.6))',
            'drop-shadow(0 0 30px rgba(34, 211, 238, 0.9))',
            'drop-shadow(0 0 20px rgba(34, 211, 238, 0.6))'
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        Rotate Your Device
      </motion.h1>

      {/* Description */}
      <p
        className="text-lg sm:text-xl text-cyan-300 text-center max-w-md mb-6"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          textShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
        }}
      >
        Please rotate your device to landscape mode for the best gaming experience
      </p>

      {/* Visual device illustration */}
      <div className="flex gap-4 items-center">
        {/* Phone in portrait (crossed out) */}
        <div className="relative">
          <div
            className="w-16 h-24 border-4 border-red-400 rounded-lg opacity-50"
            style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-1 bg-red-400 rotate-45" style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))' }} />
          </div>
        </div>

        {/* Arrow */}
        <div className="text-cyan-400 text-3xl font-bold">→</div>

        {/* Phone in landscape (checkmark) */}
        <div className="relative">
          <div
            className="w-24 h-16 border-4 border-green-400 rounded-lg"
            style={{ boxShadow: '0 0 15px rgba(74, 222, 128, 0.6)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-green-400 text-3xl font-bold">
            ✓
          </div>
        </div>
      </div>

      {/* Pulsing hint */}
      <motion.p
        className="text-sm text-gray-400 text-center mt-8"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Turn your device sideways to continue
      </motion.p>
    </motion.div>
  );
}
