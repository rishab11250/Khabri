/**
 * @file Deadlines tab displaying upcoming portal/user deadlines, calendar view, and CSV export.
 */
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { DeadlineRow } from '@/features/deadlines/components/DeadlineRow';
import { DeadlinesEmptyState } from '@/features/deadlines/components/DeadlinesEmptyState';
import { DeadlinesHeader } from '@/features/deadlines/components/DeadlinesHeader';
import { useDeadlines } from '@/features/deadlines/hooks/useDeadlines';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme) => ({
  footer: {
    height: theme.spacing.xl,
  },
});

/**
 * Renders the Deadlines Ledger list, month grid, and inline deadline creation form.
 *
 * @returns {JSX.Element} Deadlines tab screen.
 */
export default function DeadlinesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const {
    deadlines,
    isLoading,
    isRefetching,
    refetch,
    viewMode,
    setViewMode,
    showAdd,
    setShowAdd,
    statusError,
    activeCount,
    doneCount,
    dueSoonCount,
    handleExportCsv,
    handleAddCalendar,
    toggleDone,
    removeDeadline,
    control,
    errors,
    isCreating,
    submitAdd,
  } = useDeadlines();

  return (
    <ScreenShell>
      <Masthead
        title={t('deadlines.title')}
        subtitle={t('deadlines.remindersActive')}
        rightAction={
          <NewspaperButton
            size="sm"
            variant="primary"
            icon={showAdd ? 'close' : 'add'}
            label={showAdd ? t('common.skip') : t('deadlines.addTitle')}
            onPress={() => setShowAdd((s) => !s)}
          />
        }
      />

      <FlatList
        data={deadlines}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <DeadlinesHeader
            t={t}
            activeCount={activeCount}
            dueSoonCount={dueSoonCount}
            doneCount={doneCount}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            showExport={deadlines.length > 0}
            onExportCsv={handleExportCsv}
            showAdd={showAdd}
            control={control}
            errors={errors}
            isCreating={isCreating}
            onSubmitAdd={submitAdd}
            statusError={statusError}
            deadlines={deadlines}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <DeadlineRow
            item={item}
            t={t}
            onToggleDone={toggleDone}
            onAddCalendar={handleAddCalendar}
            onDelete={removeDeadline}
          />
        )}
        ListEmptyComponent={
          <DeadlinesEmptyState
            t={t}
            isLoading={isLoading}
            showAdd={showAdd}
            onShowAdd={() => setShowAdd(true)}
          />
        }
        ListFooterComponent={<View style={styles.footer} />}
      />
    </ScreenShell>
  );
}
