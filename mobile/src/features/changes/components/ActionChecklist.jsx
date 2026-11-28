/**
 * @file Interactive action-step checklist card rendered on change detail screens.
 */
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    paddingVertical: 6,
    minHeight: 40,
  },
  itemText: {
    ...typeScale.body,
    flex: 1,
    color: theme.colors.ink,
    fontFamily: fonts.body,
  },
  itemDone: {
    color: theme.colors.muted,
    textDecorationLine: 'line-through',
  },
});

/**
 * Renders persisted or synthetic checklist items with optimistic local completion state.
 *
 * @param {object} props - Component props.
 * @param {Array<object>} [props.items] - Checklist item objects (`id`, `text`, `done`).
 * @param {object} props.localChecklistDone - Optimistic done-state map keyed by item ID.
 * @param {Function} props.onToggle - Toggle handler invoked with the pressed checklist item.
 * @returns {JSX.Element | null} Checklist card or `null` when empty.
 */
export function ActionChecklist({ items, localChecklistDone, onToggle }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('card.checklistTitle')}</Text>
      {items.map((item) => {
        const isDone =
          localChecklistDone[item.id] !== undefined ? localChecklistDone[item.id] : item.done;
        // Synthetic raw-/tr- fallback items have no ChecklistItem document to toggle in backend.
        const canToggle = !String(item.id).startsWith('raw-') && !String(item.id).startsWith('tr-');
        return (
          <Pressable
            key={item.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
            disabled={!canToggle}
            onPress={() => onToggle(item)}
            style={styles.row}
          >
            <Ionicons
              name={isDone ? 'checkbox' : 'square-outline'}
              size={20}
              color={isDone ? theme.colors.neem : theme.colors.accent}
            />
            <Text style={[styles.itemText, isDone ? styles.itemDone : null]}>{item.text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
