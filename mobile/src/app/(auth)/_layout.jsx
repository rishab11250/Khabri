/**
 * @file Headerless Stack layout for authentication screens.
 */
import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

/**
 * Stack navigator wrapping sign-in and sign-up screens.
 *
 * @returns {JSX.Element} Configured Expo Router stack.
 */
export default function AuthLayout() {
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
