import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { z } from 'zod';
import { FormField } from '../../src/components/FormField';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { isApiConfigured, isSupabaseConfigured } from '../../src/lib/env';
import { supabase } from '../../src/lib/supabase';
import { useSessionStore } from '../../src/store/session';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);
  const { setSession, setProfile } = useSessionStore();
  const [submitError, setSubmitError] = useState('');

  const schema = z.object({
    email: z.string().trim().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMin')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setSubmitError('');
    if (!supabase) {
      setSubmitError(t('common.setupMissingBody'));
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSession(data.session);
    if (isApiConfigured) {
      try {
        const me = await api.getMe();
        setProfile(me.user);
      } catch {
        setProfile(null);
      }
    }
    router.replace('/');
  };

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        <View
          style={{
            borderBottomColor: theme.colors.rule,
            borderBottomWidth: theme.borders.double,
            paddingBottom: theme.spacing.md,
            marginBottom: theme.spacing.xl,
          }}
        >
          <Text
            style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}
          >
            {t('app.name')}
          </Text>
          <Text
            style={[
              typeScale.caption,
              { color: theme.colors.muted, fontFamily: fonts.body, marginTop: theme.spacing.xs },
            ]}
          >
            {t('auth.subtitle')}
          </Text>
        </View>

        {!isSupabaseConfigured ? (
          <View
            style={{
              backgroundColor: theme.colors.haldi,
              borderColor: theme.colors.rule,
              borderWidth: theme.borders.hairline,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text
              style={[typeScale.body, { color: theme.colors.haldiInk, fontFamily: fonts.bodyBold }]}
            >
              {t('common.setupMissingTitle')}
            </Text>
            <Text
              style={[typeScale.caption, { color: theme.colors.haldiInk, fontFamily: fonts.body }]}
            >
              {t('common.setupMissingBody')}
            </Text>
          </View>
        ) : null}

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
          onPress={handleSubmit(onSubmit)}
        />

        <View style={{ marginTop: theme.spacing.lg }}>
          <Link href="/(auth)/sign-up" asChild>
            <NewspaperButton label={t('auth.switchToSignUp')} variant="secondary" />
          </Link>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
