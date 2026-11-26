import { create } from 'zustand';
import i18n from '../i18n';
import { readJsonCache, writeJsonCache } from '../lib/fileCache';

const SETTINGS_CACHE = 'settings-pref.json';

export const useSettingsStore = create((set, get) => ({
  language: i18n.language || 'en',
  languageChosen: false,
  themePreference: 'system',
  appLockEnabled: false,
  isLocked: false,
  quietHours: { enabled: false, start: '22:00', end: '07:00', bypassUrgent: true },
  digestTime: '08:00',
  hydrated: false,

  hydrateSettings: async () => {
    const cached = await readJsonCache(SETTINGS_CACHE, null);
    if (cached) {
      if (cached.language) {
        i18n.changeLanguage(cached.language);
      }
      set({
        language: cached.language || get().language,
        languageChosen: Boolean(cached.languageChosen ?? cached.language),
        themePreference: cached.themePreference || get().themePreference,
        appLockEnabled: Boolean(cached.appLockEnabled),
        isLocked: Boolean(cached.appLockEnabled),
        quietHours: cached.quietHours || get().quietHours,
        digestTime: cached.digestTime || get().digestTime,
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  setLanguage: (language) => {
    i18n.changeLanguage(language);
    set({ language, languageChosen: true });
    const s = get();
    writeJsonCache(SETTINGS_CACHE, {
      language: s.language,
      languageChosen: true,
      themePreference: s.themePreference,
      appLockEnabled: s.appLockEnabled,
      quietHours: s.quietHours,
      digestTime: s.digestTime,
    });
  },

  setThemePreference: (themePreference) => {
    set({ themePreference });
    const s = get();
    writeJsonCache(SETTINGS_CACHE, {
      language: s.language,
      languageChosen: s.languageChosen,
      themePreference: s.themePreference,
      appLockEnabled: s.appLockEnabled,
      quietHours: s.quietHours,
      digestTime: s.digestTime,
    });
  },

  setAppLockEnabled: (appLockEnabled) => {
    set({ appLockEnabled, isLocked: false });
    const s = get();
    writeJsonCache(SETTINGS_CACHE, {
      language: s.language,
      languageChosen: s.languageChosen,
      themePreference: s.themePreference,
      appLockEnabled: s.appLockEnabled,
      quietHours: s.quietHours,
      digestTime: s.digestTime,
    });
  },

  setQuietHours: (quietHours) => {
    set({ quietHours });
    const s = get();
    writeJsonCache(SETTINGS_CACHE, {
      language: s.language,
      languageChosen: s.languageChosen,
      themePreference: s.themePreference,
      appLockEnabled: s.appLockEnabled,
      quietHours: s.quietHours,
      digestTime: s.digestTime,
    });
  },

  setDigestTime: (digestTime) => {
    set({ digestTime });
    const s = get();
    writeJsonCache(SETTINGS_CACHE, {
      language: s.language,
      languageChosen: s.languageChosen,
      themePreference: s.themePreference,
      appLockEnabled: s.appLockEnabled,
      quietHours: s.quietHours,
      digestTime: s.digestTime,
    });
  },

  unlock: () => set({ isLocked: false }),
  lock: () => {
    if (get().appLockEnabled) {
      set({ isLocked: true });
    }
  },
}));
