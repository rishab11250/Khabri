import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { KhabarCard } from '../../src/components/KhabarCard';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { shareKhabarCardImage } from '../../src/lib/shareCard';
import { useOfflineQueueStore } from '../../src/store/offlineQueue';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

const SAMJHAO_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

export default function ChangeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);
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
  }, [hydrateQueue]);

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

  return (
    <ScreenShell>
      <View style={{ marginBottom: theme.spacing.md }}>
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      {changeQuery.isLoading ? (
        <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('common.loading')}
        </Text>
      ) : changeQuery.isError || !card ? (
        <View style={{ gap: theme.spacing.md }}>
          <Text
            style={[typeScale.body, { color: theme.colors.accent, fontFamily: fonts.bodyMedium }]}
          >
            {changeQuery.error?.message || t('common.errorGeneric')}
          </Text>
          <NewspaperButton label={t('common.retry')} onPress={() => changeQuery.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
          <Text
            style={[
              typeScale.caption,
              {
                color: theme.colors.muted,
                fontFamily: fonts.bodyBold,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {t('card.explainIn')}
          </Text>
          <View
            style={{ flexDirection: 'row', gap: theme.spacing.xs, marginBottom: theme.spacing.md }}
          >
            {SAMJHAO_LANGS.map((l) => {
              const active = explainLang === l.code;
              return (
                <Pressable
                  key={l.code}
                  accessibilityRole="button"
                  disabled={translateMutation.isPending}
                  onPress={() => selectExplainLang(l.code)}
                  style={{
                    backgroundColor: active ? theme.colors.accent : theme.colors.card,
                    borderColor: active ? theme.colors.accent : theme.colors.rule,
                    borderWidth: theme.borders.hairline,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.xs,
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
                    {l.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {actionError ? (
            <Text
              style={[
                typeScale.caption,
                {
                  color: theme.colors.accent,
                  fontFamily: fonts.bodyMedium,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              {actionError}
            </Text>
          ) : null}

          <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.95 }}>
            <View style={{ backgroundColor: theme.colors.background }}>
              <KhabarCard card={card} compact={false} overrideWhy={activeTranslation?.why} />
            </View>
          </ViewShot>

          <View style={{ marginBottom: theme.spacing.md }}>
            <NewspaperButton label={t('card.shareCard')} onPress={handleShare} />
          </View>

          {displayChecklist.length > 0 ? (
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.rule,
                borderWidth: theme.borders.hairline,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.md,
                gap: theme.spacing.sm,
              }}
            >
              <Text
                style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
              >
                {t('card.checklistTitle')}
              </Text>
              {displayChecklist.map((item) => {
                const isDone =
                  localChecklistDone[item.id] !== undefined
                    ? localChecklistDone[item.id]
                    : item.done;
                const canToggle =
                  !String(item.id).startsWith('raw-') && !String(item.id).startsWith('tr-');
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone }}
                    disabled={!canToggle}
                    onPress={() => toggleChecklistItem(item)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                    }}
                  >
                    <Text
                      style={[
                        typeScale.body,
                        { color: theme.colors.accent, fontFamily: fonts.bodyBold },
                      ]}
                    >
                      {isDone ? '[x]' : '[ ]'}
                    </Text>
                    <Text
                      style={[
                        typeScale.body,
                        {
                          flex: 1,
                          color: isDone ? theme.colors.muted : theme.colors.ink,
                          fontFamily: fonts.body,
                          textDecorationLine: isDone ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {card.analysis?.dates?.length > 0 ? (
            <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
              {card.analysis.dates.map((d, idx) => (
                <NewspaperButton
                  key={idx}
                  variant="secondary"
                  disabled={deadlineMutation.isPending}
                  label={t('card.addDeadline', { label: d.label, iso: d.iso })}
                  onPress={() => deadlineMutation.mutate(d)}
                />
              ))}
              {savedDeadlineMsg ? (
                <Text
                  style={[
                    typeScale.caption,
                    { color: theme.colors.neem, fontFamily: fonts.bodyMedium },
                  ]}
                >
                  {savedDeadlineMsg}
                </Text>
              ) : null}
            </View>
          ) : null}

          {matchingWatch ? (
            <NewspaperButton
              variant="secondary"
              disabled={muteMutation.isPending}
              label={matchingWatch.muted ? t('card.unmuteWatch') : t('card.muteWatch')}
              onPress={() => muteMutation.mutate()}
            />
          ) : null}
        </ScrollView>
      )}
    </ScreenShell>
  );
}
