import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { WatchCard } from '@/features/watches/components/WatchCard';
import { WatchesEmptyState } from '@/features/watches/components/WatchesEmptyState';
import { useWatches } from '@/features/watches/hooks/useWatches';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function WatchingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
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

      {actionError ? (
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
          {actionError}
        </Text>
      ) : null}

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
            theme={theme}
            fonts={fonts}
            t={t}
            onToggleMute={toggleMute}
            onTogglePriority={togglePriority}
            onRefresh={refreshWatch}
            onDelete={deleteWatch}
          />
        )}
        ListEmptyComponent={
          <WatchesEmptyState
            theme={theme}
            fonts={fonts}
            t={t}
            isLoading={isLoading}
            onBrowseDiscover={() => router.push('/(tabs)/discover')}
          />
        }
        ListFooterComponent={<View style={{ height: theme.spacing.xl }} />}
      />
    </ScreenShell>
  );
}
