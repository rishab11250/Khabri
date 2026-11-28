/**
 * @file Pressable list row displaying a Circle's name, invite code, and member count.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  row: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPressed: {
    opacity: 0.85,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  meta: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
});

/**
 * Renders a Circle summary card navigating to Circle detail on tap.
 *
 * @param {object} props - Component props.
 * @param {object} props.item - Circle summary object (`name`, `inviteCode`, `memberCount`).
 * @param {Function} props.t - Translation helper.
 * @param {Function} props.onPress - Navigation press handler.
 * @returns {JSX.Element} Pressable Circle card row.
 */
export function CircleRow({ item, t, onPress }) {
  const theme = useTheme();
  const styles = useStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.textCol}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.meta}>
          {t('circles.inviteCode', { code: item.inviteCode })} · {item.memberCount}/30
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
    </Pressable>
  );
}
