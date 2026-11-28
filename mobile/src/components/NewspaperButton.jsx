/**
 * @file Pressable button primitive supporting primary, secondary, ink, and card variants.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: theme.radii.sm,
  },
  sizeMd: {
    minHeight: 50,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  sizeSm: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  variantPrimary: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    borderWidth: 0,
  },
  variantSecondary: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
  },
  variantInk: {
    backgroundColor: theme.colors.inkSurface,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
  },
  variantCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.975 }],
  },
  labelBase: {
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
  },
  labelMd: {
    ...typeScale.body,
    fontFamily: fonts.bodyBold,
  },
  labelSm: {
    ...typeScale.caption,
    fontFamily: fonts.bodyBold,
  },
  textPrimary: {
    color: theme.colors.onAccent,
  },
  textInk: {
    color: theme.colors.onInkSurface,
  },
  textDefault: {
    color: theme.colors.ink,
  },
});

/**
 * Renders a themed editorial action button with optional leading Ionicon.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - Single-line button caption.
 * @param {Function} props.onPress - Tap handler.
 * @param {'primary' | 'secondary' | 'ink' | 'card'} [props.variant='primary'] - Surface style variant.
 * @param {'md' | 'sm'} [props.size='md'] - Height and padding scale.
 * @param {boolean} [props.disabled=false] - Disables taps and lowers opacity when true.
 * @param {string} [props.icon] - Optional Ionicons glyph name.
 * @param {string} [props.accessibilityHint] - Accessibility hint read by screen readers.
 * @returns {JSX.Element} Pressable button element.
 */
export function NewspaperButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  accessibilityHint,
}) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const isSmall = size === 'sm';

  const variantBox =
    variant === 'secondary'
      ? styles.variantSecondary
      : variant === 'ink'
        ? styles.variantInk
        : variant === 'card'
          ? styles.variantCard
          : styles.variantPrimary;

  const variantText =
    variant === 'ink'
      ? styles.textInk
      : variant === 'primary'
        ? styles.textPrimary
        : styles.textDefault;

  const iconColor =
    variant === 'ink'
      ? theme.colors.onInkSurface
      : variant === 'primary'
        ? theme.colors.onAccent
        : theme.colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSmall ? styles.sizeSm : styles.sizeMd,
        variantBox,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {icon ? <Ionicons name={icon} size={isSmall ? 15 : 18} color={iconColor} /> : null}
      <Text
        numberOfLines={1}
        style={[styles.labelBase, isSmall ? styles.labelSm : styles.labelMd, variantText]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
