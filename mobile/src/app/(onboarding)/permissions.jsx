/**
 * @file Onboarding Step 4 screen requesting push notification permission and completing setup.
 */
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StepBar } from '@/components/StepBar';
import { useOnboardingPermissions } from '@/features/settings/hooks/useOnboarding';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyWrap: {
    gap: theme.spacing.sm,
  },
  title: {
    ...typeScale.masthead,
    color: theme.colors.ink,
    fontFamily: fonts.headline,
  },
  subtitle: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.md,
  },
  actions: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
});

/**
 * Requests optional notification opt-in and persists onboarding completion.
 *
 * @returns {JSX.Element} Onboarding permissions screen.
 */
export default function OnboardingPermissionsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const { saving, error, completeOnboarding } = useOnboardingPermissions();

  return (
    <ScreenShell>
      <StepBar step={4} />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={34} color={theme.colors.accent} />
        </View>

        <View style={styles.copyWrap}>
          <Text style={styles.title}>{t('onboarding.permissionsTitle')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.permissionsSubtitle')}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <NewspaperButton
          disabled={saving}
          icon="notifications-outline"
          label={saving ? t('onboarding.savingProfile') : t('onboarding.enableNotifications')}
          onPress={() => completeOnboarding(true)}
        />
        <NewspaperButton
          variant="secondary"
          disabled={saving}
          label={t('onboarding.skipNotifications')}
          onPress={() => completeOnboarding(false)}
        />
      </View>
    </ScreenShell>
  );
}
