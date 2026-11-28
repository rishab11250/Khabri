/**
 * @file Account and settings tab managing language, theme, digest schedule, quiet hours, and sign-out.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Masthead, SectionHeader } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { DigestSettingsSection } from '@/features/settings/components/DigestSettingsSection';
import { ProfileSummaryCard } from '@/features/settings/components/ProfileSummaryCard';
import { SegmentedOptionBar } from '@/features/settings/components/SegmentedOptionBar';
import { SettingsNavList } from '@/features/settings/components/SettingsNavList';
import { SETTINGS_LANGUAGES } from '@/features/settings/constants';
import { useMeSettings } from '@/features/settings/hooks/useMeSettings';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  signOutWrap: {
    marginBottom: theme.spacing.lg,
  },
  disclaimer: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
});

/**
 * Renders profile summary, preferences controls, sub-navigation links, and sign-out button.
 *
 * @returns {JSX.Element} Account settings tab screen.
 */
export default function MeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const {
    session,
    profile,
    userEmail,
    avatarInitial,
    language,
    themePreference,
    setThemePreference,
    themeOptions,
    digestTime,
    quietHours,
    navItems,
    handleLanguageChange,
    handleToggleQuietHours,
    handleToggleBypassUrgent,
    handleDigestTimeChange,
    handleSignOut,
  } = useMeSettings();

  return (
    <ScreenShell>
      <Masthead title={t('me.title')} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {session ? (
          <ProfileSummaryCard
            profile={profile}
            userEmail={userEmail}
            avatarInitial={avatarInitial}
            t={t}
          />
        ) : null}

        <SectionHeader label={t('me.language')} />
        <SegmentedOptionBar
          options={SETTINGS_LANGUAGES.map((item) => ({ key: item.code, label: item.label }))}
          value={language}
          onSelect={handleLanguageChange}
          marginBottom={theme.spacing.xl}
        />

        <SectionHeader label={t('me.theme')} />
        <SegmentedOptionBar
          options={themeOptions}
          value={themePreference}
          onSelect={setThemePreference}
          marginBottom={theme.spacing.xl}
        />

        <DigestSettingsSection
          t={t}
          digestTime={digestTime}
          quietHours={quietHours}
          onSelectDigestTime={handleDigestTimeChange}
          onToggleQuietHours={handleToggleQuietHours}
          onToggleBypassUrgent={handleToggleBypassUrgent}
        />

        <SettingsNavList items={navItems} onNavigate={(route) => router.push(route)} />

        {session ? (
          <View style={styles.signOutWrap}>
            <NewspaperButton
              icon="log-out-outline"
              label={t('auth.signOut')}
              onPress={handleSignOut}
            />
          </View>
        ) : null}

        <Text style={styles.disclaimer}>{t('app.unofficialDisclaimer')}</Text>
      </ScrollView>
    </ScreenShell>
  );
}
