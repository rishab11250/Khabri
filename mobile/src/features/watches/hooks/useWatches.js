/**
 * Loads user watches with local JSON cache fallback and mutates mute, priority, delete, and manual refresh.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';
import { readJsonCache, writeJsonCache } from '@/lib/fileCache';

const WATCHES_CACHE_KEY = 'watches-cache.json';

/**
 * Screen state hook powering the Watching tab (`(tabs)/watching`).
 *
 * @returns {object} Watches list, refresh/error state, and watch mutation handlers.
 */
export function useWatches() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');
  const [cachedWatches, setCachedWatches] = useState([]);

  useEffect(() => {
    readJsonCache(WATCHES_CACHE_KEY, []).then((cached) => {
      if (cached && cached.length > 0) {
        setCachedWatches(cached);
      }
    });
  }, []);

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const rawWatches = watchesQuery.data?.watches;
  const watches = rawWatches && rawWatches.length > 0 ? rawWatches : (rawWatches ?? cachedWatches);

  useEffect(() => {
    if (rawWatches && rawWatches.length > 0) {
      writeJsonCache(WATCHES_CACHE_KEY, rawWatches);
    }
  }, [rawWatches]);

  const patchMutation = useMutation({
    mutationFn: ({ id, body }) => api.patchWatch(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watches'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteWatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: (id) => api.refreshWatch(id),
    onSuccess: () => {
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err) => setActionError(err?.message || t('common.errorGeneric')),
  });

  return {
    watches,
    isLoading: watchesQuery.isLoading,
    isRefetching: watchesQuery.isRefetching,
    refetch: watchesQuery.refetch,
    actionError,
    toggleMute: (item) => patchMutation.mutate({ id: item.id, body: { muted: !item.muted } }),
    togglePriority: (item) =>
      patchMutation.mutate({
        id: item.id,
        body: { priority: item.priority === 'instant' ? 'normal' : 'instant' },
      }),
    refreshWatch: (id) => refreshMutation.mutate(id),
    deleteWatch: (id) => deleteMutation.mutate(id),
  };
}
