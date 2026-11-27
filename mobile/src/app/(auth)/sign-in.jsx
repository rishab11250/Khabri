import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { AuthHeader } from '@/features/settings/components/AuthHeader';
import { SignInFormCard } from '@/features/settings/components/SignInFormCard';
import { useAuthSignIn } from '@/features/settings/hooks/useAuthSignIn';
import { isSupabaseConfigured } from '@/lib/env';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function SignInScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { language, setLanguage, control, errors, isSubmitting, submitError, submitSignIn } =
    useAuthSignIn();
  const fonts = getFontFamilies(language);

  return (
    <ScreenShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl, paddingTop: theme.spacing.md }}
      >
        <AuthHeader
          language={language}
          onSelectLanguage={setLanguage}
          theme={theme}
          fonts={fonts}
          t={t}
        />

        {!isSupabaseConfigured ? (
          <View
            style={{
              backgroundColor: theme.colors.haldiSoft,
              borderRadius: theme.radii.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text
              style={[typeScale.body, { color: theme.colors.haldi, fontFamily: fonts.bodyBold }]}
            >
              {t('common.setupMissingTitle')}
            </Text>
            <Text
              style={[typeScale.caption, { color: theme.colors.haldi, fontFamily: fonts.body }]}
            >
              {t('common.setupMissingBody')}
            </Text>
          </View>
        ) : null}

        <SignInFormCard
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={submitSignIn}
          theme={theme}
          fonts={fonts}
          t={t}
        />

        <View style={{ marginTop: theme.spacing.lg }}>
          <Link href="/(auth)/sign-up" asChild>
            <NewspaperButton label={t('auth.switchToSignUp')} variant="card" />
          </Link>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
