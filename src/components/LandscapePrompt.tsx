import { motion } from 'framer-motion';
import { RotateCw, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LandscapePromptProps {
  isVisible: boolean;
  onLandscapeReady?: () => void;
}

export default function LandscapePrompt({ isVisible, onLandscapeReady }: LandscapePromptProps) {
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [hasRequestedOrientation, setHasRequestedOrientation] = useState(false);

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const switchToLandscapeAndFullscreen = async () => {
    try {
      setHasRequestedOrientation(true);

      // Try to lock to landscape orientation first
      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape');
        } catch (orientError) {
          console.log('Orientation lock requires fullscreen first');
        }
      }

      // Request fullscreen
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

      // Try orientation lock again after fullscreen
      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape');
        } catch (orientError) {
          console.log('Could not lock orientation:', orientError);
        }
      }

      // Notify parent
      if (onLandscapeReady) {
        onLandscapeReady();
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
      setFullscreenError('Please rotate device and tap again');
      setTimeout(() => setFullscreenError(null), 3000);
      setHasRequestedOrientation(false);
    }
  };

  const enterFullscreen = async () => {
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

      // Try to lock orientation to landscape
      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape');
        } catch (err) {
          console.log('Could not lock orientation');
        }
      }

      // Notify parent
      if (onLandscapeReady) {
        onLandscapeReady();
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
      setFullscreenError('Please tap the button to continue');
      setTimeout(() => setFullscreenError(null), 3000);
    }
  };

  if (!isVisible) return null;

  // Already in landscape - just need fullscreen
  if (isLandscape) {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}>

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
          className="mb-8">

          <Maximize2
            className="w-24 h-24 sm:w-32 sm:h-32 text-cyan-400"
            style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.8))' }} />

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
          }}>

          Fullscreen Mode
        </motion.h1>

        {/* Description */}
        <p
          className="text-lg sm:text-xl text-cyan-300 text-center max-w-md mb-8"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            textShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
          }}>

          This game is best played in fullscreen
        </p>

        {/* Single Button */}
        <motion.button
          onClick={enterFullscreen}
          className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xl font-bold rounded-lg transition-all flex items-center gap-3 shadow-lg"
          style={{
            fontFamily: "'Sora', sans-serif",
            boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>

          <Maximize2 className="w-8 h-8" />
          <span>Click for Fullscreen</span>
        </motion.button>

        {/* Error Message */}
        {fullscreenError &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-4 py-2 bg-red-500/20 border border-red-400 rounded-lg text-red-300 text-sm">

            {fullscreenError}
          </motion.div>
        }
      </motion.div>);

  }

  // Portrait mode - need to rotate to landscape AND fullscreen
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}>

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
        className="mb-8">

        <RotateCw
          className="w-24 h-24 sm:w-32 sm:h-32 text-cyan-400"
          style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.8))' }} />

      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-6"
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
          'drop-shadow(0 0 20px rgba(34, 211, 238, 0.6))']

        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}>

        This game is best played in
        <br />
        Landscape Fullscreen view
      </motion.h1>

      {/* Button to switch to landscape and fullscreen */}
      <motion.button
        onClick={switchToLandscapeAndFullscreen}
        className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg font-bold rounded-lg transition-all flex items-center gap-3 shadow-lg"
        style={{
          fontFamily: "'Sora', sans-serif",
          boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}>

        <RotateCw className="w-7 h-7" />
        <span>Click here for Landscape View</span>
      </motion.button>

      {/* Error Message */}
      {fullscreenError &&
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 px-4 py-2 bg-red-500/20 border border-red-400 rounded-lg text-red-300 text-sm">

          {fullscreenError}
        </motion.div>
      }

      {/* Pulsing hint */}
      <motion.p
        className="text-sm text-gray-400 text-center mt-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}>

        {hasRequestedOrientation ? 'Please rotate your device now' : 'Tap the button to continue'}
      </motion.p>
    </motion.div>);

}