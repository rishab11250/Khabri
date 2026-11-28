/**
 * @file Today edition feed tab showcasing detected official changes, quick stats, and Ask Khabri entry.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { KhabarCard } from '@/features/changes/components/KhabarCard';
import { TodayEmptyState } from '@/features/changes/components/TodayEmptyState';
import { TodayHeaderPanels } from '@/features/changes/components/TodayHeaderPanels';
import { useTodayFeed } from '@/features/changes/hooks/useTodayFeed';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme) => ({
  loadMoreWrap: {
    paddingVertical: theme.spacing.md,
  },
  footer: {
    height: theme.spacing.xl,
  },
});

/**
 * Renders the paginated Today newsroom feed of Khabar Cards.
 *
 * @returns {JSX.Element} Today feed screen.
 */
export default function TodayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const {
    profile,
    feedQuery,
    watches,
    watchCount,
    activeDeadlinesCount,
    items,
    leadId,
    syncingWatches,
    markChangeRead,
    handleSyncMonitors,
  } = useTodayFeed();

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <ScreenShell>
      <Masthead
        title={t('today.masthead')}
        subtitle={t('today.dateline', {
          state: profile?.state || t('onboarding.allIndia'),
          date: formattedDate,
        })}
        rightAction={
          <NewspaperButton
            size="sm"
            variant="card"
            icon="sparkles-outline"
            label={t('ask.title')}
            onPress={() => router.push('/ask')}
          />
        }
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <TodayHeaderPanels watchCount={watchCount} activeDeadlinesCount={activeDeadlinesCount} />
        }
        refreshControl={
          <RefreshControl
            refreshing={feedQuery.isRefetching}
            onRefresh={() => feedQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <KhabarCard
            card={item}
            lead={item.id === leadId}
            onPress={() => {
              markChangeRead(item.id);
              router.push(`/change/${item.id}`);
            }}
          />
        )}
        ListEmptyComponent={
          <TodayEmptyState
            isLoading={feedQuery.isLoading && items.length === 0}
            isError={feedQuery.isError && items.length === 0}
            errorMessage={feedQuery.error?.message}
            watches={watches}
            syncingWatches={syncingWatches}
            onRetry={() => feedQuery.refetch()}
            onSyncMonitors={handleSyncMonitors}
          />
        }
        ListFooterComponent={
          feedQuery.hasNextPage ? (
            <View style={styles.loadMoreWrap}>
              <NewspaperButton
                variant="secondary"
                disabled={feedQuery.isFetchingNextPage}
                label={feedQuery.isFetchingNextPage ? t('common.loading') : t('today.loadMore')}
                onPress={() => feedQuery.fetchNextPage()}
              />
            </View>
          ) : (
            <View style={styles.footer} />
          )
        }
      />
    </ScreenShell>
  );
}
