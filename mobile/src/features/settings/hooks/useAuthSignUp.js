import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { api } from '@/lib/api';
import { isApiConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';
import { useTheme } from '@/theme/useTheme';

function computePasswordStrength(pwd, theme, t) {
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
}

export function useAuthSignUp() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
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
  const strength = computePasswordStrength(passwordValue, theme, t);

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

  return {
    language,
    setLanguage,
    control,
    errors,
    isSubmitting,
    passwordValue,
    strength,
    submitError,
    notice,
    submitSignUp: handleSubmit(onSubmit),
  };
}
