import { render, screen } from '@testing-library/react';
import PreferencesPanel from '../PreferencesPanel';
import { vi } from 'vitest';

describe('PreferencesPanel', () => {
  const onClose = vi.fn();

  it('disables all controls for spectators', () => {
    render(
      <PreferencesPanel open={true} onClose={onClose} userRole="spectator" />
    );
    // Example: sound toggle should be disabled
    expect(screen.getByLabelText('Sound').disabled).toBe(true);
    // Example: board orientation should be disabled
    expect(screen.getByLabelText('Board Orientation').disabled).toBe(true);
  });

  it('enables controls for players', () => {
    render(
      <PreferencesPanel open={true} onClose={onClose} userRole="player" />
    );
    expect(screen.getByLabelText('Sound').disabled).toBe(false);
    expect(screen.getByLabelText('Board Orientation').disabled).toBe(false);
  });

  it('persists preferences in localStorage', () => {
    render(
      <PreferencesPanel open={true} onClose={onClose} userRole="player" />
    );
    const soundToggle = screen.getByLabelText('Sound');
    soundToggle.click();
    expect(window.localStorage.getItem('gomony.preferences')).toContain('sound');
  });

  it('shows read-only message for spectators', () => {
    render(
      <PreferencesPanel open={true} onClose={onClose} userRole="spectator" />
    );
    expect(screen.getByText(/Spectate mode/)).toBeTruthy();
  });

  it('locks avatar/name editing after game start (should fail until implemented)', () => {
    render(
      <PreferencesPanel open={true} onClose={onClose} userRole="player" editingLocked={true} />
    );
    // Avatar selector and name input should be disabled
    expect(screen.getByLabelText('Avatar').closest('button')).toBeDisabled();
    expect(screen.getByLabelText('Display Name')).toBeDisabled();
  });
});
