import { useNavigate, useLocation } from 'react-router-dom';
import { useGameEngine } from '@/contexts/GameEngineContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { GameEngine } from '@/lib/game/GameEngine';
import ShopItemModal from '@/components/game/ShopItemModal';
import ShipPreview from '@/components/game/ShipPreview';
import { Module, ModuleCategory, ModuleTier } from '@/lib/game/progression/ProgressionTypes';

type ShopTab = 'ships' | 'modules';

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

  // Module state
  const [activeTab, setActiveTab] = useState<ShopTab>('ships');
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [achievementCount, setAchievementCount] = useState(0);
  const [slotsUnlocked, setSlotsUnlocked] = useState(0);
  const [equippedModules, setEquippedModules] = useState<string[]>([]);

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
      // Ship data
      setSkins(engine.cosmeticManager.getAllSkins());
      setStardust(engine.currencyManager.getStardust());
      setActiveSkinId(engine.cosmeticManager.getActiveSkin().id);

      // Module data
      setModules(engine.moduleManager.getAllModules());
      setAchievementCount(engine.achievementManager.getUnlockedAchievements().length);
      setSlotsUnlocked(engine.moduleManager.getSlotsUnlocked());
      setEquippedModules(engine.moduleManager.getEquippedModules().map(m => m.id));

      // Listen for currency changes
      const handleCurrencyChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.balance !== undefined) {
          setStardust(customEvent.detail.balance);
        }
      };

      // Listen for module changes
      const handleModuleChange = () => {
        setModules(engine.moduleManager.getAllModules());
        setEquippedModules(engine.moduleManager.getEquippedModules().map(m => m.id));
        setSlotsUnlocked(engine.moduleManager.getSlotsUnlocked());
      };

      window.addEventListener('currency-changed', handleCurrencyChange);
      window.addEventListener('module-purchased', handleModuleChange);
      window.addEventListener('module-equipped', handleModuleChange);
      window.addEventListener('module-unequipped', handleModuleChange);

      return () => {
        window.removeEventListener('currency-changed', handleCurrencyChange);
        window.removeEventListener('module-purchased', handleModuleChange);
        window.removeEventListener('module-equipped', handleModuleChange);
        window.removeEventListener('module-unequipped', handleModuleChange);
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

  // Module handlers
  const handleModulePurchase = (moduleId: string) => {
    if (engine) {
      const result = engine.moduleManager.purchaseModule(moduleId as any);
      if (result.success) {
        setModules(engine.moduleManager.getAllModules());
        setStardust(engine.currencyManager.getStardust());
        setPurchasedSkinName(result.message);
        setShowPurchaseSuccess(true);
        setTimeout(() => setShowPurchaseSuccess(false), 4000);
      }
    }
  };

  const handleModuleEquip = (moduleId: string, slot: number) => {
    if (engine) {
      const result = engine.moduleManager.equipModule(moduleId as any, slot);
      if (result.success) {
        setEquippedModules(engine.moduleManager.getEquippedModules().map(m => m.id));
      }
    }
  };

  const handleModuleUnequip = (slot: number) => {
    if (engine) {
      const result = engine.moduleManager.unequipModule(slot);
      if (result.success) {
        setEquippedModules(engine.moduleManager.getEquippedModules().map(m => m.id));
      }
    }
  };

  // Module helper functions
  const getTierColor = (tier: ModuleTier) => {
    switch (tier) {
      case 'basic': return 'border-gray-400 bg-gray-500/20';
      case 'advanced': return 'border-blue-400 bg-blue-500/20';
      case 'elite': return 'border-purple-400 bg-purple-500/20';
      case 'legendary': return 'border-yellow-400 bg-yellow-500/20';
    }
  };

  const getTierBadge = (tier: ModuleTier) => {
    switch (tier) {
      case 'basic': return { label: 'Basic', color: 'bg-gray-500' };
      case 'advanced': return { label: 'Advanced', color: 'bg-blue-500' };
      case 'elite': return { label: 'Elite', color: 'bg-purple-500' };
      case 'legendary': return { label: 'Legendary', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' };
    }
  };

  const getCategoryIcon = (category: ModuleCategory) => {
    switch (category) {
      case 'offensive': return '⚔️';
      case 'defensive': return '🛡️';
      case 'utility': return '✨';
    }
  };

  const isModuleLocked = (module: Module) => {
    if (achievementCount < module.achievementCountRequired) return true;
    if (module.specificAchievement && engine) {
      const achievement = engine.achievementManager.getAchievementById(module.specificAchievement);
      if (!achievement?.unlocked) return true;
    }
    return false;
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
              {activeTab === 'ships' ? '🛍️ SHIP SHOP' : '🔧 MODULES'}
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
        {/* Tab Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('ships')}
            className={`px-8 py-3 rounded-lg font-bold font-['Space_Grotesk'] transition-all text-lg ${
              activeTab === 'ships'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/40'
                : 'bg-gray-800/60 text-gray-300 border-2 border-gray-600 hover:border-gray-400'
            }`}>
            🚀 Ships
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-8 py-3 rounded-lg font-bold font-['Space_Grotesk'] transition-all text-lg ${
              activeTab === 'modules'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/40'
                : 'bg-gray-800/60 text-gray-300 border-2 border-gray-600 hover:border-gray-400'
            }`}>
            🔧 Modules
          </button>
        </div>

        {/* Intro Text */}
        <div className="mb-8 text-center">
          <p className="text-lg text-cyan-300 font-['Space_Grotesk'] max-w-2xl mx-auto">
            {activeTab === 'ships'
              ? 'Customize your ship with exclusive skins! Earn Stardust by defeating enemies and unlocking achievements.'
              : 'Enhance your ship with powerful modules! Unlock slots by leveling up and defeating bosses.'}
          </p>
          {activeTab === 'modules' && (
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <div className="px-3 py-1 bg-purple-500/20 border border-purple-400/40 rounded-lg">
                <span className="text-purple-300">🏆 Achievements: {achievementCount}/30</span>
              </div>
              <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/40 rounded-lg">
                <span className="text-cyan-300">🔓 Slots: {slotsUnlocked}/3</span>
              </div>
            </div>
          )}
        </div>

        {/* Ships Tab Content */}
        {activeTab === 'ships' && (
          <>
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
          </>
        )}

        {/* Modules Tab Content */}
        {activeTab === 'modules' && (
          <>
            {/* Equipped Modules Section */}
            <div className="mb-8 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-2 border-purple-400/40 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 font-['Sora']">⚙️ Equipped Modules</h2>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((slot) => {
                  const isUnlocked = slot < slotsUnlocked;
                  const equippedModule = engine?.moduleManager.getEquippedModules()[slot];

                  return (
                    <div
                      key={slot}
                      className={`relative p-4 rounded-lg border-2 min-h-[120px] flex flex-col items-center justify-center ${
                        isUnlocked
                          ? equippedModule
                            ? `${getTierColor(equippedModule.tier)} border-dashed`
                            : 'bg-gray-800/40 border-gray-500/40 border-dashed'
                          : 'bg-gray-900/60 border-gray-700/40'
                      }`}>
                      {isUnlocked ? (
                        equippedModule ? (
                          <>
                            <div className="text-3xl mb-1">{equippedModule.icon}</div>
                            <div className="text-sm font-bold text-white text-center">{equippedModule.name}</div>
                            <div className="text-xs text-cyan-300 text-center">{equippedModule.effect.description}</div>
                            <button
                              onClick={() => handleModuleUnequip(slot)}
                              className="mt-2 px-3 py-1 text-xs bg-red-500/60 hover:bg-red-500/80 border border-red-400/40 rounded text-white">
                              Unequip
                            </button>
                          </>
                        ) : (
                          <div className="text-gray-400 text-center">
                            <div className="text-2xl mb-1">➕</div>
                            <div className="text-xs">Empty Slot {slot + 1}</div>
                          </div>
                        )
                      ) : (
                        <div className="text-gray-500 text-center">
                          <div className="text-2xl mb-1">🔒</div>
                          <div className="text-xs">
                            {slot === 0 ? 'Level 3 or Boss 1' : slot === 1 ? 'Level 5' : 'Level 10'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Categories */}
            {(['offensive', 'defensive', 'utility'] as ModuleCategory[]).map((category) => {
              const categoryModules = modules.filter(m => m.category === category);
              if (categoryModules.length === 0) return null;

              return (
                <div key={category} className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 font-['Sora'] capitalize">
                    {getCategoryIcon(category)} {category} Modules
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryModules.map((module) => {
                      const locked = isModuleLocked(module);
                      const canAfford = stardust >= module.price;
                      const isEquipped = equippedModules.includes(module.id);
                      const tierBadge = getTierBadge(module.tier);

                      return (
                        <motion.div
                          key={module.id}
                          className={`bg-gradient-to-br from-gray-900/60 to-gray-800/60 border-2 rounded-xl p-4 transition-all ${
                            locked
                              ? 'border-gray-600/40 opacity-60'
                              : isEquipped
                              ? 'border-cyan-400 shadow-lg shadow-cyan-400/30'
                              : module.owned
                              ? 'border-green-400/60'
                              : getTierColor(module.tier)
                          }`}
                          whileHover={{ scale: locked ? 1 : 1.02 }}>
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{module.icon}</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${tierBadge.color} text-white`}>
                              {tierBadge.label}
                            </span>
                          </div>

                          {/* Name */}
                          <h3 className="text-lg font-bold text-white mb-1 font-['Sora']">{module.name}</h3>

                          {/* Effect */}
                          <div className="text-sm text-cyan-300 font-['Space_Grotesk'] mb-2">
                            {module.effect.description}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-gray-400 mb-3 font-['Space_Grotesk']">{module.description}</p>

                          {/* Status / Actions */}
                          {locked ? (
                            <div className="text-xs text-gray-500 text-center">
                              🔒 {module.achievementCountRequired > achievementCount
                                ? `Need ${module.achievementCountRequired} achievements`
                                : `Requires "${module.specificAchievement}" achievement`}
                            </div>
                          ) : module.owned ? (
                            isEquipped ? (
                              <div className="text-sm text-cyan-400 font-bold text-center">✓ Equipped</div>
                            ) : (
                              <div className="flex gap-2">
                                {[0, 1, 2].filter(s => s < slotsUnlocked).map((slot) => (
                                  <button
                                    key={slot}
                                    onClick={() => handleModuleEquip(module.id, slot)}
                                    className="flex-1 px-2 py-1.5 text-xs bg-cyan-600/60 hover:bg-cyan-600/80 border border-cyan-400/40 rounded text-white font-bold">
                                    Slot {slot + 1}
                                  </button>
                                ))}
                              </div>
                            )
                          ) : (
                            <button
                              onClick={() => handleModulePurchase(module.id)}
                              disabled={!canAfford}
                              className={`w-full px-3 py-2 rounded-lg font-bold text-sm font-['Space_Grotesk'] transition-all ${
                                canAfford
                                  ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 border border-purple-400/40 text-white'
                                  : 'bg-gray-700/60 border border-gray-500/40 text-gray-400 cursor-not-allowed'
                              }`}>
                              💎 {module.price.toLocaleString()}
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Module Tips */}
            <div className="mt-8 text-center">
              <div className="inline-block bg-purple-900/40 border border-purple-400/40 rounded-lg px-6 py-4 max-w-2xl">
                <p className="text-sm text-purple-200 font-['Space_Grotesk']">
                  💡 <strong>Tip:</strong> Unlock more achievements to access Advanced, Elite, and Legendary modules! Same-type modules cannot be stacked.
                </p>
              </div>
            </div>
          </>
        )}

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
