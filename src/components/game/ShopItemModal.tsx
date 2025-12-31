import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ShipPreview from './ShipPreview';

interface ShipSkin {
  id: string;
  name: string;
  description: string;
  price: number;
  isPurchased: boolean;
  isDefault: boolean;
  filter: string;
  previewColor: string;
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
          className="relative bg-gradient-to-br from-purple-900/95 to-pink-900/95 border-2 border-purple-400 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/50"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-400/40 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-red-400" />
          </button>

          {/* Active Badge */}
          {isActive && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-cyan-500 text-black text-xs font-bold rounded-full">
              ✓ EQUIPPED
            </div>
          )}

          {/* Ship Preview */}
          <div className="mb-6 flex items-center justify-center bg-black/40 rounded-xl border border-cyan-400/30 p-8">
            <ShipPreview filter={skin.filter} size={120} showEngineGlow={true} />
          </div>

          {/* Name */}
          <h2 className="text-3xl font-black text-center mb-2 font-['Sora'] text-white">
            {skin.name}
          </h2>

          {/* Description */}
          <p className="text-center text-cyan-200 mb-6 font-['Space_Grotesk']">
            {skin.description}
          </p>

          {/* Price or Status */}
          <div className="text-center mb-6">
            {skin.isDefault ? (
              <div className="text-gray-300 font-bold">FREE - Default Skin</div>
            ) : skin.isPurchased ? (
              <div className="text-green-400 font-bold">✓ OWNED</div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <span>💎</span>
                <span className="text-purple-200">{skin.price.toLocaleString()} Stardust</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {skin.isDefault || skin.isPurchased ? (
              <button
                onClick={handleEquipClick}
                disabled={isActive}
                className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all font-['Space_Grotesk'] ${
                  isActive
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/50'
                }`}
              >
                {isActive ? '✓ Currently Equipped' : 'Equip This Ship'}
              </button>
            ) : (
              <button
                onClick={handlePurchaseClick}
                disabled={!canAfford}
                className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all font-['Space_Grotesk'] flex items-center justify-center gap-3 ${
                  canAfford
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>💎</span>
                <span>{canAfford ? 'Buy Now' : 'Not Enough Stardust'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl font-bold transition-all font-['Space_Grotesk']"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
