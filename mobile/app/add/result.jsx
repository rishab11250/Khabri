import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { useSessionStore } from '../../src/store/session';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function AddPhotoResultScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();
  const photoResult = useSessionStore((s) => s.photoResult);
  const setPhotoResult = useSessionStore((s) => s.setPhotoResult);
  const [error, setError] = useState('');

  const confirmMutation = useMutation({
    mutationFn: async (proposal) => {
      if (proposal.kind === 'catalog') {
        return api.createWatch({
          sourceId: proposal.sourceId,
          title: proposal.title,
          createdVia: 'photo',
        });
      }
      if (proposal.kind === 'link') {
        const intake = await api.intakeLink({ url: proposal.url, title: proposal.title });
        if (intake.supported) {
          return api.createWatch({ sourceId: intake.source.id, createdVia: 'photo' });
        }
        return api.createWatch({
          searchQuery: intake.suggestedQuery || proposal.title,
          title: proposal.title,
          createdVia: 'search',
        });
      }
      return api.createWatch({
        searchQuery: proposal.query,
        title: proposal.title,
        createdVia: 'search',
      });
    },
    onSuccess: () => {
      setPhotoResult(null);
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      router.replace('/(tabs)/watching');
    },
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
  });

  const extracted = photoResult?.extracted;
  const proposals = photoResult?.proposals ?? [];

  return (
    <ScreenShell>
      <View style={{ marginBottom: theme.spacing.md }}>
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        <Text style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
          {t('add.proposalsTitle')}
        </Text>
        {extracted ? (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.rule,
              borderWidth: theme.borders.hairline,
              padding: theme.spacing.md,
              marginVertical: theme.spacing.md,
            }}
          >
            <Text style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}>
              {extracted.examOrScheme || extracted.organization}
            </Text>
            {extracted.dates?.length > 0 ? (
              <Text
                style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
              >
                {extracted.dates.join(' · ')}
              </Text>
            ) : null}
          </View>
        ) : null}

        {error ? (
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
            {error}
          </Text>
        ) : null}

        <View style={{ gap: theme.spacing.sm }}>
          {proposals.map((p, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.rule,
                borderWidth: theme.borders.hairline,
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
              }}
            >
              <Text
                style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
              >
                {p.title}
              </Text>
              <Text
                style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
              >
                {p.kind} · {p.trust}
              </Text>
              <NewspaperButton
                disabled={confirmMutation.isPending}
                label={t('add.confirmWatch')}
                onPress={() => confirmMutation.mutate(p)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
