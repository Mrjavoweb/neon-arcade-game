import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ShipPreview from './ShipPreview';

interface ShipSuperpower {
  type: string;
  name: string;
  description: string;
  value?: number;
  duration?: number;
}

interface ShipSkin {
  id: string;
  name: string;
  description: string;
  price: number;
  isPurchased: boolean;
  isDefault: boolean;
  filter: string;
  previewColor: string;
  superpower?: ShipSuperpower;
  tier?: string;
  role?: 'balanced' | 'offensive' | 'mobility' | 'defensive' | 'utility';
}

interface ShopItemModalProps {
  skin: ShipSkin | null;
  onClose: () => void;
  onPurchase: (skinId: string) => void;
  onEquip: (skinId: string) => void;
  canAfford: boolean;
  isActive: boolean;
}

export default function ShopItemModal({
  skin,
  onClose,
  onPurchase,
  onEquip,
  canAfford,
  isActive
}: ShopItemModalProps) {
  if (!skin) return null;

  const handlePurchaseClick = () => {
    onPurchase(skin.id);
  };

  const handleEquipClick = () => {
    onEquip(skin.id);
    onClose();
  };

  // Helper function for role badge styling
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'offensive':
        return { icon: '⚔️', label: 'Offensive', color: 'bg-red-500/80 border-red-400/60' };
      case 'defensive':
        return { icon: '🛡️', label: 'Defensive', color: 'bg-blue-500/80 border-blue-400/60' };
      case 'mobility':
        return { icon: '⚡', label: 'Mobility', color: 'bg-green-500/80 border-green-400/60' };
      case 'utility':
        return { icon: '✨', label: 'Utility', color: 'bg-purple-500/80 border-purple-400/60' };
      case 'balanced':
        return { icon: '⚖️', label: 'Balanced', color: 'bg-cyan-500/80 border-cyan-400/60' };
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge(skin.role);

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
          className="relative bg-gradient-to-br from-purple-900/95 to-pink-900/95 border-2 border-purple-400 rounded-2xl p-6 max-w-4xl w-full shadow-2xl shadow-purple-500/50"
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

          {/* Landscape Layout: Preview Left, Details Right */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Side - Ship Preview */}
            <div className="md:w-1/3 flex flex-col items-center justify-center">
              <div className="relative w-full bg-black/40 rounded-xl border border-cyan-400/30 p-6 flex items-center justify-center min-h-[180px]">
                {/* Active Badge */}
                {isActive && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-500 text-black text-xs font-bold rounded-full">
                    ✓ EQUIPPED
                  </div>
                )}
                <ShipPreview filter={skin.filter} size={100} showEngineGlow={true} />
              </div>

              {/* Price Display (below preview) */}
              <div className="mt-4 text-center">
                {skin.isDefault ? (
                  <div className="text-gray-300 font-bold text-sm">FREE - Default</div>
                ) : skin.isPurchased ? (
                  <div className="text-green-400 font-bold text-lg">✓ OWNED</div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xl font-bold">
                    <span>💎</span>
                    <span className="text-purple-200">{skin.price.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Details & Actions */}
            <div className="md:w-2/3 flex flex-col">
              {/* Name */}
              <h2 className="text-2xl md:text-3xl font-black mb-2 font-['Sora'] text-white">
                {skin.name}
              </h2>

              {/* Role Badge */}
              {roleBadge && (
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full border-2 text-white ${roleBadge.color}`}>
                    {roleBadge.icon} {roleBadge.label.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-cyan-200 mb-4 font-['Space_Grotesk'] text-sm md:text-base">
                {skin.description}
              </p>

              {/* Superpower Display */}
              {skin.superpower && skin.superpower.type !== 'none' && (
                <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/40 rounded-xl">
                  <div className="text-xs uppercase tracking-wider text-purple-300 mb-1 font-['Space_Grotesk'] font-bold">
                    ⚡ SUPERPOWER
                  </div>
                  <div className="text-base font-bold text-yellow-300 font-['Sora']">
                    {skin.superpower.name}
                  </div>
                  <div className="text-sm text-cyan-200 font-['Space_Grotesk']">
                    {skin.superpower.description}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-auto space-y-2">
                {skin.isDefault || skin.isPurchased ? (
                  <>
                    <button
                      onClick={handleEquipClick}
                      disabled={isActive}
                      className={`w-full px-4 py-3 rounded-xl font-bold text-base transition-all font-['Space_Grotesk'] ${
                        isActive
                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/50'
                      }`}
                    >
                      {isActive ? '✓ Currently Equipped' : '🚀 Equip This Ship'}
                    </button>
                    {!isActive && (
                      <p className="text-xs text-cyan-300 text-center font-['Space_Grotesk']">
                        Click to use this ship in your next game
                      </p>
                    )}
                  </>
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
                      <span>{canAfford ? `Purchase for ${skin.price.toLocaleString()} Stardust` : 'Not Enough Stardust'}</span>
                    </button>
                    {canAfford && (
                      <p className="text-xs text-yellow-300 text-center font-['Space_Grotesk']">
                        ⚠️ After purchasing, click "Equip" to use this ship
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
