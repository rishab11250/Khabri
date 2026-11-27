import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { typeScale } from '@/theme/typography';

export function ProfileSummaryCard({ profile, userEmail, avatarInitial, theme, fonts, t }) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      }}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: theme.colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={[
            typeScale.leadTitle,
            { color: theme.colors.onAccent, fontFamily: fonts.headline },
          ]}
        >
          {avatarInitial}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          numberOfLines={1}
          style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
        >
          {profile?.name || userEmail}
        </Text>
        <Text
          numberOfLines={1}
          style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
        >
          {userEmail}
        </Text>
        {profile?.state ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Ionicons name="location-outline" size={13} color={theme.colors.accent} />
            <Text
              style={[
                typeScale.caption,
                { color: theme.colors.accent, fontFamily: fonts.bodyBold },
              ]}
            >
              {t('me.stateLabel', { state: profile.state })}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
