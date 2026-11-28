/**
 * @file Invite-code copy, system share, and contact-picker actions for a Circle detail screen.
 */
import { Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  contactsCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
  },
});

/**
 * Renders Circle invite actions and an optional quick-share phonebook contact list.
 *
 * @param {object} props - Component props.
 * @param {Function} props.t - Translation helper.
 * @param {boolean} props.copied - Shows confirmation checkmark briefly after code copy.
 * @param {Array<object>} props.contacts - Selected device contacts eligible for invite sharing.
 * @param {string | null} [props.error] - Optional invite or contacts permission error text.
 * @param {Function} props.onCopyCode - Copies the Circle invite code to the clipboard.
 * @param {Function} props.onShareInvite - Opens the OS share sheet with the invite message.
 * @param {Function} props.onPickContacts - Loads device contacts for quick invites.
 * @returns {JSX.Element} Share actions fragment.
 */
export function CircleShareActions({
  t,
  copied,
  contacts,
  error,
  onCopyCode,
  onShareInvite,
  onPickContacts,
}) {
  const styles = useStyles(createStyles);

  return (
    <>
      <View style={styles.actionsRow}>
        <NewspaperButton
          size="sm"
          variant="card"
          icon={copied ? 'checkmark' : 'copy-outline'}
          label={copied ? t('circles.copied') : t('circles.copyCode')}
          onPress={onCopyCode}
        />
        <NewspaperButton
          size="sm"
          icon="share-social-outline"
          label={t('circles.shareInvite')}
          onPress={onShareInvite}
        />
        <NewspaperButton
          size="sm"
          variant="secondary"
          icon="person-add-outline"
          label={t('circles.inviteContact')}
          onPress={onPickContacts}
        />
      </View>

      {contacts.length > 0 ? (
        <View style={styles.contactsCard}>
          {contacts.slice(0, 6).map((c) => (
            <NewspaperButton
              key={c.id}
              size="sm"
              variant="secondary"
              label={`${c.name} -> ${t('circles.shareInvite')}`}
              onPress={onShareInvite}
            />
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}
