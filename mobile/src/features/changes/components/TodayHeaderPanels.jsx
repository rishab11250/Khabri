import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export function TodayHeaderPanels({ watchCount, activeDeadlinesCount }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  const quickActions = [
    {
      icon: 'link-outline',
      label: t('add.pasteLink'),
      route: '/add/link',
      tint: theme.colors.neel,
    },
    {
      icon: 'camera-outline',
      label: t('add.scanPhoto'),
      route: '/add/photo',
      tint: theme.colors.accent,
    },
    {
      icon: 'people-outline',
      label: t('circles.title'),
      route: '/circles',
      tint: theme.colors.neem,
    },
  ];

  return (
    <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/watching')}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
            gap: theme.spacing.xs,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: theme.radii.xs,
                backgroundColor: theme.colors.neemSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="eye-outline" size={18} color={theme.colors.neem} />
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
          </View>
          <Text
            style={[
              typeScale.masthead,
              typeScale.tabular,
              { color: theme.colors.ink, fontFamily: fonts.headline, marginTop: 4 },
            ]}
          >
            {watchCount}
          </Text>
          <Text
            numberOfLines={1}
            style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.bodyMedium }]}
          >
            {t('tabs.watching')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/deadlines')}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: theme.colors.card,
            borderColor: activeDeadlinesCount > 0 ? theme.colors.accent : theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
            gap: theme.spacing.xs,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: theme.radii.xs,
                backgroundColor: theme.colors.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.colors.accent} />
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
          </View>
          <Text
            style={[
              typeScale.masthead,
              typeScale.tabular,
              {
                color: activeDeadlinesCount > 0 ? theme.colors.accent : theme.colors.ink,
                fontFamily: fonts.headline,
                marginTop: 4,
              },
            ]}
          >
            {activeDeadlinesCount}
          </Text>
          <Text
            numberOfLines={1}
            style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.bodyMedium }]}
          >
            {t('tabs.deadlines')}
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        {quickActions.map((act) => (
          <Pressable
            key={act.route}
            accessibilityRole="button"
            onPress={() => router.push(act.route)}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.ruleSubtle,
              borderWidth: theme.borders.hairline,
              borderRadius: theme.radii.sm,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.sm,
              alignItems: 'center',
              gap: 6,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name={act.icon} size={18} color={act.tint} />
            <Text
              numberOfLines={1}
              style={[typeScale.caption, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
            >
              {act.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
