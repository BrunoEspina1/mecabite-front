/**
 * Connection settings, persisted on the device. The backend URL changes with the
 * laptop's Wi-Fi IP, so it must never be hard-coded (contract: "URL base configurable").
 */

import * as Device from 'expo-device';
import { useSyncExternalStore } from 'react';

import { kv } from '@/services/api/storage';

export type ApiSettings = {
  /** e.g. http://192.168.1.20:8000 — without the /api/v1 suffix. */
  baseUrl: string;
  /** Use the in-app simulated backend instead of the real one. */
  useMock: boolean;
  participantId: string;
  /** Store landmarks on the backend for training. Only with the person's consent. */
  record: boolean;
};

const STORAGE_KEY = 'api-settings';
const DEVICE_ID_KEY = 'device-id';

const DEFAULTS: ApiSettings = {
  // Works on the iOS simulator; a physical iPhone needs the laptop's IP.
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000',
  useMock: true,
  participantId: 'p01',
  record: false,
};

function load(): ApiSettings {
  try {
    const raw = kv.get(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ApiSettings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

let current = load();
const listeners = new Set<() => void>();

export function getApiSettings(): ApiSettings {
  return current;
}

export function updateApiSettings(patch: Partial<ApiSettings>) {
  current = { ...current, ...patch, baseUrl: (patch.baseUrl ?? current.baseUrl).trim().replace(/\/+$/, '') };
  kv.set(STORAGE_KEY, JSON.stringify(current));
  listeners.forEach((listener) => listener());
}

export function useApiSettings(): ApiSettings {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getApiSettings,
  );
}

/** Stable per-install id, e.g. "iphone-15-4f9a2c". */
export function getDeviceId(): string {
  const existing = kv.get(DEVICE_ID_KEY);
  if (existing) return existing;
  const model = (Device.modelName ?? 'device').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = `${model}-${Math.random().toString(16).slice(2, 8)}`;
  kv.set(DEVICE_ID_KEY, id);
  return id;
}

export const restUrl = (baseUrl: string) => `${baseUrl}/api/v1`;

export const wsUrl = (baseUrl: string, websocketPath: string) =>
  `${baseUrl.replace(/^http/, 'ws')}${websocketPath}`;
