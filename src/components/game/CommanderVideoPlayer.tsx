import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface CommanderVideoPlayerProps {
  onEnded: () => void;
  onSkip: () => void;
}

export default function CommanderVideoPlayer({ onEnded, onSkip }: CommanderVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video starts playing (some browsers may block autoplay)
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('Video autoplay failed:', err);
      });
    }
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
          autoPlay
          playsInline
          onEnded={onEnded}
          src="/video/Commander-start-video.mp4"
        >
          Your browser does not support the video tag.
        </video>

        {/* Skip Button */}
        <motion.button
          onClick={onSkip}
          className="absolute top-4 right-4 px-4 py-2 bg-black/60 hover:bg-black/80 border-2 border-cyan-400 rounded-lg text-white font-bold text-sm backdrop-blur-sm transition-all"
          style={{
            fontFamily: "'Sora', sans-serif",
            textShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
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
