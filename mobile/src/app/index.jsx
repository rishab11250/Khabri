/**
 * @file Root launch gate routing the user to onboarding, sign-in, or the main tab feed.
 */
import { Redirect } from 'expo-router';

import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';

/**
 * Redirects initial app entry once session and settings stores hydrate.
 *
 * @returns {JSX.Element | null} Redirect element or `null` while stores hydrate.
 */
export default function IndexGate() {
  const hydrated = useSessionStore((s) => s.hydrated);
  const session = useSessionStore((s) => s.session);
  const profile = useSessionStore((s) => s.profile);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const languageChosen = useSettingsStore((s) => s.languageChosen);

  if (!hydrated || !settingsHydrated) {
    return null;
  }

  if (!session) {
    if (!languageChosen) {
      return <Redirect href="/(onboarding)/language" />;
    }
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!profile?.onboardingComplete) {
    return <Redirect href="/(onboarding)/state" />;
  }

  return <Redirect href="/(tabs)/today" />;
}
