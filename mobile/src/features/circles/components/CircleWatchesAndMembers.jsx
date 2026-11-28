/**
 * @file Shared watches list, watch-add shortcuts, and Circle member roster section.
 */
import { Text, View } from 'react-native';

import { SectionHeader } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  watchCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    gap: 4,
  },
  itemTitle: {
    ...typeScale.body,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
  itemMeta: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  addSection: {
    gap: theme.spacing.xs,
  },
  memberCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

/**
 * Renders shared Circle sources, unshared user watches available to add, and removable members.
 *
 * @param {object} props - Component props.
 * @param {object} props.circle - Detailed Circle payload with `watches`, `members`, and caller `role`.
 * @param {Array<object>} props.userWatches - Caller's active watches eligible to share.
 * @param {Function} props.t - Translation helper.
 * @param {boolean} props.isAddingWatch - Disables add buttons while mutation runs.
 * @param {Function} props.onAddWatch - Shares a watched source into the Circle.
 * @param {Function} props.onRemoveMember - Removes a non-owner member (owner-only).
 * @returns {JSX.Element} Circle watches and members sections.
 */
export function CircleWatchesAndMembers({
  circle,
  userWatches,
  t,
  isAddingWatch,
  onAddWatch,
  onRemoveMember,
}) {
  const styles = useStyles(createStyles);

  return (
    <>
      <SectionHeader label={t('circles.sharedWatches')} />
      {circle.watches.map((w) => (
        <View key={w.id} style={styles.watchCard}>
          <Text style={styles.itemTitle}>{w.name}</Text>
          <Text style={styles.itemMeta}>
            {w.category} · {w.state}
          </Text>
        </View>
      ))}

      {userWatches.length > 0 ? (
        <View style={styles.addSection}>
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
        <View key={m.userId} style={styles.memberCard}>
          <View>
            <Text style={styles.itemTitle}>{m.name}</Text>
            <Text style={styles.itemMeta}>{m.role}</Text>
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
