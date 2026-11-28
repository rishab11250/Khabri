/**
 * @file Sub-components for KhabarCard: source/impact header, before/after rail diff, and why footer.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sourceWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  sourceName: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
    flexShrink: 1,
  },
  timeAgo: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  impactBadge: {
    borderRadius: theme.radii.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  impactHighBg: {
    backgroundColor: theme.colors.accent,
  },
  impactMedBg: {
    backgroundColor: theme.colors.haldiSoft,
  },
  impactLowBg: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  impactText: {
    ...typeScale.caption,
    fontFamily: fonts.bodyBold,
  },
  impactHighText: {
    color: theme.colors.onAccent,
  },
  impactMedText: {
    color: theme.colors.haldi,
  },
  impactLowText: {
    color: theme.colors.muted,
  },
  diffBox: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  diffRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  railWrap: {
    alignItems: 'center',
    paddingTop: 5,
  },
  dotBefore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.muted,
  },
  railLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: theme.colors.ruleSubtle,
    marginTop: 4,
  },
  dotAfterBase: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotHigh: {
    backgroundColor: theme.colors.accent,
  },
  dotMed: {
    backgroundColor: theme.colors.haldi,
  },
  dotLow: {
    backgroundColor: theme.colors.neem,
  },
  beforeCol: {
    flex: 1,
    gap: 2,
  },
  beforeLabel: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.bodyBold,
  },
  beforeText: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  afterCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xs,
    padding: theme.spacing.sm,
    borderLeftWidth: 3,
    gap: 2,
  },
  borderHigh: {
    borderLeftColor: theme.colors.accent,
  },
  borderMed: {
    borderLeftColor: theme.colors.haldi,
  },
  borderLow: {
    borderLeftColor: theme.colors.neem,
  },
  afterLabelBase: {
    ...typeScale.caption,
    fontFamily: fonts.bodyBold,
  },
  labelHigh: {
    color: theme.colors.accent,
  },
  labelMed: {
    color: theme.colors.haldi,
  },
  labelLow: {
    color: theme.colors.neem,
  },
  afterText: {
    ...typeScale.body,
    color: theme.colors.ink,
    fontFamily: fonts.bodyMedium,
  },
  whyRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  whyIcon: {
    marginTop: 3,
  },
  whyWrap: {
    flex: 1,
    gap: 2,
  },
  whyText: {
    ...typeScale.body,
    color: theme.colors.ink,
    fontFamily: fonts.body,
  },
  aiNote: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  footer: {
    borderTopWidth: theme.borders.hairline,
    borderTopColor: theme.colors.ruleSubtle,
    paddingTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  readMore: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyBold,
  },
});

/**
 * Renders the top metadata row showing trust badge, source name, age, and impact pill.
 *
 * @param {object} props - Component props.
 * @param {string} props.trust - Deterministic trust classification (`OFFICIAL`, `REPORTED`, etc.).
 * @param {string} props.sourceName - Human-readable portal title.
 * @param {string} props.timeAgo - Compact relative detection age (e.g. `12m`).
 * @param {string} props.impact - Impact severity (`HIGH`, `MEDIUM`, `LOW`).
 * @param {Function} props.t - Translation helper.
 * @returns {JSX.Element} Card header row.
 */
export function KhabarCardHeader({ trust, sourceName, timeAgo, impact, t }) {
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const trustIcon =
    trust === 'OFFICIAL'
      ? { name: 'shield-checkmark', color: theme.colors.neem }
      : trust === 'REPORTED'
        ? { name: 'newspaper-outline', color: theme.colors.ink }
        : { name: 'help-circle-outline', color: theme.colors.muted };

  const badgeBg =
    impact === 'HIGH'
      ? styles.impactHighBg
      : impact === 'MEDIUM'
        ? styles.impactMedBg
        : styles.impactLowBg;
  const badgeText =
    impact === 'HIGH'
      ? styles.impactHighText
      : impact === 'MEDIUM'
        ? styles.impactMedText
        : styles.impactLowText;

  return (
    <View style={styles.headerRow}>
      <View style={styles.sourceWrap}>
        <Ionicons name={trustIcon.name} size={14} color={trustIcon.color} />
        <Text numberOfLines={1} style={styles.sourceName}>
          {sourceName || t('card.unknownSource')}
        </Text>
        {timeAgo ? <Text style={styles.timeAgo}>· {timeAgo}</Text> : null}
      </View>
      <View style={[styles.impactBadge, badgeBg]}>
        <Text style={[styles.impactText, badgeText]}>{impact}</Text>
      </View>
    </View>
  );
}

