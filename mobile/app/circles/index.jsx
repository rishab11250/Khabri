import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { FormField } from '../../src/components/FormField';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function CirclesIndexScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const circlesQuery = useQuery({
    queryKey: ['circles'],
    queryFn: api.getCircles,
  });

  const createMutation = useMutation({
    mutationFn: () => api.createCircle({ name: name.trim() }),
    onSuccess: (data) => {
      setName('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      router.push(`/circles/${data.circle.id}`);
    },
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
  });

  return (
    <ScreenShell>
      <View style={{ marginBottom: theme.spacing.md }}>
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      <Text style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
        {t('circles.title')}
      </Text>
      <Text
        style={[
          typeScale.caption,
          { color: theme.colors.muted, fontFamily: fonts.body, marginBottom: theme.spacing.md },
        ]}
      >
        {t('circles.subtitle')}
      </Text>

      <FormField
        label={t('circles.createLabel')}
        placeholder={t('circles.createPlaceholder')}
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
        error={error}
      />

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            disabled={createMutation.isPending || name.trim().length < 2}
            label={t('circles.createBtn')}
            onPress={() => createMutation.mutate()}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant="secondary"
            label={t('circles.joinBtn')}
            onPress={() => router.push('/circles/join')}
          />
        </View>
      </View>

      <FlatList
        data={circlesQuery.data?.circles ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={circlesQuery.isRefetching}
            onRefresh={() => circlesQuery.refetch()}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/circles/${item.id}`)}
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.rule,
              borderWidth: theme.borders.hairline,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.sm,
            }}
          >
            <Text
              style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                typeScale.caption,
                typeScale.tabular,
                { color: theme.colors.muted, fontFamily: fonts.body },
              ]}
            >
              {t('circles.inviteCode', { code: item.inviteCode })} · {item.memberCount}/30
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
            {circlesQuery.isLoading ? t('common.loading') : t('circles.empty')}
          </Text>
        }
      />
    </ScreenShell>
  );
}
