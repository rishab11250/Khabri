import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { typeScale } from '@/theme/typography';

export function CircleRow({ item, theme, fonts, t, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.headlineSemi }]}
        >
          {item.name}
        </Text>
        <Text
          style={[
            typeScale.caption,
            typeScale.tabular,
            { color: theme.colors.muted, fontFamily: fonts.body },
          ]}
        >
          {t('circles.inviteCode', { code: item.inviteCode })} · {item.memberCount}/30
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
    </Pressable>
  );
}
