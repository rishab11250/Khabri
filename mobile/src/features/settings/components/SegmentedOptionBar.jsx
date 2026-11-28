/**
 * @file Reusable equal-width segmented pill bar for language, theme, and digest time pickers.
 */
import { Pressable, Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.sm,
    padding: 4,
    gap: 4,
  },
  mbLg: {
    marginBottom: theme.spacing.lg,
  },
  mbXl: {
    marginBottom: theme.spacing.xl,
  },
  option: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  optionCompact: {
    minHeight: 40,
  },
  optionActive: {
    backgroundColor: theme.colors.accent,
  },
  label: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.bodyMedium,
  },
  labelTabular: {
    ...typeScale.tabular,
  },
  labelActive: {
    color: theme.colors.onAccent,
    fontFamily: fonts.bodyBold,
  },
});

/**
 * Renders a row of selectable options where the active key receives accent styling.
 *
 * @param {object} props - Component props.
 * @param {Array<{key: string, label: string}>} props.options - Selectable option entries.
 * @param {string} props.value - Currently selected option key.
 * @param {Function} props.onSelect - Callback invoked with the tapped option key.
 * @param {number} [props.minHeight=42] - Minimum touch height in dp (`<= 40` enables compact mode).
 * @param {boolean} [props.tabular=false] - Uses tabular numerals for time values when true.
 * @param {number} [props.marginBottom=0] - Bottom spacing bucket mapped to theme spacing tokens.
 * @returns {JSX.Element} Segmented control bar.
 */
export function SegmentedOptionBar({
  options,
  value,
  onSelect,
  minHeight = 42,
  tabular = false,
  marginBottom = 0,
}) {
  const styles = useStyles(createStyles);
  const bottomStyle = marginBottom >= 24 ? styles.mbXl : marginBottom > 0 ? styles.mbLg : null;

  return (
    <View style={[styles.bar, bottomStyle]}>
      {options.map((item) => {
        const active = value === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={() => onSelect(item.key)}
            style={[
              styles.option,
              minHeight <= 40 ? styles.optionCompact : null,
              active ? styles.optionActive : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                tabular ? styles.labelTabular : null,
                active ? styles.labelActive : null,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
