import { zodResolver } from '@hookform/resolvers/zod';
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

export function useAuthSignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
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

  return {
    language,
    setLanguage,
    control,
    errors,
    isSubmitting,
    submitError,
    submitSignIn: handleSubmit(onSubmit),
  };
}
