/**
 * Signs approved in practice since the app was opened.
 * Kept in memory on purpose: there are no accounts or profiles to attach it to yet, so it starts empty on
 * every launch. When they exist, this is the one place to load and save it.
 */

import { useSyncExternalStore } from 'react';

let completed: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Call when a practice session approves the sign. */
export function markSignCompleted(id: string) {
  if (completed.has(id)) return;
  completed = new Set(completed).add(id);
  listeners.forEach((listener) => listener());
}

/** IDs of the signs approved so far. */
export function useCompletedSigns(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, () => completed);
}
