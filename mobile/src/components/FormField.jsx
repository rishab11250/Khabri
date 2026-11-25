import { StyleSheet, Text, TextInput, View } from 'react-native';
import { getFontFamilies, typeScale } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { useSettingsStore } from '../store/settings';

export function FormField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
}) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text
        style={[
          typeScale.caption,
          {
            color: theme.colors.ink,
            fontFamily: fonts.bodyBold,
            marginBottom: theme.spacing.xs,
          },
        ]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        accessibilityLabel={label}
        style={[
          styles.input,
          typeScale.body,
          {
            color: theme.colors.ink,
            fontFamily: fonts.body,
            backgroundColor: theme.colors.card,
            borderColor: error ? theme.colors.accent : theme.colors.rule,
            borderWidth: theme.borders.hairline,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md,
          },
        ]}
      />
      {error ? (
        <Text
          style={[
            typeScale.caption,
            {
              color: theme.colors.accent,
              fontFamily: fonts.bodyMedium,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 46,
  },
});
