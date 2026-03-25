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
    expect(screen.getByLabelText('Sound')).toBeDisabled();
    // Example: board orientation should be disabled
    expect(screen.getByLabelText('Board Orientation')).toBeDisabled();
  });

  it('enables controls for players', () => {
    render(
      <PreferencesPanel open={true} onClose={onClose} userRole="player" />
    );
    expect(screen.getByLabelText('Sound')).not.toBeDisabled();
    expect(screen.getByLabelText('Board Orientation')).not.toBeDisabled();
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
});
