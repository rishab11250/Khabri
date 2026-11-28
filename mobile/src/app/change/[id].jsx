/**
 * @file Change detail screen with Samjhao translation selector, checklist toggles, deadline save, share card capture, and PDF export.
 */
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
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  backWrap: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  errorBox: {
    gap: theme.spacing.md,
  },
  errorText: {
    ...typeScale.body,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  actionErrorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.sm,
  },
  shotBackground: {
    backgroundColor: theme.colors.background,
  },
  shareRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  shareCol: {
    flex: 1,
  },
  datesWrap: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  savedMsg: {
    ...typeScale.caption,
    color: theme.colors.neem,
    fontFamily: fonts.bodyMedium,
  },
});

/**
 * Renders full Khabar Card details, checklist items, language translation switcher, and export actions.
 *
 * @returns {JSX.Element} Change detail screen.
 */
export default function ChangeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const styles = useStyles(createStyles);

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
      <View style={styles.backWrap}>
        <NewspaperButton
          size="sm"
          variant="card"
          icon="arrow-back"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      {changeQuery.isLoading ? (
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      ) : changeQuery.isError || !card ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {changeQuery.error?.message || t('common.errorGeneric')}
          </Text>
          <NewspaperButton label={t('common.retry')} onPress={() => changeQuery.refetch()} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SamjhaoSelector
            explainLang={explainLang}
            disabled={translatePending}
            onSelect={selectExplainLang}
          />

          {actionError ? <Text style={styles.actionErrorText}>{actionError}</Text> : null}

          <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.95 }}>
            <View style={styles.shotBackground}>
              <KhabarCard card={card} compact={false} overrideWhy={activeTranslation?.why} />
            </View>
          </ViewShot>

          <View style={styles.shareRow}>
            <View style={styles.shareCol}>
              <NewspaperButton
                icon="share-social-outline"
                label={t('card.shareCard')}
                onPress={handleShare}
              />
            </View>
            <View style={styles.shareCol}>
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
            <View style={styles.datesWrap}>
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
              {savedDeadlineMsg ? <Text style={styles.savedMsg}>{savedDeadlineMsg}</Text> : null}
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
