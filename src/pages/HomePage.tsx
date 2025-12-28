import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StarfieldBackground from '@/components/StarfieldBackground';
import NeonButton from '@/components/NeonButton';
import GameInstructions from '@/components/GameInstructions';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated starfield background */}
      <StarfieldBackground />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}>

          {/* Game Title */}
          <motion.h1
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-6"
            style={{
              fontFamily: "'Sora', sans-serif",
              background: 'linear-gradient(180deg, #22d3ee 0%, #3b82f6 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 80px rgba(34, 211, 238, 0.5)',
              filter: 'drop-shadow(0 0 40px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 80px rgba(236, 72, 153, 0.4))'
            }}
            animate={{
              filter: [
              'drop-shadow(0 0 40px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 80px rgba(236, 72, 153, 0.4))',
              'drop-shadow(0 0 50px rgba(34, 211, 238, 1)) drop-shadow(0 0 100px rgba(236, 72, 153, 0.6))',
              'drop-shadow(0 0 40px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 80px rgba(236, 72, 153, 0.4))']

            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}>

            NEON INVADERS
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-xl sm:text-2xl md:text-3xl text-cyan-300 mb-4"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: '0 0 20px rgba(34, 211, 238, 0.6)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}>

            Defend Earth Against the Alien Horde
          </motion.p>

          {/* Description */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-blue-200 max-w-2xl mx-auto mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}>

            Experience the classic arcade action reimagined with cinematic visuals,
            intense combat, and addictive gameplay.
          </motion.p>

          <motion.p
            className="text-sm sm:text-base text-pink-300"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: '0 0 10px rgba(236, 72, 153, 0.5)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}>

            Fast-paced • Power-ups • Boss Battles • High Scores
          </motion.p>
        </motion.div>

        {/* Play Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}>

          <NeonButton onClick={() => navigate('/game')}>
            ▶ PLAY GAME
          </NeonButton>
        </motion.div>

        {/* Instructions */}
        <GameInstructions />

        {/* Footer Credits */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}>

          <p
            className="text-sm text-gray-500"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

            Built with React • Optimized for 60fps • Desktop & Mobile
          </p>
        </motion.div>
      </div>

      {/* Ambient gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"
          style={{
            animation: 'pulse 8s ease-in-out infinite'
          }} />

        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]"
          style={{
            animation: 'pulse 8s ease-in-out infinite 4s'
          }} />

      </div>
    </div>);

}