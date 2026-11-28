/**
 * @file Styled labelled text input with inline validation error display.
 */
import { Text, TextInput, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  field: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
    marginBottom: theme.spacing.xs,
  },
  input: {
    ...typeScale.body,
    minHeight: 50,
    color: theme.colors.ink,
    fontFamily: fonts.body,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  inputError: {
    borderColor: theme.colors.accent,
    borderWidth: theme.borders.double,
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginTop: theme.spacing.xs,
  },
});

/**
 * Renders a newspaper-styled text input field with optional error feedback.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - Visible field label and accessibility label.
 * @param {string} props.value - Controlled input text value.
 * @param {Function} props.onChangeText - Text change handler.
 * @param {Function} [props.onBlur] - Optional blur handler.
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {string | null} [props.error] - Validation error message to show below input.
 * @param {boolean} [props.secureTextEntry=false] - Masks input characters when true.
 * @param {string} [props.keyboardType='default'] - Virtual keyboard mode.
 * @param {string} [props.autoCapitalize='none'] - Auto-capitalization mode.
 * @param {string} [props.autoComplete] - Platform autofill hint.
 * @returns {JSX.Element} Labelled form field view.
 */
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
  const styles = useStyles(createStyles);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
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
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
