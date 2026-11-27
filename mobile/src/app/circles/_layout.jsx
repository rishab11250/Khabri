import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

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
