/**
 * @file Preview card showing server-verified portal classification before confirming a link watch.
 */
import { Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.neem,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  meta: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  preview: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.body,
  },
});

/**
 * Renders intake check results (`type`, `trust`, extracted snippet) and the watch confirmation button.
 *
 * @param {object} props - Component props.
 * @param {object | null} props.checked - Link intake response from `/v1/intake/link`.
 * @param {Function} props.t - Translation helper.
 * @param {boolean} props.isConfirming - Disables confirmation while watch creation runs.
 * @param {Function} props.onConfirm - Creates a watch for the checked source (or search fallback).
 * @returns {JSX.Element | null} Verification preview card or `null` before link check.
 */
export function CheckedLinkCard({ checked, t, isConfirming, onConfirm }) {
  const styles = useStyles(createStyles);

  if (!checked) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{checked.source.name}</Text>
      <Text style={styles.meta}>
        {checked.supported
          ? `${checked.source.type} · ${checked.source.trust}`
          : t('add.jsUnsupported')}
      </Text>
      {checked.preview ? (
        <Text numberOfLines={4} style={styles.preview}>
          {checked.preview}
        </Text>
      ) : null}
      <NewspaperButton
        disabled={isConfirming}
        icon="checkmark-circle-outline"
        label={checked.supported ? t('add.confirmWatch') : t('add.confirmSearchWatch')}
        onPress={onConfirm}
      />
    </View>
  );
}
