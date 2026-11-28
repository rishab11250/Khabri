/**
 * Manages invite-code input state and the circle join mutation for deep links and manual entry.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';

/**
 * Screen state hook for joining a Circle by invite code (`circles/join`).
 *
 * @param {string|string[]} paramCode - Optional invite code prefilled from deep-link params.
 * @returns {object} Invite code state and `joinCircle` action.
 */
export function useJoinCircle(paramCode) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [code, setCode] = useState(typeof paramCode === 'string' ? paramCode : '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof paramCode === 'string' && paramCode) {
      setCode(paramCode);
    }
  }, [paramCode]);

  const joinMutation = useMutation({
    mutationFn: () => api.joinCircle(code.trim().toUpperCase()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      router.replace(`/circles/${data.circle.id}`);
    },
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
  });

  return {
    code,
    setCode,
    error,
    isJoining: joinMutation.isPending,
    joinCircle: () => joinMutation.mutate(),
  };
}
