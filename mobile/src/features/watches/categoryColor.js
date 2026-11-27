export function getCategoryColor(cat, theme) {
  if (cat === 'recruitment') return theme.colors.neel;
  if (cat === 'scholarship') return theme.colors.haldi;
  if (cat === 'scheme') return theme.colors.neem;
  return theme.colors.accent;
}
