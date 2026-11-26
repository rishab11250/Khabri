import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Masthead } from '../../src/components/Masthead';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { readJsonCache, writeJsonCache } from '../../src/lib/fileCache';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

const WATCHES_CACHE_KEY = 'watches-cache.json';

export default function WatchingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');
  const [cachedWatches, setCachedWatches] = useState([]);

  useEffect(() => {
    readJsonCache(WATCHES_CACHE_KEY, []).then((cached) => {
      if (cached && cached.length > 0) {
        setCachedWatches(cached);
      }
    });
  }, []);

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const rawWatches = watchesQuery.data?.watches;
  const watches = rawWatches && rawWatches.length > 0 ? rawWatches : (rawWatches ?? cachedWatches);

  useEffect(() => {
    if (rawWatches && rawWatches.length > 0) {
      writeJsonCache(WATCHES_CACHE_KEY, rawWatches);
    }
  }, [rawWatches]);

  const patchMutation = useMutation({
    mutationFn: ({ id, body }) => api.patchWatch(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watches'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteWatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: (id) => api.refreshWatch(id),
    onSuccess: () => {
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err) => setActionError(err?.message || t('common.errorGeneric')),
  });

  return (
    <ScreenShell>
      <Masthead
        title={t('watching.title')}
        eyebrowLeft="MONITORED PORTALS"
        eyebrowRight={`${watches.length}/15 ACTIVE`}
        rightAction={
          <NewspaperButton
            size="sm"
            variant="secondary"
            label={`+ ${t('tabs.discover')}`}
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
        refreshControl={
          <RefreshControl
            refreshing={watchesQuery.isRefetching}
            onRefresh={() => watchesQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => {
          const src = item.source;
          const checkedStr = src?.lastFetchedAt
            ? t('watching.lastChecked', {
                time: new Date(src.lastFetchedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })
            : t('watching.neverChecked');

          return (
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.ruleSubtle,
                borderWidth: theme.borders.hairline,
                borderLeftWidth: 3,
                borderLeftColor: item.muted ? theme.colors.muted : theme.colors.neem,
                borderRadius: theme.radii.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                gap: theme.spacing.sm,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: theme.spacing.sm,
                }}
              >
                <Text
                  style={[
                    typeScale.section,
                    { flex: 1, color: theme.colors.ink, fontFamily: fonts.headlineSemi },
                  ]}
                >
                  {item.title}
                </Text>
                <View
                  style={{
                    backgroundColor: item.muted ? theme.colors.background : theme.colors.neem,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: 2,
                    borderRadius: theme.radii.xs,
                  }}
                >
                  <Text
                    style={{
                      color: item.muted ? theme.colors.muted : theme.colors.onNeem,
                      fontFamily: fonts.bodyBold,
                      fontSize: 10,
                    }}
                  >
                    {item.muted
                      ? t('watching.muted').toUpperCase()
                      : item.priority === 'instant'
                        ? t('watching.instant').toUpperCase()
                        : t('watching.normal').toUpperCase()}
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
                {(src?.category || 'notice').toUpperCase()} · {checkedStr}
              </Text>
              {src?.unsupported ? (
                <Text
                  style={[
                    typeScale.caption,
                    { color: theme.colors.accent, fontFamily: fonts.body },
                  ]}
                >
                  {t('watching.unsupported')}
                </Text>
              ) : null}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                <NewspaperButton
                  size="sm"
                  variant={item.muted ? 'primary' : 'secondary'}
                  label={item.muted ? t('watching.muted') : t('watching.mute')}
                  onPress={() =>
                    patchMutation.mutate({ id: item.id, body: { muted: !item.muted } })
                  }
                />
                <NewspaperButton
                  size="sm"
                  variant={item.priority === 'instant' ? 'primary' : 'secondary'}
                  label={item.priority === 'instant' ? t('watching.instant') : t('watching.normal')}
                  onPress={() =>
                    patchMutation.mutate({
                      id: item.id,
                      body: { priority: item.priority === 'instant' ? 'normal' : 'instant' },
                    })
                  }
                />
                <NewspaperButton
                  size="sm"
                  variant="secondary"
                  label={t('watching.refresh')}
                  onPress={() => refreshMutation.mutate(item.id)}
                />
                <NewspaperButton
                  size="sm"
                  variant="secondary"
                  label={t('watching.remove')}
                  onPress={() => deleteMutation.mutate(item.id)}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          watchesQuery.isLoading ? (
            <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
              {t('common.loading')}
            </Text>
          ) : (
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.ruleSubtle,
                borderWidth: theme.borders.hairline,
                borderRadius: theme.radii.md,
                padding: theme.spacing.lg,
                gap: theme.spacing.md,
              }}
            >
              <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
                {t('watching.empty')}
              </Text>
              <NewspaperButton
                size="sm"
                variant="secondary"
                label={t('tabs.discover')}
                onPress={() => router.push('/(tabs)/discover')}
              />
            </View>
          )
        }
      />
    </ScreenShell>
  );
}
