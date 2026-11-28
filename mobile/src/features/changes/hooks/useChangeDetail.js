/**
 * Loads a change card, tracks read state, toggles offline-queued checklists, runs Samjhao
 * translations, saves detected deadlines, and triggers PNG/PDF exports.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { exportChangePdf } from '@/features/changes/exportChangePdf';
import { shareKhabarCardImage } from '@/features/changes/shareCard';
import { api } from '@/lib/api';
import { useOfflineQueueStore } from '@/store/offlineQueue';
import { useSettingsStore } from '@/store/settings';

/**
 * Screen state hook orchestrating change card viewing, translation, checklist toggles, mute, and sharing.
 *
 * @param {string|string[]} id - Route parameter identifying the change card.
 * @returns {object} Change detail query state, derived display fields, and action handlers.
 */
export function useChangeDetail(id) {
  const { t } = useTranslation();
  const markChangeRead = useSettingsStore((s) => s.markChangeRead);
  const queryClient = useQueryClient();
  const shotRef = useRef(null);

  const [savedDeadlineMsg, setSavedDeadlineMsg] = useState('');
  const [explainLang, setExplainLang] = useState('en');
  const [translations, setTranslations] = useState({});
  const [actionError, setActionError] = useState('');

  const { localChecklistDone, setChecklistLocal, enqueueAction, hydrateQueue } =
    useOfflineQueueStore();

  useEffect(() => {
    hydrateQueue();
    if (id) {
      markChangeRead(String(id));
    }
  }, [hydrateQueue, id, markChangeRead]);

  const changeQuery = useQuery({
    queryKey: ['change', id],
    queryFn: () => api.getChange(String(id)),
    enabled: Boolean(id),
  });

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const card = changeQuery.data?.card;
  const matchingWatch = watchesQuery.data?.watches?.find((w) => w.sourceId === card?.sourceId);

  const translateMutation = useMutation({
    mutationFn: (lang) => api.translateChange(String(id), lang),
    onSuccess: (data) => {
      setActionError('');
      setTranslations((prev) => ({ ...prev, [data.lang]: data }));
      setExplainLang(data.lang);
    },
    onError: (err) => setActionError(err?.message || t('common.errorGeneric')),
  });

  const selectExplainLang = (lang) => {
    if (lang === 'en' || translations[lang]) {
      setExplainLang(lang);
      return;
    }
    translateMutation.mutate(lang);
  };

  const toggleChecklistItem = async (item) => {
    const currentDone =
      localChecklistDone[item.id] !== undefined ? localChecklistDone[item.id] : item.done;
    const nextDone = !currentDone;
    await setChecklistLocal(item.id, nextDone);
    try {
      await api.patchChecklist(item.id, nextDone);
      queryClient.invalidateQueries({ queryKey: ['change', id] });
    } catch {
      await enqueueAction({ type: 'checklist', id: item.id, done: nextDone });
    }
  };

  const muteMutation = useMutation({
    mutationFn: () => api.patchWatch(matchingWatch.id, { muted: !matchingWatch.muted }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watches'] }),
  });

  const deadlineMutation = useMutation({
    mutationFn: (d) =>
      api.createDeadline({
        label: d.label,
        dueAt: `${d.iso}T23:59:00.000Z`,
        sourceId: card.sourceId,
        changeId: card.id,
      }),
    onSuccess: () => {
      setSavedDeadlineMsg(t('card.deadlineSaved'));
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });

  const activeTranslation = explainLang !== 'en' ? translations[explainLang] : null;
  const displayChecklist =
    activeTranslation?.checklist?.length > 0
      ? (card?.checklistItems?.map((item, idx) => ({
          ...item,
          text: activeTranslation.checklist[idx] ?? item.text,
        })) ??
        activeTranslation.checklist.map((text, idx) => ({ id: `tr-${idx}`, text, done: false })))
      : card?.checklistItems?.length > 0
        ? card.checklistItems
        : (card?.analysis?.checklist || []).map((text, idx) => ({
            id: `raw-${idx}`,
            text,
            done: false,
          }));

  const handleShare = async () => {
    setActionError('');
    try {
      await shareKhabarCardImage(shotRef, card);
    } catch (err) {
      setActionError(err?.message || t('common.errorGeneric'));
    }
  };

  const handleExportPdf = async () => {
    setActionError('');
    try {
      await exportChangePdf(card, card.sourceName || t('card.unknownSource'));
    } catch (err) {
      setActionError(err?.message || t('common.errorGeneric'));
    }
  };

  return {
    shotRef,
    changeQuery,
    card,
    matchingWatch,
    savedDeadlineMsg,
    explainLang,
    activeTranslation,
    displayChecklist,
    localChecklistDone,
    actionError,
    translatePending: translateMutation.isPending,
    mutePending: muteMutation.isPending,
    deadlinePending: deadlineMutation.isPending,
    selectExplainLang,
    toggleChecklistItem,
    toggleMute: () => muteMutation.mutate(),
    saveDeadline: (d) => deadlineMutation.mutate(d),
    handleShare,
    handleExportPdf,
  };
}
