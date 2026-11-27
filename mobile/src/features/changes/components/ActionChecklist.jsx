import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export function ActionChecklist({ items, localChecklistDone, onToggle }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      <Text
        style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.headlineSemi }]}
      >
        {t('card.checklistTitle')}
      </Text>
      {items.map((item) => {
        const isDone =
          localChecklistDone[item.id] !== undefined ? localChecklistDone[item.id] : item.done;
        const canToggle = !String(item.id).startsWith('raw-') && !String(item.id).startsWith('tr-');
        return (
          <Pressable
            key={item.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
            disabled={!canToggle}
            onPress={() => onToggle(item)}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: theme.spacing.sm,
              paddingVertical: 6,
              minHeight: 40,
            }}
          >
            <Ionicons
              name={isDone ? 'checkbox' : 'square-outline'}
              size={20}
              color={isDone ? theme.colors.neem : theme.colors.accent}
            />
            <Text
              style={[
                typeScale.body,
                {
                  flex: 1,
                  color: isDone ? theme.colors.muted : theme.colors.ink,
                  fontFamily: fonts.body,
                  textDecorationLine: isDone ? 'line-through' : 'none',
                },
              ]}
            >
              {item.text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
