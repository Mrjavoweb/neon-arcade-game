import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameEngine } from '@/lib/game/GameEngine';
import { GameState, GameStats } from '@/lib/game/types';
import GameHUD from './GameHUD';
import GameOverlay from './GameOverlay';

interface GameCanvasProps {
  isMobile: boolean;
}

export default function GameCanvas({ isMobile }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<GameState>('playing');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    lives: 3,
    wave: 1,
    enemiesDestroyed: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reinitialize game engine if it exists
      if (gameEngineRef.current) {
        const oldStats = gameEngineRef.current.stats;
        const oldState = gameEngineRef.current.state;
        gameEngineRef.current.cleanup();
        
        gameEngineRef.current = new GameEngine(canvas, isMobile);
        gameEngineRef.current.stats = oldStats;
        gameEngineRef.current.state = oldState;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize game engine
    gameEngineRef.current = new GameEngine(canvas, isMobile);

    // Game loop
    const gameLoop = () => {
      const engine = gameEngineRef.current;
      if (!engine) return;

      engine.update();
      engine.render();

      // Update React state
      setGameState(engine.state);
      setStats({ ...engine.stats });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gameEngineRef.current) {
        gameEngineRef.current.cleanup();
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isMobile]);

  const handleResume = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.state = 'playing';
    }
  };

  const handleRestart = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.reset();
    }
  };

  const handleMainMenu = () => {
    navigate('/');
  };

  const handlePause = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.togglePause();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0014]">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ touchAction: 'none' }}
      />
      
      <GameHUD stats={stats} />
      
      <GameOverlay
        state={gameState}
        stats={stats}
        onResume={handleResume}
        onRestart={handleRestart}
        onMainMenu={handleMainMenu}
      />

      {/* Mobile pause button */}
      {isMobile && gameState === 'playing' && (
        <button
          onClick={handlePause}
          className="absolute top-4 right-4 z-10 px-4 py-2 bg-cyan-500/30 border border-cyan-500 rounded-lg text-cyan-300 font-['Space_Grotesk'] font-bold"
          style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.4)' }}
        >
          PAUSE
        </button>
      )}

      {/* Desktop controls hint */}
      {!isMobile && gameState === 'playing' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 text-center text-sm text-blue-300/60 font-['Space_Grotesk']">
          <div>← → Move | SPACE Fire | P Pause</div>
        </div>
      )}
    </div>
  );
}
