import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';
import { FormField } from '../../src/components/FormField';
import { Kabootar } from '../../src/components/Kabootar';
import { Masthead } from '../../src/components/Masthead';
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
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const fonts = getFontFamilies(language);
  const { setSession, setProfile } = useSessionStore();
  const [submitError, setSubmitError] = useState('');
  const [notice, setNotice] = useState('');

  const schema = z
    .object({
      name: z.string().trim().min(1, t('auth.nameRequired')),
      email: z.string().trim().email(t('auth.invalidEmail')),
      password: z.string().min(6, t('auth.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.passwordMismatch'),
      path: ['confirmPassword'],
    });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password') || '';

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: theme.colors.ruleSubtle };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (score <= 1) return { score: 1, label: t('auth.strengthWeak'), color: theme.colors.accent };
    if (score === 2) return { score: 2, label: t('auth.strengthFair'), color: theme.colors.haldi };
    if (score === 3) return { score: 3, label: t('auth.strengthGood'), color: theme.colors.neel };
    return { score: 4, label: t('auth.strengthStrong'), color: theme.colors.neem };
  };

  const strength = getPasswordStrength(passwordValue);

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
        emailRedirectTo: Linking.createURL('/sign-in'),
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
        const me = await api.patchMe({ name: values.name, language });
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
        <Masthead
          title={t('app.name')}
          eyebrowLeft="SUBAH KA AKHBAAR"
          eyebrowRight="OFFICIAL GAZETTE"
          subtitle={t('auth.subtitle')}
          rightAction={<Kabootar size={44} flap />}
        />

        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing.xs,
            marginBottom: theme.spacing.lg,
          }}
        >
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'gu', label: 'ગુજરાતી' },
          ].map((item) => {
            const active = language === item.code;
            return (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                onPress={() => setLanguage(item.code)}
                style={{
                  borderWidth: theme.borders.hairline,
                  borderColor: active ? theme.colors.accent : theme.colors.ruleSubtle,
                  borderRadius: theme.radii.pill,
                  backgroundColor: active ? theme.colors.accent : theme.colors.card,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={[
                    typeScale.caption,
                    {
                      color: active ? theme.colors.onAccent : theme.colors.ink,
                      fontFamily: fonts.bodyMedium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
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

        {passwordValue.length > 0 ? (
          <View style={{ marginBottom: theme.spacing.md, gap: theme.spacing.xs }}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
              {[1, 2, 3, 4].map((level) => (
                <View
                  key={level}
                  style={{
                    flex: 1,
                    height: 4,
                    backgroundColor:
                      level <= strength.score ? strength.color : theme.colors.ruleSubtle,
                  }}
                />
              ))}
            </View>
            <Text
              style={[typeScale.caption, { color: strength.color, fontFamily: fonts.bodyBold }]}
            >
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
