/**
 * @file Editorial Khabar news card presenting source trust, before/after diff, impact, and why-it-matters.
 */
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import {
  KhabarCardDiff,
  KhabarCardFooter,
  KhabarCardHeader,
} from '@/features/changes/components/KhabarCardParts';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

function formatRelativeTime(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function deriveHeadline(card) {
  const explicit = card?.analysis?.headline;
  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim();
  }
  const source = (card?.after || '').trim();
  if (!source) return card?.sourceName || '';
  const firstSentence = source.split(/(?<=[.?!।\n])\s+/)[0] || source;
  if (firstSentence.length <= 90) return firstSentence;
  const truncated = firstSentence.slice(0, 90);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated).trim();
}

const createStyles = (theme, fonts) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  cardHigh: {
    borderColor: theme.colors.accent,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  leadBar: {
    height: 4,
    backgroundColor: theme.colors.accent,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headline: {
    ...typeScale.title,
    color: theme.colors.ink,
    fontFamily: fonts.headline,
  },
  headlineLead: {
    ...typeScale.leadTitle,
    color: theme.colors.ink,
    fontFamily: fonts.headline,
  },
});

/**
 * Renders a detected change card in compact feed mode or expanded detail/share-capture mode.
 *
 * @param {object} props - Component props.
 * @param {object} props.card - Change feed/detail payload.
 * @param {Function} [props.onPress] - Optional tap handler; renders static view when omitted.
 * @param {boolean} [props.compact=true] - Truncates text to two lines when true and not lead.
 * @param {boolean} [props.lead=false] - Highlights card as the top edition story with an accent bar.
 * @param {string} [props.overrideWhy] - Translated "why it matters" string replacing the default analysis.
 * @returns {JSX.Element} Khabar card container.
 */
export function KhabarCard({ card, onPress, compact = true, lead = false, overrideWhy }) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);

  const trust = card.trust ?? 'OFFICIAL';
  const impact = card.impact ?? 'LOW';
  const isHigh = impact === 'HIGH';
  const isCompact = compact && !lead;
  const headline = deriveHeadline(card);
  const timeAgo = formatRelativeTime(card.detectedAt);
  const whyText = overrideWhy || card.analysis?.why;
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isHigh ? styles.cardHigh : null,
        pressed && onPress ? styles.cardPressed : null,
      ]}
    >
      {lead ? <View style={styles.leadBar} /> : null}

      <View style={styles.content}>
        <KhabarCardHeader
          trust={trust}
          sourceName={card.sourceName}
          timeAgo={timeAgo}
          impact={impact}
          t={t}
        />

        <Text
          numberOfLines={isCompact ? 2 : undefined}
          style={lead ? styles.headlineLead : styles.headline}
        >
          {headline}
        </Text>

        <KhabarCardDiff
          before={card.before}
          after={card.after}
          impact={impact}
          isCompact={isCompact}
          t={t}
        />

        <KhabarCardFooter
          whyText={whyText}
          showWhy={Boolean(whyText)}
          showReadMore={Boolean(isCompact && onPress)}
          isCompact={isCompact}
          t={t}
        />
      </View>
    </Container>
  );
}
