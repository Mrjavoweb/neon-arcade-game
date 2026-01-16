import { createContext, useContext, ReactNode } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';

interface GameEngineContextType {
  engine: GameEngine | null;
  setEngine: (engine: GameEngine | null) => void;
}

const GameEngineContext = createContext<GameEngineContextType | undefined>(undefined);

export function useGameEngine() {
  const context = useContext(GameEngineContext);
  if (!context) {
    // During development with HMR, context might temporarily be undefined
    // Return a safe default instead of throwing
    console.warn('useGameEngine: Context not found, returning default values');
    return { engine: null, setEngine: () => {} };
  }
  return context;
}

interface GameEngineProviderProps {
  children: ReactNode;
  engine: GameEngine | null;
  setEngine: (engine: GameEngine | null) => void;
}

export function GameEngineProvider({ children, engine, setEngine }: GameEngineProviderProps) {
  return (
    <GameEngineContext.Provider value={{ engine, setEngine }}>
      {children}
    </GameEngineContext.Provider>);

}