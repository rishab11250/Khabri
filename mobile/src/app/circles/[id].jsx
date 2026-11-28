/**
 * @file Circle detail screen showing invite actions, shared watches, and member roster.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { CircleShareActions } from '@/features/circles/components/CircleShareActions';
import { CircleWatchesAndMembers } from '@/features/circles/components/CircleWatchesAndMembers';
import { useCircleDetail } from '@/features/circles/hooks/useCircleDetail';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  backWrap: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  emptyBox: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
  },
  emptyText: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
});

/**
 * Displays Circle metadata, invite sharing tools, shared sources, and owner moderation actions.
 *
 * @returns {JSX.Element} Circle detail screen.
 */
export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles(createStyles);
  const {
    circle,
    userWatches,
    isLoading,
    queryError,
    copied,
    contacts,
    error,
    copyInviteCode,
    shareInvite,
    pickContacts,
    isAddingWatch,
    addWatch,
    removeMember,
  } = useCircleDetail(id);

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

      {isLoading || !circle ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{queryError || t('common.loading')}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Masthead
            title={circle.name}
            subtitle={t('circles.inviteCode', { code: circle.inviteCode })}
            eyebrowRight={`${circle.memberCount}/30`}
          />

          <CircleShareActions
            t={t}
            copied={copied}
            contacts={contacts}
            error={error}
            onCopyCode={copyInviteCode}
            onShareInvite={shareInvite}
            onPickContacts={pickContacts}
          />

          <CircleWatchesAndMembers
            circle={circle}
            userWatches={userWatches}
            t={t}
            isAddingWatch={isAddingWatch}
            onAddWatch={addWatch}
            onRemoveMember={removeMember}
          />
        </ScrollView>
      )}
    </ScreenShell>
  );
}
