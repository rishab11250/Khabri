import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFontFamilies } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

const TAB_ICONS = {
  today: ['newspaper', 'newspaper-outline'],
  watching: ['eye', 'eye-outline'],
  deadlines: ['calendar', 'calendar-outline'],
  discover: ['compass', 'compass-outline'],
  me: ['person', 'person-outline'],
};

function TabIcon({ name, color, focused, accentSoft }) {
  const [activeIcon, inactiveIcon] = TAB_ICONS[name] || TAB_ICONS.me;
  return (
    <View
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: focused ? accentSoft : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={focused ? activeIcon : inactiveIcon} size={21} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.ruleSubtle,
          borderTopWidth: theme.borders.hairline,
          height: 60 + bottomPad,
          paddingTop: 6,
          paddingBottom: bottomPad,
          elevation: 0,
        },
        tabBarIconStyle: {
          width: 56,
          height: 32,
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyBold,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="today"
              color={color}
              focused={focused}
              accentSoft={theme.colors.accentSoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="watching"
        options={{
          title: t('tabs.watching'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="watching"
              color={color}
              focused={focused}
              accentSoft={theme.colors.accentSoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: t('tabs.deadlines'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="deadlines"
              color={color}
              focused={focused}
              accentSoft={theme.colors.accentSoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="discover"
              color={color}
              focused={focused}
              accentSoft={theme.colors.accentSoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t('tabs.me'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="me"
              color={color}
              focused={focused}
              accentSoft={theme.colors.accentSoft}
            />
          ),
        }}
      />
    </Tabs>
  );
}
