import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { typeScale } from '@/theme/typography';

export function SettingsNavList({ items, theme, fonts, onNavigate }) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.lg,
      }}
    >
      {items.map((item, idx) => (
        <Pressable
          key={item.route}
          accessibilityRole="button"
          onPress={() => onNavigate(item.route)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.lg,
            minHeight: 54,
            borderTopWidth: idx === 0 ? 0 : theme.borders.hairline,
            borderTopColor: theme.colors.ruleSubtle,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Ionicons name={item.icon} size={20} color={theme.colors.ink} />
            <Text style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}>
              {item.label}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </Pressable>
      ))}
    </View>
  );
}
