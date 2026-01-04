import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CommanderVideoPlayerProps {
  onEnded: () => void;
  onSkip: () => void;
}

export default function CommanderVideoPlayer({ onEnded, onSkip }: CommanderVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('🎬 Commander video component mounted');
    console.log('🎬 Video source:', video.src);

    const handleLoadedData = () => {
      console.log('🎬 Video loaded successfully');
      setIsLoaded(true);

      // Try to play the video
      video.play()
        .then(() => {
          console.log('🎬 Video playback started');
        })
        .catch(err => {
          console.error('🎬 Video autoplay failed:', err);
          setError('Autoplay blocked. Click to play.');
        });
    };

    const handleError = (e: Event) => {
      console.error('🎬 Video error:', e);
      setError('Failed to load video');
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    // Force load
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black z-[200]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Video Container */}
      <motion.div
        className="fixed inset-0 z-[201] flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          preload="auto"
          onEnded={onEnded}
          onClick={() => {
            // Allow clicking video to play if autoplay failed
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play();
            }
          }}
        >
          <source src="/video/Commander-start-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Error/Loading Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/80 border-2 border-red-400 rounded-lg px-6 py-4 text-white text-center">
              <p className="text-lg font-bold mb-2">{error}</p>
              <p className="text-sm">Click anywhere to continue</p>
            </div>
          </div>
        )}

        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-xl font-bold">Loading video...</div>
          </div>
        )}

        {/* Skip Button */}
        <motion.button
          onClick={onSkip}
          className="absolute top-4 right-4 px-4 py-2 bg-black/60 hover:bg-black/80 border-2 border-cyan-400 rounded-lg text-white font-bold text-sm backdrop-blur-sm transition-all z-[202] cursor-pointer"
          style={{
            fontFamily: "'Sora', sans-serif",
            textShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
            pointerEvents: 'auto'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          SKIP ⏭
        </motion.button>
      </motion.div>
    </>
  );
}
