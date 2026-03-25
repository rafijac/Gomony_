import { render, screen } from '@testing-library/react';
import EndGameModal from '../EndGameModal';
import { vi } from 'vitest';

describe('EndGameModal edge/user role cases', () => {
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

  it('shows disconnect outcome for player', () => {
    render(
      <EndGameModal
        outcome="disconnect"
        player={player}
        opponent={opponent}
        isSpectator={false}
      />
    );
    expect(screen.getByText(/disconnected/i)).toBeTruthy();
  });

  it('shows abandoned outcome for spectator', () => {
    render(
      <EndGameModal
        outcome="abandoned"
        player={player}
        opponent={opponent}
        isSpectator={true}
      />
    );
    expect(screen.getByText(/abandoned/i)).toBeTruthy();
  });

  it('handles mid-game role change (player to spectator)', () => {
    // Simulate: was player, now isSpectator
    render(
      <EndGameModal
        outcome="draw"
        player={player}
        opponent={opponent}
        isSpectator={true}
      />
    );
    expect(screen.getByText('Alice vs Bob')).toBeTruthy();
    expect(screen.queryByText('Rematch')).toBeNull();
  });

  it('shows simultaneous outcome for multiplayer', () => {
    render(
      <EndGameModal
        outcome="simultaneous"
        player={player}
        opponent={opponent}
        isSpectator={false}
      />
    );
    expect(screen.getByText(/simultaneous/i)).toBeTruthy();
  });

  it('shows correct UI for AI role', () => {
    const aiPlayer = { ...player, role: 'AI' as const };
    render(
      <EndGameModal
        outcome="win"
        player={aiPlayer}
        opponent={opponent}
        isSpectator={false}
      />
    );
    expect(screen.getByText('You win!')).toBeTruthy();
    expect(screen.getByText('Alice')).toBeTruthy();
  });
});
