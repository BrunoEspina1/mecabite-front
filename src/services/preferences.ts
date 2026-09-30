/**
 * What the person chose for the app, kept on the device: light or dark theme and the hand they sign with.
 */

import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

import { kv } from '@/services/api/storage';

export type ThemeName = 'light' | 'dark';
export type Hand = 'left' | 'right';

export type Preferences = {
  theme: ThemeName;
  /** `null` until the person chooses, on the welcome screen. */
  hand: Hand | null;
};

export const HAND_OPTIONS: readonly { value: Hand; label: string }[] = [
  { value: 'left', label: 'Izquierda' },
  { value: 'right', label: 'Derecha' },
];

const STORAGE_KEY = 'preferences';
const DEFAULTS: Preferences = { theme: 'light', hand: null };

function load(): Preferences {
  try {
    const raw = kv.get(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/** Keyboards, alerts and the tab bar are drawn by the system: tell it which theme the app is in. */
function applyTheme(theme: ThemeName) {
  try {
    Appearance.setColorScheme(theme);
  } catch {
    // Not available on this platform: only the app's own colours change.
  }
}

let current = load();
applyTheme(current.theme);
const listeners = new Set<() => void>();

export function getPreferences(): Preferences {
  return current;
}

export function updatePreferences(patch: Partial<Preferences>) {
  current = { ...current, ...patch };
  kv.set(STORAGE_KEY, JSON.stringify(current));
  if (patch.theme) applyTheme(patch.theme);
  listeners.forEach((listener) => listener());
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getPreferences,
  );
}
