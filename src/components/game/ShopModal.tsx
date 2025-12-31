import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ShipSkin } from '@/lib/game/progression/ProgressionTypes';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  skins: ShipSkin[];
  currentBalance: number;
  activeSkinId: string;
  onPurchase: (skinId: string) => { success: boolean; message: string };
  onEquip: (skinId: string) => { success: boolean; message: string };
}

type TierFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary';

export default function ShopModal({
  isOpen,
  onClose,
  skins,
  currentBalance,
  activeSkinId,
  onPurchase,
  onEquip
}: ShopModalProps) {
  const [selectedSkin, setSelectedSkin] = useState<ShipSkin | null>(null);
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'default': return 'text-gray-400 border-gray-600';
      case 'common': return 'text-green-400 border-green-500';
      case 'rare': return 'text-blue-400 border-blue-500';
      case 'epic': return 'text-purple-400 border-purple-500';
      case 'legendary': return 'text-yellow-400 border-yellow-500';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'default': return 'from-gray-700 to-gray-800';
      case 'common': return 'from-green-600 to-emerald-700';
      case 'rare': return 'from-blue-600 to-cyan-700';
      case 'epic': return 'from-purple-600 to-pink-700';
      case 'legendary': return 'from-yellow-500 to-orange-600';
      default: return 'from-gray-700 to-gray-800';
    }
  };

  // Filter skins
  const filteredSkins = skins.filter(skin =>
    tierFilter === 'all' || skin.tier === tierFilter
  );

  // Select first skin by default
  useEffect(() => {
    if (isOpen && !selectedSkin && filteredSkins.length > 0) {
      setSelectedSkin(filteredSkins[0]);
    }
  }, [isOpen, selectedSkin, filteredSkins]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handlePurchase = () => {
    if (!selectedSkin) return;
    const result = onPurchase(selectedSkin.id);
    setMessage({
      text: result.message,
      type: result.success ? 'success' : 'error'
    });
  };

  const handleEquip = () => {
    if (!selectedSkin) return;
    const result = onEquip(selectedSkin.id);
    setMessage({
      text: result.message,
      type: result.success ? 'success' : 'error'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Shop Modal */}
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div
              className="bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 border-4 border-cyan-400 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
              style={{ boxShadow: '0 0 50px rgba(34, 211, 238, 0.5)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b-2 border-cyan-400/30">
                <div>
                  <h2 className="text-4xl font-black text-white font-['Sora'] mb-1"
                      style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>
                    SHIP SKINS
                  </h2>
                  <div className="text-cyan-300 text-sm font-['Space_Grotesk']">
                    Customize your fighter with CSS filters!
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 text-xs font-bold tracking-wider">YOUR BALANCE</div>
                  <div className="text-2xl font-black text-purple-300 flex items-center gap-2"
                       style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.8)' }}>
                    <span>💎</span>
                    <span>{currentBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Tier Filters */}
              <div className="flex gap-2 p-4 border-b border-cyan-400/20 overflow-x-auto">
                {(['all', 'common', 'rare', 'epic', 'legendary'] as TierFilter[]).map(tier => (
                  <button
                    key={tier}
                    onClick={() => setTierFilter(tier)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide transition-all font-['Space_Grotesk'] ${
                      tierFilter === tier
                        ? 'bg-cyan-500 text-white scale-105'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  {/* Skin Grid */}
                  <div className="space-y-3">
                    {filteredSkins.map(skin => (
                      <motion.div
                        key={skin.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedSkin?.id === skin.id
                            ? 'border-cyan-400 bg-cyan-400/10 scale-105'
                            : 'border-gray-700 bg-gray-900/30 hover:border-gray-500'
                        }`}
                        onClick={() => setSelectedSkin(skin)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Ship Preview Icon */}
                          <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getTierGradient(skin.tier)} flex items-center justify-center text-3xl border-2 ${getTierColor(skin.tier)}`}>
                            🚀
                          </div>

                          {/* Skin Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-bold font-['Sora']">{skin.name}</h3>
                              {skin.unlocked && skin.id === activeSkinId && (
                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                                  EQUIPPED
                                </span>
                              )}
                              {skin.unlocked && skin.id !== activeSkinId && (
                                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">
                                  OWNED
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-1">{skin.description}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase ${getTierColor(skin.tier)}`}>
                                {skin.tier}
                              </span>
                              {!skin.unlocked && (
                                <span className="text-purple-300 font-bold text-sm flex items-center gap-1">
                                  <span>💎</span>
                                  <span>{skin.price.toLocaleString()}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Selected Skin Details */}
                  {selectedSkin && (
                    <motion.div
                      key={selectedSkin.id}
                      className="bg-gray-900/50 rounded-xl p-6 border-2 border-cyan-400/30 flex flex-col"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {/* Large Preview */}
                      <div className={`w-full aspect-square rounded-xl bg-gradient-to-br ${getTierGradient(selectedSkin.tier)} flex items-center justify-center text-9xl mb-4 border-4 ${getTierColor(selectedSkin.tier)}`}
                           style={{ boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)' }}>
                        🚀
                      </div>

                      {/* Skin Details */}
                      <div className="flex-1">
                        <h3 className="text-3xl font-black text-white mb-2 font-['Sora']">
                          {selectedSkin.name}
                        </h3>
                        <p className="text-gray-300 mb-4 font-['Space_Grotesk']">
                          {selectedSkin.description}
                        </p>

                        {/* Tier Badge */}
                        <div className={`inline-block px-3 py-1 rounded-lg border-2 ${getTierColor(selectedSkin.tier)} font-bold uppercase text-sm mb-4`}>
                          {selectedSkin.tier} Tier
                        </div>

                        {/* Technical Info */}
                        <div className="bg-black/30 rounded-lg p-4 mb-4 space-y-2">
                          <div className="text-xs text-gray-400 font-['Space_Grotesk']">
                            <div className="flex justify-between">
                              <span>CSS Filter:</span>
                              <span className="text-cyan-300 font-mono text-[0.65rem]">
                                {selectedSkin.filter.length > 30
                                  ? selectedSkin.filter.substring(0, 30) + '...'
                                  : selectedSkin.filter}
                              </span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Bullet Color:</span>
                              <span className="text-cyan-300 font-mono text-[0.65rem]">
                                {selectedSkin.bulletColor}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {!selectedSkin.unlocked && (
                          <button
                            onClick={handlePurchase}
                            disabled={currentBalance < selectedSkin.price}
                            className={`w-full py-4 rounded-xl font-black text-xl transition-all font-['Sora'] ${
                              currentBalance >= selectedSkin.price
                                ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-gray-900 hover:scale-105'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                            style={currentBalance >= selectedSkin.price ? { boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)' } : {}}
                          >
                            {currentBalance >= selectedSkin.price
                              ? `PURCHASE FOR ${selectedSkin.price.toLocaleString()} 💎`
                              : `NEED ${(selectedSkin.price - currentBalance).toLocaleString()} MORE 💎`
                            }
                          </button>
                        )}

                        {selectedSkin.unlocked && selectedSkin.id !== activeSkinId && (
                          <button
                            onClick={handleEquip}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black text-xl py-4 rounded-xl hover:scale-105 transition-all font-['Sora']"
                            style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)' }}
                          >
                            EQUIP SKIN
                          </button>
                        )}

                        {selectedSkin.unlocked && selectedSkin.id === activeSkinId && (
                          <div className="w-full bg-green-500 text-white font-black text-xl py-4 rounded-xl text-center font-['Sora']">
                            ✓ CURRENTLY EQUIPPED
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t-2 border-cyan-400/30 flex justify-between items-center">
                {/* Message Display */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      className={`px-4 py-2 rounded-lg font-bold ${
                        message.type === 'success'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={onClose}
                  className="ml-auto px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all font-['Space_Grotesk']"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
