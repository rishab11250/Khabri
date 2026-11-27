import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StepBar } from '@/components/StepBar';
import { useOnboardingPermissions } from '@/features/settings/hooks/useOnboarding';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function OnboardingPermissionsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { language, saving, error, completeOnboarding } = useOnboardingPermissions();
  const fonts = getFontFamilies(language);

  return (
    <ScreenShell>
      <StepBar step={4} />

      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.lg }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: theme.colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="notifications-outline" size={34} color={theme.colors.accent} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text
            style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}
          >
            {t('onboarding.permissionsTitle')}
          </Text>
          <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
            {t('onboarding.permissionsSubtitle')}
          </Text>
        </View>
      </View>

      {error ? (
        <Text
          style={[
            typeScale.caption,
            {
              color: theme.colors.accent,
              fontFamily: fonts.bodyMedium,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}

      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}>
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
