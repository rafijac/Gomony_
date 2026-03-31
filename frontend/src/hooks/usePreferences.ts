import { useState, useEffect } from 'react';

export interface Preferences {
  sound: boolean;
  animation: boolean;
  boardOrientation: 'north' | 'south';
  accessibility: boolean;
  theme: 'light' | 'dark';
}

const defaultPreferences: Preferences = {
  sound: true,
  animation: true,
  boardOrientation: 'south',
  accessibility: false,
  theme: 'light',
};

export function getStoredPreferences(): Preferences {
  try {
    const stored = localStorage.getItem('gomony-preferences');
    if (stored) return { ...defaultPreferences, ...JSON.parse(stored) };
  } catch {}
  return defaultPreferences;
}

export function setStoredPreferences(prefs: Preferences) {
  localStorage.setItem('gomony-preferences', JSON.stringify(prefs));
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(getStoredPreferences());

  useEffect(() => {
    setStoredPreferences(preferences);
  }, [preferences]);

  return [preferences, setPreferences] as const;
}
