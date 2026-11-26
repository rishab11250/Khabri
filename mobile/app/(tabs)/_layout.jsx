import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { getFontFamilies } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

function TabIcon({ name, color, focused }) {
  const stroke = focused ? 2 : 1.5;

  if (name === 'today') {
    return (
      <View
        style={{
          width: 20,
          height: 20,
          borderWidth: stroke,
          borderColor: color,
          borderRadius: 3,
          padding: 3,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ height: 3, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ height: 2, backgroundColor: color, width: '80%' }} />
        <View style={{ height: 2, backgroundColor: color, width: '60%' }} />
      </View>
    );
  }

  if (name === 'watching') {
    return (
      <View
        style={{
          width: 22,
          height: 14,
          borderWidth: stroke,
          borderColor: color,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      </View>
    );
  }

  if (name === 'deadlines') {
    return (
      <View
        style={{
          width: 20,
          height: 20,
          borderWidth: stroke,
          borderColor: color,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: 5, backgroundColor: color }} />
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
          }}
        >
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  if (name === 'discover') {
    return (
      <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 15,
            height: 15,
            borderRadius: 7.5,
            borderWidth: stroke,
            borderColor: color,
            position: 'absolute',
            top: 1,
            left: 1,
          }}
        />
        <View
          style={{
            width: 6,
            height: 2,
            backgroundColor: color,
            position: 'absolute',
            bottom: 2,
            right: 1,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 3.5,
          borderWidth: stroke,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: 14,
          height: 7,
          borderTopLeftRadius: 7,
          borderTopRightRadius: 7,
          borderWidth: stroke,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
    </View>
  );
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
          borderTopColor: theme.colors.ruleSubtle,
          borderTopWidth: theme.borders.hairline,
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
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
