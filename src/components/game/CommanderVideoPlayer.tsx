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
  const [isMuted, setIsMuted] = useState(true); // Start muted for mobile compatibility
  const [isPlaying, setIsPlaying] = useState(false);

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

      // Try to play the video (muted initially for mobile compatibility)
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🎬 Video playback started successfully');
            setIsPlaying(true);
            // Try to unmute after playback starts
            setTimeout(() => {
              if (video && !video.paused) {
                video.muted = false;
                setIsMuted(false);
                console.log('🎬 Video unmuted');
              }
            }, 100);
          })
          .catch(err => {
            console.error('🎬 Video autoplay failed:', err.name, err.message);
            setIsPlaying(false);
            // Don't set error, just show play button
          });
      }
    };

    const handlePlay = () => {
      console.log('🎬 Video started playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('🎬 Video paused');
      setIsPlaying(false);
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
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Force load
    console.log('🎬 Calling video.load()');
    video.load();

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
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
          muted={isMuted}
          autoPlay
          webkit-playsinline="true"
          x5-playsinline="true"
          onEnded={onEnded}
          onClick={() => {
            // Allow clicking video to play if autoplay failed or toggle mute
            if (videoRef.current) {
              if (videoRef.current.paused) {
                console.log('🎬 Video clicked - attempting to play');
                videoRef.current.play();
              } else {
                // Toggle mute on click
                console.log('🎬 Video clicked - toggling mute');
                videoRef.current.muted = !videoRef.current.muted;
                setIsMuted(videoRef.current.muted);
              }
            }
          }}
          src="/video/Commander-start-video.mp4"
        >
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

        {/* Manual Play Button - Show if loaded but not playing */}
        {isLoaded && !isPlaying && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => {
                console.log('🎬 Manual play button clicked');
                if (videoRef.current) {
                  videoRef.current.play();
                }
              }}
              className="px-12 py-6 bg-green-600 hover:bg-green-500 border-4 border-green-400 rounded-2xl text-white font-bold text-2xl shadow-2xl cursor-pointer"
              style={{
                pointerEvents: 'auto',
                zIndex: 9999
              }}
            >
              ▶ PLAY VIDEO
            </button>
          </div>
        )}

        {/* Sound Toggle Button */}
        {isLoaded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.muted = !videoRef.current.muted;
                setIsMuted(videoRef.current.muted);
                console.log('🎬 Sound toggled:', videoRef.current.muted ? 'muted' : 'unmuted');
              }
            }}
            className="absolute top-4 left-4 px-4 py-3 bg-purple-600 hover:bg-purple-500 border-2 border-purple-400 rounded-lg text-white font-bold text-2xl shadow-lg cursor-pointer"
            style={{
              pointerEvents: 'auto',
              zIndex: 9999
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
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
