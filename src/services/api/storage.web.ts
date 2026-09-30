/** Web: localStorage (expo-sqlite needs extra WASM setup on web). */
export const kv = {
  get: (key: string): string | null => {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Private mode / blocked storage: settings stay in memory.
    }
  },
};
