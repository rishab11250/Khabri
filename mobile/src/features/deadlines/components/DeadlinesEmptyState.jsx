/**
 * @file Empty/loading placeholder card for the Deadlines screen with a quick-add prompt.
 */
import { Text, View } from 'react-native';

import { Kabootar } from '@/components/Kabootar';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  card: {
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
  message: {
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
 * Renders the empty or loading state when no deadlines are listed.
 *
 * @param {object} props - Component props.
 * @param {Function} props.t - Translation helper.
 * @param {boolean} props.isLoading - Displays loading copy while deadlines fetch.
 * @param {boolean} props.showAdd - Hides the quick-add CTA when the add form is already open.
 * @param {Function} props.onShowAdd - Opens the manual deadline creation form.
 * @returns {JSX.Element} Empty-state card.
 */
export function DeadlinesEmptyState({ t, isLoading, showAdd, onShowAdd }) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.mascotWrap}>
        <Kabootar size={56} />
      </View>
      <Text style={styles.message}>{isLoading ? t('common.loading') : t('deadlines.empty')}</Text>
      {!showAdd ? (
        <View style={styles.ctaWrap}>
          <NewspaperButton icon="add" label={t('deadlines.addTitle')} onPress={onShowAdd} />
        </View>
      ) : null}
    </View>
  );
}
