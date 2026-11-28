/**
 * Manages the user's circles list query and new circle creation form state.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';

/**
 * Screen state hook for listing and creating Circles (`circles/index`).
 *
 * @returns {object} Circles list query state, name input state, and `createCircle` handler.
 */
export function useCirclesList() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const circlesQuery = useQuery({
    queryKey: ['circles'],
    queryFn: api.getCircles,
  });

  const createMutation = useMutation({
    mutationFn: () => api.createCircle({ name: name.trim() }),
    onSuccess: (data) => {
      setName('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      router.push(`/circles/${data.circle.id}`);
    },
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
  });

  return {
    name,
    setName,
    error,
    circles: circlesQuery.data?.circles ?? [],
    isLoading: circlesQuery.isLoading,
    isRefetching: circlesQuery.isRefetching,
    refetch: circlesQuery.refetch,
    isCreating: createMutation.isPending,
    createCircle: () => createMutation.mutate(),
  };
}
