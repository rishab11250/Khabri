import { Controller } from 'react-hook-form';
import { Text, View } from 'react-native';
import { FormField } from '@/components/FormField';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';

export function SignUpFormCard({
  control,
  errors,
  isSubmitting,
  passwordValue,
  strength,
  submitError,
  notice,
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
        {t('auth.signUpTitle')}
      </Text>

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
        <View style={{ marginBottom: theme.spacing.md, gap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
            {[1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: theme.radii.pill,
                  backgroundColor:
                    level <= strength.score ? strength.color : theme.colors.surfaceAlt,
                }}
              />
            ))}
          </View>
          <Text style={[typeScale.caption, { color: strength.color, fontFamily: fonts.bodyBold }]}>
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

      {notice ? (
        <View
          style={{
            backgroundColor: theme.colors.neemSoft,
            borderRadius: theme.radii.sm,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
          }}
        >
          <Text
            style={[typeScale.body, { color: theme.colors.neem, fontFamily: fonts.bodyMedium }]}
          >
            {notice}
          </Text>
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
