import { useState, useEffect } from 'react';
import { Download, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAInstallButtonProps {
  variant?: 'button' | 'text';
}

export default function PWAInstallButton({ variant = 'button' }: PWAInstallButtonProps) {
  const [showButton, setShowButton] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showAlreadyInstalled, setShowAlreadyInstalled] = useState(false);

  useEffect(() => {
    // Check if already running as PWA
    const checkPWAStatus = () => {
      const isInStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isInStandaloneMode);

      // If not standalone and install is available, show button
      if (!isInStandaloneMode && (window as any).installPWA) {
        setShowButton(true);
      }
    };

    checkPWAStatus();

    // Show button if install is available
    const handleInstallAvailable = () => {
      checkPWAStatus();
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  const handleInstall = async () => {
    // Check if already installed
    if (isStandalone) {
      setShowAlreadyInstalled(true);
      setTimeout(() => setShowAlreadyInstalled(false), 5000); // Auto-hide after 5 seconds
      return;
    }

    try {
      if ((window as any).installPWA) {
        await (window as any).installPWA();
      } else {
        // No install prompt available - might already be installed
        setShowAlreadyInstalled(true);
        setTimeout(() => setShowAlreadyInstalled(false), 5000);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  // Don't show button if already installed or if install not available
  if (isStandalone || !showButton) {
    return null;
  }

  return (
    <>
      {/* Already Installed Popup */}
      <AnimatePresence>
        {showAlreadyInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setShowAlreadyInstalled(false)}
          >
            <motion.div
              className="relative bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-2 border-green-400/50 rounded-2xl p-8 max-w-md"
              style={{
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon with app image */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 relative">
                  <img
                    src="/assets/app-icon.webp"
                    alt="Alien Attack Icon"
                    className="w-24 h-24 rounded-2xl"
                    style={{
                      boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)'
                    }}
                  />
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                    <CheckCircle className="text-white" size={24} />
                  </div>
                </div>

                <h3
                  className="text-2xl font-bold mb-2"
                  style={{
                    background: 'linear-gradient(90deg, #22d3ee 0%, #10b981 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: "'Sora', sans-serif"
                  }}
                >
                  Already Installed!
                </h3>

                <p className="text-green-100 mb-4 text-lg">
                  Alien Attack is already installed on your device.
                </p>

                <p className="text-green-200/80 text-sm mb-6">
                  Look for this icon on your home screen or app drawer to launch the game.
                </p>

                <button
                  onClick={() => setShowAlreadyInstalled(false)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95"
                  style={{
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
                    fontFamily: "'Sora', sans-serif"
                  }}
                >
                  Got It!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text variant - Simple inline link */}
      {variant === 'text' ? (
        <p className="text-xs text-gray-400 font-['Space_Grotesk']">
          📱 Add game to homescreen:{' '}
          <button
            onClick={handleInstall}
            className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
          >
            Click Here
          </button>
        </p>
      ) : (
        /* Button variant - Full styled button */
        <motion.button
          onClick={handleInstall}
          className="relative w-full px-4 py-2 sm:px-6 sm:py-3 md:px-12 md:py-5 text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white bg-transparent border-2 border-green-400 rounded-lg overflow-hidden group"
          style={{
            fontFamily: "'Sora', sans-serif",
            textShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.5)',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1)'
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.8), inset 0 0 30px rgba(34, 197, 94, 0.2)'
          }}
          whileTap={{ scale: 0.95 }}
          animate={{
            y: [0, -8, 0]
          }}
          transition={{
            y: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }}
        >
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          />

          {/* Button content */}
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Download size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span>INSTALL APP</span>
          </span>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
      )}
    </>
  );
}
