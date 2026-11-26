import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { authenticateBiometrics, isBiometricsAvailable } from '../../src/lib/biometrics';
import { isApiConfigured } from '../../src/lib/env';
import { supabase } from '../../src/lib/supabase';
import { useSessionStore } from '../../src/store/session';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

const DIGEST_TIMES = [
  { time: '08:00', label: '08:00 AM' },
  { time: '09:00', label: '09:00 AM' },
  { time: '20:00', label: '08:00 PM' },
];

export default function MeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const {
    language,
    setLanguage,
    themePreference,
    setThemePreference,
    appLockEnabled,
    setAppLockEnabled,
    quietHours,
    setQuietHours,
    digestTime,
    setDigestTime,
  } = useSettingsStore();
  const { session, profile, setProfile, clearSession } = useSessionStore();
  const [healthText, setHealthText] = useState('');
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    isBiometricsAvailable().then(setBiometricsSupported);
  }, []);

  const themeOptions = [
    { key: 'system', label: t('me.themeSystem') },
    { key: 'light', label: t('me.themeLight') },
    { key: 'dark', label: t('me.themeDark') },
  ];

  const handleLanguageChange = async (code) => {
    setLanguage(code);
    if (session && isApiConfigured) {
      try {
        const res = await api.patchMe({ language: code });
        setProfile(res.user);
      } catch {
        // Keep local preference if API is temporarily unreachable
      }
    }
  };

  const handleToggleQuietHours = async () => {
    const next = { ...quietHours, enabled: !quietHours.enabled };
    setQuietHours(next);
    if (session && isApiConfigured) {
      try {
        const res = await api.patchMe({ quietHours: next });
        setProfile(res.user);
      } catch {
        // local setting persisted
      }
    }
  };

  const handleToggleBypassUrgent = async () => {
    const next = { ...quietHours, bypassUrgent: !quietHours.bypassUrgent };
    setQuietHours(next);
    if (session && isApiConfigured) {
      try {
        const res = await api.patchMe({ quietHours: next });
        setProfile(res.user);
      } catch {
        // local setting persisted
      }
    }
  };

  const handleDigestTimeChange = async (time) => {
    setDigestTime(time);
    if (session && isApiConfigured) {
      try {
        const res = await api.patchMe({ digestTime: time });
        setProfile(res.user);
      } catch {
        // local setting persisted
      }
    }
  };

  const handleToggleAppLock = async () => {
    setStatusMsg('');
    const ok = await authenticateBiometrics(
      appLockEnabled ? t('lock.disablePrompt') : t('lock.enablePrompt'),
    );
    if (ok) {
      setAppLockEnabled(!appLockEnabled);
    } else {
      setStatusMsg(t('lock.failed'));
    }
  };

  const checkHealth = async () => {
    setHealthText(t('me.backendChecking'));
    try {
      const data = await api.getHealth();
      setHealthText(t('me.backendOnline', { db: data.db ?? 'ok' }));
    } catch {
      setHealthText(t('me.backendOffline'));
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearSession();
    router.replace('/(auth)/sign-in');
  };

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        <View
          style={{
            borderBottomColor: theme.colors.rule,
            borderBottomWidth: theme.borders.rule,
            paddingBottom: theme.spacing.sm,
            marginBottom: theme.spacing.lg,
          }}
        >
          <Text style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
            {t('me.title')}
          </Text>
        </View>

        {session ? (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.rule,
              borderWidth: theme.borders.hairline,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.xl,
            }}
          >
            <Text
              style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.bodyBold }]}
            >
              {t('me.account')}
            </Text>
            <Text
              style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyMedium }]}
            >
              {t('me.signedInAs', { email: session.user?.email ?? '' })}
            </Text>
            {profile?.state ? (
              <Text
                style={[
                  typeScale.caption,
                  {
                    color: theme.colors.muted,
                    fontFamily: fonts.body,
                    marginTop: theme.spacing.xs,
                  },
                ]}
              >
                {t('me.stateLabel', { state: profile.state })}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text
          style={[
            typeScale.section,
            { color: theme.colors.ink, fontFamily: fonts.bodyBold, marginBottom: theme.spacing.sm },
          ]}
        >
          {t('me.language')}
        </Text>
        <View style={[styles.row, { gap: theme.spacing.sm, marginBottom: theme.spacing.xl }]}>
          {LANGUAGES.map((item) => {
            const active = language === item.code;
            return (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                onPress={() => handleLanguageChange(item.code)}
                style={{
                  borderWidth: theme.borders.hairline,
                  borderColor: active ? theme.colors.accent : theme.colors.rule,
                  backgroundColor: active ? theme.colors.accent : theme.colors.card,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                }}
              >
                <Text
                  style={[
                    typeScale.caption,
                    {
                      color: active ? theme.colors.onAccent : theme.colors.ink,
                      fontFamily: fonts.bodyMedium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text
          style={[
            typeScale.section,
            { color: theme.colors.ink, fontFamily: fonts.bodyBold, marginBottom: theme.spacing.sm },
          ]}
        >
          {t('me.theme')}
        </Text>
        <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
          {themeOptions.map((item) => {
            const active = themePreference === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => setThemePreference(item.key)}
                style={{
                  borderWidth: theme.borders.hairline,
                  borderColor: active ? theme.colors.accent : theme.colors.rule,
                  backgroundColor: active ? theme.colors.accent : theme.colors.card,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                }}
              >
                <Text
                  style={[
                    typeScale.body,
                    {
                      color: active ? theme.colors.onAccent : theme.colors.ink,
                      fontFamily: fonts.bodyMedium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* F12: Digest & Quiet Hours Section */}
        <Text
          style={[
            typeScale.section,
            { color: theme.colors.ink, fontFamily: fonts.bodyBold, marginBottom: theme.spacing.sm },
          ]}
        >
          {t('me.digestSection')}
        </Text>
        <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
          <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
            {t('me.digestTimeHelp')}
          </Text>
          <View style={[styles.row, { gap: theme.spacing.sm }]}>
            {DIGEST_TIMES.map((item) => {
              const active = digestTime === item.time;
              return (
                <Pressable
                  key={item.time}
                  accessibilityRole="button"
                  onPress={() => handleDigestTimeChange(item.time)}
                  style={{
                    borderWidth: theme.borders.hairline,
                    borderColor: active ? theme.colors.accent : theme.colors.rule,
                    backgroundColor: active ? theme.colors.accent : theme.colors.card,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                  }}
                >
                  <Text
                    style={[
                      typeScale.caption,
                      {
                        color: active ? theme.colors.onAccent : theme.colors.ink,
                        fontFamily: fonts.bodyMedium,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={{
              backgroundColor: theme.colors.card,
              borderWidth: theme.borders.hairline,
              borderColor: theme.colors.rule,
              padding: theme.spacing.md,
              gap: theme.spacing.sm,
              marginTop: theme.spacing.sm,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
                >
                  {t('me.quietHoursTitle')}
                </Text>
                <Text
                  style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
                >
                  {t('me.quietHoursHours', { start: quietHours.start, end: quietHours.end })}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={handleToggleQuietHours}
                style={{
                  borderWidth: theme.borders.hairline,
                  borderColor: quietHours.enabled ? theme.colors.accent : theme.colors.rule,
                  backgroundColor: quietHours.enabled ? theme.colors.accent : 'transparent',
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                }}
              >
                <Text
                  style={[
                    typeScale.caption,
                    {
                      color: quietHours.enabled ? theme.colors.onAccent : theme.colors.ink,
                      fontFamily: fonts.bodyBold,
                    },
                  ]}
                >
                  {quietHours.enabled ? t('common.enabled') : t('common.disabled')}
                </Text>
              </Pressable>
            </View>

            {quietHours.enabled ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: quietHours.bypassUrgent }}
                onPress={handleToggleBypassUrgent}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  paddingTop: theme.spacing.xs,
                  borderTopWidth: theme.borders.hairline,
                  borderTopColor: theme.colors.ruleSubtle,
                }}
              >
                <Text
                  style={[
                    typeScale.caption,
                    { color: theme.colors.accent, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {quietHours.bypassUrgent ? '[x]' : '[ ]'}
                </Text>
                <Text
                  style={[typeScale.caption, { color: theme.colors.ink, fontFamily: fonts.body }]}
                >
                  {t('me.quietHoursBypass')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* F15: Biometrics Section */}
        {biometricsSupported ? (
          <>
            <Text
              style={[
                typeScale.section,
                {
                  color: theme.colors.ink,
                  fontFamily: fonts.bodyBold,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              {t('me.security')}
            </Text>
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderWidth: theme.borders.hairline,
                borderColor: theme.colors.rule,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.xl,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
                <Text
                  style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
                >
                  {t('lock.title')}
                </Text>
                <Text
                  style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
                >
                  {t('lock.description')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={handleToggleAppLock}
                style={{
                  borderWidth: theme.borders.hairline,
                  borderColor: appLockEnabled ? theme.colors.accent : theme.colors.rule,
                  backgroundColor: appLockEnabled ? theme.colors.accent : 'transparent',
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                }}
              >
                <Text
                  style={[
                    typeScale.caption,
                    {
                      color: appLockEnabled ? theme.colors.onAccent : theme.colors.ink,
                      fontFamily: fonts.bodyBold,
                    },
                  ]}
                >
                  {appLockEnabled ? t('common.enabled') : t('common.disabled')}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {statusMsg ? (
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
            {statusMsg}
          </Text>
        ) : null}

        <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
          <NewspaperButton
            variant="secondary"
            label={t('circles.title')}
            onPress={() => router.push('/circles')}
          />
          <NewspaperButton
            variant="secondary"
            label={t('ask.title')}
            onPress={() => router.push('/ask')}
          />
          <NewspaperButton
            variant="secondary"
            label={t('about.title')}
            onPress={() => router.push('/about')}
          />
          <NewspaperButton variant="secondary" label={t('me.checkBackend')} onPress={checkHealth} />
          {healthText ? (
            <Text
              style={[
                typeScale.caption,
                { color: theme.colors.neel, fontFamily: fonts.bodyMedium },
              ]}
            >
              {t('me.backendStatus')}: {healthText}
            </Text>
          ) : null}
          {session ? <NewspaperButton label={t('auth.signOut')} onPress={handleSignOut} /> : null}
        </View>

        <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('app.unofficialDisclaimer')}
        </Text>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
