import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/i18n';
import { AppLockModal } from '../src/components/AppLockModal';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { api } from '../src/lib/api';
import { isApiConfigured } from '../src/lib/env';
import { extractChangeIdFromResponse, registerForPushNotificationsAsync } from '../src/lib/push';
import { supabase } from '../src/lib/supabase';
import { useSessionStore } from '../src/store/session';
import { useSettingsStore } from '../src/store/settings';
import { fontAssets } from '../src/theme/typography';
import { useTheme } from '../src/theme/useTheme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
  const lock = useSettingsStore((s) => s.lock);

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
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const currentSession = data?.session ?? null;
        setSession(currentSession);
        if (currentSession && isApiConfigured) {
          try {
            const me = await api.getMe();
            if (!mounted) return;
            setProfile(me.user);
            if (me.user?.language) {
              setLanguage(me.user.language);
            }
          } catch {
            if (mounted) setProfile(null);
          }
        }
      } finally {
        if (mounted) setHydrated(true);
      }
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
        lock();
      }
    });

    return () => {
      mounted = false;
      authSub?.data?.subscription?.unsubscribe();
      appStateSub?.remove();
    };
  }, [hydrateSettings, lock, setHydrated, setLanguage, setProfile, setSession]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, hydrated]);

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

  if ((!fontsLoaded && !fontError) || !hydrated) {
    return null;
  }

  return (
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
        <AppLockModal />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
