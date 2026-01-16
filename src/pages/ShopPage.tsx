import { useNavigate, useLocation } from 'react-router-dom';
import { useGameEngine } from '@/contexts/GameEngineContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { GameEngine } from '@/lib/game/GameEngine';
import ShopItemModal from '@/components/game/ShopItemModal';
import ShipPreview from '@/components/game/ShipPreview';

interface ShipSkin {
  id: string;
  name: string;
  description: string;
  price: number;
  unlocked: boolean;
  filter: string;
  tier: string;
  role?: 'balanced' | 'offensive' | 'mobility' | 'defensive' | 'utility';
}

export default function ShopPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { engine: contextEngine, setEngine } = useGameEngine();
  const [localEngine, setLocalEngine] = useState<GameEngine | null>(null);
  const [skins, setSkins] = useState<ShipSkin[]>([]);
  const [stardust, setStardust] = useState(0);
  const [activeSkinId, setActiveSkinId] = useState('default');
  const [selectedSkin, setSelectedSkin] = useState<ShipSkin | null>(null);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [purchasedSkinName, setPurchasedSkinName] = useState('');

  // Use context engine if available, otherwise local engine
  const engine = contextEngine || localEngine;

  // Get return path from location state, default to /game
  const returnPath = (location.state as { from?: string })?.from || '/game';

  // Helper function for role badge styling
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'offensive':
        return { icon: '⚔️', label: 'Offensive', color: 'bg-red-500/80 text-white' };
      case 'defensive':
        return { icon: '🛡️', label: 'Defensive', color: 'bg-blue-500/80 text-white' };
      case 'mobility':
        return { icon: '⚡', label: 'Mobility', color: 'bg-green-500/80 text-white' };
      case 'utility':
        return { icon: '✨', label: 'Utility', color: 'bg-purple-500/80 text-white' };
      case 'balanced':
        return { icon: '⚖️', label: 'Balanced', color: 'bg-cyan-500/80 text-black' };
      default:
        return null;
    }
  };

  // Initialize local engine if context engine doesn't exist
  useEffect(() => {
    if (!contextEngine && !localEngine) {
      console.log('🛍️ ShopPage: Creating local engine instance');
      const tempCanvas = document.createElement('canvas');
      const newEngine = new GameEngine(tempCanvas, false);
      setLocalEngine(newEngine);
      // Also try to set it in context for persistence
      setEngine(newEngine);
    }
  }, [contextEngine, localEngine, setEngine]);

  useEffect(() => {
    if (engine) {
      setSkins(engine.cosmeticManager.getAllSkins());
      setStardust(engine.currencyManager.getStardust());
      setActiveSkinId(engine.cosmeticManager.getActiveSkin().id);

      // Listen for currency changes
      const handleCurrencyChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.balance !== undefined) {
          setStardust(customEvent.detail.balance);
        }
      };
      window.addEventListener('currency-changed', handleCurrencyChange);

      return () => {
        window.removeEventListener('currency-changed', handleCurrencyChange);
      };
    }
  }, [engine]);

  const handleBack = () => {
    navigate(returnPath, { state: { returnedFrom: 'shop' } });
  };

  const handlePurchase = (skinId: string) => {
    if (engine) {
      const skin = skins.find(s => s.id === skinId);
      const result = engine.cosmeticManager.purchaseSkin(skinId);

      console.log('🛒 Purchase attempt:', { skinId, result }); // Debug log

      if (result.success) {
        const updatedSkins = engine.cosmeticManager.getAllSkins();
        setSkins(updatedSkins);
        setStardust(engine.currencyManager.getStardust());

        // Update the selected skin to show the new purchased state
        const updatedSelectedSkin = updatedSkins.find(s => s.id === skinId);
        if (updatedSelectedSkin) {
          setSelectedSkin(updatedSelectedSkin);
        }

        // Show success notification
        if (skin) {
          setPurchasedSkinName(skin.name);
          setShowPurchaseSuccess(true);
          setTimeout(() => setShowPurchaseSuccess(false), 4000);
        }

        console.log('✅ Purchase successful!'); // Debug log
      } else {
        console.error('❌ Purchase failed:', result.message); // Debug log
      }
    }
  };

  const handleEquip = (skinId: string) => {
    if (engine) {
      const result = engine.cosmeticManager.equipSkin(skinId);
      if (result.success) {
        setActiveSkinId(skinId);
        setSkins(engine.cosmeticManager.getAllSkins());
      }
    }
  };

  if (!engine) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0014] to-[#1a0a2e] flex items-center justify-center">
        <div className="text-white text-xl">Loading Shop...</div>
      </div>
    );
  }

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
              <span>Back to Game</span>
            </button>

            <h1
              className="text-3xl md:text-4xl font-black font-['Sora'] text-cyan-400"
              style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>
              🛍️ SHIP SHOP
            </h1>

            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/40 rounded-lg">
              <span className="text-2xl">💎</span>
              <div className="text-right">
                <div className="text-xs text-purple-300 font-['Space_Grotesk']">Stardust</div>
                <div className="text-xl font-bold text-purple-200">{stardust.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Intro Text */}
        <div className="mb-8 text-center">
          <p className="text-lg text-cyan-300 font-['Space_Grotesk'] max-w-2xl mx-auto">
            Customize your ship with exclusive skins! Earn Stardust by defeating enemies and unlocking achievements.
          </p>
        </div>

        {/* Skins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {skins.map((skin) => {
            const isActive = skin.id === activeSkinId;
            const isDefault = skin.tier === 'default';
            const canAfford = stardust >= skin.price;

            const roleBadge = getRoleBadge(skin.role);

            return (
              <motion.div
                key={skin.id}
                className={`bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 rounded-xl p-6 transition-all cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 shadow-lg shadow-cyan-400/50'
                    : selectedSkin?.id === skin.id
                    ? 'border-purple-400 shadow-lg shadow-purple-400/30'
                    : 'border-purple-400/30 hover:border-purple-400/60'
                }`}
                onClick={() => setSelectedSkin(skin)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>

                {/* Badge Row */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {/* Active Badge */}
                  {isActive && (
                    <div className="inline-block px-3 py-1 bg-cyan-500 text-black text-xs font-bold rounded-full">
                      ✓ EQUIPPED
                    </div>
                  )}

                  {/* Owned Badge */}
                  {!isActive && skin.unlocked && !isDefault && (
                    <div className="inline-block px-3 py-1 bg-green-500/70 text-white text-xs font-bold rounded-full">
                      ✓ OWNED
                    </div>
                  )}

                  {/* Default Badge */}
                  {isDefault && !isActive && (
                    <div className="inline-block px-3 py-1 bg-gray-500/50 text-white text-xs font-bold rounded-full">
                      DEFAULT
                    </div>
                  )}

                  {/* Role Badge */}
                  {roleBadge && (
                    <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${roleBadge.color}`}>
                      {roleBadge.icon} {roleBadge.label}
                    </div>
                  )}
                </div>

                {/* Ship Preview */}
                <div className="relative h-32 mb-4 flex items-center justify-center bg-black/40 rounded-lg border border-cyan-400/20">
                  <ShipPreview filter={skin.filter} size={64} showEngineGlow={true} />
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-white mb-2 font-['Sora']">{skin.name}</h3>

                {/* Description */}
                <p className="text-sm text-cyan-200/80 mb-4 font-['Space_Grotesk'] line-clamp-2">{skin.description}</p>

                {/* Price Display */}
                <div className="mb-3 text-center">
                  {isDefault ? (
                    <div className="text-sm text-gray-400 font-['Space_Grotesk']">Free - Default Ship</div>
                  ) : skin.unlocked ? (
                    <div className="text-sm text-green-400 font-bold font-['Space_Grotesk']">✓ Owned</div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">💎</span>
                      <span className={`text-lg font-bold font-['Space_Grotesk'] ${canAfford ? 'text-purple-200' : 'text-gray-400'}`}>
                        {skin.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => setSelectedSkin(skin)}
                  className="w-full px-4 py-2 rounded-lg font-bold transition-all font-['Space_Grotesk'] bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 border border-purple-400/40 text-white">
                  View Details & Superpowers
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Tip */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-purple-900/40 border border-purple-400/40 rounded-lg px-6 py-4 max-w-2xl">
            <p className="text-sm text-purple-200 font-['Space_Grotesk']">
              💡 <strong>Tip:</strong> Earn more Stardust by defeating enemies, completing waves, and unlocking achievements!
            </p>
          </div>
        </div>

        {/* Bottom Back Button */}
        <div className="mt-8 mb-8 text-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600/60 to-blue-600/60 hover:from-cyan-500/70 hover:to-blue-500/70 border-2 border-cyan-400/60 rounded-lg transition-all font-['Space_Grotesk'] font-bold shadow-lg shadow-cyan-500/30 mx-auto">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Game</span>
          </button>
        </div>
      </div>

      {/* Shop Item Modal */}
      {selectedSkin && (
        <ShopItemModal
          skin={{
            ...selectedSkin,
            isPurchased: selectedSkin.unlocked,
            isDefault: selectedSkin.tier === 'default'
          }}
          onClose={() => setSelectedSkin(null)}
          onPurchase={handlePurchase}
          onEquip={handleEquip}
          canAfford={stardust >= selectedSkin.price}
          isActive={selectedSkin.id === activeSkinId}
        />
      )}

      {/* Purchase Success Notification */}
      <AnimatePresence>
        {showPurchaseSuccess && (
          <motion.div
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-400 rounded-xl px-8 py-4 shadow-2xl shadow-green-500/50"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="text-white font-bold text-center">
              <div className="text-2xl mb-1">🎉 Purchase Successful!</div>
              <div className="text-lg font-['Space_Grotesk']">{purchasedSkinName} unlocked! Click "Equip Ship" if you want to use it now.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
