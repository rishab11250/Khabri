import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Kabootar } from '@/components/Kabootar';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StepBar } from '@/components/StepBar';
import { ONBOARDING_LANGUAGES } from '@/features/settings/constants';
import { useOnboardingLanguage } from '@/features/settings/hooks/useOnboarding';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function OnboardingLanguageScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { language, selected, choose, handleContinue } = useOnboardingLanguage();
  const fonts = getFontFamilies(language);

  return (
    <ScreenShell>
      <StepBar step={1} />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}
          >
            {t('onboarding.languageTitle')}
          </Text>
          <Text
            style={[
              typeScale.body,
              { color: theme.colors.muted, fontFamily: fonts.body, marginTop: theme.spacing.xs },
            ]}
          >
            {t('onboarding.languageSubtitle')}
          </Text>
        </View>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: theme.spacing.md,
          }}
        >
          <Kabootar size={42} flap />
        </View>
      </View>

      <View style={{ gap: theme.spacing.md, flex: 1, marginTop: theme.spacing.sm }}>
        {ONBOARDING_LANGUAGES.map((item) => {
          const active = selected === item.code;
          return (
            <Pressable
              key={item.code}
              accessibilityRole="button"
              onPress={() => choose(item.code)}
              style={({ pressed }) => ({
                backgroundColor: theme.colors.card,
                borderColor: active ? theme.colors.accent : theme.colors.ruleSubtle,
                borderWidth: active ? theme.borders.double : theme.borders.hairline,
                borderRadius: theme.radii.md,
                padding: theme.spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
                <Text
                  style={[
                    typeScale.leadTitle,
                    { color: theme.colors.ink, fontFamily: fonts.headlineSemi },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    typeScale.caption,
                    { color: theme.colors.muted, fontFamily: fonts.body, marginTop: 4 },
                  ]}
                >
                  {item.subtitle}
                </Text>
              </View>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={active ? theme.colors.accent : theme.colors.muted}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingBottom: theme.spacing.lg }}>
        <NewspaperButton label={t('common.continue')} onPress={handleContinue} />
      </View>
    </ScreenShell>
  );
}
