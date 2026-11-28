/**
 * Registers bundled Google Font faces (Fraunces + Noto Sans + Devanagari + Gujarati) and type scales.
 * Deliberately maps script-specific font families per active language code cleanly.
 */
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  NotoSansGujarati_400Regular,
  NotoSansGujarati_700Bold,
} from '@expo-google-fonts/noto-sans-gujarati';
import { NotoSerifDevanagari_700Bold } from '@expo-google-fonts/noto-serif-devanagari';
import { NotoSerifGujarati_700Bold } from '@expo-google-fonts/noto-serif-gujarati';

export const fontAssets = {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_700Bold,
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_700Bold,
  NotoSansGujarati_400Regular,
  NotoSansGujarati_700Bold,
  NotoSerifDevanagari_700Bold,
  NotoSerifGujarati_700Bold,
};

/**
 * Returns script-matched font family names (`headline`, `body`, `bodyMedium`, `bodyBold`) for `language`.
 *
 * @param {'en'|'hi'|'gu'} language - Active UI language code.
 * @returns {{ headline: string, headlineSemi: string, body: string, bodyMedium: string, bodyBold: string }} Font family map.
 */
export function getFontFamilies(language) {
  if (language === 'hi') {
    return {
      headline: 'NotoSerifDevanagari_700Bold',
      headlineSemi: 'NotoSerifDevanagari_700Bold',
      body: 'NotoSansDevanagari_400Regular',
      bodyMedium: 'NotoSansDevanagari_700Bold',
      bodyBold: 'NotoSansDevanagari_700Bold',
    };
  }
  if (language === 'gu') {
    return {
      headline: 'NotoSerifGujarati_700Bold',
      headlineSemi: 'NotoSerifGujarati_700Bold',
      body: 'NotoSansGujarati_400Regular',
      bodyMedium: 'NotoSansGujarati_700Bold',
      bodyBold: 'NotoSansGujarati_700Bold',
    };
  }
  return {
    headline: 'Fraunces_700Bold',
    headlineSemi: 'Fraunces_600SemiBold',
    body: 'NotoSans_400Regular',
    bodyMedium: 'NotoSans_500Medium',
    bodyBold: 'NotoSans_700Bold',
  };
}

export const typeScale = {
  masthead: { fontSize: 32, lineHeight: 40, letterSpacing: -0.6 },
  title: { fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  leadTitle: { fontSize: 24, lineHeight: 32, letterSpacing: -0.3 },
  section: { fontSize: 17, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 19 },
  tabular: { fontVariant: ['tabular-nums'] },
};
