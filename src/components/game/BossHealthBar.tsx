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
    phase2: { bg: 'bg-cyan-600', glow: 'rgba(6, 182, 212, 0.8)', text: 'text-cyan-400' },
    phase3: { bg: 'bg-yellow-600', glow: 'rgba(234, 179, 8, 0.8)', text: 'text-yellow-400' },
    phase4: { bg: 'bg-purple-600', glow: 'rgba(168, 85, 247, 0.8)', text: 'text-purple-400' }
  };

  const colors = phaseColors[phase];

  return (
    <motion.div
      className="absolute top-2 left-1/2 -translate-x-1/2 z-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>

      <div className="bg-black/80 rounded-md border border-cyan-400/60 px-3 py-1.5 flex items-center gap-2"
      style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.3)' }}>

        <h3
          className={`text-xs font-black font-['Sora'] ${colors.text} whitespace-nowrap`}
          style={{ textShadow: `0 0 8px ${colors.glow}` }}>
          BOSS
        </h3>

        <div className="relative h-3 w-32 bg-black/60 rounded-full border border-cyan-400/40 overflow-hidden">
          <motion.div
            className={`h-full ${colors.bg}`}
            style={{
              width: `${healthPercent}%`,
              boxShadow: `0 0 8px ${colors.glow}`,
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

          {/* Phase markers */}
          <div className="absolute inset-y-0 left-[25%] w-px bg-white/20" />
          <div className="absolute inset-y-0 left-[50%] w-px bg-white/20" />
          <div className="absolute inset-y-0 left-[75%] w-px bg-white/20" />
        </div>

        <span className={`text-[0.65rem] font-bold ${colors.text} whitespace-nowrap`}>{phase.replace('phase', 'P')}</span>
      </div>
    </motion.div>);

}