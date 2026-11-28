/**
 * @file Summary counters and quick-action shortcuts pinned above the Today edition feed.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  root: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  statCardAlert: {
    borderColor: theme.colors.accent,
  },
  statCardPressed: {
    opacity: 0.85,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxNeem: {
    backgroundColor: theme.colors.neemSoft,
  },
  iconBoxAccent: {
    backgroundColor: theme.colors.accentSoft,
  },
  statCount: {
    ...typeScale.masthead,
    ...typeScale.tabular,
    color: theme.colors.ink,
    fontFamily: fonts.headline,
    marginTop: 4,
  },
  statCountAlert: {
    color: theme.colors.accent,
  },
  statLabel: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.bodyMedium,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
});

/**
 * Renders watch/deadline stat cards and quick navigation actions (link, photo, Circles).
 *
 * @param {object} props - Component props.
 * @param {number} props.watchCount - Active watch count displayed on the first stat card.
 * @param {number} props.activeDeadlinesCount - Pending deadline count; triggers accent highlight above 0.
 * @returns {JSX.Element} Feed header dashboard block.
 */
export function TodayHeaderPanels({ watchCount, activeDeadlinesCount }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const quickActions = [
    {
      icon: 'link-outline',
      label: t('add.pasteLink'),
      route: '/add/link',
      tint: theme.colors.neel,
    },
    {
      icon: 'camera-outline',
      label: t('add.scanPhoto'),
      route: '/add/photo',
      tint: theme.colors.accent,
    },
    {
      icon: 'people-outline',
      label: t('circles.title'),
      route: '/circles',
      tint: theme.colors.neem,
    },
  ];

  const hasDeadlines = activeDeadlinesCount > 0;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/watching')}
          style={({ pressed }) => [styles.statCard, pressed ? styles.statCardPressed : null]}
        >
          <View style={styles.statTop}>
            <View style={[styles.iconBox, styles.iconBoxNeem]}>
              <Ionicons name="eye-outline" size={18} color={theme.colors.neem} />
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
          </View>
          <Text style={styles.statCount}>{watchCount}</Text>
          <Text numberOfLines={1} style={styles.statLabel}>
            {t('tabs.watching')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/deadlines')}
          style={({ pressed }) => [
            styles.statCard,
            hasDeadlines ? styles.statCardAlert : null,
            pressed ? styles.statCardPressed : null,
          ]}
        >
          <View style={styles.statTop}>
            <View style={[styles.iconBox, styles.iconBoxAccent]}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.accent} />
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
          </View>
          <Text style={[styles.statCount, hasDeadlines ? styles.statCountAlert : null]}>
            {activeDeadlinesCount}
          </Text>
          <Text numberOfLines={1} style={styles.statLabel}>
            {t('tabs.deadlines')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        {quickActions.map((act) => (
          <Pressable
            key={act.route}
            accessibilityRole="button"
            onPress={() => router.push(act.route)}
            style={({ pressed }) => [styles.actionBtn, pressed ? styles.statCardPressed : null]}
          >
            <Ionicons name={act.icon} size={18} color={act.tint} />
            <Text numberOfLines={1} style={styles.actionLabel}>
              {act.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
