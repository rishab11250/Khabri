/**
 * @file Headerless Stack layout for Circles screens (list, join, detail).
 */
import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

/**
 * Stack navigator wrapping Circles routes.
 *
 * @returns {JSX.Element} Configured Expo Router stack.
 */
export default function CirclesLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
