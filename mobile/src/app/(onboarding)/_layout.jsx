/**
 * @file Headerless Stack layout for multi-step onboarding screens.
 */
import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

/**
 * Stack navigator wrapping language, state, interests, and permission steps.
 *
 * @returns {JSX.Element} Configured Expo Router stack.
 */
export default function OnboardingLayout() {
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
