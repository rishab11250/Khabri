/**
 * @file Root Expo Router layout mounting i18n initialization, global providers, and stack navigator.
 */
import '@/i18n';

import { Stack } from 'expo-router';
import { useMemo } from 'react';

import { AppProviders } from '@/components/AppProviders';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useTheme } from '@/theme/useTheme';

/**
 * Boots fonts/stores and wraps all routes with shared application providers.
 *
 * @returns {JSX.Element | null} Root provider tree or `null` while bootstrapping.
 */
export default function RootLayout() {
  const theme = useTheme();
  const isReady = useAppBootstrap();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }),
    [theme.colors.background],
  );

  if (!isReady) {
    return null;
  }

  return (
    <AppProviders ready={isReady}>
      <Stack screenOptions={screenOptions} />
    </AppProviders>
  );
}
