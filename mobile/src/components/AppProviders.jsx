/**
 * @file Top-level React Query, SafeArea, Share Intent, and offline-banner provider tree.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ShareIntentProvider, useShareIntent } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/OfflineBanner';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const queryClient = new QueryClient();

const createStyles = (theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

function extractSharedUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.match(/https?:\/\/\S+/i);
  return match ? match[0] : null;
}

function ShareIntentWatcher({ ready }) {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    debug: false,
    resetOnBackground: true,
  });

  useEffect(() => {
    if (!ready) return undefined;

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

/**
 * Wraps root navigation with query cache, safe-area context, offline banner, and OS share/link listeners.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.ready - Delays deep-link navigation until fonts and stores finish bootstrapping.
 * @param {JSX.Element | JSX.Element[]} props.children - Root navigator subtree.
 * @returns {JSX.Element} Provider-wrapped application root.
 */
export function AppProviders({ ready, children }) {
  const theme = useTheme();
  const styles = useStyles(createStyles);

  return (
    <ShareIntentProvider>
      <ShareIntentWatcher ready={ready} />
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
          <View style={styles.root}>
            <OfflineBanner />
            {children}
          </View>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ShareIntentProvider>
  );
}
