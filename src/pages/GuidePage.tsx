import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Zap, Heart, Shield, Rocket, Target, Trophy, Download, Settings } from 'lucide-react';

export default function GuidePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get return path from location state, default to home
  const returnPath = (location.state as { from?: string })?.from || '/';

  const handleBack = () => {
    navigate(returnPath, { state: { returnedFrom: 'guide' } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0014] to-[#1a0a2e] text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-cyan-400/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600/60 to-blue-600/60 hover:from-cyan-500/70 hover:to-blue-500/70 border-2 border-cyan-400/60 rounded-lg transition-all font-['Space_Grotesk'] font-bold shadow-lg shadow-cyan-500/30">
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <h1
              className="text-3xl md:text-4xl font-black font-['Sora'] text-cyan-400"
              style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>
              📖 GAME GUIDE
            </h1>

            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Game Overview */}
        <motion.section
          className="mb-8 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-400/40 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          <h2 className="text-2xl font-black text-cyan-400 mb-4 font-['Sora'] flex items-center gap-2">
            <Rocket className="w-6 h-6" />
            Game Overview
          </h2>
          <p className="text-cyan-200 font-['Space_Grotesk'] leading-relaxed">
            Alien Invasion Neon is a classic space shooter where you defend Earth from waves of alien invaders.
            Control your ship, dodge enemy fire, collect power-ups, and defeat massive bosses. Earn Stardust to
            unlock new ship skins and achievements!
          </p>
        </motion.section>

        {/* Controls */}
        <motion.section
          className="mb-8 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-2 border-cyan-400/40 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}>
          <h2 className="text-2xl font-black text-cyan-400 mb-4 font-['Sora'] flex items-center gap-2">
            <Target className="w-6 h-6" />
            How to Play
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-lg p-4 border border-cyan-400/20">
              <h3 className="text-lg font-bold text-cyan-300 mb-2 font-['Space_Grotesk']">🖥️ Desktop Controls</h3>
              <ul className="space-y-2 text-cyan-200 font-['Space_Grotesk']">
                <li><strong className="text-white">Arrow Keys / WASD:</strong> Move ship</li>
                <li><strong className="text-white">Spacebar:</strong> Shoot</li>
                <li><strong className="text-white">ESC / P:</strong> Pause game</li>
              </ul>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-cyan-400/20">
              <h3 className="text-lg font-bold text-cyan-300 mb-2 font-['Space_Grotesk']">📱 Mobile Controls</h3>
              <ul className="space-y-2 text-cyan-200 font-['Space_Grotesk']">
                <li><strong className="text-white">Touch & Drag:</strong> Move ship</li>
                <li><strong className="text-white">Auto-Fire:</strong> Shoots automatically</li>
                <li><strong className="text-white">Pause Button:</strong> Top-right corner</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Power-Ups */}
        <motion.section
          className="mb-8 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-400/40 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}>
          <h2 className="text-2xl font-black text-cyan-400 mb-4 font-['Sora'] flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Power-Ups (12 Types by Rarity)
          </h2>

          {/* Common Power-Ups (60%) */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-green-300 mb-3 font-['Space_Grotesk']">⚪ Common (60% drop rate)</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-lg p-3 border border-cyan-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-lg">🔵</div>
                  <h4 className="text-md font-bold text-cyan-300 font-['Space_Grotesk']">Rapid Fire (25%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Doubles fire rate for 10 seconds</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-purple-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-lg">🟣</div>
                  <h4 className="text-md font-bold text-purple-300 font-['Space_Grotesk']">Plasma Shot (20%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Fires 3 bullets in a spread for 10 seconds</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-green-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-lg">🟢</div>
                  <h4 className="text-md font-bold text-green-300 font-['Space_Grotesk']">Shield (15%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Temporary invincibility for 10 seconds</p>
              </div>
            </div>
          </div>

          {/* Uncommon Power-Ups (25%) */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-blue-300 mb-3 font-['Space_Grotesk']">🔷 Uncommon (25% drop rate)</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-lg p-3 border border-emerald-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-lg">🧲</div>
                  <h4 className="text-md font-bold text-emerald-300 font-['Space_Grotesk']">Magnet (10%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Attracts all powerups within 200px range</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-orange-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-lg">🟠</div>
                  <h4 className="text-md font-bold text-orange-300 font-['Space_Grotesk']">Slow Motion (8%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Slows down all enemies and projectiles</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-pink-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-lg">🌸</div>
                  <h4 className="text-md font-bold text-pink-300 font-['Space_Grotesk']">Homing Missiles (7%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Bullets track nearest enemy automatically</p>
              </div>
            </div>
          </div>

          {/* Rare Power-Ups (12%) */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-purple-300 mb-3 font-['Space_Grotesk']">💜 Rare (12% drop rate)</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-lg p-3 border border-blue-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-lg">❄️</div>
                  <h4 className="text-md font-bold text-blue-300 font-['Space_Grotesk']">Freeze Ray (5%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Freezes all enemy movement and firing</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-purple-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-lg">💜</div>
                  <h4 className="text-md font-bold text-purple-300 font-['Space_Grotesk']">Score Multiplier (4%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">2x score for all kills and bonuses (6 sec)</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-red-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-lg">🔴</div>
                  <h4 className="text-md font-bold text-red-300 font-['Space_Grotesk']">Laser Beam (3%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Hold spacebar for continuous piercing beam</p>
              </div>
            </div>
          </div>

          {/* Legendary Power-Ups (3%) */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-yellow-300 mb-3 font-['Space_Grotesk']">⭐ Legendary (3% drop rate)</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-lg p-3 border border-yellow-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg">⭐</div>
                  <h4 className="text-md font-bold text-yellow-300 font-['Space_Grotesk']">Invincibility (1.5%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Complete invulnerability - no damage taken</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-red-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-lg">💥</div>
                  <h4 className="text-md font-bold text-red-300 font-['Space_Grotesk']">Nuke (1.0%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Destroys all on-screen enemies instantly</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-pink-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-lg">❤️</div>
                  <h4 className="text-md font-bold text-pink-300 font-['Space_Grotesk']">Extra Life (0.5%)</h4>
                </div>
                <p className="text-cyan-200 text-xs font-['Space_Grotesk']">Adds +1 life immediately (ultra rare!)</p>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
            <p className="text-cyan-200 font-['Space_Grotesk'] text-sm">
              <strong className="text-cyan-300">💡 Pro Tip:</strong> Ship superpowers extend powerup durations!
              The Cosmic Void ship grants +5 seconds to all timed powerups.
            </p>
          </div>
        </motion.section>

        {/* Enemies */}
        <motion.section
          className="mb-8 bg-gradient-to-br from-red-900/40 to-orange-900/40 border-2 border-red-400/40 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}>
          <h2 className="text-2xl font-black text-cyan-400 mb-4 font-['Sora'] flex items-center gap-2">
            👾 Enemy Types
          </h2>
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4 border border-red-400/20">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 flex items-center justify-center">
                  <img
                    src="https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/95d93858-1da2-4410-bc6d-7c97a81a2690.webp"
                    alt="Basic Alien"
                    className="w-12 h-12 object-contain"
                    style={{ filter: 'drop-shadow(0 0 8px #ec4899)' }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-300 font-['Space_Grotesk'] mb-1">Basic Aliens</h3>
                  <p className="text-cyan-200 text-sm font-['Space_Grotesk']">Simple movement, easy to destroy. Worth 10 points.</p>
                </div>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-orange-400/20">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 flex items-center justify-center">
                  <img
                    src="https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/b6b8921b-cb05-4c7c-9637-17e8f8199206.webp"
                    alt="Heavy Alien"
                    className="w-12 h-12 object-contain"
                    style={{ filter: 'drop-shadow(0 0 8px #f97316)' }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-orange-300 font-['Space_Grotesk'] mb-1">Heavy Aliens</h3>
                  <p className="text-cyan-200 text-sm font-['Space_Grotesk']">Orange aliens with more health and slower movement. Worth 30 points.</p>
                </div>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/20">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 flex items-center justify-center">
                  <img
                    src="https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/0ee5fdad-b7fc-40b7-b71b-5785189cd229.webp"
                    alt="Fast Alien"
                    className="w-12 h-12 object-contain"
                    style={{ filter: 'drop-shadow(0 0 8px #eab308)' }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-300 font-['Space_Grotesk'] mb-1">Fast Aliens</h3>
                  <p className="text-cyan-200 text-sm font-['Space_Grotesk']">Quick-moving yellow aliens, harder to hit. Worth 20 points.</p>
                </div>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-purple-400/20">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 flex items-center justify-center">
                  <img
                    src="https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/30807/63f19d5b-0342-487b-8747-2fc17cb64440.webp"
                    alt="Boss Alien"
                    className="w-12 h-12 object-contain"
                    style={{ filter: 'drop-shadow(0 0 10px #dc2626)' }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-400 font-['Space_Grotesk'] mb-1">Boss Aliens</h3>
                  <p className="text-cyan-200 text-sm font-['Space_Grotesk']">Appear every 5 waves with massive health, color-changing phases, and powerful attacks. Worth 500+ points!</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Strategy Tips */}
        <motion.section
          className="mb-8 bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-400/40 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}>
          <h2 className="text-2xl font-black text-cyan-400 mb-4 font-['Sora'] flex items-center gap-2">
            💡 Pro Tips & Strategy
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-1">🎯</div>
              <p className="text-cyan-200 font-['Space_Grotesk']">
                <strong className="text-green-300">Focus on dodging first!</strong> Staying alive is more important than getting kills
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-1">⚡</div>
              <p className="text-cyan-200 font-['Space_Grotesk']">
                <strong className="text-green-300">Collect power-ups immediately!</strong> They can save you in tough situations
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-1">🛡️</div>
              <p className="text-cyan-200 font-['Space_Grotesk']">
                <strong className="text-green-300">Save shields for bosses:</strong> They're invaluable during boss fights
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-1">🎨</div>
              <p className="text-cyan-200 font-['Space_Grotesk']">
                <strong className="text-green-300">Unlock ship skins:</strong> Use Stardust to customize your ship in the shop
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-1">🏆</div>
              <p className="text-cyan-200 font-['Space_Grotesk']">
                <strong className="text-green-300">Complete achievements:</strong> Earn bonus Stardust and permanent upgrades
              </p>
            </div>
          </div>
        </motion.section>

        {/* Progression System */}
        <motion.section
          className="mb-8 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-400/40 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}>
          <h2 className="text-2xl font-black text-cyan-400 mb-4 font-['Sora'] flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Progression System
          </h2>
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4 border border-purple-400/20">
              <h3 className="text-lg font-bold text-purple-300 mb-2 font-['Space_Grotesk']">💎 Earn Stardust</h3>
              <p className="text-cyan-200 font-['Space_Grotesk'] text-sm">
                Collect Stardust by defeating enemies, completing waves, and unlocking achievements.
                Use it in the Ship Shop to buy exclusive skins!
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/20">
              <h3 className="text-lg font-bold text-yellow-300 mb-2 font-['Space_Grotesk']">🏆 Complete Achievements</h3>
              <p className="text-cyan-200 font-['Space_Grotesk'] text-sm">
                Unlock achievements to earn bonus Stardust and permanent stat boosts like extra lives
                and increased max health!
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-cyan-400/20">
              <h3 className="text-lg font-bold text-cyan-300 mb-2 font-['Space_Grotesk']">🛍️ Shop System</h3>
              <p className="text-cyan-200 font-['Space_Grotesk'] text-sm">
                Visit the Ship Shop to browse and purchase new ship skins. Each skin has a unique look
                and description. Equip your favorites to stand out!
              </p>
            </div>
          </div>
        </motion.section>

        {/* Settings */}
        <motion.section
          className="mb-8 bg-gradient-to-br from-gray-900/40 to-slate-900/40 border-2 border-gray-400/40 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}>
          <h2 className="text-2xl font-black text-cyan-400 mb-4 font-['Sora'] flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings & Customization
          </h2>
          <p className="text-cyan-200 font-['Space_Grotesk'] mb-4">
            Access settings from the pause menu during gameplay or from the main menu. Customize your experience:
          </p>
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4 border border-cyan-400/20">
              <h3 className="text-lg font-bold text-cyan-300 mb-2 font-['Space_Grotesk']">🎬 Screen Shake</h3>
              <p className="text-cyan-200 font-['Space_Grotesk'] text-sm">
                Toggle camera shake effects on/off. When enabled, the screen shakes during impacts and explosions
                (reduced to 50% intensity for comfort). Disable if you find it distracting or disorienting.
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-purple-400/20">
              <h3 className="text-lg font-bold text-purple-300 mb-2 font-['Space_Grotesk']">✨ Particle Quality</h3>
              <p className="text-cyan-200 font-['Space_Grotesk'] text-sm">
                Adjust visual effects quality for better performance:
              </p>
              <ul className="mt-2 space-y-1 text-cyan-200 font-['Space_Grotesk'] text-sm ml-4">
                <li><strong className="text-white">• Low:</strong> Minimal particles, best for older devices</li>
                <li><strong className="text-white">• Medium:</strong> Balanced visuals and performance (recommended)</li>
                <li><strong className="text-white">• High:</strong> Maximum visual effects for powerful devices</li>
              </ul>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/20">
              <h3 className="text-lg font-bold text-yellow-300 mb-2 font-['Space_Grotesk']">🔊 Audio Controls</h3>
              <p className="text-cyan-200 font-['Space_Grotesk'] text-sm">
                Sound effects and background music toggles are coming soon! When implemented, you'll be able to:
              </p>
              <ul className="mt-2 space-y-1 text-cyan-200/70 font-['Space_Grotesk'] text-sm ml-4">
                <li>• Control sound effects volume</li>
                <li>• Toggle background music on/off</li>
                <li>• Adjust individual audio elements</li>
              </ul>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-blue-400/20">
              <h3 className="text-lg font-bold text-blue-300 mb-2 font-['Space_Grotesk']">📱 Mobile Settings</h3>
              <p className="text-cyan-200 font-['Space_Grotesk'] text-sm">
                On mobile devices, you can also adjust touch control sensitivity (Low/Normal/High) to match
                your playing style. Haptic feedback toggle coming soon!
              </p>
            </div>
          </div>
        </motion.section>

        {/* Install PWA */}
        <motion.section
          className="mb-8 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-2 border-cyan-400/60 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}>
          <h2 className="text-2xl font-black text-cyan-400 mb-4 font-['Sora'] flex items-center gap-2">
            <Download className="w-6 h-6" />
            Install as App
          </h2>
          <div className="bg-black/30 rounded-lg p-6 border border-cyan-400/40">
            <p className="text-cyan-200 font-['Space_Grotesk'] mb-4 leading-relaxed">
              <strong className="text-cyan-300">Get the best experience!</strong> Install Alien Invasion Neon
              as a Progressive Web App (PWA) to play offline, get faster loading, and enjoy full-screen gameplay
              without browser distractions.
            </p>
            <div className="space-y-2 text-cyan-200 font-['Space_Grotesk'] text-sm">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span>Play offline anytime, anywhere</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span>Instant loading and smooth performance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span>Full-screen immersive gameplay</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                <span>Home screen icon for quick access</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-cyan-500/20 border border-cyan-400/40 rounded-lg">
              <p className="text-cyan-200 font-['Space_Grotesk'] text-sm">
                <strong className="text-cyan-300">How to install:</strong> Look for the install prompt in your browser,
                or check your browser's menu for "Install" or "Add to Home Screen" option.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Bottom Back Button */}
        <div className="mt-8 mb-8 text-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600/60 to-blue-600/60 hover:from-cyan-500/70 hover:to-blue-500/70 border-2 border-cyan-400/60 rounded-xl transition-all font-['Space_Grotesk'] font-bold shadow-lg shadow-cyan-500/30 mx-auto text-lg">
            <ChevronLeft className="w-6 h-6" />
            <span>Back to Game</span>
          </button>
        </div>
      </div>
    </div>
  );
}
