import '@testing-library/jest-dom';
// Polyfill ResizeObserver for jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
import { render, fireEvent, screen } from '@testing-library/react';
import Tooltip from './Tooltip';
import GameBoard from './GameBoard';
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Polyfill localStorage for Vitest/node
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length; },
  };
}

describe('GameBoard stack tooltip dismiss', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows and can dismiss the stack tooltip, which does not reappear after dismissal', () => {
    // Minimal board with one stack at (0,0)
    const board = Array.from({ length: 12 }, () => Array.from({ length: 12 }, () => []));
    board[0][0] = [1]; // Place a stack at (0,0)
    
    // Mock GameContext
    vi.spyOn(React, 'useContext').mockReturnValue({
      board,
      moveStack: vi.fn(),
      resetGame: vi.fn(),
      lastMessage: '',
      currentPlayer: 1,
      pendingJump: null,
      gameMode: 'PC',
      isThinking: false,
      setIsThinking: vi.fn(),
      orientation: 'south',
      playerNumber: 1,
      sessionExpired: false,
      setSessionExpired: vi.fn(),
      setBoardStateFromAI: vi.fn(),
    });

    render(<GameBoard Tooltip={Tooltip} />);
    // Find the stack cell (should have tooltip)
    const cell = screen.getAllByRole('button', { hidden: true })[0] || screen.getByText((_, el) => el?.className.includes('cell'));
    fireEvent.mouseEnter(cell);
    expect(screen.getByRole('tooltip').textContent).toContain('Click or drag to move this stack.');
    // Dismiss
    fireEvent.click(screen.getByLabelText(/don't show/i));
    expect(screen.queryByRole('tooltip')).toBeNull();
    // Hover again, tooltip should not reappear
    fireEvent.mouseEnter(cell);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
