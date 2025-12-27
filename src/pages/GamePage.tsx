import { useEffect, useState } from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import { AssetManager } from '@/lib/game/GameEngine';
import { GameAssets } from '@/lib/game/types';

export default function GamePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [assets, setAssets] = useState<Partial<GameAssets>>({});
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const assetManager = new AssetManager();
        
        // Track loading progress
        const progressInterval = setInterval(() => {
          setLoadingProgress(assetManager.getLoadProgress());
        }, 100);

        const loadedAssets = await assetManager.loadAllAssets();
        
        clearInterval(progressInterval);
        setAssets(loadedAssets);
        setLoadingProgress(1);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading game assets:', error);
        setLoadError('Failed to load game assets. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0014]">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-bold text-cyan-400 font-['Space_Grotesk'] mb-4">
            LOADING GAME ASSETS
          </h2>
          
          {/* Loading bar */}
          <div className="w-80 h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-cyan-500/30">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out"
              style={{ 
                width: `${loadingProgress * 100}%`,
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)'
              }}
            />
          </div>
          
          {/* Percentage */}
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            {Math.floor(loadingProgress * 100)}%
          </div>
          
          {/* Loading dots animation */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0014]">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-red-400 font-['Space_Grotesk']">
            ERROR
          </h2>
          <p className="text-xl text-gray-400">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-8 py-3 bg-cyan-500/30 border-2 border-cyan-500 rounded-lg text-cyan-300 font-bold hover:bg-cyan-500/50 transition-all"
            style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)' }}
          >
            RELOAD
          </button>
        </div>
      </div>
    );
  }

  return <GameCanvas isMobile={isMobile} assets={assets} />;
}