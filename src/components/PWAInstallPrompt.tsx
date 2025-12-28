import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed or running as PWA
    const checkPWAStatus = () => {
      const isInStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isInStandaloneMode);
      setIsInstalled(isInStandaloneMode);
    };

    checkPWAStatus();

    // Listen for PWA install availability
    const handleInstallAvailable = () => {
      if (!isStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);

    // Listen for successful installation
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setIsInstalled(true);
      console.log('PWA installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    try {
      if ((window as any).installPWA) {
        await (window as any).installPWA();
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to avoid showing again this session
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissal < 24) {
        setShowPrompt(false);
      }
    }
  }, []);

  return (
    <AnimatePresence>
      {showPrompt && !isInstalled && !isStandalone && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[200]"
        >
          <div
            className="relative bg-gradient-to-br from-cyan-500/20 to-pink-500/20 backdrop-blur-xl border-2 border-cyan-400/50 rounded-2xl p-6 shadow-2xl"
            style={{
              boxShadow: '0 0 40px rgba(34, 211, 238, 0.3), 0 0 80px rgba(236, 72, 153, 0.2)'
            }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-cyan-300 hover:text-cyan-100 transition-colors"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-pink-400 flex items-center justify-center text-2xl"
                  style={{
                    boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
                  }}
                >
                  👾
                </div>
              </div>

              <div className="flex-1">
                <h3
                  className="text-lg font-bold mb-1"
                  style={{
                    background: 'linear-gradient(90deg, #22d3ee 0%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Install Neon Invaders
                </h3>
                <p className="text-sm text-cyan-100/80 mb-4">
                  Install as an app for offline play and faster loading!
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95"
                    style={{
                      boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
                    }}
                  >
                    <Download size={18} />
                    Install
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 border-2 border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-all font-semibold"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-4 pt-4 border-t border-cyan-400/20">
              <div className="grid grid-cols-3 gap-2 text-xs text-cyan-100/70">
                <div className="flex items-center gap-1">
                  <span className="text-green-400">✓</span>
                  <span>Offline play</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-400">✓</span>
                  <span>Fast loading</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-400">✓</span>
                  <span>Full screen</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Installed badge (shows briefly after installation) */}
      {isInstalled && isStandalone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-6 right-6 z-[200]"
        >
          <div
            className="bg-green-500/20 border-2 border-green-400/50 backdrop-blur-xl rounded-full px-4 py-2 flex items-center gap-2"
            style={{
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
            }}
          >
            <span className="text-green-400 text-xl">✓</span>
            <span className="text-green-100 font-bold text-sm">Running as App</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
