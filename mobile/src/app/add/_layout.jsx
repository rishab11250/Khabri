/**
 * @file Headerless Stack layout for watch-addition flows (choice, link, photo, result).
 */
import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

/**
 * Stack navigator wrapping add-watch subroutes.
 *
 * @returns {JSX.Element} Configured Expo Router stack.
 */
export default function AddLayout() {
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
