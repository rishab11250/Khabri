import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { AuthHeader } from '@/features/settings/components/AuthHeader';
import { SignUpFormCard } from '@/features/settings/components/SignUpFormCard';
import { useAuthSignUp } from '@/features/settings/hooks/useAuthSignUp';
import { getFontFamilies } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    language,
    setLanguage,
    control,
    errors,
    isSubmitting,
    passwordValue,
    strength,
    submitError,
    notice,
    submitSignUp,
  } = useAuthSignUp();
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

        <SignUpFormCard
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          passwordValue={passwordValue}
          strength={strength}
          submitError={submitError}
          notice={notice}
          onSubmit={submitSignUp}
          theme={theme}
          fonts={fonts}
          t={t}
        />

        <View style={{ marginTop: theme.spacing.lg }}>
          <Link href="/(auth)/sign-in" asChild>
            <NewspaperButton label={t('auth.switchToSignIn')} variant="card" />
          </Link>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
