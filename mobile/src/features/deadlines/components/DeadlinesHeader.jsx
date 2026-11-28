/**
 * @file Deadlines dashboard header with status counters, view switcher, CSV export, and creation form.
 */
import { Controller } from 'react-hook-form';
import { Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { NewspaperButton } from '@/components/NewspaperButton';
import { MonthCalendar } from '@/features/deadlines/components/MonthCalendar';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  root: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  statValue: {
    ...typeScale.leadTitle,
    ...typeScale.tabular,
    fontFamily: fonts.headline,
  },
  statInk: {
    color: theme.colors.ink,
  },
  statAccent: {
    color: theme.colors.accent,
  },
  statNeem: {
    color: theme.colors.neem,
  },
  statLabel: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  flexOne: {
    flex: 1,
  },
  addCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
  },
});

/**
 * Renders summary metric cards, list/calendar toggle, optional add form, and inline month view.
 *
 * @param {object} props - Component props.
 * @param {Function} props.t - Translation helper.
 * @param {number} props.activeCount - Total pending deadlines.
 * @param {number} props.dueSoonCount - Pending deadlines due within 7 days.
 * @param {number} props.doneCount - Completed deadlines count.
 * @param {'list' | 'calendar'} props.viewMode - Selected presentation mode.
 * @param {Function} props.onChangeViewMode - Switches between list and calendar views.
 * @param {boolean} props.showExport - Enables CSV export button when deadlines exist.
 * @param {Function} props.onExportCsv - Exports all deadlines to CSV and opens share sheet.
 * @param {boolean} props.showAdd - Controls visibility of the inline add-deadline form.
 * @param {object} props.control - React Hook Form control instance.
 * @param {object} props.errors - React Hook Form validation error map.
 * @param {boolean} props.isCreating - True while creating a deadline.
 * @param {Function} props.onSubmitAdd - Submit callback for the new deadline form.
 * @param {string | null} [props.statusError] - Calendar or mutation feedback error.
 * @param {Array<object>} props.deadlines - Deadlines passed to {@link MonthCalendar}.
 * @returns {JSX.Element} Deadlines list header view.
 */
export function DeadlinesHeader({
  t,
  activeCount,
  dueSoonCount,
  doneCount,
  viewMode,
  onChangeViewMode,
  showExport,
  onExportCsv,
  showAdd,
  control,
  errors,
  isCreating,
  onSubmitAdd,
  statusError,
  deadlines,
}) {
  const styles = useStyles(createStyles);

  const stats = [
    { value: activeCount, label: 'Active', style: styles.statInk },
    { value: dueSoonCount, label: 'Due ≤ 7d', style: styles.statAccent },
    { value: doneCount, label: 'Done', style: styles.statNeem },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={[styles.statValue, stat.style]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.flexOne}>
          <NewspaperButton
            size="sm"
            variant={viewMode === 'list' ? 'ink' : 'card'}
            icon="list-outline"
            label={t('deadlines.listView')}
            onPress={() => onChangeViewMode('list')}
          />
        </View>
        <View style={styles.flexOne}>
          <NewspaperButton
            size="sm"
            variant={viewMode === 'calendar' ? 'ink' : 'card'}
            icon="calendar-outline"
            label={t('deadlines.calendarView')}
            onPress={() => onChangeViewMode('calendar')}
          />
        </View>
        {showExport ? (
          <NewspaperButton
            size="sm"
            variant="card"
            icon="download-outline"
            label={t('deadlines.exportCsv')}
            onPress={onExportCsv}
          />
        ) : null}
      </View>

      {showAdd ? (
        <View style={styles.addCard}>
          <Controller
            control={control}
            name="label"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label={t('deadlines.addTitle')}
                placeholder={t('deadlines.labelPlaceholder')}
                autoCapitalize="sentences"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.label?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label={t('deadlines.datePlaceholder')}
                placeholder={t('deadlines.datePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.date?.message}
              />
            )}
          />
          <NewspaperButton disabled={isCreating} label={t('common.save')} onPress={onSubmitAdd} />
        </View>
      ) : null}

      {statusError ? <Text style={styles.errorText}>{statusError}</Text> : null}

      {viewMode === 'calendar' ? <MonthCalendar deadlines={deadlines} /> : null}
    </View>
  );
}
