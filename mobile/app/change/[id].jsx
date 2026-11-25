import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { KhabarCard } from '../../src/components/KhabarCard';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function ChangeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);
  const queryClient = useQueryClient();

  const changeQuery = useQuery({
    queryKey: ['change', id],
    queryFn: () => api.getChange(String(id)),
    enabled: Boolean(id),
  });

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const card = changeQuery.data?.card;
  const matchingWatch = watchesQuery.data?.watches?.find((w) => w.sourceId === card?.sourceId);

  const muteMutation = useMutation({
    mutationFn: () => api.patchWatch(matchingWatch.id, { muted: !matchingWatch.muted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
    },
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

      {changeQuery.isLoading ? (
        <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('common.loading')}
        </Text>
      ) : changeQuery.isError || !card ? (
        <View style={{ gap: theme.spacing.md }}>
          <Text
            style={[typeScale.body, { color: theme.colors.accent, fontFamily: fonts.bodyMedium }]}
          >
            {changeQuery.error?.message || t('common.errorGeneric')}
          </Text>
          <NewspaperButton label={t('common.retry')} onPress={() => changeQuery.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
          <KhabarCard card={card} compact={false} />

          {card.analysis?.checklist?.length > 0 ? (
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.rule,
                borderWidth: theme.borders.hairline,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.md,
              }}
            >
              <Text
                style={[
                  typeScale.section,
                  {
                    color: theme.colors.ink,
                    fontFamily: fonts.bodyBold,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                {t('card.checklistTitle')}
              </Text>
              {card.analysis.checklist.map((step, idx) => (
                <Text
                  key={idx}
                  style={[
                    typeScale.body,
                    {
                      color: theme.colors.ink,
                      fontFamily: fonts.body,
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  • {step}
                </Text>
              ))}
            </View>
          ) : null}

          {matchingWatch ? (
            <NewspaperButton
              variant="secondary"
              disabled={muteMutation.isPending}
              label={matchingWatch.muted ? t('card.unmuteWatch') : t('card.muteWatch')}
              onPress={() => muteMutation.mutate()}
            />
          ) : null}
        </ScrollView>
      )}
    </ScreenShell>
  );
}
