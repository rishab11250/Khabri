import { create } from 'zustand';
import i18n from '@/i18n';
import { readJsonCache, writeJsonCache } from '@/lib/fileCache';

const SETTINGS_CACHE = 'settings-pref.json';

function persistSettings(s) {
  writeJsonCache(SETTINGS_CACHE, {
    language: s.language,
    languageChosen: s.languageChosen,
    themePreference: s.themePreference,
    quietHours: s.quietHours,
    digestTime: s.digestTime,
    readChangeIds: s.readChangeIds,
  });
}

export const useSettingsStore = create((set, get) => ({
  language: i18n.language || 'en',
  languageChosen: false,
  themePreference: 'system',
  quietHours: { enabled: false, start: '22:00', end: '07:00', bypassUrgent: true },
  digestTime: '08:00',
  readChangeIds: [],
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
        quietHours: cached.quietHours || get().quietHours,
        digestTime: cached.digestTime || get().digestTime,
        readChangeIds: Array.isArray(cached.readChangeIds) ? cached.readChangeIds : [],
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  setLanguage: (language) => {
    i18n.changeLanguage(language);
    set({ language, languageChosen: true });
    persistSettings(get());
  },

  setThemePreference: (themePreference) => {
    set({ themePreference });
    persistSettings(get());
  },

  setQuietHours: (quietHours) => {
    set({ quietHours });
    persistSettings(get());
  },

  setDigestTime: (digestTime) => {
    set({ digestTime });
    persistSettings(get());
  },

  markChangeRead: (id) => {
    if (!id) return;
    const prev = get().readChangeIds;
    if (prev.includes(id)) return;
    const next = [id, ...prev].slice(0, 100);
    set({ readChangeIds: next });
    persistSettings(get());
  },
}));
