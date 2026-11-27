import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export function AskScopeFilter({ scope, watches, onSelect }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  const items = [
    { id: 'all', label: t('ask.scopeAll') },
    ...watches.map((w) => ({ id: w.sourceId, label: w.title })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, flexShrink: 0, marginBottom: theme.spacing.md }}
      contentContainerStyle={{ gap: theme.spacing.xs, alignItems: 'center' }}
    >
      {items.map((item) => {
        const active = scope === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => onSelect(item.id)}
            style={{
              backgroundColor: active ? theme.colors.accent : theme.colors.card,
              borderColor: active ? theme.colors.accent : theme.colors.ruleSubtle,
              borderWidth: theme.borders.hairline,
              borderRadius: theme.radii.pill,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: 8,
              minHeight: 38,
              justifyContent: 'center',
            }}
          >
            <Text
              style={[
                typeScale.caption,
                {
                  color: active ? theme.colors.onAccent : theme.colors.ink,
                  fontFamily: fonts.bodyBold,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
