/**
 * @file Newspaper-inspired screen masthead and section header primitives.
 */
import { Pressable, Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  root: {
    marginBottom: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...typeScale.masthead,
    color: theme.colors.ink,
    fontFamily: fonts.headline,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.neem,
  },
  subtitle: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.muted,
    fontFamily: fonts.bodyMedium,
  },
  separator: {
    ...typeScale.caption,
    color: theme.colors.muted,
  },
  eyebrow: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  sectionAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  sectionActionText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyBold,
  },
});

/**
 * Renders a primary screen title with optional live-dot subtitle, right eyebrow, and action node.
 *
 * @param {object} props - Component props.
 * @param {string} props.title - Masthead display heading.
 * @param {string} [props.subtitle] - Left metadata text shown beside the status dot.
 * @param {string} [props.eyebrowRight] - Right metadata text separated by a middot.
 * @param {JSX.Element | null} [props.rightAction] - Optional trailing header action element.
 * @returns {JSX.Element} Masthead block.
 */
export function Masthead({ title, subtitle, eyebrowRight, rightAction }) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle || eyebrowRight ? (
            <View style={styles.metaRow}>
              <View style={styles.dot} />
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              {subtitle && eyebrowRight ? <Text style={styles.separator}>·</Text> : null}
              {eyebrowRight ? <Text style={styles.eyebrow}>{eyebrowRight}</Text> : null}
            </View>
          ) : null}
        </View>
        {rightAction ?? null}
      </View>
    </View>
  );
}

/**
 * Renders a section heading row with an optional right-aligned text action.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - Section title text.
 * @param {string} [props.rightLabel] - Optional action button text.
 * @param {Function} [props.onPressRight] - Press handler for the action text.
 * @returns {JSX.Element} Section header row.
 */
export function SectionHeader({ label, rightLabel, onPressRight }) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {rightLabel ? (
        <Pressable accessibilityRole="button" onPress={onPressRight} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{rightLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
