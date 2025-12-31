import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PWAInstallButton() {
  const [showButton, setShowButton] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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
    try {
      if ((window as any).installPWA) {
        await (window as any).installPWA();
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
    <motion.button
      onClick={handleInstall}
      className="relative w-full px-12 py-5 text-2xl md:text-3xl font-bold text-white bg-transparent border-2 border-green-400 rounded-lg overflow-hidden group"
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
        <Download size={24} />
        <span>INSTALL APP</span>
      </span>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}
