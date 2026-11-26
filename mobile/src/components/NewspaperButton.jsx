import { Pressable, StyleSheet, Text } from 'react-native';
import { useSettingsStore } from '../store/settings';
import { getFontFamilies, typeScale } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

export function NewspaperButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  accessibilityHint,
}) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  const isPrimary = variant === 'primary';
  const isSmall = size === 'sm';
  const backgroundColor = isPrimary ? theme.colors.accent : theme.colors.card;
  const textColor = isPrimary ? theme.colors.onAccent : theme.colors.ink;
  const borderColor = isPrimary ? theme.colors.accent : theme.colors.ruleSubtle;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: isSmall ? 36 : 46,
          borderRadius: theme.radii.sm,
          backgroundColor,
          borderColor,
          borderWidth: theme.borders.hairline,
          paddingHorizontal: isSmall ? theme.spacing.md : theme.spacing.lg,
          paddingVertical: isSmall ? theme.spacing.xs : theme.spacing.sm,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
      ]}
    >
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
