/**
 * @file User avatar monogram, account email, and selected state summary card for settings.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typeScale.leadTitle,
    color: theme.colors.onAccent,
    fontFamily: fonts.headline,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
  email: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stateText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyBold,
  },
});

/**
 * Renders the signed-in user's name/email summary and configured state badge.
 *
 * @param {object} props - Component props.
 * @param {object | null} props.profile - Authenticated backend profile document.
 * @param {string} props.userEmail - Session email fallback when profile name is absent.
 * @param {string} props.avatarInitial - Single-letter monogram shown in the avatar circle.
 * @param {Function} props.t - Translation helper.
 * @returns {JSX.Element} Profile summary card.
 */
export function ProfileSummaryCard({ profile, userEmail, avatarInitial, t }) {
  const theme = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarInitial}</Text>
      </View>
      <View style={styles.infoCol}>
        <Text numberOfLines={1} style={styles.name}>
          {profile?.name || userEmail}
        </Text>
        <Text numberOfLines={1} style={styles.email}>
          {userEmail}
        </Text>
        {profile?.state ? (
          <View style={styles.stateRow}>
            <Ionicons name="location-outline" size={13} color={theme.colors.accent} />
            <Text style={styles.stateText}>{t('me.stateLabel', { state: profile.state })}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
