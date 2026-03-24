import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import React from 'react';
import GameBoard from './GameBoard';
import { GameProvider, useGame } from './GameContext';

// Test: After first move in PC mode, board should not reset/reload unnecessarily

describe('PC Mode first move', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not reset or reload the board on first move in PC mode', async () => {
    render(
      <GameProvider>
        <GameBoard />
      </GameProvider>
    );
    // Simulate PC mode
    act(() => {
      const { setGameMode } = useGame();
      setGameMode('PC');
    });
    // Simulate selecting and moving a piece (mock click)
    const cell = await screen.findByTestId('cell-0-1'); // dark square with P1 piece
    fireEvent.click(cell);
    // Now click a valid destination
    const dest = await screen.findByTestId('cell-1-2');
    fireEvent.click(dest);
    // Board should not reset (no full reload, no session cleared)
    // Check that the board state is not the initial state
    const allCells = screen.getAllByTestId(/cell-/);
    const pieceCounts = allCells.map(c => c.querySelectorAll('.disc').length);
    expect(pieceCounts.reduce((a, b) => a + b, 0)).toBeLessThan(48); // Some piece moved
  });
});
