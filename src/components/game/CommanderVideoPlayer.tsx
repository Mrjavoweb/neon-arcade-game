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
    if (!video) {
      console.error('🎬 Video ref is null');
      return;
    }

    console.log('🎬 Commander video component mounted');
    console.log('🎬 Video element:', video);

    const handleLoadStart = () => {
      console.log('🎬 Video load started');
    };

    const handleLoadedMetadata = () => {
      console.log('🎬 Video metadata loaded');
      console.log('🎬 Video duration:', video.duration);
      console.log('🎬 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    };

    const handleLoadedData = () => {
      console.log('🎬 Video data loaded successfully');
      setIsLoaded(true);

      // Try to play the video
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🎬 Video playback started successfully');
          })
          .catch(err => {
            console.error('🎬 Video autoplay failed:', err.name, err.message);
            setError('Autoplay blocked. Click to play.');
          });
      }
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      console.error('🎬 Video error event:', e);
      console.error('🎬 Video error code:', target.error?.code);
      console.error('🎬 Video error message:', target.error?.message);
      console.error('🎬 Video src:', target.src);
      console.error('🎬 Video currentSrc:', target.currentSrc);
      setError(`Failed to load video (Error ${target.error?.code})`);
    };

    const handleCanPlay = () => {
      console.log('🎬 Video can play');
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    // Force load
    console.log('🎬 Calling video.load()');
    video.load();

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
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
        style={{ pointerEvents: 'auto' }}
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('🎬 Skip button clicked');
            onSkip();
          }}
          className="absolute top-4 right-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 border-2 border-cyan-400 rounded-lg text-white font-bold text-base shadow-lg cursor-pointer"
          style={{
            fontFamily: "'Sora', sans-serif",
            textShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
            pointerEvents: 'auto',
            zIndex: 9999
          }}
        >
          SKIP ⏭
        </button>
      </motion.div>
    </>
  );
}
