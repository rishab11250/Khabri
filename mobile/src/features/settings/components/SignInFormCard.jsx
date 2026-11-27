import { Controller } from 'react-hook-form';
import { Text, View } from 'react-native';
import { FormField } from '@/components/FormField';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';

export function SignInFormCard({
  control,
  errors,
  isSubmitting,
  submitError,
  onSubmit,
  theme,
  fonts,
  t,
}) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.lg,
        padding: theme.spacing.lg,
      }}
    >
      <Text
        style={[
          typeScale.title,
          {
            color: theme.colors.ink,
            fontFamily: fonts.headlineSemi,
            marginBottom: theme.spacing.lg,
          },
        ]}
      >
        {t('auth.signInTitle')}
      </Text>

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

      {submitError ? (
        <Text
          style={[
            typeScale.caption,
            {
              color: theme.colors.accent,
              fontFamily: fonts.bodyMedium,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          {submitError}
        </Text>
      ) : null}

      <NewspaperButton
        label={isSubmitting ? t('common.loading') : t('auth.signInButton')}
        disabled={isSubmitting}
        onPress={onSubmit}
      />
    </View>
  );
}
