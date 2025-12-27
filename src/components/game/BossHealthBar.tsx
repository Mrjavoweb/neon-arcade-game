import { motion } from 'framer-motion';

interface BossHealthBarProps {
  health: number;
  maxHealth: number;
  phase: 'phase1' | 'phase2' | 'phase3' | 'phase4';
}

export default function BossHealthBar({ health, maxHealth, phase }: BossHealthBarProps) {
  const healthPercent = health / maxHealth * 100;

  const phaseColors = {
    phase1: { bg: 'bg-red-600', glow: 'rgba(220, 38, 38, 0.8)', text: 'text-red-400' },
    phase2: { bg: 'bg-orange-600', glow: 'rgba(249, 115, 22, 0.8)', text: 'text-orange-400' },
    phase3: { bg: 'bg-yellow-600', glow: 'rgba(234, 179, 8, 0.8)', text: 'text-yellow-400' },
    phase4: { bg: 'bg-purple-600', glow: 'rgba(168, 85, 247, 0.8)', text: 'text-purple-400' }
  };

  const colors = phaseColors[phase];

  return (
    <motion.div
      className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-2xl px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>

      <div className="text-center mb-2">
        <h3
          className={`text-2xl font-black font-['Sora'] ${colors.text}`}
          style={{ textShadow: `0 0 15px ${colors.glow}` }}>

          BOSS - {phase.toUpperCase()}
        </h3>
      </div>
      
      <div className="relative h-8 bg-black/60 rounded-full border-2 border-cyan-400 overflow-hidden"
      style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}>
        <motion.div
          className={`h-full ${colors.bg}`}
          style={{
            width: `${healthPercent}%`,
            boxShadow: `0 0 20px ${colors.glow}`,
            transition: 'width 0.3s ease-out'
          }}
          animate={{
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }} />

        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold font-['Space_Grotesk'] text-sm drop-shadow-lg">
            {Math.ceil(health)} / {maxHealth}
          </span>
        </div>

        {/* Phase markers */}
        <div className="absolute inset-y-0 left-[25%] w-0.5 bg-white/30" />
        <div className="absolute inset-y-0 left-[50%] w-0.5 bg-white/30" />
        <div className="absolute inset-y-0 left-[75%] w-0.5 bg-white/30" />
      </div>
    </motion.div>);

}