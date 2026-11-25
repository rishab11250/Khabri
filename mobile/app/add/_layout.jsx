import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';

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
