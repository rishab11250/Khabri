import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { z } from 'zod';
import { FormField } from '../../src/components/FormField';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { useCountdown } from '../../src/hooks/useCountdown';
import { api } from '../../src/lib/api';
import { addDeadlineToDeviceCalendar, syncDeadlineReminders } from '../../src/lib/reminders';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

function MonthCalendar({ deadlines, theme, fonts }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date();
  const viewDate = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = viewDate.getDay();

  const dueDays = new Set(
    deadlines
      .filter((d) => d.status === 'active')
      .map((d) => new Date(d.dueAt))
      .filter((dt) => dt.getFullYear() === year && dt.getMonth() === month)
      .map((dt) => dt.getDate()),
  );

  const cells = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.rule,
        borderWidth: theme.borders.hairline,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.sm,
        }}
      >
        <Pressable accessibilityRole="button" onPress={() => setMonthOffset((m) => m - 1)}>
          <Text
            style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
          >
            {'<'}
          </Text>
        </Pressable>
        <Text
          style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.headlineSemi }]}
        >
          {monthLabel}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => setMonthOffset((m) => m + 1)}>
          <Text
            style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
          >
            {'>'}
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, idx) => {
          const hasDue = day !== null && dueDays.has(day);
          return (
            <View
              key={idx}
              style={{
                width: '14.28%',
                paddingVertical: theme.spacing.xs,
                alignItems: 'center',
                backgroundColor: hasDue ? theme.colors.accent : 'transparent',
              }}
            >
              <Text
                style={[
                  typeScale.caption,
                  typeScale.tabular,
                  {
                    color: hasDue ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: hasDue ? fonts.bodyBold : fonts.body,
                  },
                ]}
              >
                {day ?? ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function DeadlineRow({ item, theme, fonts, t, onToggleDone, onAddCalendar, onDelete }) {
  const countdown = useCountdown(item.dueAt);
  const dueStr = new Date(item.dueAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const oldStr = item.previousDueAt
    ? new Date(item.previousDueAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : null;

  const badgeText = countdown.expired
    ? t('deadlines.expired')
    : countdown.daysLeft <= 0
      ? t('deadlines.dueToday')
      : t('deadlines.daysLeft', { count: countdown.daysLeft });

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.rule,
        borderWidth: theme.borders.hairline,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.xs,
      }}
    >
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}
      >
        <Text
          style={[
            typeScale.section,
            {
              flex: 1,
              color: theme.colors.ink,
              fontFamily: fonts.bodyBold,
              textDecorationLine: item.status === 'done' ? 'line-through' : 'none',
            },
          ]}
        >
          {item.label}
        </Text>
        <View
          style={{
            backgroundColor: countdown.daysLeft <= 3 ? theme.colors.accent : theme.colors.haldi,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 2,
          }}
        >
          <Text
            style={[
              typeScale.caption,
              typeScale.tabular,
              {
                color: countdown.daysLeft <= 3 ? theme.colors.onAccent : theme.colors.haldiInk,
                fontFamily: fonts.bodyBold,
              },
            ]}
          >
            {badgeText}
          </Text>
        </View>
      </View>

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
          style={[typeScale.caption, { color: theme.colors.accent, fontFamily: fonts.bodyMedium }]}
        >
          {t('deadlines.movedFrom', { old: oldStr, next: dueStr })}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.xs,
          marginTop: theme.spacing.xs,
        }}
      >
        <NewspaperButton
          variant="secondary"
          label={item.status === 'done' ? t('deadlines.reopen') : t('deadlines.markDone')}
          onPress={() => onToggleDone(item)}
        />
        <NewspaperButton
          variant="secondary"
          disabled={Boolean(item.calendarEventId)}
          label={
            item.calendarEventId ? t('deadlines.addedToCalendar') : t('deadlines.addToCalendar')
          }
          onPress={() => onAddCalendar(item)}
        />
        <NewspaperButton
          variant="secondary"
          label={t('watching.remove')}
          onPress={() => onDelete(item.id)}
        />
      </View>
    </View>
  );
}

export default function DeadlinesScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState('list');
  const [showAdd, setShowAdd] = useState(false);
  const [statusError, setStatusError] = useState('');

  const deadlinesQuery = useQuery({
    queryKey: ['deadlines'],
    queryFn: () => api.getDeadlines(),
  });

  const rawDeadlines = deadlinesQuery.data?.deadlines;
  const deadlines = rawDeadlines ?? [];

  useEffect(() => {
    if (rawDeadlines && rawDeadlines.length > 0) {
      syncDeadlineReminders(rawDeadlines);
    }
  }, [rawDeadlines]);

  const schema = z.object({
    label: z.string().trim().min(1, t('deadlines.labelRequired')),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('deadlines.invalidDate')),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { label: '', date: '' },
  });

  const createMutation = useMutation({
    mutationFn: (v) => api.createDeadline({ label: v.label, dueAt: `${v.date}T23:59:00.000Z` }),
    onSuccess: () => {
      reset();
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
    onError: (err) => setStatusError(err?.message || t('common.errorGeneric')),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, body }) => api.patchDeadline(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteDeadline(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const handleAddCalendar = async (item) => {
    setStatusError('');
    try {
      const eventId = await addDeadlineToDeviceCalendar(item);
      await patchMutation.mutateAsync({ id: item.id, body: { calendarEventId: String(eventId) } });
    } catch (err) {
      setStatusError(err?.message || t('common.errorGeneric'));
    }
  };

  return (
    <ScreenShell>
      <View
        style={{
          borderBottomColor: theme.colors.rule,
          borderBottomWidth: theme.borders.rule,
          paddingBottom: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}
      >
        <Text style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
          {t('deadlines.title')}
        </Text>
        <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('deadlines.remindersActive')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            label={t('deadlines.listView')}
            onPress={() => setViewMode('list')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
            label={t('deadlines.calendarView')}
            onPress={() => setViewMode('calendar')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant="secondary"
            label={showAdd ? t('common.skip') : t('deadlines.addTitle')}
            onPress={() => setShowAdd((s) => !s)}
          />
        </View>
      </View>

      {showAdd ? (
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.rule,
            borderWidth: theme.borders.hairline,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
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
          <NewspaperButton
            disabled={createMutation.isPending}
            label={t('common.save')}
            onPress={handleSubmit((v) => createMutation.mutate(v))}
          />
        </View>
      ) : null}

      {statusError ? (
        <Text
          style={[
            typeScale.caption,
            {
              color: theme.colors.accent,
              fontFamily: fonts.bodyMedium,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          {statusError}
        </Text>
      ) : null}

      <FlatList
        data={deadlines}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          viewMode === 'calendar' ? (
            <MonthCalendar deadlines={deadlines} theme={theme} fonts={fonts} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={deadlinesQuery.isRefetching}
            onRefresh={() => deadlinesQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <DeadlineRow
            item={item}
            theme={theme}
            fonts={fonts}
            t={t}
            onToggleDone={(d) =>
              patchMutation.mutate({
                id: d.id,
                body: { status: d.status === 'done' ? 'active' : 'done' },
              })
            }
            onAddCalendar={handleAddCalendar}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}
        ListEmptyComponent={
          <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
            {deadlinesQuery.isLoading ? t('common.loading') : t('deadlines.empty')}
          </Text>
        }
      />
    </ScreenShell>
  );
}
