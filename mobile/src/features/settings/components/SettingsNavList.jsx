/**
 * @file Grouped navigation list linking settings items (Circles, About, etc.).
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    minHeight: 54,
  },
  rowBorder: {
    borderTopWidth: theme.borders.hairline,
    borderTopColor: theme.colors.ruleSubtle,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rowLabel: {
    ...typeScale.body,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
});

/**
 * Renders a bordered card of navigation rows with leading icons and trailing chevrons.
 *
 * @param {object} props - Component props.
 * @param {Array<{route: string, icon: string, label: string}>} props.items - Navigation destinations.
 * @param {Function} props.onNavigate - Route navigation handler.
 * @returns {JSX.Element} Navigation list card.
 */
export function SettingsNavList({ items, onNavigate }) {
  const theme = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.card}>
      {items.map((item, idx) => (
        <Pressable
          key={item.route}
          accessibilityRole="button"
          onPress={() => onNavigate(item.route)}
          style={({ pressed }) => [
            styles.row,
            idx > 0 ? styles.rowBorder : null,
            pressed ? styles.rowPressed : null,
          ]}
        >
          <View style={styles.rowLeft}>
            <Ionicons name={item.icon} size={20} color={theme.colors.ink} />
            <Text style={styles.rowLabel}>{item.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </Pressable>
      ))}
    </View>
  );
}
