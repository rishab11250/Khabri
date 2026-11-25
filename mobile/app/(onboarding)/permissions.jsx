import { useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { isApiConfigured } from '../../src/lib/env';
import { useSessionStore } from '../../src/store/session';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function OnboardingPermissionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);
  const { onboardingDraft, setProfile } = useSessionStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const completeOnboarding = async (askPermission) => {
    setSaving(true);
    setError('');
    try {
      if (askPermission) {
        await Notifications.requestPermissionsAsync();
      }
      const payload = {
        language: onboardingDraft.language ?? language,
        state: onboardingDraft.state ?? 'All India',
        interests: onboardingDraft.interests ?? ['exam'],
        onboardingComplete: true,
      };
      if (isApiConfigured) {
        const res = await api.patchMe(payload);
        setProfile(res.user);
      } else {
        setProfile(payload);
      }
      router.replace('/(tabs)/today');
    } catch (err) {
      setError(err?.message ?? t('common.errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell>
      <Text
        style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.bodyMedium }]}
      >
        {t('onboarding.stepIndicator', { step: 4 })}
      </Text>
      <Text
        style={[
          typeScale.masthead,
          { color: theme.colors.ink, fontFamily: fonts.headline, marginTop: theme.spacing.xs },
        ]}
      >
        {t('onboarding.permissionsTitle')}
      </Text>
      <Text
        style={[
          typeScale.body,
          {
            color: theme.colors.muted,
            fontFamily: fonts.body,
            marginTop: theme.spacing.sm,
            flex: 1,
          },
        ]}
      >
        {t('onboarding.permissionsSubtitle')}
      </Text>

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
          label={saving ? t('onboarding.savingProfile') : t('onboarding.enableNotifications')}
          onPress={() => completeOnboarding(true)}
        />
        <NewspaperButton
          variant="secondary"
          disabled={saving}
          label={t('onboarding.skipNotifications')}
          onPress={() => completeOnboarding(false)}
        />
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>
    </ScreenShell>
  );
}
