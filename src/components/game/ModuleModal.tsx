import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Module, ModuleCategory, ModuleTier } from '@/lib/game/progression/ProgressionTypes';

interface ModuleModalProps {
  module: Module | null;
  onClose: () => void;
  onPurchase: (moduleId: string) => void;
  onEquip: (moduleId: string, slot: number) => void;
  canAfford: boolean;
  isEquipped: boolean;
  isLocked: boolean;
  lockReason?: string;
  slotsUnlocked: number;
  equippedSlot?: number;
}

export default function ModuleModal({
  module,
  onClose,
  onPurchase,
  onEquip,
  canAfford,
  isEquipped,
  isLocked,
  lockReason,
  slotsUnlocked,
  equippedSlot
}: ModuleModalProps) {
  if (!module) return null;

  const handlePurchaseClick = () => {
    onPurchase(module.id);
  };

  const handleEquipClick = (slot: number) => {
    onEquip(module.id, slot);
    onClose();
  };

  // Helper functions for styling
  const getTierColor = (tier: ModuleTier) => {
    switch (tier) {
      case 'basic': return 'border-gray-400 bg-gray-500/30';
      case 'advanced': return 'border-blue-400 bg-blue-500/30';
      case 'elite': return 'border-purple-400 bg-purple-500/30';
      case 'legendary': return 'border-yellow-400 bg-yellow-500/30';
    }
  };

  const getTierBadge = (tier: ModuleTier) => {
    switch (tier) {
      case 'basic': return { label: 'Basic', color: 'bg-gray-500', glow: 'rgba(107, 114, 128, 0.5)' };
      case 'advanced': return { label: 'Advanced', color: 'bg-blue-500', glow: 'rgba(59, 130, 246, 0.5)' };
      case 'elite': return { label: 'Elite', color: 'bg-purple-500', glow: 'rgba(168, 85, 247, 0.5)' };
      case 'legendary': return { label: 'Legendary', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', glow: 'rgba(234, 179, 8, 0.5)' };
    }
  };

  const getCategoryInfo = (category: ModuleCategory) => {
    switch (category) {
      case 'offensive': return { icon: '⚔️', label: 'Offensive', color: 'text-red-400' };
      case 'defensive': return { icon: '🛡️', label: 'Defensive', color: 'text-blue-400' };
      case 'utility': return { icon: '✨', label: 'Utility', color: 'text-purple-400' };
    }
  };

  const tierBadge = getTierBadge(module.tier);
  const categoryInfo = getCategoryInfo(module.category);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-2 ${getTierColor(module.tier)} rounded-2xl p-6 max-w-3xl w-full shadow-2xl`}
          style={{ boxShadow: `0 0 40px ${tierBadge.glow}` }}
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-400/40 rounded-lg transition-all z-10"
          >
            <X className="w-5 h-5 text-red-400" />
          </button>

          {/* Landscape Layout: Icon Left, Details Right */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Side - Module Icon & Status */}
            <div className="md:w-1/3 flex flex-col items-center justify-center">
              <div className={`relative w-full rounded-xl border-2 ${getTierColor(module.tier)} p-8 flex items-center justify-center min-h-[160px]`}>
                {/* Equipped Badge */}
                {isEquipped && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-500 text-black text-xs font-bold rounded-full">
                    ✓ SLOT {(equippedSlot ?? 0) + 1}
                  </div>
                )}
                {/* Locked Badge */}
                {isLocked && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs font-bold rounded-full">
                    🔒 LOCKED
                  </div>
                )}
                <span className="text-7xl">{module.icon}</span>
              </div>

              {/* Price/Status Display */}
              <div className="mt-4 text-center">
                {isLocked ? (
                  <div className="text-gray-400 font-bold text-sm">🔒 Locked</div>
                ) : module.owned ? (
                  <div className="text-green-400 font-bold text-lg">✓ OWNED</div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xl font-bold">
                    <span>💎</span>
                    <span className="text-purple-200">{module.price.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Details & Actions */}
            <div className="md:w-2/3 flex flex-col">
              {/* Name & Tier */}
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl md:text-3xl font-black font-['Sora'] text-white">
                  {module.name}
                </h2>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${tierBadge.color} text-white`}>
                  {tierBadge.label}
                </span>
              </div>

              {/* Category Badge */}
              <div className="mb-3">
                <span className={`inline-block text-sm font-bold ${categoryInfo.color}`}>
                  {categoryInfo.icon} {categoryInfo.label} Module
                </span>
              </div>

              {/* Effect Display */}
              <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-400/30 rounded-xl">
                <div className="text-xs uppercase tracking-wider text-cyan-400 mb-1 font-['Space_Grotesk'] font-bold">
                  ⚡ EFFECT
                </div>
                <div className="text-lg font-bold text-cyan-200 font-['Sora']">
                  {module.effect.description}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-4 font-['Space_Grotesk'] text-sm">
                {module.description}
              </p>

              {/* Action Buttons */}
              <div className="mt-auto space-y-2">
                {isLocked ? (
                  <div className="w-full px-4 py-3 rounded-xl bg-gray-700/50 text-gray-400 text-center font-['Space_Grotesk']">
                    <div className="font-bold">🔒 Module Locked</div>
                    <div className="text-xs mt-1">{lockReason}</div>
                  </div>
                ) : module.owned ? (
                  isEquipped ? (
                    <>
                      <div className="w-full px-4 py-3 rounded-xl bg-cyan-600/30 border border-cyan-400/40 text-cyan-300 text-center font-bold font-['Space_Grotesk']">
                        ✓ Equipped in Slot {(equippedSlot ?? 0) + 1}
                      </div>
                      <p className="text-xs text-cyan-300 text-center font-['Space_Grotesk']">
                        Unequip from the Equipped Modules section to change slots
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-center text-gray-300 mb-2 font-['Space_Grotesk']">
                        Select a slot to equip:
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((slot) => {
                          const isSlotUnlocked = slot < slotsUnlocked;
                          return (
                            <button
                              key={slot}
                              onClick={() => isSlotUnlocked && handleEquipClick(slot)}
                              disabled={!isSlotUnlocked}
                              className={`flex-1 px-3 py-3 rounded-xl font-bold text-sm transition-all font-['Space_Grotesk'] ${
                                isSlotUnlocked
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/30'
                                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {isSlotUnlocked ? `🔧 Slot ${slot + 1}` : `🔒 Slot ${slot + 1}`}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-cyan-300 text-center font-['Space_Grotesk']">
                        Click a slot to equip this module for your next game
                      </p>
                    </>
                  )
                ) : (
                  <>
                    <button
                      onClick={handlePurchaseClick}
                      disabled={!canAfford}
                      className={`w-full px-4 py-3 rounded-xl font-bold text-base transition-all font-['Space_Grotesk'] flex items-center justify-center gap-2 ${
                        canAfford
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/50'
                          : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>💎</span>
                      <span>{canAfford ? `Purchase for ${module.price.toLocaleString()} Stardust` : 'Not Enough Stardust'}</span>
                    </button>
                    {canAfford && (
                      <p className="text-xs text-yellow-300 text-center font-['Space_Grotesk']">
                        ⚠️ After purchasing, select a slot to equip this module
                      </p>
                    )}
                  </>
                )}

                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl font-bold transition-all font-['Space_Grotesk'] text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
