import { createContext, useContext, ReactNode, useMemo } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';

interface GameEngineContextType {
  engine: GameEngine | null;
  setEngine: (engine: GameEngine | null) => void;
}

const GameEngineContext = createContext<GameEngineContextType | undefined>(undefined);

// Stable default object to prevent re-renders when context is not found
const defaultContextValue: GameEngineContextType = {
  engine: null,
  setEngine: () => {}
};

export function useGameEngine() {
  const context = useContext(GameEngineContext);
  if (!context) {
    // During development with HMR, context might temporarily be undefined
    // Return a stable default to prevent infinite re-renders
    console.warn('useGameEngine: Context not found, returning default values');
    return defaultContextValue;
  }
  return context;
}

interface GameEngineProviderProps {
  children: ReactNode;
  engine: GameEngine | null;
  setEngine: (engine: GameEngine | null) => void;
}

export function GameEngineProvider({ children, engine, setEngine }: GameEngineProviderProps) {
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ engine, setEngine }), [engine, setEngine]);

  return (
    <GameEngineContext.Provider value={value}>
      {children}
    </GameEngineContext.Provider>
  );
}
