import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './en.json';
import hi from './hi.json';
import gu from './gu.json';

const SUPPORTED_LANGUAGES = ['en', 'hi', 'gu'];

function getDeviceLanguage() {
  const locales = Localization.getLocales();
  const code = locales[0]?.languageCode;
  return code && SUPPORTED_LANGUAGES.includes(code) ? code : 'en';
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      gu: { translation: gu },
    },
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

export { SUPPORTED_LANGUAGES };
export default i18n;
