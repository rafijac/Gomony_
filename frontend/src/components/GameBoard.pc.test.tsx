import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import React from 'react';
import GameBoard from './GameBoard';
import { GameProvider } from './GameContext';

// Integration test for PC mode: user move triggers AI move, disables input, and shows indicator

describe('PC Mode integration', () => {
  beforeEach(() => {
    cleanup();
  });

  it('shows PC is thinking indicator and disables input during AI turn', async () => {
    // Render with GameProvider and set PC mode
    render(
      <GameProvider>
        <GameBoard />
      </GameProvider>
    );
    // Simulate mode selection (setGameMode)
    // (In real app, this is done via modal, but here we set directly)
    // TODO: If context is not accessible, this test may need to be moved to App level
    // For now, just check that the indicator can be rendered
    // Simulate isThinking true
    // (In real test, would mock setIsThinking and postAIMove)
    // For now, check that the indicator renders
    // This is a placeholder for a more complete integration test
  });
});
