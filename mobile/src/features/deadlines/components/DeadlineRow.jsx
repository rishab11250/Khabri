import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { useCountdown } from '@/hooks/useCountdown';
import { typeScale } from '@/theme/typography';

export function DeadlineRow({ item, theme, fonts, t, onToggleDone, onAddCalendar, onDelete }) {
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
  const isUrgent = !isDone && !countdown.expired && countdown.daysLeft <= 3;

  const boxBg = isDone
    ? theme.colors.neemSoft
    : countdown.expired
      ? theme.colors.surfaceAlt
      : isUrgent
        ? theme.colors.accent
        : theme.colors.surfaceAlt;

  const boxFg = isDone
    ? theme.colors.neem
    : countdown.expired
      ? theme.colors.muted
      : isUrgent
        ? theme.colors.onAccent
        : theme.colors.ink;

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
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: isUrgent ? theme.colors.accent : theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        gap: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
        <View
          style={{
            width: 78,
            minHeight: 74,
            borderRadius: theme.radii.sm,
            backgroundColor: boxBg,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: theme.spacing.xs,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <Text
            style={[
              typeScale.leadTitle,
              typeScale.tabular,
              { color: boxFg, fontFamily: fonts.headline },
            ]}
          >
            {countdownPrimary}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              typeScale.caption,
              typeScale.tabular,
              { color: boxFg, fontFamily: fonts.bodyMedium, textAlign: 'center' },
            ]}
          >
            {isDone || countdown.expired || countdown.daysLeft <= 0 ? countdownSub : dueStr}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={[
              typeScale.title,
              {
                color: theme.colors.ink,
                fontFamily: fonts.headlineSemi,
                textDecorationLine: isDone ? 'line-through' : 'none',
              },
            ]}
          >
            {item.label}
          </Text>
          <Text
            style={[
              typeScale.caption,
              typeScale.tabular,
              { color: theme.colors.muted, fontFamily: fonts.body },
            ]}
          >
            {dueStr}
            {item.sourceName ? ` · ${item.sourceName}` : ''}
          </Text>
          {oldStr ? (
            <Text
              style={[
                typeScale.caption,
                { color: theme.colors.accent, fontFamily: fonts.bodyMedium },
              ]}
            >
              {t('deadlines.movedFrom', { old: oldStr, next: dueStr })}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
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
          style={{
            minWidth: 40,
            minHeight: 40,
            borderRadius: theme.radii.sm,
            backgroundColor: theme.colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: theme.spacing.sm,
          }}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}
