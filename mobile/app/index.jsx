import { Redirect } from 'expo-router';
import { useSessionStore } from '../src/store/session';

export default function IndexGate() {
  const hydrated = useSessionStore((s) => s.hydrated);
  const session = useSessionStore((s) => s.session);
  const profile = useSessionStore((s) => s.profile);

  if (!hydrated) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!profile?.onboardingComplete) {
    return <Redirect href="/(onboarding)/language" />;
  }

  return <Redirect href="/(tabs)/today" />;
}
