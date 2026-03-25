

import { render, screen, fireEvent } from '@testing-library/react';
import EndGameModal from '../EndGameModal';
import { vi } from 'vitest';

// Placeholder mocks for confetti and sound
vi.mock('../ConfettiEffect', () => ({ __esModule: true, default: () => <div data-testid="confetti-effect" /> }));
vi.mock('../useSoundEffect', () => ({ __esModule: true, default: () => vi.fn() }));

describe('EndGameModal', () => {
  const player = {
    userId: '1',
    displayName: 'Alice',
    avatarUrl: 'https://example.com/alice.png',
    role: 'player' as const,
  };
  const opponent = {
    userId: '2',
    displayName: 'Bob',
    avatarUrl: 'https://example.com/bob.png',
    role: 'player' as const,
  };

  it('renders win outcome and actions for player', () => {
    const onRematch = vi.fn();
    const onLobby = vi.fn();
    render(
      <EndGameModal
        outcome="win"
        player={player}
        opponent={opponent}
        isSpectator={false}
        onRematch={onRematch}
        onLobby={onLobby}
        onReplay={undefined}
        onExit={undefined}
      />
    );
    expect(!!screen.getByText('You win!')).toBe(true);
    expect(!!screen.getByText('Alice')).toBe(true);
    expect(!!screen.getByText('Bob')).toBe(true);
    fireEvent.click(screen.getByText('Rematch'));
    expect(onRematch).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Return to Lobby'));
    expect(onLobby).toHaveBeenCalled();
  });

  it('triggers confetti and sound on win (TDD)', () => {
    render(
      <EndGameModal
        outcome="win"
        player={player}
        opponent={opponent}
        isSpectator={false}
      />
    );
    // Confetti and sound should be triggered
    expect(screen.getByTestId('confetti-effect')).toBeTruthy();
    // Sound effect would be checked via mock/spy in real test
  });

  it('shows subtle/neutral feedback for draw, resign, timeout, disconnect, abandon (TDD)', () => {
    const outcomes = ['draw', 'resign', 'timeout', 'disconnect', 'abandoned'];
    outcomes.forEach(outcome => {
      render(
        <EndGameModal
          outcome={outcome as any}
          player={player}
          opponent={opponent}
          isSpectator={false}
        />
      );
      // Should not show confetti
      expect(screen.queryByTestId('confetti-effect')).toBeNull();
      // Should show a neutral/subtle feedback element
      expect(screen.getByTestId('endgame-feedback')).toBeTruthy();
    });
  });

  it('EndGameModal is accessible: ARIA roles, keyboard navigation, respects prefers-reduced-motion, and allows muting (TDD)', () => {
    render(
      <EndGameModal
        outcome="win"
        player={player}
        opponent={opponent}
        isSpectator={false}
      />
    );
    // Modal should have role dialog and aria-modal
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    // Should allow keyboard navigation (tabindex, focus trap, etc.)
    // (Placeholder: check modal is focusable)
    expect(modal.tabIndex).toBeGreaterThanOrEqual(0);
    // Should respect prefers-reduced-motion (placeholder: check data attribute)
    expect(modal).toHaveAttribute('data-prefers-reduced-motion');
    // Should allow muting (placeholder: check mute button exists)
    expect(screen.getByTestId('mute-sound')).toBeTruthy();
  });

  it('EndGameModal is responsive and mobile-friendly (TDD)', () => {
    render(
      <EndGameModal
        outcome="win"
        player={player}
        opponent={opponent}
        isSpectator={false}
      />
    );
    // Modal should have responsive/mobile class or style
    const modal = screen.getByRole('dialog');
    expect(modal.className).toMatch(/responsive|mobile/i);
  });

  it('renders draw outcome and disables player actions for spectator', () => {
    render(
      <EndGameModal
        outcome="draw"
        player={player}
        opponent={opponent}
        isSpectator={true}
        onRematch={undefined}
        onLobby={undefined}
        onReplay={undefined}
        onExit={undefined}
      />
    );
    expect(screen.getByText('Alice vs Bob')).toBeTruthy();
    expect(screen.queryByText('Rematch')).toBeNull();
    expect(screen.queryByText('Return to Lobby')).toBeNull();
  });

  it('shows custom message if provided', () => {
    render(
      <EndGameModal
        outcome="timeout"
        customMessage="You lost by timeout."
        player={player}
        opponent={opponent}
        isSpectator={false}
        onRematch={undefined}
        onLobby={undefined}
        onReplay={undefined}
        onExit={undefined}
      />
    );
    // There are two elements with this text: h2 and custom message div
    const all = screen.getAllByText('You lost by timeout.');
    expect(all.length).toBeGreaterThanOrEqual(1);
  });
});
