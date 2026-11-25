import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  hydrated: false,
  session: null,
  profile: null,
  onboardingDraft: {
    language: 'en',
    state: 'All India',
    interests: ['exam', 'recruitment'],
  },
  setHydrated: (hydrated) => set({ hydrated }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  updateOnboardingDraft: (patch) =>
    set((prev) => ({
      onboardingDraft: { ...prev.onboardingDraft, ...patch },
    })),
  clearSession: () => set({ session: null, profile: null }),
}));
