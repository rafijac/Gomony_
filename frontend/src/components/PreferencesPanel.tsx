import React from 'react';
import { usePreferences } from '../hooks/usePreferences';

const themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function PreferencesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = usePreferences();

  if (!open) return null;

  return (
    <div className="modal-backdrop preferences-modal-backdrop">
      <div className="modal preferences-modal" role="dialog" aria-modal="true" aria-labelledby="preferences-title">
        <h2 id="preferences-title">Settings & Preferences</h2>
        <form>
          <label>
            <input
              type="checkbox"
              checked={prefs.sound}
              onChange={e => setPrefs({ ...prefs, sound: e.target.checked })}
            />
            Sound
          </label>
          <label>
            <input
              type="checkbox"
              checked={prefs.animation}
              onChange={e => setPrefs({ ...prefs, animation: e.target.checked })}
            />
            Animation
          </label>
          <label>
            Board Orientation:
            <select
              value={prefs.boardOrientation}
              onChange={e => setPrefs({ ...prefs, boardOrientation: e.target.value as 'north' | 'south' })}
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
            />
            Accessibility Mode
          </label>
          <label>
            Theme:
            <select
              value={prefs.theme}
              onChange={e => setPrefs({ ...prefs, theme: e.target.value as 'light' | 'dark' })}
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
