import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export function StepBar({ step, total = 4 }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.lg,
      }}
    >
      {Array.from({ length: total }, (_, idx) => {
        const active = idx < step;
        const current = idx === step - 1;
        return (
          <View
            key={idx}
            style={{
              flex: 1,
              height: 4,
              borderRadius: theme.radii.pill,
              backgroundColor: current
                ? theme.colors.accent
                : active
                  ? theme.colors.inkSurface
                  : theme.colors.surfaceAlt,
            }}
          />
        );
      })}
    </View>
  );
}
