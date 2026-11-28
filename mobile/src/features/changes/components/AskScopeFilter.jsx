/**
 * @file Horizontal scope pill bar for filtering Ask Khabri queries across all or one watched source.
 */
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: theme.spacing.md,
  },
  scrollContent: {
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  pill: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  pillText: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
  pillTextActive: {
    color: theme.colors.onAccent,
  },
});

/**
 * Renders scrollable source filter chips for Ask Khabri context grounding.
 *
 * @param {object} props - Component props.
 * @param {string} props.scope - Active scope identifier (`'all'` or a `sourceId`).
 * @param {Array<object>} props.watches - User's active watched sources.
 * @param {Function} props.onSelect - Callback invoked with the tapped scope ID.
 * @returns {JSX.Element} Horizontal chip scroller.
 */
export function AskScopeFilter({ scope, watches, onSelect }) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);

  const items = [
    { id: 'all', label: t('ask.scopeAll') },
    ...watches.map((w) => ({ id: w.sourceId, label: w.title })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {items.map((item) => {
        const active = scope === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => onSelect(item.id)}
            style={[styles.pill, active ? styles.pillActive : null]}
          >
            <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
