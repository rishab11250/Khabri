import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

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
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  const isSmall = size === 'sm';
  let backgroundColor = theme.colors.accent;
  let textColor = theme.colors.onAccent;
  let borderColor = theme.colors.accent;

  if (variant === 'secondary') {
    backgroundColor = theme.colors.surfaceAlt;
    textColor = theme.colors.ink;
    borderColor = theme.colors.ruleSubtle;
  } else if (variant === 'ink') {
    backgroundColor = theme.colors.inkSurface;
    textColor = theme.colors.onInkSurface;
    borderColor = theme.colors.ruleSubtle;
  } else if (variant === 'card') {
    backgroundColor = theme.colors.card;
    textColor = theme.colors.ink;
    borderColor = theme.colors.ruleSubtle;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: isSmall ? 40 : 50,
          borderRadius: theme.radii.sm,
          backgroundColor,
          borderColor,
          borderWidth: variant === 'primary' ? 0 : theme.borders.hairline,
          paddingHorizontal: isSmall ? theme.spacing.md : theme.spacing.lg,
          paddingVertical: isSmall ? theme.spacing.xs : theme.spacing.sm,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled ? 0.975 : 1 }],
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={isSmall ? 15 : 18} color={textColor} /> : null}
      <Text
        numberOfLines={1}
        style={[
          isSmall ? typeScale.caption : typeScale.body,
          styles.label,
          {
            color: textColor,
            fontFamily: fonts.bodyBold,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    textAlign: 'center',
  },
});
