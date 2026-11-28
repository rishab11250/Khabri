/**
 * @file Standard safe-area screen wrapper applying background paper color and horizontal gutters.
 */
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStyles } from '@/theme/useStyles';

const createStyles = (theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
});

/**
 * Wraps screen content in top/side safe-area insets and standard padding.
 *
 * @param {object} props - Component props.
 * @param {JSX.Element | JSX.Element[]} props.children - Screen body content.
 * @returns {JSX.Element} Safe-area padded container.
 */
export function ScreenShell({ children }) {
  const styles = useStyles(createStyles);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}
