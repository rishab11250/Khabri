/**
 * @file Watching tab displaying user's tracked portals (15-watch cap) and alert controls.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { WatchCard } from '@/features/watches/components/WatchCard';
import { WatchesEmptyState } from '@/features/watches/components/WatchesEmptyState';
import { useWatches } from '@/features/watches/hooks/useWatches';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    height: theme.spacing.xl,
  },
});

/**
 * Renders the list of followed sources with mute, priority, manual refresh, and unfollow actions.
 *
 * @returns {JSX.Element} Watching tab screen.
 */
export default function WatchingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const {
    watches,
    isLoading,
    isRefetching,
    refetch,
    actionError,
    toggleMute,
    togglePriority,
    refreshWatch,
    deleteWatch,
  } = useWatches();

  return (
    <ScreenShell>
      <Masthead
        title={t('watching.title')}
        eyebrowRight={`${watches.length}/15`}
        rightAction={
          <NewspaperButton
            size="sm"
            variant="primary"
            icon="add"
            label={t('tabs.discover')}
            onPress={() => router.push('/(tabs)/discover')}
          />
        }
      />

      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

      <FlatList
        data={watches}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <WatchCard
            item={item}
            t={t}
            onToggleMute={toggleMute}
            onTogglePriority={togglePriority}
            onRefresh={refreshWatch}
            onDelete={deleteWatch}
          />
        )}
        ListEmptyComponent={
          <WatchesEmptyState
            t={t}
            isLoading={isLoading}
            onBrowseDiscover={() => router.push('/(tabs)/discover')}
          />
        }
        ListFooterComponent={<View style={styles.footer} />}
      />
    </ScreenShell>
  );
}
