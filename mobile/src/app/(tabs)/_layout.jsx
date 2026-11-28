/**
 * @file Bottom tab navigator configuring the 5 primary screens with safe-area padding.
 */
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const TAB_ICONS = {
  today: ['newspaper', 'newspaper-outline'],
  watching: ['eye', 'eye-outline'],
  deadlines: ['calendar', 'calendar-outline'],
  discover: ['compass', 'compass-outline'],
  me: ['person', 'person-outline'],
};

const createStyles = (theme, fonts) => ({
  iconPill: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillFocused: {
    backgroundColor: theme.colors.accentSoft,
  },
  tabBar: {
    backgroundColor: theme.colors.card,
    borderTopColor: theme.colors.ruleSubtle,
    borderTopWidth: theme.borders.hairline,
    paddingTop: 6,
    elevation: 0,
  },
  tabBarIcon: {
    width: 56,
    height: 32,
    marginBottom: 2,
  },
  tabBarLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
});

function TabIcon({ name, color, focused }) {
  const styles = useStyles(createStyles);
  const [activeIcon, inactiveIcon] = TAB_ICONS[name] || TAB_ICONS.me;
  return (
    <View style={[styles.iconPill, focused && styles.iconPillFocused]}>
      <Ionicons name={focused ? activeIcon : inactiveIcon} size={21} color={color} />
    </View>
  );
}

/**
 * Configures the Today, Watching, Deadlines, Discover, and Me bottom tabs.
 *
 * @returns {JSX.Element} Bottom tab layout.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: theme.colors.accent,
      tabBarInactiveTintColor: theme.colors.muted,
      tabBarStyle: [styles.tabBar, { height: 60 + bottomPad, paddingBottom: bottomPad }],
      tabBarIconStyle: styles.tabBarIcon,
      tabBarLabelStyle: styles.tabBarLabel,
    }),
    [bottomPad, styles, theme.colors.accent, theme.colors.muted],
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="today"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="today" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="watching"
        options={{
          title: t('tabs.watching'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="watching" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: t('tabs.deadlines'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="deadlines" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="discover" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t('tabs.me'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="me" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
