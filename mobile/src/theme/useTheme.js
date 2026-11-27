import { useColorScheme } from 'react-native';
import { getTheme } from './tokens';
import { useSettingsStore } from '@/store/settings';

export function useTheme() {
  const systemScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const resolvedScheme = themePreference === 'system' ? (systemScheme ?? 'light') : themePreference;
  return getTheme(resolvedScheme);
}
