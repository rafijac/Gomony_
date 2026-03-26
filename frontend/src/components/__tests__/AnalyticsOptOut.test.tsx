import { render, screen, fireEvent } from '@testing-library/react';
import PreferencesPanel from '../PreferencesPanel';
import { vi } from 'vitest';

describe('Analytics Opt-Out (PreferencesPanel)', () => {
  const onClose = vi.fn();

  it('shows analytics opt-out toggle in preferences', () => {
    render(
      <PreferencesPanel open={true} onClose={onClose} userRole="player" />
    );
    // Fails: No analytics opt-out toggle present
    expect(screen.getByLabelText(/analytics/i)).toBeInTheDocument();
  });

  it('persists analytics opt-out preference in localStorage', () => {
    render(
      <PreferencesPanel open={true} onClose={onClose} userRole="player" />
    );
    const analyticsToggle = screen.getByLabelText(/analytics/i);
    fireEvent.click(analyticsToggle);
    // Fails: No analytics opt-out key in localStorage
    expect(window.localStorage.getItem('gomony.analyticsOptOut')).toBe('true');
  });
});
