/**
 * @file Empty/loading placeholder card for the Watching tab directing users to Discover.
 */
import { Text, View } from 'react-native';

import { Kabootar } from '@/components/Kabootar';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

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
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  mascotWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  ctaWrap: {
    width: '100%',
  },
});

/**
 * Renders loading copy or an illustrated empty state prompting users to add watches.
 *
 * @param {object} props - Component props.
 * @param {Function} props.t - Translation helper.
 * @param {boolean} props.isLoading - Shows loading placeholder when true.
 * @param {Function} props.onBrowseDiscover - Navigates to the Discover tab.
 * @returns {JSX.Element} Loading or empty card.
 */
export function WatchesEmptyState({ t, isLoading, onBrowseDiscover }) {
  const styles = useStyles(createStyles);

  if (isLoading) {
    return (
      <View style={styles.loadingCard}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyCard}>
      <View style={styles.mascotWrap}>
        <Kabootar size={56} />
      </View>
      <Text style={styles.emptyText}>{t('watching.empty')}</Text>
      <View style={styles.ctaWrap}>
        <NewspaperButton
          icon="compass-outline"
          label={t('tabs.discover')}
          onPress={onBrowseDiscover}
        />
      </View>
    </View>
  );
}
