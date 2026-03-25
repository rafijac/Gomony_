import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from './GameContext';
import ReconnectSpectator from './ReconnectSpectator';

describe('ReconnectSpectator UI', () => {
  it('shows reconnect prompt when session is lost', async () => {
    // Simulate lost session state
    render(
      <GameProvider>
        <ReconnectSpectator reconnectAvailable={true} />
      </GameProvider>
    );
    // Look for the prompt specifically
    expect(await screen.findByText('Reconnect to your game?')).toBeInTheDocument();
  });

  it('calls onReconnect when user clicks reconnect', async () => {
    const onReconnect = vi.fn();
    render(
      <GameProvider>
        <ReconnectSpectator reconnectAvailable={true} onReconnect={onReconnect} />
      </GameProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /reconnect/i }));
    expect(onReconnect).toHaveBeenCalled();
  });

  it('shows spectator join UI when in spectator mode', async () => {
    render(
      <GameProvider>
        <ReconnectSpectator spectatorMode={true} />
      </GameProvider>
    );
    expect(await screen.findByText(/spectating/i)).toBeInTheDocument();
  });

  it('shows error if reconnect fails', async () => {
    render(
      <GameProvider>
        <ReconnectSpectator reconnectAvailable={true} reconnectError="Session expired" />
      </GameProvider>
    );
    expect(await screen.findByText(/session expired/i)).toBeInTheDocument();
  });
});
