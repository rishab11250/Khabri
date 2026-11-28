/**
 * @file Loading, error, watched-quiet, and onboarding-empty states for the Today feed.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Kabootar } from '@/components/Kabootar';
import { SectionHeader } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  loadingCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  errorCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.accent,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    ...typeScale.body,
    color: theme.colors.accent,
    fontFamily: fonts.body,
  },
  watchedCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  watchedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  smallMascotWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchedTitleWrap: {
    flex: 1,
  },
  watchedTitle: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  watchedSubtitle: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  watchList: {
    gap: theme.spacing.xs,
  },
  watchRow: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  watchRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: theme.colors.neem,
  },
  dotMuted: {
    backgroundColor: theme.colors.muted,
  },
  watchTitle: {
    ...typeScale.body,
    color: theme.colors.ink,
    fontFamily: fonts.bodyMedium,
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  flexOne: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  bigMascotWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typeScale.title,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  ctaWrap: {
    width: '100%',
    marginTop: theme.spacing.xs,
  },
});

function WatchedMonitorsState({
  styles,
  theme,
  t,
  watches,
  syncingWatches,
  onSyncMonitors,
  router,
}) {
  return (
    <View style={styles.watchedCard}>
      <View style={styles.watchedTop}>
        <View style={styles.smallMascotWrap}>
          <Kabootar size={36} flap />
        </View>
        <View style={styles.watchedTitleWrap}>
          <Text style={styles.watchedTitle}>{t('today.emptyTitle')}</Text>
          <Text style={styles.watchedSubtitle}>
            {t('watching.title')} · {watches.length}
          </Text>
        </View>
      </View>

      <SectionHeader
        label={t('tabs.watching')}
        rightLabel={t('watching.refresh')}
        onPressRight={onSyncMonitors}
      />

      <View style={styles.watchList}>
        {watches.slice(0, 4).map((w) => (
          <Pressable
            key={w.id}
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/watching')}
            style={styles.watchRow}
          >
            <View style={styles.watchRowLeft}>
              <View style={[styles.statusDot, w.muted ? styles.dotMuted : styles.dotActive]} />
              <Text numberOfLines={1} style={styles.watchTitle}>
                {w.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
          </Pressable>
        ))}
      </View>

      <View style={styles.btnRow}>
        <View style={styles.flexOne}>
          <NewspaperButton
            size="sm"
            variant="primary"
            icon="refresh-outline"
            disabled={syncingWatches}
            label={syncingWatches ? t('common.loading') : t('watching.refresh')}
            onPress={onSyncMonitors}
          />
        </View>
        <View style={styles.flexOne}>
          <NewspaperButton
            size="sm"
            variant="secondary"
            icon="compass-outline"
            label={t('tabs.discover')}
            onPress={() => router.push('/(tabs)/discover')}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * Renders the appropriate empty-feed card based on loading, error, or watch-count state.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isLoading - True while initial feed query is pending.
 * @param {boolean} props.isError - True when feed fetch failed.
 * @param {string | undefined} props.errorMessage - Error copy to display when present.
 * @param {Array<object>} props.watches - Active user watches used to differentiate quiet vs empty state.
 * @param {boolean} props.syncingWatches - Disables sync button while manual refresh is running.
 * @param {Function} props.onRetry - Retry handler for failed feed loads.
 * @param {Function} props.onSyncMonitors - Handler triggering immediate watch checks.
 * @returns {JSX.Element} State-specific empty view.
 */
export function TodayEmptyState({
  isLoading,
  isError,
  errorMessage,
  watches,
  syncingWatches,
  onRetry,
  onSyncMonitors,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  if (isLoading) {
    return (
      <View style={styles.loadingCard}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorText}>{errorMessage || t('common.errorGeneric')}</Text>
        <NewspaperButton label={t('common.retry')} onPress={onRetry} />
      </View>
    );
  }

  if (watches.length > 0) {
    return (
      <WatchedMonitorsState
        styles={styles}
        theme={theme}
        t={t}
        watches={watches}
        syncingWatches={syncingWatches}
        onSyncMonitors={onSyncMonitors}
        router={router}
      />
    );
  }

  return (
    <View style={styles.emptyCard}>
      <View style={styles.bigMascotWrap}>
        <Kabootar size={56} flap />
      </View>
      <Text style={styles.emptyTitle}>{t('today.emptyTitle')}</Text>
      <Text style={styles.emptySubtitle}>{t('today.emptySubtitle')}</Text>
      <View style={styles.ctaWrap}>
        <NewspaperButton
          icon="compass-outline"
          label={t('tabs.discover')}
          onPress={() => router.push('/(tabs)/discover')}
        />
      </View>
    </View>
  );
}
