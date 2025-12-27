import GameHUD from '@/components/game/GameHUD';
import GameOverlay from '@/components/game/GameOverlay';
import BossHealthBar from '@/components/game/BossHealthBar';
import BossIntro from '@/components/game/BossIntro';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';
import { GameState, GameStats, BossState } from '@/lib/game/types';

export default function GamePage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number>();
  const [isMobile] = useState(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  const [gameState, setGameState] = useState<{
    state: GameState;
    stats: GameStats;
    bossState: BossState;
  }>({
    state: 'playing',
    stats: {
      score: 0,
      lives: 3,
      wave: 1,
      enemiesDestroyed: 0,
      xp: 0,
      level: 1,
      maxHealth: 3,
      fireRateBonus: 0,
      movementSpeedBonus: 0
    },
    bossState: {
      isBossWave: false,
      bossActive: false,
      bossHealth: 0,
      bossMaxHealth: 0,
      bossPhase: 'phase1',
      bossIntroTimer: 0,
      bossVictoryTimer: 0,
      lastAttackTime: 0,
      attackPattern: 'spread',
      teleportCooldown: 0
    }
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas, isMobile);
    engineRef.current = engine;

    const init = async () => {
      await engine.loadAssets();

      const gameLoop = () => {
        engine.update();

        // Update player level display
        if (engine.player) {
          engine.player.level = engine.stats.level;
        }

        engine.render();

        setGameState({
          state: engine.state,
          stats: { ...engine.stats },
          bossState: { ...engine.bossState }
        });

        animationFrameRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoop();
    };

    init();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      engine.cleanup();
    };
  }, [isMobile]);

  const handleResume = () => {
    engineRef.current?.togglePause();
  };

  const handleRestart = () => {
    engineRef.current?.reset();
  };

  const handleMainMenu = () => {
    navigate('/');
  };

  return (
    <div className="relative w-full h-screen bg-[#0a0014] overflow-hidden">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="absolute inset-0" />


      <GameHUD stats={gameState.stats} />

      <BossHealthBar
        show={gameState.bossState.bossActive}
        health={gameState.bossState.bossHealth}
        maxHealth={gameState.bossState.bossMaxHealth}
        phase={gameState.bossState.bossPhase} />


      {/* <BossIntro show={gameState.bossState.bossIntroTimer > 0} wave={gameState.stats.wave} /> */}

      <GameOverlay
        state={gameState.state}
        stats={gameState.stats}
        onResume={handleResume}
        onRestart={handleRestart}
        onMainMenu={handleMainMenu} />

    </div>);

}