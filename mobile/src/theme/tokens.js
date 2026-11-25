export const lightColors = {
  background: '#F4ECDD',
  card: '#FBF6EA',
  ink: '#1B1A17',
  accent: '#C8402A',
  haldi: '#E4A92B',
  haldiInk: '#1B1A17',
  neem: '#2F6B4F',
  neel: '#2C4A7A',
  muted: '#6B665C',
  rule: '#1B1A17',
  ruleSubtle: '#D7CEBC',
  onAccent: '#FBF6EA',
  onNeem: '#FBF6EA',
};

export const darkColors = {
  background: '#14120F',
  card: '#1D1A16',
  ink: '#F1E9D8',
  accent: '#E5694F',
  haldi: '#F0BA45',
  haldiInk: '#14120F',
  neem: '#5AA882',
  neel: '#82A7DF',
  muted: '#B5AC9B',
  rule: '#F1E9D8',
  ruleSubtle: '#353029',
  onAccent: '#14120F',
  onNeem: '#14120F',
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
  xs: 2,
  sm: 4,
};

export const borders = {
  hairline: 1,
  rule: 1.5,
  double: 2,
};

export function getTheme(colorScheme) {
  return {
    scheme: colorScheme === 'dark' ? 'dark' : 'light',
    colors: colorScheme === 'dark' ? darkColors : lightColors,
    spacing,
    radii,
    borders,
  };
}
