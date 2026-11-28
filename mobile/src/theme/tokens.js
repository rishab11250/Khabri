/**
 * Defines Khabri's semantic color palettes (light/dark) and design system spacing, radii, and borders.
 * Deliberately centralizes every hex code here so UI components consume theme tokens exclusively.
 */
export const lightColors = {
  background: '#F5F6F8',
  card: '#FFFFFF',
  surfaceAlt: '#ECEEF2',
  surfaceMuted: '#E2E5EB',
  ink: '#0F172A',
  inkSurface: '#111827',
  onInkSurface: '#F9FAFB',
  accent: '#D91B42',
  accentSoft: '#FFE4EA',
  haldi: '#B45309',
  haldiInk: '#FFFFFF',
  haldiSoft: '#FEF3C7',
  neem: '#047857',
  neemSoft: '#D1FAE5',
  neel: '#1D4ED8',
  neelSoft: '#DBEAFE',
  muted: '#475569',
  rule: '#0F172A',
  ruleSubtle: '#E2E8F0',
  onAccent: '#FFFFFF',
  onNeem: '#FFFFFF',
};

const darkColors = {
  background: '#090B0F',
  card: '#11141B',
  surfaceAlt: '#191E28',
  surfaceMuted: '#222836',
  ink: '#F8FAFC',
  inkSurface: '#1E2430',
  onInkSurface: '#F8FAFC',
  accent: '#FB7185',
  accentSoft: '#2B141C',
  haldi: '#FBBF24',
  haldiInk: '#090B0F',
  haldiSoft: '#2B200E',
  neem: '#34D399',
  neemSoft: '#0F2920',
  neel: '#60A5FA',
  neelSoft: '#13223A',
  muted: '#94A3B8',
  rule: '#F8FAFC',
  ruleSubtle: '#212733',
  onAccent: '#090B0F',
  onNeem: '#090B0F',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  none: 0,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
};

export const borders = {
  hairline: 1,
  rule: 1.5,
  double: 2,
};

/**
 * Resolves the active design-token theme object for `'light'` or `'dark'` mode.
 *
 * @param {'light'|'dark'} colorScheme - Resolved system or user-selected color scheme.
 * @returns {{ scheme: 'light'|'dark', colors: object, spacing: object, radii: object, borders: object }} Theme token bundle.
 */
export function getTheme(colorScheme) {
  return {
    scheme: colorScheme === 'dark' ? 'dark' : 'light',
    colors: colorScheme === 'dark' ? darkColors : lightColors,
    spacing,
    radii,
    borders,
  };
}
