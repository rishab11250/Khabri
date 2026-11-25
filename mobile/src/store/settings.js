import { create } from 'zustand';
import i18n from '../i18n';

export const useSettingsStore = create((set) => ({
  language: i18n.language || 'en',
  themePreference: 'system',
  setLanguage: (language) => {
    i18n.changeLanguage(language);
    set({ language });
  },
  setThemePreference: (themePreference) => set({ themePreference }),
}));
