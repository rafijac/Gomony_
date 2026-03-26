
import React from 'react';
import { usePreferences } from '../hooks/usePreferences';

const themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function PreferencesPanel({ open, onClose, userRole = 'player' }: {
  open: boolean;
  onClose: () => void;
  userRole?: 'player' | 'spectator' | 'ai';
}) {
  const [prefs, setPrefs] = usePreferences();
  const [analyticsOptOut, setAnalyticsOptOut] = React.useState(() => window.localStorage.getItem('gomony.analyticsOptOut') === 'true');

  // Patch: use correct localStorage key for test compatibility
  React.useEffect(() => {
    if (open) {
      window.localStorage.setItem('gomony.preferences', JSON.stringify(prefs));
    }
  }, [prefs, open]);

  React.useEffect(() => {
    window.localStorage.setItem('gomony.analyticsOptOut', analyticsOptOut ? 'true' : '');
  }, [analyticsOptOut]);

  if (!open) return null;

  const isSpectator = userRole === 'spectator';
  const isPlayer = userRole === 'player' || userRole === 'ai';

  return (
    <div className="modal-backdrop preferences-modal-backdrop">
      <div className="modal preferences-modal" role="dialog" aria-modal="true" aria-labelledby="preferences-title">
        <h2 id="preferences-title">Settings & Preferences</h2>
        {isSpectator && (
          <div style={{ color: '#a33', fontWeight: 600, marginBottom: 12 }}>
            Spectate mode: Preferences are read-only.
          </div>
        )}
        <form>
          <label>
            <input
              type="checkbox"
              checked={analyticsOptOut}
              onChange={e => setAnalyticsOptOut(e.target.checked)}
              disabled={isSpectator}
              aria-label="Analytics Opt-Out"
            />
            Opt out of analytics (privacy)
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.sound}
              onChange={e => setPrefs({ ...prefs, sound: e.target.checked })}
              disabled={isSpectator}
              aria-label="Sound"
            />
            Sound
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.animation}
              onChange={e => setPrefs({ ...prefs, animation: e.target.checked })}
              disabled={isSpectator}
              aria-label="Animation"
            />
            Animation
          </label>
          <label>
            Board Orientation:
            <select
              value={prefs.boardOrientation}
              onChange={e => setPrefs({ ...prefs, boardOrientation: e.target.value as 'north' | 'south' })}
              disabled={isSpectator}
              aria-label="Board Orientation"
            >
              <option value="south">South (default)</option>
              <option value="north">North</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.accessibility}
              onChange={e => setPrefs({ ...prefs, accessibility: e.target.checked })}
              disabled={isSpectator}
              aria-label="Accessibility Mode"
            />
            Accessibility Mode
          </label>
          <label>
            Theme:
            <select
              value={prefs.theme}
              onChange={e => setPrefs({ ...prefs, theme: e.target.value as 'light' | 'dark' })}
              disabled={isSpectator}
              aria-label="Theme"
            >
              {themes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
        </form>
        <button className="modal-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
