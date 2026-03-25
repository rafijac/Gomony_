

import { render, screen, fireEvent } from '@testing-library/react';
import EndGameModal from '../EndGameModal';
import { vi } from 'vitest';

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
