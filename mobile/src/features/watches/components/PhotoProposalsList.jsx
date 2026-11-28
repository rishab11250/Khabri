/**
 * @file List of official source candidates and extracted notice dates returned from circular photo scanning.
 */
import { Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  extractedCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: 4,
  },
  extractedTitle: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
  extractedDates: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.sm,
  },
  proposalCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  proposalTitle: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  proposalMeta: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
});

/**
 * Renders the scanned exam/scheme header and tappable proposed portal cards.
 *
 * @param {object} props - Component props.
 * @param {object | null} props.extracted - Structured fields extracted from the uploaded notice photo.
 * @param {Array<object>} props.proposals - Ranked candidate sources (`title`, `kind`, `trust`, `url`).
 * @param {string | null} [props.error] - Inline watch creation error text.
 * @param {Function} props.t - Translation helper.
 * @param {boolean} props.isConfirming - Disables confirm buttons while watch creation runs.
 * @param {Function} props.onConfirm - Creates a watch from the selected proposal.
 * @returns {JSX.Element} Photo proposals list fragment.
 */
export function PhotoProposalsList({ extracted, proposals, error, t, isConfirming, onConfirm }) {
  const styles = useStyles(createStyles);

  return (
    <>
      {extracted ? (
        <View style={styles.extractedCard}>
          <Text style={styles.extractedTitle}>
            {extracted.examOrScheme || extracted.organization}
          </Text>
          {extracted.dates?.length > 0 ? (
            <Text style={styles.extractedDates}>{extracted.dates.join(' · ')}</Text>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.list}>
        {proposals.map((p, idx) => (
          <View key={idx} style={styles.proposalCard}>
            <Text style={styles.proposalTitle}>{p.title}</Text>
            <Text style={styles.proposalMeta}>
              {p.kind} · {p.trust}
            </Text>
            <NewspaperButton
              icon="checkmark-circle-outline"
              disabled={isConfirming}
              label={t('add.confirmWatch')}
              onPress={() => onConfirm(p)}
            />
          </View>
        ))}
      </View>
    </>
  );
}
