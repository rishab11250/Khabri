import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StepBar } from '@/components/StepBar';
import { INTEREST_CATEGORIES } from '@/constants/india';
import { INTEREST_CATEGORY_ICONS } from '@/features/settings/constants';
import { useOnboardingInterests } from '@/features/settings/hooks/useOnboarding';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function OnboardingInterestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { language, selected, error, toggle, handleContinue } = useOnboardingInterests();
  const fonts = getFontFamilies(language);

  return (
    <ScreenShell>
      <StepBar step={3} />

      <Text style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
        {t('onboarding.interestsTitle')}
      </Text>
      <Text
        style={[
          typeScale.body,
          {
            color: theme.colors.muted,
            fontFamily: fonts.body,
            marginTop: theme.spacing.xs,
            marginBottom: theme.spacing.lg,
          },
        ]}
      >
        {t('onboarding.interestsSubtitle')}
      </Text>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
                  backgroundColor: theme.colors.card,
                  borderColor: active ? theme.colors.accent : theme.colors.ruleSubtle,
                  borderWidth: active ? theme.borders.double : theme.borders.hairline,
                  borderRadius: theme.radii.md,
                  padding: theme.spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: theme.radii.sm,
                      backgroundColor: active ? theme.colors.accent : theme.colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={INTEREST_CATEGORY_ICONS[cat] || 'bookmark-outline'}
                      size={20}
                      color={active ? theme.colors.onAccent : theme.colors.ink}
                    />
                  </View>
                  <Text
                    style={[
                      typeScale.section,
                      { color: theme.colors.ink, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t(`onboarding.categories.${cat}`)}
                  </Text>
                </View>
                <Ionicons
                  name={active ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={active ? theme.colors.accent : theme.colors.muted}
                />
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
          <NewspaperButton label={t('common.continue')} onPress={handleContinue} />
        </View>
      </View>
    </ScreenShell>
  );
}
