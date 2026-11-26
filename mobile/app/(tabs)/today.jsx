import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Kabootar } from '../../src/components/Kabootar';
import { KhabarCard } from '../../src/components/KhabarCard';
import { Masthead } from '../../src/components/Masthead';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { readJsonCache, writeJsonCache } from '../../src/lib/fileCache';
import { useSessionStore } from '../../src/store/session';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

const FEED_CACHE_KEY = 'feed-cache.json';

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const profile = useSessionStore((s) => s.profile);
  const [cachedItems, setCachedItems] = useState([]);

  useEffect(() => {
    readJsonCache(FEED_CACHE_KEY, []).then((cached) => {
      if (cached && cached.length > 0) {
        setCachedItems(cached);
      }
    });
  }, []);

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => api.getFeed(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
  });

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const deadlinesQuery = useQuery({
    queryKey: ['deadlines'],
    queryFn: api.getDeadlines,
  });

  const watchCount = watchesQuery.data?.watches?.length ?? 0;
  const activeDeadlinesCount =
    deadlinesQuery.data?.deadlines?.filter((d) => d.status === 'active').length ?? 0;

  const networkItems = useMemo(
    () => feedQuery.data?.pages.flatMap((p) => p.items || []) ?? [],
    [feedQuery.data?.pages],
  );

  useEffect(() => {
    if (networkItems.length > 0) {
      writeJsonCache(FEED_CACHE_KEY, networkItems);
    }
  }, [networkItems]);

  const items = networkItems.length > 0 ? networkItems : cachedItems;

  return (
    <ScreenShell>
      <Masthead
        title={t('today.masthead')}
        eyebrowRight="VOL. I · DAILY"
        subtitle={t('today.dateline', {
          state: profile?.state || t('onboarding.allIndia'),
          date: formattedDate,
        })}
        rightAction={
          <NewspaperButton
            size="sm"
            variant="secondary"
            label={t('ask.title')}
            onPress={() => router.push('/ask')}
          />
        }
      />

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.sm,
          marginBottom: theme.spacing.md,
          overflow: 'hidden',
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/watching')}
          style={{
            flex: 1,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRightWidth: theme.borders.hairline,
            borderRightColor: theme.colors.ruleSubtle,
          }}
        >
          <Text
            style={[
              typeScale.caption,
              { color: theme.colors.muted, fontFamily: fonts.bodyBold, fontSize: 10 },
            ]}
          >
            {t('tabs.watching').toUpperCase()}
          </Text>
          <Text
            style={[
              typeScale.title,
              typeScale.tabular,
              { color: theme.colors.ink, fontFamily: fonts.headlineSemi },
            ]}
          >
            {watchCount}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/deadlines')}
          style={{
            flex: 1,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRightWidth: theme.borders.hairline,
            borderRightColor: theme.colors.ruleSubtle,
          }}
        >
          <Text
            style={[
              typeScale.caption,
              { color: theme.colors.muted, fontFamily: fonts.bodyBold, fontSize: 10 },
            ]}
          >
            {t('tabs.deadlines').toUpperCase()}
          </Text>
          <Text
            style={[
              typeScale.title,
              typeScale.tabular,
              { color: theme.colors.accent, fontFamily: fonts.headlineSemi },
            ]}
          >
            {activeDeadlinesCount}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/circles')}
          style={{
            flex: 1,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
          }}
        >
          <Text
            style={[
              typeScale.caption,
              { color: theme.colors.muted, fontFamily: fonts.bodyBold, fontSize: 10 },
            ]}
          >
            {t('circles.title').toUpperCase()}
          </Text>
          <Text
            style={[
              typeScale.caption,
              { color: theme.colors.neem, fontFamily: fonts.bodyBold, marginTop: 4 },
            ]}
          >
            {t('common.continue')} →
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={feedQuery.isRefetching}
            onRefresh={() => feedQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <KhabarCard card={item} onPress={() => router.push(`/change/${item.id}`)} />
        )}
        ListEmptyComponent={
          feedQuery.isLoading && items.length === 0 ? (
            <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
              {t('common.loading')}
            </Text>
          ) : feedQuery.isError && items.length === 0 ? (
            <View style={{ gap: theme.spacing.md }}>
              <Text
                style={[typeScale.body, { color: theme.colors.accent, fontFamily: fonts.body }]}
              >
                {feedQuery.error?.message || t('common.errorGeneric')}
              </Text>
              <NewspaperButton label={t('common.retry')} onPress={() => feedQuery.refetch()} />
            </View>
          ) : (
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.ruleSubtle,
                borderWidth: theme.borders.hairline,
                borderRadius: theme.radii.md,
                padding: theme.spacing.lg,
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}
            >
              <Kabootar size={56} flap />
              <Text
                style={[
                  typeScale.title,
                  {
                    color: theme.colors.ink,
                    fontFamily: fonts.headlineSemi,
                    textAlign: 'center',
                  },
                ]}
              >
                {t('today.emptyTitle')}
              </Text>
              <Text
                style={[
                  typeScale.body,
                  {
                    color: theme.colors.muted,
                    fontFamily: fonts.body,
                    textAlign: 'center',
                  },
                ]}
              >
                {t('today.emptySubtitle')}
              </Text>
              <View style={{ marginTop: theme.spacing.xs, width: '100%' }}>
                <NewspaperButton
                  size="sm"
                  label={t('tabs.discover')}
                  onPress={() => router.push('/(tabs)/discover')}
                />
              </View>
            </View>
          )
        }
        ListFooterComponent={
          feedQuery.hasNextPage ? (
            <View style={{ paddingVertical: theme.spacing.md }}>
              <NewspaperButton
                variant="secondary"
                disabled={feedQuery.isFetchingNextPage}
                label={feedQuery.isFetchingNextPage ? t('common.loading') : t('today.loadMore')}
                onPress={() => feedQuery.fetchNextPage()}
              />
            </View>
          ) : null
        }
      />
    </ScreenShell>
  );
}
