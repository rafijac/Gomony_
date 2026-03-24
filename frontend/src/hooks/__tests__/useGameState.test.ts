import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../useGameState';

describe('useGameState', () => {
  it('initializes with the default board and player', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.board).toBeDefined();
    expect(result.current.currentPlayer).toBe(1);
  });

  it('can reset the game state', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.resetGame();
    });
    expect(result.current.board).toBeDefined();
    expect(result.current.currentPlayer).toBe(1);
  });

  it('can update the board and player', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.setBoard([[[1]]]);
      result.current.setCurrentPlayer(2);
    });
    expect(result.current.board).toEqual([[[1]]]);
    expect(result.current.currentPlayer).toBe(2);
  });
});
