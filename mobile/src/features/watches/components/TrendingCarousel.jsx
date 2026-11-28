/**
 * @file Horizontal carousel highlighting top-followed portals in the Discover tab.
 */
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SectionHeader } from '@/components/Masthead';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  root: {
    marginBottom: theme.spacing.lg,
  },
  scrollContent: {
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    width: 200,
  },
  cardWatched: {
    borderColor: theme.colors.neem,
  },
  cardPressed: {
    opacity: 0.88,
  },
  topBar: {
    height: 3,
    backgroundColor: theme.colors.accent,
  },
  barNeel: {
    backgroundColor: theme.colors.neel,
  },
  barHaldi: {
    backgroundColor: theme.colors.haldi,
  },
  barNeem: {
    backgroundColor: theme.colors.neem,
  },
  body: {
    padding: theme.spacing.md,
    gap: 6,
  },
  rankText: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.muted,
    fontFamily: fonts.bodyBold,
  },
  nameText: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  actionText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyBold,
  },
  actionWatched: {
    color: theme.colors.neem,
  },
});

function getBarStyle(cat, watched, styles) {
  if (watched) return styles.barNeem;
  if (cat === 'recruitment') return styles.barNeel;
  if (cat === 'scholarship') return styles.barHaldi;
  if (cat === 'scheme') return styles.barNeem;
  return null;
}

/**
 * Renders quick-follow cards for up to 6 trending catalog sources.
 *
 * @param {object} props - Component props.
 * @param {Array<object>} props.sources - Ordered list of trending catalog sources.
 * @param {Map<string, object>} props.watchBySourceId - Lookup map of currently followed source IDs.
 * @param {Function} props.t - Translation helper.
 * @param {Function} props.onToggleFollow - Follow/unfollow press handler.
 * @returns {JSX.Element | null} Horizontal carousel or `null` when trending list is empty.
 */
export function TrendingCarousel({ sources, watchBySourceId, t, onToggleFollow }) {
  const styles = useStyles(createStyles);

  if (!sources || sources.length === 0) return null;

  return (
    <View style={styles.root}>
      <SectionHeader label={t('discover.trendingTitle')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sources.slice(0, 6).map((src, idx) => {
          const watched = watchBySourceId.get(src.id);
          return (
            <Pressable
              key={src.id}
              accessibilityRole="button"
              onPress={() => onToggleFollow(src, watched)}
              style={({ pressed }) => [
                styles.card,
                watched ? styles.cardWatched : null,
                pressed ? styles.cardPressed : null,
              ]}
            >
              <View style={[styles.topBar, getBarStyle(src.category, watched, styles)]} />
              <View style={styles.body}>
                <Text style={styles.rankText}>
                  #{idx + 1} · {src.category || 'notice'}
                </Text>
                <Text numberOfLines={2} style={styles.nameText}>
                  {src.name}
                </Text>
                <Text style={[styles.actionText, watched ? styles.actionWatched : null]}>
                  {watched ? `✓ ${t('discover.following')}` : `+ ${t('discover.follow')}`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
