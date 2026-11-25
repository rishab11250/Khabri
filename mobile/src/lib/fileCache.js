import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

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

export async function writeJsonCache(filename, data) {
  try {
    const serialized = JSON.stringify(data);
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(`khabri:${filename}`, serialized);
      return;
    }
    const file = new File(Paths.document, filename);
    if (!file.exists) {
      file.create({ intermediates: true });
    }
    file.write(serialized);
  } catch {
    // Non-fatal local cache failure
  }
}
