/**
 * @file Deadline card displaying live countdown badge, date-shift history, calendar export, and status actions.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { useCountdown } from '@/hooks/useCountdown';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cardUrgent: {
    borderColor: theme.colors.accent,
  },
  topRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  countdownBox: {
    width: 78,
    minHeight: 74,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  boxDone: {
    backgroundColor: theme.colors.neemSoft,
  },
  boxUrgent: {
    backgroundColor: theme.colors.accent,
  },
  countdownPrimary: {
    ...typeScale.leadTitle,
    ...typeScale.tabular,
    color: theme.colors.ink,
    fontFamily: fonts.headline,
  },
  countdownSub: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.ink,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
  },
  fgDone: {
    color: theme.colors.neem,
  },
  fgExpired: {
    color: theme.colors.muted,
  },
  fgUrgent: {
    color: theme.colors.onAccent,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  label: {
    ...typeScale.title,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  labelDone: {
    textDecorationLine: 'line-through',
  },
  meta: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  movedText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
  },
  actions: {
    flexDirection: 'row',
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
 * Renders an exam/scheme deadline row with live days-left urgency highlighting.
 *
 * @param {object} props - Component props.
 * @param {object} props.item - Deadline record (`dueAt`, `previousDueAt`, `status`, `label`, `sourceName`).
 * @param {Function} props.t - Translation helper.
 * @param {Function} props.onToggleDone - Toggles active/done status.
 * @param {Function} props.onAddCalendar - Exports the deadline to the native device calendar.
 * @param {Function} props.onDelete - Deletes the deadline item.
 * @returns {JSX.Element} Deadline item card.
 */
export function DeadlineRow({ item, t, onToggleDone, onAddCalendar, onDelete }) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const countdown = useCountdown(item.dueAt);

  const dueStr = new Date(item.dueAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const oldStr = item.previousDueAt
    ? new Date(item.previousDueAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : null;

  const isDone = item.status === 'done';
  // Highlight deadlines within 3 days using the primary alert accent.
  const isUrgent = !isDone && !countdown.expired && countdown.daysLeft <= 3;

  const boxStyle = isDone
    ? styles.boxDone
    : isUrgent && !countdown.expired
      ? styles.boxUrgent
      : null;
  const fgStyle = isDone
    ? styles.fgDone
    : countdown.expired
      ? styles.fgExpired
      : isUrgent
        ? styles.fgUrgent
        : null;

  const countdownPrimary = isDone
    ? '✓'
    : countdown.expired
      ? '—'
      : countdown.daysLeft <= 0
        ? '0d'
        : `${countdown.daysLeft}d`;

  const countdownSub = isDone
    ? t('deadlines.markDone')
    : countdown.expired
      ? t('deadlines.expired')
      : countdown.daysLeft <= 0
        ? t('deadlines.dueToday')
        : dueStr;

  return (
    <View style={[styles.card, isUrgent ? styles.cardUrgent : null]}>
      <View style={styles.topRow}>
        <View style={[styles.countdownBox, boxStyle]}>
          <Text style={[styles.countdownPrimary, fgStyle]}>{countdownPrimary}</Text>
          <Text numberOfLines={1} style={[styles.countdownSub, fgStyle]}>
            {isDone || countdown.expired || countdown.daysLeft <= 0 ? countdownSub : dueStr}
          </Text>
        </View>

        <View style={styles.details}>
          <Text style={[styles.label, isDone ? styles.labelDone : null]}>{item.label}</Text>
          <Text style={styles.meta}>
            {dueStr}
            {item.sourceName ? ` · ${item.sourceName}` : ''}
          </Text>
          {oldStr ? (
            <Text style={styles.movedText}>
              {t('deadlines.movedFrom', { old: oldStr, next: dueStr })}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <NewspaperButton
          size="sm"
          variant={isDone ? 'primary' : 'secondary'}
          icon={isDone ? 'refresh-outline' : 'checkmark-circle-outline'}
          label={isDone ? t('deadlines.reopen') : t('deadlines.markDone')}
          onPress={() => onToggleDone(item)}
        />
        <NewspaperButton
          size="sm"
          variant="secondary"
          icon="calendar-outline"
          disabled={Boolean(item.calendarEventId)}
          label={
            item.calendarEventId ? t('deadlines.addedToCalendar') : t('deadlines.addToCalendar')
          }
          onPress={() => onAddCalendar(item)}
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
  );
}
