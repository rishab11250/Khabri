/**
 * Persists small JSON state caches safely across native Expo FileSystem and web `localStorage`.
 * Deliberately swallows filesystem errors so degraded storage never breaks app rendering.
 */
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Reads and parses a cached JSON document from document storage (or `localStorage` on web).
 *
 * @param {string} filename - Cache file name under `Paths.document`.
 * @param {*} [fallback] - Default value returned when missing or unreadable.
 * @returns {Promise<*>} Parsed cache payload or `fallback`.
 */
export async function readJsonCache(filename, fallback = null) {
  try {
    if (Platform.OS === 'web') {
      const raw = globalThis.localStorage?.getItem(`khabri:${filename}`);
      return raw ? JSON.parse(raw) : fallback;
    }
    const file = new File(Paths.document, filename);
    if (!file.exists) return fallback;
    const raw = await file.text();
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Serializes `data` into the local JSON cache (best-effort, non-throwing).
 *
 * @param {string} filename - Cache file name under `Paths.document`.
 * @param {*} data - JSON-serializable state to persist.
 * @returns {Promise<void>}
 */
export function writeJsonCache(filename, data) {
  try {
    const serialized = JSON.stringify(data);
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(`khabri:${filename}`, serialized);
      return Promise.resolve();
    }
    const file = new File(Paths.document, filename);
    if (!file.exists) {
      file.create({ intermediates: true });
    }
    file.write(serialized);
  } catch {
    // Non-fatal local cache failure
  }
  return Promise.resolve();
}
