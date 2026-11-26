import { Pressable, Text, View } from 'react-native';
import { useSettingsStore } from '../store/settings';
import { getFontFamilies, typeScale } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

export function Masthead({
  title,
  subtitle,
  eyebrowLeft = 'SUBAH KA AKHBAAR',
  eyebrowRight,
  rightAction,
}) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopColor: theme.colors.rule,
          borderTopWidth: theme.borders.hairline,
          borderBottomColor: theme.colors.ruleSubtle,
          borderBottomWidth: theme.borders.hairline,
          paddingVertical: 4,
          marginBottom: theme.spacing.xs,
        }}
      >
        <Text
          style={{
            color: theme.colors.accent,
            fontFamily: fonts.bodyBold,
            fontSize: 10,
            letterSpacing: 1.2,
          }}
        >
          {eyebrowLeft}
        </Text>
        {eyebrowRight ? (
          <Text
            style={{
              color: theme.colors.muted,
              fontFamily: fonts.bodyBold,
              fontSize: 10,
              letterSpacing: 1,
            }}
          >
            {eyebrowRight}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                typeScale.caption,
                typeScale.tabular,
                { color: theme.colors.muted, fontFamily: fonts.body, marginTop: 2 },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightAction ?? null}
      </View>

      <View style={{ height: 2, backgroundColor: theme.colors.rule }} />
      <View style={{ height: 1, backgroundColor: theme.colors.ruleSubtle, marginTop: 2 }} />
    </View>
  );
}

export function SectionHeader({ label, rightLabel, onPressRight }) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
      }}
    >
      <Text
        style={{
          color: theme.colors.muted,
          fontFamily: fonts.bodyBold,
          fontSize: 11,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.ruleSubtle }} />
      {rightLabel ? (
        <Pressable accessibilityRole="button" onPress={onPressRight}>
          <Text
            style={[typeScale.caption, { color: theme.colors.accent, fontFamily: fonts.bodyBold }]}
          >
            {rightLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
