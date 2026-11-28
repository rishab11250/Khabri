/**
 * Provides step-by-step hooks for the 4-screen onboarding flow (language, state/GPS, interests, notifications).
 */
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { matchIndianState } from '@/constants/india';
import { api } from '@/lib/api';
import { isApiConfigured } from '@/lib/env';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';

/**
 * Hook for onboarding step 1 (UI language selection and auth/state step routing).
 *
 * @returns {{ language: string, selected: string, choose: Function, handleContinue: () => void }} Step 1 controls.
 */
export function useOnboardingLanguage() {
  const router = useRouter();
  const { language, setLanguage } = useSettingsStore();
  const { session, onboardingDraft, updateOnboardingDraft } = useSessionStore();
  const selected = onboardingDraft.language ?? language;

  const choose = (code) => {
    setLanguage(code);
    updateOnboardingDraft({ language: code });
  };

  const handleContinue = () => {
    setLanguage(selected);
    updateOnboardingDraft({ language: selected });
    if (session) {
      router.push('/(onboarding)/state');
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  return { language, selected, choose, handleContinue };
}

/**
 * Hook for onboarding step 2 (Indian state picker and GPS reverse-geocode helper).
 *
 * @returns {object} Selected state, GPS detector status, and continuation handler.
 */
export function useOnboardingState() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const { session, profile, setProfile, onboardingDraft, updateOnboardingDraft } =
    useSessionStore();
  const [detecting, setDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const selectedState = onboardingDraft.state ?? profile?.state ?? 'All India';

  const handleContinue = () => {
    updateOnboardingDraft({ state: selectedState });
    if (session && isApiConfigured) {
      api
        .patchMe({ state: selectedState })
        .then((res) => setProfile(res.user))
        .catch(() => {});
    }
    router.push('/(onboarding)/interests');
  };

  const detectLocation = async () => {
    setDetecting(true);
    setStatusMessage('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusMessage(t('onboarding.locationUnavailable'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const matched = matchIndianState(places[0]?.region);
      if (matched) {
        updateOnboardingDraft({ state: matched });
        setStatusMessage(t('onboarding.locationSuccess', { state: matched }));
      } else {
        setStatusMessage(t('onboarding.locationUnavailable'));
      }
    } catch {
      setStatusMessage(t('onboarding.locationUnavailable'));
    } finally {
      setDetecting(false);
    }
  };

  return {
    language,
    selectedState,
    selectState: (item) => updateOnboardingDraft({ state: item }),
    detecting,
    statusMessage,
    detectLocation,
    handleContinue,
  };
}

/**
 * Hook for onboarding step 3 (multi-select notice categories with min-1 guard).
 *
 * @returns {object} Selected categories, validation error, toggle handler, and continuation action.
 */
export function useOnboardingInterests() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const { onboardingDraft, updateOnboardingDraft } = useSessionStore();
  const [error, setError] = useState('');

  const selected = onboardingDraft.interests ?? [];

  const toggle = (cat) => {
    setError('');
    const next = selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat];
    updateOnboardingDraft({ interests: next });
  };

  const handleContinue = () => {
    if (selected.length === 0) {
      setError(t('onboarding.interestMinError'));
      return;
    }
    router.push('/(onboarding)/permissions');
  };

  return { language, selected, error, toggle, handleContinue };
}

/**
 * Hook for onboarding step 4 (optional notification permission request and `/v1/me` completion save).
 *
 * @returns {{ language: string, saving: boolean, error: string, completeOnboarding: (askPermission: boolean) => Promise<void> }} Step 4 controls.
 */
export function useOnboardingPermissions() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const { onboardingDraft, setProfile } = useSessionStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const completeOnboarding = async (askPermission) => {
    setSaving(true);
    setError('');
    try {
      if (askPermission) {
        try {
          await Notifications.requestPermissionsAsync();
        } catch {
          // Proceed even if native notification prompt fails
        }
      }
      const payload = {
        language: onboardingDraft.language ?? language,
        state: onboardingDraft.state ?? 'All India',
        interests: onboardingDraft.interests ?? ['exam'],
        onboardingComplete: true,
      };
      if (isApiConfigured) {
        const res = await api.patchMe(payload);
        setProfile(res.user);
      } else {
        setProfile(payload);
      }
      router.replace('/(tabs)/today');
    } catch (err) {
      setError(err?.message ?? t('common.errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  return { language, saving, error, completeOnboarding };
}
