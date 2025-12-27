import { motion } from 'framer-motion';
import { Keyboard, Smartphone } from 'lucide-react';

export default function GameInstructions() {
  return (
    <motion.div
      className="w-full max-w-4xl mx-auto mt-16 px-4"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Desktop Controls */}
        <div
          className="relative p-6 rounded-xl border border-cyan-500/30 bg-black/40 backdrop-blur-sm"
          style={{
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.2), inset 0 0 20px rgba(34, 211, 238, 0.05)'
          }}>

          <div className="flex items-center gap-3 mb-4">
            <Keyboard className="w-6 h-6 text-cyan-400" />
            <h3
              className="text-xl font-bold text-cyan-400"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                textShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
              }}>

              Desktop Controls
            </h3>
          </div>
          <div className="space-y-3 text-blue-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Move Ship</span>
              <span className="px-3 py-1 bg-cyan-500/20 rounded border border-cyan-500/50 text-cyan-300">← →</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Fire Weapon</span>
              <span className="px-3 py-1 bg-cyan-500/20 rounded border border-cyan-500/50 text-cyan-300">SPACE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pause Game</span>
              <span className="px-3 py-1 bg-cyan-500/20 rounded border border-cyan-500/50 text-cyan-300">P</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Toggle Mute</span>
              <span className="px-3 py-1 bg-cyan-500/20 rounded border border-cyan-500/50 text-cyan-300">M</span>
            </div>
          </div>
        </div>

        {/* Mobile Controls */}
        <div
          className="relative p-6 rounded-xl border border-magenta-500/30 bg-black/40 backdrop-blur-sm"
          style={{
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.2), inset 0 0 20px rgba(236, 72, 153, 0.05)'
          }}>

          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-pink-400" />
            <h3
              className="text-xl font-bold text-pink-400"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                textShadow: '0 0 10px rgba(236, 72, 153, 0.5)'
              }}>

              Mobile Controls
            </h3>
          </div>
          <div className="space-y-3 text-blue-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="flex flex-col gap-2">
              <span className="text-gray-400">Touch & drag to move ship</span>
              <span className="text-gray-400">Tap screen to fire</span>
              <span className="text-gray-400">Auto-fire enabled</span>
            </div>
            <div className="mt-4 p-3 bg-pink-500/10 rounded border border-pink-500/30">
              <p className="text-sm text-pink-300">
                Best experienced in landscape mode for optimal gameplay
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>);

}