import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { KhabarCard } from '../../src/components/KhabarCard';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { useSessionStore } from '../../src/store/session';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const profile = useSessionStore((s) => s.profile);

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

  const items = feedQuery.data?.pages.flatMap((p) => p.items || []) ?? [];

  return (
    <ScreenShell>
      <View
        style={{
          borderBottomColor: theme.colors.rule,
          borderBottomWidth: theme.borders.double,
          paddingBottom: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}
      >
        <Text style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
          {t('today.masthead')}
        </Text>
        <Text
          style={[
            typeScale.caption,
            typeScale.tabular,
            { color: theme.colors.muted, fontFamily: fonts.body, marginTop: theme.spacing.xs },
          ]}
        >
          {t('today.dateline', {
            state: profile?.state || t('onboarding.allIndia'),
            date: formattedDate,
          })}
        </Text>
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
          feedQuery.isLoading ? (
            <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
              {t('common.loading')}
            </Text>
          ) : feedQuery.isError ? (
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
                borderColor: theme.colors.rule,
                borderWidth: theme.borders.hairline,
                padding: theme.spacing.lg,
              }}
            >
              <Text
                style={[
                  typeScale.title,
                  { color: theme.colors.ink, fontFamily: fonts.headlineSemi },
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
                    marginTop: theme.spacing.sm,
                  },
                ]}
              >
                {t('today.emptySubtitle')}
              </Text>
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
