/**
 * Synchronizes Me-tab language, theme, digest schedule, and quiet-hours edits with local storage and `/v1/me`.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';
import { isApiConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';

/**
 * Settings screen controller hook exposing preferences, profile summary data, nav links, and sign-out.
 *
 * @returns {object} Settings values, navigation items, and preference mutation handlers.
 */
export function useMeSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    language,
    setLanguage,
    themePreference,
    setThemePreference,
    quietHours,
    setQuietHours,
    digestTime,
    setDigestTime,
  } = useSettingsStore();
  const { session, profile, setProfile, clearSession } = useSessionStore();

  const patchRemote = async (payload) => {
    if (!session || !isApiConfigured) return;
    try {
      const res = await api.patchMe(payload);
      setProfile(res.user);
    } catch {
      // Keep local preference if API is temporarily unreachable
    }
  };

  const handleLanguageChange = async (code) => {
    setLanguage(code);
    await patchRemote({ language: code });
  };

  const handleToggleQuietHours = async () => {
    const next = { ...quietHours, enabled: !quietHours.enabled };
    setQuietHours(next);
    await patchRemote({ quietHours: next });
  };

  const handleToggleBypassUrgent = async () => {
    const next = { ...quietHours, bypassUrgent: !quietHours.bypassUrgent };
    setQuietHours(next);
    await patchRemote({ quietHours: next });
  };

  const handleDigestTimeChange = async (time) => {
    setDigestTime(time);
    await patchRemote({ digestTime: time });
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearSession();
    router.replace('/(auth)/sign-in');
  };

  const userEmail = session?.user?.email ?? '';
  const avatarInitial = (profile?.name || userEmail || 'K').charAt(0).toUpperCase();

  const themeOptions = [
    { key: 'system', label: t('me.themeSystem') },
    { key: 'light', label: t('me.themeLight') },
    { key: 'dark', label: t('me.themeDark') },
  ];

  const navItems = [
    { label: t('circles.title'), icon: 'people-outline', route: '/circles' },
    { label: t('ask.title'), icon: 'sparkles-outline', route: '/ask' },
    { label: t('about.title'), icon: 'information-circle-outline', route: '/about' },
  ];

  return {
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
  };
}
