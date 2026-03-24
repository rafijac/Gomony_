// useGameState.ts
// Custom React hook for managing game state in Gomony
// (Stub implementation, expand as needed)
import { useContext } from 'react';
import { GameContext } from '../components/GameContext';

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}
