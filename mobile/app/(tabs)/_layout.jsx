import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { useTheme } from '../../src/theme/useTheme';
import { getFontFamilies } from '../../src/theme/typography';

function TabGlyph({ label, color }) {
  return <Text style={{ color, fontSize: 14 }}>{label}</Text>;
}

export default function TabsLayout() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.rule,
          borderTopWidth: theme.borders.hairline,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color }) => <TabGlyph label="N" color={color} />,
        }}
      />
      <Tabs.Screen
        name="watching"
        options={{
          title: t('tabs.watching'),
          tabBarIcon: ({ color }) => <TabGlyph label="W" color={color} />,
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: t('tabs.deadlines'),
          tabBarIcon: ({ color }) => <TabGlyph label="D" color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color }) => <TabGlyph label="S" color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t('tabs.me'),
          tabBarIcon: ({ color }) => <TabGlyph label="M" color={color} />,
        }}
      />
    </Tabs>
  );
}
