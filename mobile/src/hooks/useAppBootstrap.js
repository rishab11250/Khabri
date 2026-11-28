/**
 * Coordinates cold-start app hydration: fonts, persisted settings, Supabase session, cached
 * profile hydration, splash dismissal, push token registration, and notification deep-links.
 * Deliberately unblocks routing as soon as cached profile + fonts are ready while refreshing `/v1/me` online.
 */
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { api } from '@/lib/api';
import { isApiConfigured } from '@/lib/env';
import { extractChangeIdFromResponse, registerForPushNotificationsAsync } from '@/lib/push';
import { supabase } from '@/lib/supabase';
import { readCachedProfile, useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';
import { fontAssets } from '@/theme/typography';

// Keep native splash visible until fonts and session hydration settle.
SplashScreen.preventAutoHideAsync();

async function fetchAndApplyProfile(isMounted, setProfile, setLanguage) {
  try {
    const me = await api.getMe();
    if (!isMounted()) return;
    setProfile(me.user);
    if (me.user?.language) {
      setLanguage(me.user.language);
    }
  } catch {
    // Allow app to continue when offline or backend is cold-starting
  }
}

async function hydrateFromCache(isMounted, setSession, setProfile, setLanguage) {
  try {
    const [{ data }, cachedProfile] = await Promise.all([
      supabase.auth.getSession(),
      readCachedProfile(),
    ]);
    if (!isMounted()) return { aborted: true, session: null, hasCachedProfile: false };

    const session = data?.session ?? null;
    setSession(session);
    // Reject cached profiles from a previously logged-in user before hydrating store state.
    const matchesUser =
      cachedProfile &&
      (!cachedProfile.supabaseId || cachedProfile.supabaseId === session?.user?.id);
    if (session && matchesUser) {
      setProfile(cachedProfile);
      if (cachedProfile.language) {
        setLanguage(cachedProfile.language);
      }
      return { aborted: false, session, hasCachedProfile: true };
    }
    return { aborted: false, session, hasCachedProfile: false };
  } catch {
    return { aborted: false, session: null, hasCachedProfile: false };
  }
}

async function runBootstrap({ isMounted, setHydrated, setSession, setProfile, setLanguage }) {
  if (!supabase) {
    if (isMounted()) setHydrated(true);
    return;
  }

  const { aborted, session, hasCachedProfile } = await hydrateFromCache(
    isMounted,
    setSession,
    setProfile,
    setLanguage,
  );
  if (aborted) return;

  if (session && isApiConfigured) {
    if (hasCachedProfile && isMounted()) {
      setHydrated(true);
    }
    await fetchAndApplyProfile(isMounted, setProfile, setLanguage);
  }

  if (isMounted()) setHydrated(true);
}

function useNotificationDeepLinks() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!active || !response) return;
      const changeId = extractChangeIdFromResponse(response);
      if (changeId) {
        router.push(`/change/${changeId}`);
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const changeId = extractChangeIdFromResponse(response);
      if (changeId) {
        router.push(`/change/${changeId}`);
      }
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, [router]);
}

/**
 * Initializes fonts, auth session, settings store, push tokens, and notification navigation hooks.
 *
 * @returns {boolean} True when both fonts and session hydration have completed.
 */
export function useAppBootstrap() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const hydrated = useSessionStore((s) => s.hydrated);
  const session = useSessionStore((s) => s.session);
  const setHydrated = useSessionStore((s) => s.setHydrated);
  const setSession = useSessionStore((s) => s.setSession);
  const setProfile = useSessionStore((s) => s.setProfile);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const hydrateSettings = useSettingsStore((s) => s.hydrateSettings);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    let mounted = true;
    runBootstrap({
      isMounted: () => mounted,
      setHydrated,
      setSession,
      setProfile,
      setLanguage,
    });

    const authSub = supabase
      ? supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
          if (!nextSession) {
            setProfile(null);
          }
        })
      : null;

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (!supabase) return;
      if (state === 'active') supabase.auth.startAutoRefresh();
      else if (state === 'background') supabase.auth.stopAutoRefresh();
    });

    return () => {
      mounted = false;
      authSub?.data?.subscription?.unsubscribe();
      appStateSub?.remove();
    };
  }, [setHydrated, setLanguage, setProfile, setSession]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && hydrated && settingsHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, hydrated, settingsHydrated]);

  useEffect(() => {
    if (session) {
      registerForPushNotificationsAsync();
    }
  }, [session]);

  useNotificationDeepLinks();

  return hydrated && Boolean(fontsLoaded || fontError);
}