/**
 * Renders the vertical-rail before/after diff block for a detected change.
 *
 * @param {object} props - Component props.
 * @param {string | null | undefined} props.before - Previous official text (omitted on baseline notices).
 * @param {string} props.after - Updated official text.
 * @param {string} props.impact - Severity controlling indicator dot and border colors.
 * @param {boolean} props.isCompact - Clamps snippets to 2 lines when true.
 * @param {Function} props.t - Translation helper.
 * @returns {JSX.Element} Diff comparison panel.
 */
export function KhabarCardDiff({ before, after, impact, isCompact, t }) {
  const styles = useStyles(createStyles);
  const dotTone =
    impact === 'HIGH' ? styles.dotHigh : impact === 'MEDIUM' ? styles.dotMed : styles.dotLow;
  const borderTone =
    impact === 'HIGH'
      ? styles.borderHigh
      : impact === 'MEDIUM'
        ? styles.borderMed
        : styles.borderLow;
  const labelTone =
    impact === 'HIGH' ? styles.labelHigh : impact === 'MEDIUM' ? styles.labelMed : styles.labelLow;

  return (
    <View style={styles.diffBox}>
      {before ? (
        <View style={styles.diffRow}>
          <View style={styles.railWrap}>
            <View style={styles.dotBefore} />
            <View style={styles.railLine} />
          </View>
          <View style={styles.beforeCol}>
            <Text style={styles.beforeLabel}>{t('card.before')}</Text>
            <Text numberOfLines={isCompact ? 2 : undefined} style={styles.beforeText}>
              {before}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.diffRow}>
        <View style={styles.railWrap}>
          <View style={[styles.dotAfterBase, dotTone]} />
        </View>
        <View style={[styles.afterCard, borderTone]}>
          <Text style={[styles.afterLabelBase, labelTone]}>{t('card.after')}</Text>
          <Text numberOfLines={isCompact ? 2 : undefined} style={styles.afterText}>
            {after}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Renders the AI impact explanation and optional "read more" prompt below the diff.
 *
 * @param {object} props - Component props.
 * @param {string | undefined} props.whyText - Plain-language impact summary.
 * @param {boolean} props.showWhy - Whether to render the explanation block.
 * @param {boolean} props.showReadMore - Whether to show the navigation footer row.
 * @param {boolean} props.isCompact - Clamps explanation text to 2 lines when true.
 * @param {Function} props.t - Translation helper.
 * @returns {JSX.Element} Card footer fragment.
 */
export function KhabarCardFooter({ whyText, showWhy, showReadMore, isCompact, t }) {
  const theme = useTheme();
  const styles = useStyles(createStyles);

  return (
    <>
      {showWhy ? (
        <View style={styles.whyRow}>
          <Ionicons
            name="sparkles-outline"
            size={15}
            color={theme.colors.accent}
            style={styles.whyIcon}
          />
          <View style={styles.whyWrap}>
            <Text numberOfLines={isCompact ? 2 : undefined} style={styles.whyText}>
              {whyText}
            </Text>
            <Text style={styles.aiNote}>{t('card.aiNote')}</Text>
          </View>
        </View>
      ) : null}

      {showReadMore ? (
        <View style={styles.footer}>
          <Text style={styles.readMore}>{t('card.readMore')}</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.accent} />
        </View>
      ) : null}
    </>
  );
}
