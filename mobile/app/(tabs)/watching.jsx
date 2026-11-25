import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function WatchingScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

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
      <View
        style={{
          borderBottomColor: theme.colors.rule,
          borderBottomWidth: theme.borders.rule,
          paddingBottom: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}
      >
        <Text style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
          {t('watching.title')}
        </Text>
      </View>

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
        data={watchesQuery.data?.watches ?? []}
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
                borderColor: theme.colors.rule,
                borderWidth: theme.borders.hairline,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                gap: theme.spacing.sm,
              }}
            >
              <Text
                style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  typeScale.caption,
                  typeScale.tabular,
                  { color: theme.colors.muted, fontFamily: fonts.body },
                ]}
              >
                {src?.category} · {checkedStr}
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
                  variant={item.muted ? 'primary' : 'secondary'}
                  label={item.muted ? t('watching.muted') : t('watching.mute')}
                  onPress={() =>
                    patchMutation.mutate({ id: item.id, body: { muted: !item.muted } })
                  }
                />
                <NewspaperButton
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
                  variant="secondary"
                  label={t('watching.refresh')}
                  onPress={() => refreshMutation.mutate(item.id)}
                />
                <NewspaperButton
                  variant="secondary"
                  label={t('watching.remove')}
                  onPress={() => deleteMutation.mutate(item.id)}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
            {watchesQuery.isLoading ? t('common.loading') : t('watching.empty')}
          </Text>
        }
      />
    </ScreenShell>
  );
}
