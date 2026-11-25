import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { INTEREST_CATEGORIES } from '../../src/constants/india';
import { useSessionStore } from '../../src/store/session';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function OnboardingInterestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);
  const { onboardingDraft, updateOnboardingDraft } = useSessionStore();
  const [error, setError] = useState('');

  const selected = onboardingDraft.interests ?? [];

  const toggle = (cat) => {
    setError('');
    const next = selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat];
    updateOnboardingDraft({ interests: next });
  };

  const onNext = () => {
    if (selected.length === 0) {
      setError(t('onboarding.interestMinError'));
      return;
    }
    router.push('/(onboarding)/permissions');
  };

  return (
    <ScreenShell>
      <Text
        style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.bodyMedium }]}
      >
        {t('onboarding.stepIndicator', { step: 3 })}
      </Text>
      <Text
        style={[
          typeScale.masthead,
          { color: theme.colors.ink, fontFamily: fonts.headline, marginTop: theme.spacing.xs },
        ]}
      >
        {t('onboarding.interestsTitle')}
      </Text>
      <Text
        style={[
          typeScale.body,
          {
            color: theme.colors.muted,
            fontFamily: fonts.body,
            marginTop: theme.spacing.sm,
            marginBottom: theme.spacing.xl,
          },
        ]}
      >
        {t('onboarding.interestsSubtitle')}
      </Text>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ gap: theme.spacing.sm }}>
          {INTEREST_CATEGORIES.map((cat) => {
            const active = selected.includes(cat);
            return (
              <Pressable
                key={cat}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                onPress={() => toggle(cat)}
                style={{
                  backgroundColor: active ? theme.colors.accent : theme.colors.card,
                  borderColor: active ? theme.colors.accent : theme.colors.rule,
                  borderWidth: theme.borders.hairline,
                  padding: theme.spacing.lg,
                }}
              >
                <Text
                  style={[
                    typeScale.section,
                    {
                      color: active ? theme.colors.onAccent : theme.colors.ink,
                      fontFamily: active ? fonts.bodyBold : fonts.bodyMedium,
                    },
                  ]}
                >
                  {t(`onboarding.categories.${cat}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

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

      <View
        style={{ flexDirection: 'row', gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}
      >
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant="secondary"
            label={t('common.back')}
            onPress={() => router.back()}
          />
        </View>
        <View style={{ flex: 2 }}>
          <NewspaperButton label={t('common.continue')} onPress={onNext} />
        </View>
      </View>
    </ScreenShell>
  );
}
