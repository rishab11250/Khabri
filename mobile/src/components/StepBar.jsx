/**
 * @file Horizontal segmented progress bar for multi-step onboarding screens.
 */
import { View } from 'react-native';

import { useStyles } from '@/theme/useStyles';

const createStyles = (theme) => ({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: theme.radii.pill,
  },
  barCurrent: {
    backgroundColor: theme.colors.accent,
  },
  barActive: {
    backgroundColor: theme.colors.inkSurface,
  },
  barInactive: {
    backgroundColor: theme.colors.surfaceAlt,
  },
});

/**
 * Renders a segmented step indicator highlighting completed and current steps.
 *
 * @param {object} props - Component props.
 * @param {number} props.step - 1-based index of the current active step.
 * @param {number} [props.total=4] - Total number of segments to render.
 * @returns {JSX.Element} Step indicator row.
 */
export function StepBar({ step, total = 4 }) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, idx) => {
        const active = idx < step;
        const current = idx === step - 1;
        const tone = current ? styles.barCurrent : active ? styles.barActive : styles.barInactive;
        return <View key={idx} style={[styles.bar, tone]} />;
      })}
    </View>
  );
}
