import { Pressable, Text, View } from 'react-native';
import { typeScale } from '@/theme/typography';

export function SegmentedOptionBar({
  options,
  value,
  onSelect,
  theme,
  fonts,
  minHeight = 42,
  tabular = false,
  marginBottom = 0,
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.sm,
        padding: 4,
        gap: 4,
        marginBottom,
      }}
    >
      {options.map((item) => {
        const active = value === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={() => onSelect(item.key)}
            style={{
              flex: 1,
              minHeight,
              borderRadius: theme.radii.xs,
              backgroundColor: active ? theme.colors.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: theme.spacing.xs,
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                typeScale.caption,
                tabular ? typeScale.tabular : null,
                {
                  color: active ? theme.colors.onAccent : theme.colors.ink,
                  fontFamily: active ? fonts.bodyBold : fonts.bodyMedium,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
