import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Masthead, SectionHeader } from '../../src/components/Masthead';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { INTEREST_CATEGORIES } from '../../src/constants/india';
import { useDebounce } from '../../src/hooks/useDebounce';
import { api } from '../../src/lib/api';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function DiscoverScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [clipboardUrl, setClipboardUrl] = useState('');
  const [actionError, setActionError] = useState('');
  const debouncedQuery = useDebounce(search.trim(), 250);

  useEffect(() => {
    Clipboard.getStringAsync()
      .then((text) => {
        const trimmed = (text || '').trim();
        if (/^https?:\/\/\S+$/i.test(trimmed)) {
          setClipboardUrl(trimmed);
        }
      })
      .catch(() => {});
  }, []);

  const catalogQuery = useQuery({
    queryKey: ['catalog', category, debouncedQuery],
    queryFn: () =>
      api.getCatalog({ category: category || undefined, q: debouncedQuery || undefined }),
  });

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const trendingQuery = useQuery({
    queryKey: ['trending'],
    queryFn: api.getTrending,
  });

  const watchBySourceId = new Map((watchesQuery.data?.watches || []).map((w) => [w.sourceId, w]));

  const toggleMutation = useMutation({
    mutationFn: ({ source, existingWatch }) =>
      existingWatch
        ? api.deleteWatch(existingWatch.id)
        : api.createWatch({ sourceId: source.id, createdVia: 'catalog' }),
    onSuccess: () => {
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err) => setActionError(err?.message || t('common.errorGeneric')),
  });

  const getCategoryColor = (cat) => {
    if (cat === 'recruitment') return theme.colors.neel;
    if (cat === 'scholarship') return theme.colors.haldi;
    if (cat === 'scheme') return theme.colors.neem;
    return theme.colors.accent;
  };

  return (
    <ScreenShell>
      <Masthead
        title={t('discover.title')}
        eyebrowLeft="OFFICIAL DIRECTORY"
        eyebrowRight={`${catalogQuery.data?.sources?.length ?? 0} PORTALS`}
        subtitle={t('discover.subtitle')}
      />

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant="secondary"
            label={t('add.pasteLink')}
            onPress={() => router.push('/add/link')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NewspaperButton label={t('add.scanPhoto')} onPress={() => router.push('/add/photo')} />
        </View>
      </View>

      {clipboardUrl ? (
        <View
          style={{
            backgroundColor: theme.colors.haldi,
            borderColor: theme.colors.rule,
            borderWidth: theme.borders.hairline,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            gap: theme.spacing.xs,
          }}
        >
          <Text
            style={[
              typeScale.caption,
              { color: theme.colors.haldiInk, fontFamily: fonts.bodyBold },
            ]}
          >
            {t('add.clipboardTitle')}
          </Text>
          <Text
            numberOfLines={1}
            style={[typeScale.caption, { color: theme.colors.haldiInk, fontFamily: fonts.body }]}
          >
            {clipboardUrl}
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <NewspaperButton
              label={t('add.watchLink')}
              onPress={() => router.push({ pathname: '/add/link', params: { url: clipboardUrl } })}
            />
            <NewspaperButton
              variant="secondary"
              label={t('common.skip')}
              onPress={() => setClipboardUrl('')}
            />
          </View>
        </View>
      ) : null}

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('discover.searchPlaceholder')}
        placeholderTextColor={theme.colors.muted}
        accessibilityLabel={t('discover.searchPlaceholder')}
        style={[
          typeScale.body,
          {
            color: theme.colors.ink,
            fontFamily: fonts.body,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.sm,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
          },
        ]}
      />

      {actionError ? (
        <Text
          style={[
            typeScale.caption,
            {
              color: theme.colors.accent,
              fontFamily: fonts.bodyMedium,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {actionError}
        </Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, marginBottom: theme.spacing.md }}
        contentContainerStyle={{ gap: theme.spacing.xs, alignItems: 'center', paddingVertical: 2 }}
      >
        {['', ...INTEREST_CATEGORIES].map((cat) => {
          const active = category === cat;
          return (
            <Pressable
              key={cat || 'all'}
              accessibilityRole="button"
              onPress={() => setCategory(cat)}
              style={{
                backgroundColor: active ? theme.colors.accent : theme.colors.card,
                borderColor: active ? theme.colors.accent : theme.colors.ruleSubtle,
                borderWidth: theme.borders.hairline,
                borderRadius: theme.radii.pill,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 7,
              }}
            >
              <Text
                style={[
                  typeScale.caption,
                  {
                    color: active ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: fonts.bodyMedium,
                  },
                ]}
              >
                {cat ? t(`onboarding.categories.${cat}`) : t('discover.allCategories')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={catalogQuery.data?.sources ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          (trendingQuery.data?.sources?.length ?? 0) > 0 ? (
            <View style={{ marginBottom: theme.spacing.md }}>
              <SectionHeader label={t('discover.trendingTitle')} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: theme.spacing.sm }}
              >
                {trendingQuery.data.sources.slice(0, 6).map((src, idx) => {
                  const watched = watchBySourceId.get(src.id);
                  return (
                    <Pressable
                      key={src.id}
                      accessibilityRole="button"
                      onPress={() => toggleMutation.mutate({ source: src, existingWatch: watched })}
                      style={{
                        backgroundColor: watched ? theme.colors.accent : theme.colors.card,
                        borderColor: watched ? theme.colors.accent : theme.colors.ruleSubtle,
                        borderTopWidth: 2,
                        borderTopColor: watched
                          ? theme.colors.accent
                          : getCategoryColor(src.category),
                        borderWidth: theme.borders.hairline,
                        borderRadius: theme.radii.sm,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        maxWidth: 190,
                      }}
                    >
                      <Text
                        style={{
                          color: watched ? theme.colors.onAccent : theme.colors.muted,
                          fontFamily: fonts.bodyBold,
                          fontSize: 10,
                          marginBottom: 2,
                        }}
                      >
                        #{String(idx + 1).padStart(2, '0')} ·{' '}
                        {(src.category || 'notice').toUpperCase()}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          typeScale.caption,
                          {
                            color: watched ? theme.colors.onAccent : theme.colors.ink,
                            fontFamily: fonts.headlineSemi,
                          },
                        ]}
                      >
                        {src.name}
                      </Text>
                      <Text
                        style={[
                          typeScale.caption,
                          {
                            color: watched ? theme.colors.onAccent : theme.colors.accent,
                            fontFamily: fonts.bodyBold,
                            marginTop: 2,
                          },
                        ]}
                      >
                        {watched ? `✓ ${t('discover.following')}` : `+ ${t('discover.follow')}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={catalogQuery.isRefetching}
            onRefresh={() => catalogQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => {
          const existingWatch = watchBySourceId.get(item.id);
          return (
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.ruleSubtle,
                borderWidth: theme.borders.hairline,
                borderLeftWidth: 3,
                borderLeftColor: getCategoryColor(item.category),
                borderRadius: theme.radii.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Text
                    style={{
                      color: getCategoryColor(item.category),
                      fontFamily: fonts.bodyBold,
                      fontSize: 10,
                      letterSpacing: 0.8,
                    }}
                  >
                    {(item.category || 'notice').toUpperCase()}
                  </Text>
                  <Text style={{ color: theme.colors.muted, fontSize: 10 }}>· {item.state}</Text>
                  {item.isDemo ? (
                    <View
                      style={{
                        backgroundColor: theme.colors.haldi,
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: theme.radii.xs,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.haldiInk,
                          fontFamily: fonts.bodyBold,
                          fontSize: 9,
                        }}
                      >
                        {t('discover.demoBadge')}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    typeScale.body,
                    { color: theme.colors.ink, fontFamily: fonts.headlineSemi },
                  ]}
                >
                  {item.name}
                </Text>
              </View>
              <NewspaperButton
                size="sm"
                variant={existingWatch ? 'secondary' : 'primary'}
                disabled={toggleMutation.isPending}
                label={existingWatch ? t('discover.following') : t('discover.follow')}
                onPress={() => toggleMutation.mutate({ source: item, existingWatch })}
              />
            </View>
          );
        }}
      />
    </ScreenShell>
  );
}
