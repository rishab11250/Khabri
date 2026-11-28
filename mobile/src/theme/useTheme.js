/**
 * Resolves and memoizes the active light/dark theme from system appearance or user settings override.
 */
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/settings';

import { getTheme } from './tokens';

/**
 * Returns the memoized theme token object matching the user's light, dark, or system preference.
 *
 * @returns {{ scheme: 'light'|'dark', colors: object, spacing: object, radii: object, borders: object }} Active theme tokens.
 */
export function useTheme() {
  const systemScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const resolvedScheme = themePreference === 'system' ? (systemScheme ?? 'light') : themePreference;
  return useMemo(() => getTheme(resolvedScheme), [resolvedScheme]);
}
