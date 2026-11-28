/**
 * @file Controlled email/password sign-in form card backed by React Hook Form.
 */
import { Controller } from 'react-hook-form';
import { Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
  },
  title: {
    ...typeScale.title,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.md,
  },
});

/**
 * Renders email and password fields, error copy, and submit action for sign-in.
 *
 * @param {object} props - Component props.
 * @param {object} props.control - React Hook Form control instance.
 * @param {object} props.errors - Validation errors keyed by field name.
 * @param {boolean} props.isSubmitting - Disables submit button during auth request.
 * @param {string | null} [props.submitError] - Supabase authentication error message.
 * @param {Function} props.onSubmit - Validated form submit handler.
 * @param {Function} props.t - Translation helper.
 * @returns {JSX.Element} Sign-in form card.
 */
export function SignInFormCard({ control, errors, isSubmitting, submitError, onSubmit, t }) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('auth.signInTitle')}</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label={t('auth.emailLabel')}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoComplete="email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label={t('auth.passwordLabel')}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
            autoComplete="password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />

      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <NewspaperButton
        label={isSubmitting ? t('common.loading') : t('auth.signInButton')}
        disabled={isSubmitting}
        onPress={onSubmit}
      />
    </View>
  );
}
