/**
 * @file Subscribed watch card with alert-tier stripe, mute/priority toggles, manual check, and delete button.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
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
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  stripeBase: {
    width: 4,
  },
  stripeMuted: {
    backgroundColor: theme.colors.muted,
  },
  stripeInstant: {
    backgroundColor: theme.colors.accent,
  },
  stripeNormal: {
    backgroundColor: theme.colors.neem,
  },
  body: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  titleCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typeScale.title,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.xs,
  },
  badgeMuted: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  badgeInstant: {
    backgroundColor: theme.colors.accentSoft,
  },
  badgeNormal: {
    backgroundColor: theme.colors.neemSoft,
  },
  badgeText: {
    ...typeScale.caption,
    fontFamily: fonts.bodyBold,
  },
  fgMuted: {
    color: theme.colors.muted,
  },
  fgInstant: {
    color: theme.colors.accent,
  },
  fgNormal: {
    color: theme.colors.neem,
  },
  unsupportedText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.body,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  deleteBtn: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
});

/**
 * Renders a watched source card allowing mute, priority, immediate refresh, and unfollow actions.
 *
 * @param {object} props - Component props.
 * @param {object} props.item - Watch record including populated `source` metadata.
 * @param {Function} props.t - Translation helper.
 * @param {Function} props.onToggleMute - Mutes or unmutes watch alerts.
 * @param {Function} props.onTogglePriority - Toggles instant vs normal alert priority.
 * @param {Function} props.onRefresh - Requests an immediate backend crawl (subject to cooldown).
 * @param {Function} props.onDelete - Removes the watch.
 * @returns {JSX.Element} Watch card element.
 */
export function WatchCard({ item, t, onToggleMute, onTogglePriority, onRefresh, onDelete }) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const src = item.source;
  const checkedStr = src?.lastFetchedAt
    ? t('watching.lastChecked', {
        time: new Date(src.lastFetchedAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    : t('watching.neverChecked');

  const isInstant = item.priority === 'instant';
  const stripeTone = item.muted
    ? styles.stripeMuted
    : isInstant
      ? styles.stripeInstant
      : styles.stripeNormal;
  const badgeTone = item.muted
    ? styles.badgeMuted
    : isInstant
      ? styles.badgeInstant
      : styles.badgeNormal;
  const fgTone = item.muted ? styles.fgMuted : isInstant ? styles.fgInstant : styles.fgNormal;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.stripeBase, stripeTone]} />
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={styles.titleCol}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={theme.colors.muted} />
                <Text style={styles.metaText}>
                  {src?.category || 'notice'} · {checkedStr}
                </Text>
              </View>
            </View>

            <View style={[styles.badge, badgeTone]}>
              <Text style={[styles.badgeText, fgTone]}>
                {item.muted
                  ? t('watching.muted')
                  : isInstant
                    ? t('watching.instant')
                    : t('watching.normal')}
              </Text>
            </View>
          </View>

          {src?.unsupported ? (
            <Text style={styles.unsupportedText}>{t('watching.unsupported')}</Text>
          ) : null}

          <View style={styles.actions}>
            <NewspaperButton
              size="sm"
              variant={item.muted ? 'primary' : 'secondary'}
              icon={item.muted ? 'notifications-off-outline' : 'notifications-outline'}
              label={item.muted ? t('watching.muted') : t('watching.mute')}
              onPress={() => onToggleMute(item)}
            />
            <NewspaperButton
              size="sm"
              variant={isInstant ? 'ink' : 'secondary'}
              icon="flash-outline"
              label={isInstant ? t('watching.instant') : t('watching.normal')}
              onPress={() => onTogglePriority(item)}
            />
            <NewspaperButton
              size="sm"
              variant="secondary"
              icon="refresh-outline"
              label={t('watching.refresh')}
              onPress={() => onRefresh(item.id)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('watching.remove')}
              onPress={() => onDelete(item.id)}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.accent} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
