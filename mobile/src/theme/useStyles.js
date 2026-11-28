/**
 * Memoizes `StyleSheet.create` objects keyed by resolved theme and active script language.
 * Deliberately expects callers to pass a module-level factory function for stable memoization.
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useSettingsStore } from '@/store/settings';
import { getFontFamilies } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

/**
 * Calls `factory(theme, fonts)` and caches the compiled React Native `StyleSheet` per theme and language.
 *
 * @param {(theme: object, fonts: object) => object} factory - Pure style factory defined at module scope.
 * @returns {object} Memoized `StyleSheet.create` stylesheet object.
 */
export function useStyles(factory) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);

  return useMemo(() => {
    const fonts = getFontFamilies(language);
    return StyleSheet.create(factory(theme, fonts));
  }, [factory, theme, language]);
}
