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
import { isApiConfigured } from '../../src/lib/env';
import { supabase } from '../../src/lib/supabase';
import { useSessionStore } from '../../src/store/session';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);
  const { setSession, setProfile } = useSessionStore();
  const [submitError, setSubmitError] = useState('');
  const [notice, setNotice] = useState('');

  const schema = z.object({
    name: z.string().trim().min(1, t('auth.nameRequired')),
    email: z.string().trim().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMin')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setSubmitError('');
    setNotice('');
    if (!supabase) {
      setSubmitError(t('common.setupMissingBody'));
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { name: values.name },
      },
    });

    if (error) {
      setSubmitError(error.message);
      return;
    }

    if (!data.session) {
      setNotice(t('auth.confirmEmailNotice'));
      return;
    }

    setSession(data.session);
    if (isApiConfigured) {
      try {
        const me = await api.patchMe({ name: values.name });
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
              backgroundColor: theme.colors.neem,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <Text
              style={[typeScale.body, { color: theme.colors.onNeem, fontFamily: fonts.bodyMedium }]}
            >
              {notice}
            </Text>
          </View>
        ) : null}

        <NewspaperButton
          label={isSubmitting ? t('common.loading') : t('auth.signUpButton')}
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />

        <View style={{ marginTop: theme.spacing.lg }}>
          <Link href="/(auth)/sign-in" asChild>
            <NewspaperButton label={t('auth.switchToSignIn')} variant="secondary" />
          </Link>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
