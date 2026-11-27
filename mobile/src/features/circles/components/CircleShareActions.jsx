import { Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';

export function CircleShareActions({
  theme,
  fonts,
  t,
  copied,
  contacts,
  error,
  onCopyCode,
  onShareInvite,
  onPickContacts,
}) {
  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
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
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.md,
            gap: theme.spacing.xs,
          }}
        >
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

      {error ? (
        <Text
          style={[typeScale.caption, { color: theme.colors.accent, fontFamily: fonts.bodyMedium }]}
        >
          {error}
        </Text>
      ) : null}
    </>
  );
}
