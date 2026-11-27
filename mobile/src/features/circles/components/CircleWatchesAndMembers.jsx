import { Text, View } from 'react-native';
import { SectionHeader } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';

export function CircleWatchesAndMembers({
  circle,
  userWatches,
  theme,
  fonts,
  t,
  isAddingWatch,
  onAddWatch,
  onRemoveMember,
}) {
  return (
    <>
      <SectionHeader label={t('circles.sharedWatches')} />
      {circle.watches.map((w) => (
        <View
          key={w.id}
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
            gap: 4,
          }}
        >
          <Text style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}>
            {w.name}
          </Text>
          <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
            {w.category} · {w.state}
          </Text>
        </View>
      ))}

      {userWatches.length > 0 ? (
        <View style={{ gap: theme.spacing.xs }}>
          <SectionHeader label={t('circles.addFromWatching')} />
          {userWatches
            .filter((uw) => !circle.watches.some((cw) => cw.id === uw.sourceId))
            .slice(0, 5)
            .map((uw) => (
              <NewspaperButton
                key={uw.id}
                size="sm"
                variant="card"
                icon="add"
                disabled={isAddingWatch}
                label={uw.title}
                onPress={() => onAddWatch(uw.sourceId)}
              />
            ))}
        </View>
      ) : null}

      <SectionHeader label={t('circles.membersTitle', { count: circle.memberCount })} />
      {circle.members.map((m) => (
        <View
          key={m.userId}
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}>
              {m.name}
            </Text>
            <Text
              style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
            >
              {m.role}
            </Text>
          </View>
          {circle.role === 'owner' && m.role !== 'owner' ? (
            <NewspaperButton
              size="sm"
              variant="secondary"
              label={t('watching.remove')}
              onPress={() => onRemoveMember(m.userId)}
            />
          ) : null}
        </View>
      ))}
    </>
  );
}
