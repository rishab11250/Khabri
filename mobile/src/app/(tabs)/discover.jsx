/**
 * @file Discover tab listing verified sources, trending carousels, and link/photo intake CTAs.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Masthead } from '@/components/Masthead';
import { ScreenShell } from '@/components/ScreenShell';
import { CatalogSourceRow } from '@/features/watches/components/CatalogSourceRow';
import { DiscoverToolbar } from '@/features/watches/components/DiscoverToolbar';
import { TrendingCarousel } from '@/features/watches/components/TrendingCarousel';
import { useDiscover } from '@/features/watches/hooks/useDiscover';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme) => ({
  footer: {
    height: theme.spacing.xl,
  },
});

/**
 * Renders catalog search, category filters, trending portals, and quick watch toggles.
 *
 * @returns {JSX.Element} Discover tab screen.
 */
export default function DiscoverScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const {
    search,
    setSearch,
    category,
    setCategory,
    clipboardUrl,
    setClipboardUrl,
    actionError,
    sources,
    trendingSources,
    isRefetching,
    refetch,
    watchBySourceId,
    isToggling,
    toggleFollow,
  } = useDiscover();

  return (
    <ScreenShell>
      <Masthead
        title={t('discover.title')}
        subtitle={t('discover.subtitle')}
        eyebrowRight={`${sources.length}`}
      />

      <DiscoverToolbar
        t={t}
        clipboardUrl={clipboardUrl}
        onClearClipboard={() => setClipboardUrl('')}
        onWatchClipboard={() =>
          router.push({ pathname: '/add/link', params: { url: clipboardUrl } })
        }
        onPressPasteLink={() => router.push('/add/link')}
        onPressScanPhoto={() => router.push('/add/photo')}
        search={search}
        onChangeSearch={setSearch}
        category={category}
        onChangeCategory={setCategory}
        actionError={actionError}
      />

      <FlatList
        data={sources}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <TrendingCarousel
            sources={trendingSources}
            watchBySourceId={watchBySourceId}
            t={t}
            onToggleFollow={toggleFollow}
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
          <CatalogSourceRow
            item={item}
            existingWatch={watchBySourceId.get(item.id)}
            t={t}
            isToggling={isToggling}
            onToggle={toggleFollow}
          />
        )}
        ListFooterComponent={<View style={styles.footer} />}
      />
    </ScreenShell>
  );
}
