import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { ShareIntentProvider, useShareIntent } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/i18n';
import { OfflineBanner } from '@/components/OfflineBanner';
import { api } from '@/lib/api';
import { isApiConfigured } from '@/lib/env';
import { extractChangeIdFromResponse, registerForPushNotificationsAsync } from '@/lib/push';
import { supabase } from '@/lib/supabase';
import { readCachedProfile, useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';
import { fontAssets } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ShareIntentWatcher({ ready }) {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    debug: false,
    resetOnBackground: true,
  });

  useEffect(() => {
    if (!ready) return undefined;
    const extractSharedUrl = (raw) => {
      if (!raw || typeof raw !== 'string') return null;
      const match = raw.match(/https?:\/\/\S+/i);
      return match ? match[0] : null;
    };

    const handleIncomingUrl = (rawUrl) => {
      if (!rawUrl) return;
      const parsed = Linking.parse(rawUrl);
      const paramUrl = parsed?.queryParams?.url;
      if (typeof paramUrl === 'string' && /^https?:\/\//i.test(paramUrl)) {
        router.push({ pathname: '/add/link', params: { url: paramUrl } });
        return;
      }
      if (parsed?.path?.startsWith('change/')) {
        const id = parsed.path.replace('change/', '');
        if (id) router.push(`/change/${id}`);
        return;
      }
      const embedded = extractSharedUrl(rawUrl);
      if (embedded) {
        router.push({ pathname: '/add/link', params: { url: embedded } });
      }
    };

    Linking.getInitialURL().then(handleIncomingUrl);
    const linkSub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
    return () => linkSub.remove();
  }, [ready, router]);

  useEffect(() => {
    if (!ready || !hasShareIntent) return;
    const candidate =
      shareIntent?.webUrl ||
      (typeof shareIntent?.text === 'string'
        ? shareIntent.text.match(/https?:\/\/\S+/i)?.[0]
        : null);
    if (candidate) {
      resetShareIntent();
      router.push({ pathname: '/add/link', params: { url: candidate } });
    } else {
      resetShareIntent();
    }
  }, [hasShareIntent, ready, resetShareIntent, router, shareIntent]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const theme = useTheme();
  const router = useRouter();
  const hydrated = useSessionStore((s) => s.hydrated);
  const session = useSessionStore((s) => s.session);
  const setHydrated = useSessionStore((s) => s.setHydrated);
  const setSession = useSessionStore((s) => s.setSession);
  const setProfile = useSessionStore((s) => s.setProfile);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const hydrateSettings = useSettingsStore((s) => s.hydrateSettings);

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      if (!supabase) {
        if (mounted) setHydrated(true);
        return;
      }
      let currentSession;
      let hasCachedProfile = false;
      try {
        const [{ data }, cachedProfile] = await Promise.all([
          supabase.auth.getSession(),
          readCachedProfile(),
        ]);
        if (!mounted) return;
        currentSession = data?.session ?? null;
        setSession(currentSession);
        if (
          currentSession &&
          cachedProfile &&
          (!cachedProfile.supabaseId || cachedProfile.supabaseId === currentSession.user?.id)
        ) {
          hasCachedProfile = true;
          setProfile(cachedProfile);
          if (cachedProfile.language) {
            setLanguage(cachedProfile.language);
          }
        }
      } catch {
        currentSession = null;
      }

      if (currentSession && isApiConfigured && hasCachedProfile) {
        if (mounted) setHydrated(true);
        try {
          const me = await api.getMe();
          if (!mounted) return;
          setProfile(me.user);
          if (me.user?.language) {
            setLanguage(me.user.language);
          }
        } catch {
          // Keep cached profile when offline or API cold-starting
        }
        return;
      }

      if (currentSession && isApiConfigured) {
        try {
          const me = await api.getMe();
          if (!mounted) return;
          setProfile(me.user);
          if (me.user?.language) {
            setLanguage(me.user.language);
          }
        } catch {
          // Allow app to continue even if backend is unreachable
        }
      }

      if (mounted) setHydrated(true);
    }

    bootstrapSession();

    const authSub = supabase
      ? supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
          if (!nextSession) {
            setProfile(null);
          }
        })
      : null;

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (supabase) supabase.auth.startAutoRefresh();
      } else if (state === 'background') {
        if (supabase) supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      mounted = false;
      authSub?.data?.subscription?.unsubscribe();
      appStateSub?.remove();
    };
  }, [setHydrated, setLanguage, setProfile, setSession]);

  const settingsHydrated = useSettingsStore((s) => s.hydrated);

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

  const isReady = hydrated && Boolean(fontsLoaded || fontError);
  if (!isReady) {
    return null;
  }

  return (
    <ShareIntentProvider>
      <ShareIntentWatcher ready={isReady} />
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <OfflineBanner />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            />
          </View>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ShareIntentProvider>
  );
}
