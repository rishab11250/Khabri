import { Controller } from 'react-hook-form';
import { Text, View } from 'react-native';
import { FormField } from '@/components/FormField';
import { NewspaperButton } from '@/components/NewspaperButton';
import { MonthCalendar } from '@/features/deadlines/components/MonthCalendar';
import { typeScale } from '@/theme/typography';

export function DeadlinesHeader({
  theme,
  fonts,
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
  const stats = [
    { value: activeCount, label: 'Active', color: theme.colors.ink },
    { value: dueSoonCount, label: 'Due ≤ 7d', color: theme.colors.accent },
    { value: doneCount, label: 'Done', color: theme.colors.neem },
  ];

  return (
    <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.ruleSubtle,
              borderWidth: theme.borders.hairline,
              borderRadius: theme.radii.md,
              padding: theme.spacing.md,
            }}
          >
            <Text
              style={[
                typeScale.leadTitle,
                typeScale.tabular,
                { color: stat.color, fontFamily: fonts.headline },
              ]}
            >
              {stat.value}
            </Text>
            <Text
              style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            size="sm"
            variant={viewMode === 'list' ? 'ink' : 'card'}
            icon="list-outline"
            label={t('deadlines.listView')}
            onPress={() => onChangeViewMode('list')}
          />
        </View>
        <View style={{ flex: 1 }}>
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
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
          }}
        >
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

      {statusError ? (
        <Text
          style={[typeScale.caption, { color: theme.colors.accent, fontFamily: fonts.bodyMedium }]}
        >
          {statusError}
        </Text>
      ) : null}

      {viewMode === 'calendar' ? (
        <MonthCalendar deadlines={deadlines} theme={theme} fonts={fonts} />
      ) : null}
    </View>
  );
}
