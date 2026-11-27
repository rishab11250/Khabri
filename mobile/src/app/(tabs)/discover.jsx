import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';
import { Masthead } from '@/components/Masthead';
import { ScreenShell } from '@/components/ScreenShell';
import { CatalogSourceRow } from '@/features/watches/components/CatalogSourceRow';
import { DiscoverToolbar } from '@/features/watches/components/DiscoverToolbar';
import { TrendingCarousel } from '@/features/watches/components/TrendingCarousel';
import { useDiscover } from '@/features/watches/hooks/useDiscover';
import { getFontFamilies } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function DiscoverScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
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
        theme={theme}
        fonts={fonts}
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
            theme={theme}
            fonts={fonts}
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
            theme={theme}
            fonts={fonts}
            t={t}
            isToggling={isToggling}
            onToggle={toggleFollow}
          />
        )}
        ListFooterComponent={<View style={{ height: theme.spacing.xl }} />}
      />
    </ScreenShell>
  );
}
