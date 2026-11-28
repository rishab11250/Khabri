/**
 * @file Account registration screen with password-strength validation and language switcher.
 */
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { AuthHeader } from '@/features/settings/components/AuthHeader';
import { SignUpFormCard } from '@/features/settings/components/SignUpFormCard';
import { useAuthSignUp } from '@/features/settings/hooks/useAuthSignUp';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme) => ({
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
  },
  switchWrap: {
    marginTop: theme.spacing.lg,
  },
});

/**
 * Renders the sign-up form and link back to sign-in.
 *
 * @returns {JSX.Element} Sign-up screen.
 */
export default function SignUpScreen() {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
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

  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AuthHeader language={language} onSelectLanguage={setLanguage} t={t} />

        <SignUpFormCard
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          passwordValue={passwordValue}
          strength={strength}
          submitError={submitError}
          notice={notice}
          onSubmit={submitSignUp}
          t={t}
        />

        <View style={styles.switchWrap}>
          <Link href="/(auth)/sign-in" asChild>
            <NewspaperButton label={t('auth.switchToSignIn')} variant="card" />
          </Link>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
