import { motion } from 'framer-motion';

interface BossHealthBarProps {
  show: boolean;
  health: number;
  maxHealth: number;
  phase: 'phase1' | 'phase2' | 'phase3' | 'phase4';
}

export default function BossHealthBar({ show, health, maxHealth, phase }: BossHealthBarProps) {
  if (!show) return null;

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
      className="absolute top-4 right-4 z-10 w-64"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}>

      <div className="bg-black/80 rounded-lg border-2 border-cyan-400/60 p-3"
      style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)' }}>

        <div className="flex items-center justify-between mb-2">
          <h3
            className={`text-sm font-black font-['Sora'] ${colors.text}`}
            style={{ textShadow: `0 0 10px ${colors.glow}` }}>
            BOSS
          </h3>
          <span className={`text-xs font-bold ${colors.text}`}>{phase.replace('phase', 'P')}</span>
        </div>

        <div className="relative h-4 bg-black/60 rounded-full border border-cyan-400/40 overflow-hidden">
          <motion.div
            className={`h-full ${colors.bg}`}
            style={{
              width: `${healthPercent}%`,
              boxShadow: `0 0 10px ${colors.glow}`,
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
            <span className="text-white font-bold font-['Space_Grotesk'] text-xs drop-shadow-lg">
              {Math.ceil(health)} / {maxHealth}
            </span>
          </div>

          {/* Phase markers */}
          <div className="absolute inset-y-0 left-[25%] w-px bg-white/20" />
          <div className="absolute inset-y-0 left-[50%] w-px bg-white/20" />
          <div className="absolute inset-y-0 left-[75%] w-px bg-white/20" />
        </div>
      </div>
    </motion.div>);

}