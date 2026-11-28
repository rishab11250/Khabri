/**
 * Zustand store managing Supabase auth session, cached backend user profile, onboarding draft,
 * and pending photo scan extraction results.
 */
import { create } from 'zustand';

import { readJsonCache, writeJsonCache } from '@/lib/fileCache';

const PROFILE_CACHE_KEY = 'profile-cache.json';

/**
 * Loads the last cached user profile from local storage for instant cold-boot rendering.
 *
 * @returns {Promise<object|null>} Cached profile object or `null`.
 */
export function readCachedProfile() {
  return readJsonCache(PROFILE_CACHE_KEY, null);
}

// Holds authentication, user profile, photo proposal transfer state, and onboarding selections.
export const useSessionStore = create((set) => ({
  hydrated: false,
  session: null,
  profile: null,
  photoResult: null,
  onboardingDraft: {
    language: 'en',
    state: null,
    interests: ['exam', 'recruitment'],
  },
  setHydrated: (hydrated) => set({ hydrated }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => {
    if (profile) {
      writeJsonCache(PROFILE_CACHE_KEY, profile);
    }
    set((prev) => ({
      profile,
      onboardingDraft: profile
        ? {
            language: profile.language ?? prev.onboardingDraft.language,
            state: profile.state ?? prev.onboardingDraft.state,
            interests:
              Array.isArray(profile.interests) && profile.interests.length > 0
                ? profile.interests
                : prev.onboardingDraft.interests,
          }
        : prev.onboardingDraft,
    }));
  },
  setPhotoResult: (photoResult) => set({ photoResult }),
  updateOnboardingDraft: (patch) =>
    set((prev) => ({
      onboardingDraft: { ...prev.onboardingDraft, ...patch },
    })),
  clearSession: () => {
    writeJsonCache(PROFILE_CACHE_KEY, null);
    return set({
      session: null,
      profile: null,
      onboardingDraft: { language: 'en', state: null, interests: ['exam', 'recruitment'] },
    });
  },
}));
