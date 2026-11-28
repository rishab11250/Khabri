/**
 * @file Controlled sign-up form card featuring password-strength meter and verification notice.
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
  strengthWrap: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  barBase: {
    flex: 1,
    height: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceAlt,
  },
  bar1: { backgroundColor: theme.colors.accent },
  bar2: { backgroundColor: theme.colors.haldi },
  bar3: { backgroundColor: theme.colors.neel },
  bar4: { backgroundColor: theme.colors.neem },
  strengthLabelBase: {
    ...typeScale.caption,
    fontFamily: fonts.bodyBold,
  },
  label1: { color: theme.colors.accent },
  label2: { color: theme.colors.haldi },
  label3: { color: theme.colors.neel },
  label4: { color: theme.colors.neem },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.md,
  },
  noticeBox: {
    backgroundColor: theme.colors.neemSoft,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  noticeText: {
    ...typeScale.body,
    color: theme.colors.neem,
    fontFamily: fonts.bodyMedium,
  },
});

/**
 * Renders registration inputs, live 4-segment password strength indicator, and submission controls.
 *
 * @param {object} props - Component props.
 * @param {object} props.control - React Hook Form control instance.
 * @param {object} props.errors - Validation errors keyed by field name.
 * @param {boolean} props.isSubmitting - Disables submit button while creating the account.
 * @param {string} props.passwordValue - Current password input used to decide meter visibility.
 * @param {object} props.strength - Computed password strength score (`0-4`) and label.
 * @param {string | null} [props.submitError] - Registration API error message.
 * @param {string | null} [props.notice] - Email-confirmation notice shown after sign-up.
 * @param {Function} props.onSubmit - Validated form submit handler.
 * @param {Function} props.t - Translation helper.
 * @returns {JSX.Element} Sign-up form card.
 */
export function SignUpFormCard({
  control,
  errors,
  isSubmitting,
  passwordValue,
  strength,
  submitError,
  notice,
  onSubmit,
  t,
}) {
  const styles = useStyles(createStyles);
  const barTone =
    strength.score <= 1
      ? styles.bar1
      : strength.score === 2
        ? styles.bar2
        : strength.score === 3
          ? styles.bar3
          : styles.bar4;
  const labelTone =
    strength.score <= 1
      ? styles.label1
      : strength.score === 2
        ? styles.label2
        : strength.score === 3
          ? styles.label3
          : styles.label4;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('auth.signUpTitle')}</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label={t('auth.nameLabel')}
            placeholder={t('auth.namePlaceholder')}
            autoCapitalize="words"
            autoComplete="name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

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
            autoComplete="new-password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />

      {passwordValue.length > 0 ? (
        <View style={styles.strengthWrap}>
          <View style={styles.strengthBars}>
            {[1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={[styles.barBase, level <= strength.score ? barTone : null]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabelBase, labelTone]}>
            {t('auth.passwordStrengthLabel', { level: strength.label })}
          </Text>
        </View>
      ) : null}

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label={t('auth.confirmPasswordLabel')}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            secureTextEntry
            autoComplete="new-password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      {notice ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <NewspaperButton
        label={isSubmitting ? t('common.loading') : t('auth.signUpButton')}
        disabled={isSubmitting}
        onPress={onSubmit}
      />
    </View>
  );
}
