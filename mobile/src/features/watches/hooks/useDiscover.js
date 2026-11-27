import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';

export function useDiscover() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [clipboardUrl, setClipboardUrl] = useState('');
  const [actionError, setActionError] = useState('');
  const debouncedQuery = useDebounce(search.trim(), 250);

  useEffect(() => {
    Clipboard.getStringAsync()
      .then((text) => {
        const trimmed = (text || '').trim();
        if (/^https?:\/\/\S+$/i.test(trimmed)) {
          setClipboardUrl(trimmed);
        }
      })
      .catch(() => {});
  }, []);

  const catalogQuery = useQuery({
    queryKey: ['catalog', category, debouncedQuery],
    queryFn: () =>
      api.getCatalog({ category: category || undefined, q: debouncedQuery || undefined }),
  });

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const trendingQuery = useQuery({
    queryKey: ['trending'],
    queryFn: api.getTrending,
  });

  const watchBySourceId = new Map((watchesQuery.data?.watches || []).map((w) => [w.sourceId, w]));

  const toggleMutation = useMutation({
    mutationFn: ({ source, existingWatch }) =>
      existingWatch
        ? api.deleteWatch(existingWatch.id)
        : api.createWatch({ sourceId: source.id, createdVia: 'catalog' }),
    onSuccess: () => {
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err) => setActionError(err?.message || t('common.errorGeneric')),
  });

  return {
    search,
    setSearch,
    category,
    setCategory,
    clipboardUrl,
    setClipboardUrl,
    actionError,
    sources: catalogQuery.data?.sources ?? [],
    trendingSources: trendingQuery.data?.sources ?? [],
    isRefetching: catalogQuery.isRefetching,
    refetch: catalogQuery.refetch,
    watchBySourceId,
    isToggling: toggleMutation.isPending,
    toggleFollow: (source, existingWatch) => toggleMutation.mutate({ source, existingWatch }),
  };
}
