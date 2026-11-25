import { Pressable, StyleSheet, Text } from 'react-native';
import { useSettingsStore } from '../store/settings';
import { getFontFamilies, typeScale } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

export function NewspaperButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityHint,
}) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  const isPrimary = variant === 'primary';
  const backgroundColor = isPrimary ? theme.colors.accent : theme.colors.card;
  const textColor = isPrimary ? theme.colors.onAccent : theme.colors.ink;
  const borderColor = isPrimary ? theme.colors.accent : theme.colors.rule;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth: theme.borders.hairline,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          typeScale.body,
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
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
