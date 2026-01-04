import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LandscapePromptProps {
  isVisible: boolean;
  onLandscapeReady?: () => void;
}

export default function LandscapePrompt({ isVisible, onLandscapeReady }: LandscapePromptProps) {
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);

  // Detect orientation change
  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);

      // Show fullscreen prompt when switching to landscape
      if (landscape && isVisible) {
        setShowFullscreenPrompt(true);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isVisible]);

  const requestFullscreen = async () => {
    try {
      const elem = document.documentElement;

      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }

      // Hide prompt and notify parent
      setShowFullscreenPrompt(false);
      if (onLandscapeReady) {
        onLandscapeReady();
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
      setFullscreenError('Could not enter fullscreen');
      setTimeout(() => setFullscreenError(null), 3000);
    }
  };

  const skipFullscreen = () => {
    setShowFullscreenPrompt(false);
    if (onLandscapeReady) {
      onLandscapeReady();
    }
  };

  if (!isVisible) return null;

  // Show fullscreen prompt when in landscape mode
  if (isLandscape && showFullscreenPrompt) {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Fullscreen Icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-8"
        >
          <Maximize2
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
        >
          Fullscreen Mode
        </motion.h1>

        {/* Description */}
        <p
          className="text-lg sm:text-xl text-cyan-300 text-center max-w-md mb-8"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            textShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
          }}
        >
          For the best gaming experience, switch to fullscreen mode
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
            onClick={requestFullscreen}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-all flex items-center gap-3 shadow-lg"
            style={{
              fontFamily: "'Sora', sans-serif",
              boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Maximize2 className="w-6 h-6" />
            <span>Enter Fullscreen</span>
          </motion.button>

          <motion.button
            onClick={skipFullscreen}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
            style={{
              fontFamily: "'Sora', sans-serif"
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Skip
          </motion.button>
        </div>

        {/* Error Message */}
        {fullscreenError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-4 py-2 bg-red-500/20 border border-red-400 rounded-lg text-red-300 text-sm"
          >
            {fullscreenError}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Show portrait rotation prompt (no fullscreen button)
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
