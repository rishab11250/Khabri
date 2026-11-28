/**
 * @file Email/password sign-in screen with Supabase configuration warning and language toggle.
 */
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { AuthHeader } from '@/features/settings/components/AuthHeader';
import { SignInFormCard } from '@/features/settings/components/SignInFormCard';
import { useAuthSignIn } from '@/features/settings/hooks/useAuthSignIn';
import { isSupabaseConfigured } from '@/lib/env';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
  },
  setupBanner: {
    backgroundColor: theme.colors.haldiSoft,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  setupTitle: {
    ...typeScale.body,
    color: theme.colors.haldi,
    fontFamily: fonts.bodyBold,
  },
  setupBody: {
    ...typeScale.caption,
    color: theme.colors.haldi,
    fontFamily: fonts.body,
  },
  switchWrap: {
    marginTop: theme.spacing.lg,
  },
});

/**
 * Renders the user sign-in view and link to account registration.
 *
 * @returns {JSX.Element} Sign-in screen.
 */
export default function SignInScreen() {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const { language, setLanguage, control, errors, isSubmitting, submitError, submitSignIn } =
    useAuthSignIn();

  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AuthHeader language={language} onSelectLanguage={setLanguage} t={t} />

        {!isSupabaseConfigured ? (
          <View style={styles.setupBanner}>
            <Text style={styles.setupTitle}>{t('common.setupMissingTitle')}</Text>
            <Text style={styles.setupBody}>{t('common.setupMissingBody')}</Text>
          </View>
        ) : null}

        <SignInFormCard
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={submitSignIn}
          t={t}
        />

        <View style={styles.switchWrap}>
          <Link href="/(auth)/sign-up" asChild>
            <NewspaperButton label={t('auth.switchToSignUp')} variant="card" />
          </Link>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
