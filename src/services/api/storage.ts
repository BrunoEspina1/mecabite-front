import Storage from 'expo-sqlite/kv-store';

/** Tiny synchronous key-value store (SQLite on native). */
export const kv = {
  get: (key: string) => Storage.getItemSync(key),
  set: (key: string, value: string) => Storage.setItemSync(key, value),
};
