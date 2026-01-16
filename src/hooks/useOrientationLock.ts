import { useEffect, useState } from 'react';

/**
 * Custom hook to detect orientation and attempt to lock to landscape on mobile
 * Returns whether the device is in portrait mode (should show rotation prompt)
 */
export function useOrientationLock(enableLock: boolean = true) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(mobile);
      return mobile;
    };

    // Check current orientation
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      return portrait;
    };

    // Attempt to lock screen orientation to landscape (only works in some browsers/contexts)
    const lockOrientation = async () => {
      if (!enableLock) return;

      try {
        // Check if device is mobile
        if (!checkMobile()) return;

        // Screen Orientation API (modern browsers, requires fullscreen or installed PWA)
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {
            // Silently fail - orientation lock requires fullscreen or PWA context
            console.log('Orientation lock requires fullscreen or PWA mode');
          });
        }
        // Legacy orientation lock API (deprecated but still supported in some browsers)
        else if ('lockOrientation' in screen) {
          (screen as any).lockOrientation('landscape');
        }
        // Webkit/Mozilla prefixed versions
        else if ('mozLockOrientation' in screen) {
          (screen as any).mozLockOrientation('landscape');
        } else
        if ('msLockOrientation' in screen) {
          (screen as any).msLockOrientation('landscape');
        }
      } catch (error) {
        // Orientation lock failed - this is expected in regular browser mode
        console.log('Orientation lock not available:', error);
      }
    };

    // Initial checks
    checkMobile();
    checkOrientation();

    // Try to lock orientation when component mounts
    lockOrientation();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      checkOrientation();
    };

    // Listen for window resize (covers both orientation change and resize)
    window.addEventListener('resize', handleOrientationChange);

    // Also listen to the orientationchange event if available
    if ('onorientationchange' in window) {
      window.addEventListener('orientationchange', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      if ('onorientationchange' in window) {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }

      // Unlock orientation when component unmounts (if API is available)
      if (enableLock && screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, [enableLock]);

  return {
    isPortrait,
    isMobile,
    shouldShowPrompt: isMobile && isPortrait
  };
}