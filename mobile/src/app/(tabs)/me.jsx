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
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function MeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      >
        {session ? (
          <ProfileSummaryCard
            profile={profile}
            userEmail={userEmail}
            avatarInitial={avatarInitial}
            theme={theme}
            fonts={fonts}
            t={t}
          />
        ) : null}

        <SectionHeader label={t('me.language')} />
        <SegmentedOptionBar
          options={SETTINGS_LANGUAGES.map((item) => ({ key: item.code, label: item.label }))}
          value={language}
          onSelect={handleLanguageChange}
          theme={theme}
          fonts={fonts}
          marginBottom={theme.spacing.xl}
        />

        <SectionHeader label={t('me.theme')} />
        <SegmentedOptionBar
          options={themeOptions}
          value={themePreference}
          onSelect={setThemePreference}
          theme={theme}
          fonts={fonts}
          marginBottom={theme.spacing.xl}
        />

        <DigestSettingsSection
          theme={theme}
          fonts={fonts}
          t={t}
          digestTime={digestTime}
          quietHours={quietHours}
          onSelectDigestTime={handleDigestTimeChange}
          onToggleQuietHours={handleToggleQuietHours}
          onToggleBypassUrgent={handleToggleBypassUrgent}
        />

        <SettingsNavList
          items={navItems}
          theme={theme}
          fonts={fonts}
          onNavigate={(route) => router.push(route)}
        />

        {session ? (
          <View style={{ marginBottom: theme.spacing.lg }}>
            <NewspaperButton
              icon="log-out-outline"
              label={t('auth.signOut')}
              onPress={handleSignOut}
            />
          </View>
        ) : null}

        <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('app.unofficialDisclaimer')}
        </Text>
      </ScrollView>
    </ScreenShell>
  );
}
