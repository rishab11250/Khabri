import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Kabootar } from '../../src/components/Kabootar';
import { Masthead } from '../../src/components/Masthead';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { useSessionStore } from '../../src/store/session';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

const LANGUAGES = [
  { code: 'en', title: 'English', subtitle: 'Hinglish-warm editorial' },
  { code: 'hi', title: 'हिन्दी', subtitle: 'हिंदी अख़बार संस्करण' },
  { code: 'gu', title: 'ગુજરાતી', subtitle: 'ગુજરાતી અખબાર આવૃત્તિ' },
];

export default function OnboardingLanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { language, setLanguage } = useSettingsStore();
  const { session, onboardingDraft, updateOnboardingDraft } = useSessionStore();
  const fonts = getFontFamilies(language);

  const selected = onboardingDraft.language ?? language;

  const choose = (code) => {
    setLanguage(code);
    updateOnboardingDraft({ language: code });
  };

  const handleContinue = () => {
    setLanguage(selected);
    updateOnboardingDraft({ language: selected });
    if (session) {
      router.push('/(onboarding)/state');
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  return (
    <ScreenShell>
      <Masthead
        title={t('app.name')}
        eyebrowLeft="SUBAH KA AKHBAAR"
        eyebrowRight={t('onboarding.stepIndicator', { step: 1 })}
        rightAction={<Kabootar size={44} flap />}
      />

      <Text
        style={[
          typeScale.title,
          { color: theme.colors.ink, fontFamily: fonts.headlineSemi, marginTop: theme.spacing.xs },
        ]}
      >
        {t('onboarding.languageTitle')}
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
        {t('onboarding.languageSubtitle')}
      </Text>

      <View style={{ gap: theme.spacing.md, flex: 1 }}>
        {LANGUAGES.map((item) => {
          const active = selected === item.code;
          return (
            <Pressable
              key={item.code}
              accessibilityRole="button"
              onPress={() => choose(item.code)}
              style={{
                backgroundColor: active ? theme.colors.accent : theme.colors.card,
                borderColor: active ? theme.colors.accent : theme.colors.ruleSubtle,
                borderWidth: theme.borders.hairline,
                borderRadius: theme.radii.md,
                padding: theme.spacing.lg,
              }}
            >
              <Text
                style={[
                  typeScale.title,
                  {
                    color: active ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: fonts.headlineSemi,
                  },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  typeScale.caption,
                  {
                    color: active ? theme.colors.onAccent : theme.colors.muted,
                    fontFamily: fonts.body,
                    marginTop: theme.spacing.xs,
                  },
                ]}
              >
                {item.subtitle}
              </Text>
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
