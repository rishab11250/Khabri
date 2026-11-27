import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { ActionChecklist } from '@/features/changes/components/ActionChecklist';
import { KhabarCard } from '@/features/changes/components/KhabarCard';
import { SamjhaoSelector } from '@/features/changes/components/SamjhaoSelector';
import { useChangeDetail } from '@/features/changes/hooks/useChangeDetail';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function ChangeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  const {
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
    translatePending,
    mutePending,
    deadlinePending,
    selectExplainLang,
    toggleChecklistItem,
    toggleMute,
    saveDeadline,
    handleShare,
    handleExportPdf,
  } = useChangeDetail(id);

  return (
    <ScreenShell>
      <View style={{ alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
        <NewspaperButton
          size="sm"
          variant="card"
          icon="arrow-back"
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
        >
          <SamjhaoSelector
            explainLang={explainLang}
            disabled={translatePending}
            onSelect={selectExplainLang}
          />

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

          <View
            style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}
          >
            <View style={{ flex: 1 }}>
              <NewspaperButton
                icon="share-social-outline"
                label={t('card.shareCard')}
                onPress={handleShare}
              />
            </View>
            <View style={{ flex: 1 }}>
              <NewspaperButton
                variant="card"
                icon="document-text-outline"
                label={t('card.exportPdf')}
                onPress={handleExportPdf}
              />
            </View>
          </View>

          <ActionChecklist
            items={displayChecklist}
            localChecklistDone={localChecklistDone}
            onToggle={toggleChecklistItem}
          />

          {card.analysis?.dates?.length > 0 ? (
            <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
              {card.analysis.dates.map((d, idx) => (
                <NewspaperButton
                  key={idx}
                  variant="ink"
                  icon="calendar-outline"
                  disabled={deadlinePending}
                  label={t('card.addDeadline', { label: d.label, iso: d.iso })}
                  onPress={() => saveDeadline(d)}
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
              icon={matchingWatch.muted ? 'notifications-outline' : 'notifications-off-outline'}
              disabled={mutePending}
              label={matchingWatch.muted ? t('card.unmuteWatch') : t('card.muteWatch')}
              onPress={toggleMute}
            />
          ) : null}
        </ScrollView>
      )}
    </ScreenShell>
  );
}
