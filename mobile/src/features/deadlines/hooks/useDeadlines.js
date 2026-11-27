import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { exportDeadlinesCsv } from '@/features/deadlines/exportDeadlinesCsv';
import { addDeadlineToDeviceCalendar, syncDeadlineReminders } from '@/features/deadlines/reminders';
import { api } from '@/lib/api';
import { readJsonCache, writeJsonCache } from '@/lib/fileCache';

const DEADLINES_CACHE_KEY = 'deadlines-cache.json';

export function useDeadlines() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState('list');
  const [showAdd, setShowAdd] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [cachedDeadlines, setCachedDeadlines] = useState([]);

  useEffect(() => {
    readJsonCache(DEADLINES_CACHE_KEY, []).then((cached) => {
      if (cached && cached.length > 0) {
        setCachedDeadlines(cached);
      }
    });
  }, []);

  const deadlinesQuery = useQuery({
    queryKey: ['deadlines'],
    queryFn: () => api.getDeadlines(),
  });

  const rawDeadlines = deadlinesQuery.data?.deadlines;
  const deadlines =
    rawDeadlines && rawDeadlines.length > 0 ? rawDeadlines : (rawDeadlines ?? cachedDeadlines);

  useEffect(() => {
    if (rawDeadlines && rawDeadlines.length > 0) {
      writeJsonCache(DEADLINES_CACHE_KEY, rawDeadlines);
      syncDeadlineReminders(rawDeadlines);
    }
  }, [rawDeadlines]);

  const handleExportCsv = async () => {
    setStatusError('');
    try {
      await exportDeadlinesCsv(deadlines);
    } catch (err) {
      setStatusError(err?.message || t('common.errorGeneric'));
    }
  };

  const schema = z.object({
    label: z.string().trim().min(1, t('deadlines.labelRequired')),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('deadlines.invalidDate')),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { label: '', date: '' },
  });

  const createMutation = useMutation({
    mutationFn: (v) => api.createDeadline({ label: v.label, dueAt: `${v.date}T23:59:00.000Z` }),
    onSuccess: () => {
      reset();
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
    onError: (err) => setStatusError(err?.message || t('common.errorGeneric')),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, body }) => api.patchDeadline(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteDeadline(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const handleAddCalendar = async (item) => {
    setStatusError('');
    try {
      const eventId = await addDeadlineToDeviceCalendar(item);
      await patchMutation.mutateAsync({ id: item.id, body: { calendarEventId: String(eventId) } });
    } catch (err) {
      setStatusError(err?.message || t('common.errorGeneric'));
    }
  };

  const toggleDone = (d) =>
    patchMutation.mutate({
      id: d.id,
      body: { status: d.status === 'done' ? 'active' : 'done' },
    });

  const removeDeadline = (id) => deleteMutation.mutate(id);

  const activeCount = deadlines.filter((d) => d.status === 'active').length;
  const doneCount = deadlines.filter((d) => d.status === 'done').length;
  const dueSoonCount = deadlines.filter((d) => {
    if (d.status !== 'active') return false;
    const diffDays = (new Date(d.dueAt).getTime() - Date.now()) / 86400000;
    return diffDays <= 7;
  }).length;

  return {
    deadlines,
    isLoading: deadlinesQuery.isLoading,
    isRefetching: deadlinesQuery.isRefetching,
    refetch: deadlinesQuery.refetch,
    viewMode,
    setViewMode,
    showAdd,
    setShowAdd,
    statusError,
    activeCount,
    doneCount,
    dueSoonCount,
    handleExportCsv,
    handleAddCalendar,
    toggleDone,
    removeDeadline,
    control,
    errors,
    isCreating: createMutation.isPending,
    submitAdd: handleSubmit((v) => createMutation.mutate(v)),
  };
}
