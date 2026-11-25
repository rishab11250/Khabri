import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { INTEREST_CATEGORIES } from '../../src/constants/india';
import { useDebounce } from '../../src/hooks/useDebounce';
import { api } from '../../src/lib/api';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function DiscoverScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const debouncedQuery = useDebounce(search.trim(), 250);

  const catalogQuery = useQuery({
    queryKey: ['catalog', category, debouncedQuery],
    queryFn: () =>
      api.getCatalog({ category: category || undefined, q: debouncedQuery || undefined }),
  });

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const watchBySourceId = new Map((watchesQuery.data?.watches || []).map((w) => [w.sourceId, w]));

  const toggleMutation = useMutation({
    mutationFn: ({ source, existingWatch }) =>
      existingWatch
        ? api.deleteWatch(existingWatch.id)
        : api.createWatch({ sourceId: source.id, createdVia: 'catalog' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
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
          {t('discover.title')}
        </Text>
        <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('discover.subtitle')}
        </Text>
      </View>

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
            borderColor: theme.colors.rule,
            borderWidth: theme.borders.hairline,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
          },
        ]}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44, marginBottom: theme.spacing.md }}
        contentContainerStyle={{ gap: theme.spacing.xs, alignItems: 'center' }}
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
                borderColor: active ? theme.colors.accent : theme.colors.rule,
                borderWidth: theme.borders.hairline,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
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
                borderColor: theme.colors.rule,
                borderWidth: theme.borders.hairline,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
                >
                  {item.category} · {item.state}
                  {item.isDemo ? ` · ${t('discover.demoBadge')}` : ''}
                </Text>
              </View>
              <NewspaperButton
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
