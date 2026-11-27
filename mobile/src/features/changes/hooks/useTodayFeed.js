import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { readJsonCache, writeJsonCache } from '@/lib/fileCache';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';

const FEED_CACHE_KEY = 'feed-cache.json';

export function useTodayFeed() {
  const queryClient = useQueryClient();
  const profile = useSessionStore((s) => s.profile);
  const readChangeIds = useSettingsStore((s) => s.readChangeIds);
  const markChangeRead = useSettingsStore((s) => s.markChangeRead);
  const [cachedItems, setCachedItems] = useState([]);
  const [syncingWatches, setSyncingWatches] = useState(false);

  useEffect(() => {
    readJsonCache(FEED_CACHE_KEY, []).then((cached) => {
      if (cached && cached.length > 0) {
        setCachedItems(cached);
      }
    });
  }, []);

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => api.getFeed(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
  });

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const deadlinesQuery = useQuery({
    queryKey: ['deadlines'],
    queryFn: api.getDeadlines,
  });

  const watches = watchesQuery.data?.watches ?? [];
  const watchCount = watches.length;
  const activeDeadlinesCount =
    deadlinesQuery.data?.deadlines?.filter((d) => d.status === 'active').length ?? 0;

  const networkItems = useMemo(
    () => feedQuery.data?.pages.flatMap((p) => p.items || []) ?? [],
    [feedQuery.data?.pages],
  );

  useEffect(() => {
    if (networkItems.length > 0) {
      writeJsonCache(FEED_CACHE_KEY, networkItems);
    }
  }, [networkItems]);

  const handleSyncMonitors = async () => {
    if (syncingWatches || watches.length === 0) return;
    setSyncingWatches(true);
    try {
      await Promise.allSettled(watches.slice(0, 6).map((w) => api.refreshWatch(w.id)));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['watches'] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
      ]);
    } finally {
      setSyncingWatches(false);
    }
  };

  const items = networkItems.length > 0 ? networkItems : cachedItems;
  const leadId = items.find(
    (item) => item.impact === 'HIGH' && !readChangeIds.includes(item.id),
  )?.id;

  return {
    profile,
    feedQuery,
    watches,
    watchCount,
    activeDeadlinesCount,
    items,
    leadId,
    syncingWatches,
    markChangeRead,
    handleSyncMonitors,
  };
}
