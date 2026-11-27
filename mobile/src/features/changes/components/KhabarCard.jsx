import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

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

export function KhabarCard({ card, onPress, compact = true, lead = false, overrideWhy }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  const trust = card.trust ?? 'OFFICIAL';
  const trustConfig =
    trust === 'OFFICIAL'
      ? { color: theme.colors.neem, icon: 'shield-checkmark', label: t('card.trustOfficial') }
      : trust === 'REPORTED'
        ? { color: theme.colors.ink, icon: 'newspaper-outline', label: t('card.trustReported') }
        : {
            color: theme.colors.muted,
            icon: 'help-circle-outline',
            label: t('card.trustUnverified'),
          };

  const impact = card.impact ?? 'LOW';
  const isHigh = impact === 'HIGH';
  const isMedium = impact === 'MEDIUM';

  const impactBg = isHigh
    ? theme.colors.accent
    : isMedium
      ? theme.colors.haldiSoft
      : theme.colors.surfaceAlt;
  const impactFg = isHigh
    ? theme.colors.onAccent
    : isMedium
      ? theme.colors.haldi
      : theme.colors.muted;
  const diffBarColor = isHigh
    ? theme.colors.accent
    : isMedium
      ? theme.colors.haldi
      : theme.colors.neem;

  const isCompact = compact && !lead;
  const headline = deriveHeadline(card);
  const timeAgo = formatRelativeTime(card.detectedAt);
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: theme.colors.card,
          borderColor: isHigh ? diffBarColor : theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.md,
          marginBottom: theme.spacing.md,
          overflow: 'hidden',
          opacity: pressed && onPress ? 0.92 : 1,
          transform: [{ scale: pressed && onPress ? 0.99 : 1 }],
        },
      ]}
    >
      {lead ? <View style={{ height: 4, backgroundColor: theme.colors.accent }} /> : null}

      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: theme.spacing.xs,
            }}
          >
            <Ionicons name={trustConfig.icon} size={14} color={trustConfig.color} />
            <Text
              numberOfLines={1}
              style={[
                typeScale.caption,
                { color: theme.colors.ink, fontFamily: fonts.bodyBold, flexShrink: 1 },
              ]}
            >
              {card.sourceName || t('card.unknownSource')}
            </Text>
            {timeAgo ? (
              <Text
                style={[
                  typeScale.caption,
                  typeScale.tabular,
                  { color: theme.colors.muted, fontFamily: fonts.body },
                ]}
              >
                · {timeAgo}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              backgroundColor: impactBg,
              borderRadius: theme.radii.xs,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 3,
            }}
          >
            <Text style={[typeScale.caption, { color: impactFg, fontFamily: fonts.bodyBold }]}>
              {impact}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={isCompact ? 2 : undefined}
          style={[
            lead ? typeScale.leadTitle : typeScale.title,
            { color: theme.colors.ink, fontFamily: fonts.headline },
          ]}
        >
          {headline}
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radii.sm,
            padding: theme.spacing.md,
            gap: theme.spacing.sm,
          }}
        >
          {card.before ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <View style={{ alignItems: 'center', paddingTop: 5 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: theme.colors.muted,
                  }}
                />
                <View
                  style={{
                    width: 1.5,
                    flex: 1,
                    backgroundColor: theme.colors.ruleSubtle,
                    marginTop: 4,
                  }}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={[
                    typeScale.caption,
                    { color: theme.colors.muted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t('card.before')}
                </Text>
                <Text
                  numberOfLines={isCompact ? 2 : undefined}
                  style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}
                >
                  {card.before}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <View style={{ alignItems: 'center', paddingTop: 5 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: diffBarColor,
                }}
              />
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: theme.colors.card,
                borderRadius: theme.radii.xs,
                padding: theme.spacing.sm,
                borderLeftWidth: 3,
                borderLeftColor: diffBarColor,
                gap: 2,
              }}
            >
              <Text
                style={[typeScale.caption, { color: diffBarColor, fontFamily: fonts.bodyBold }]}
              >
                {t('card.after')}
              </Text>
              <Text
                numberOfLines={isCompact ? 2 : undefined}
                style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyMedium }]}
              >
                {card.after}
              </Text>
            </View>
          </View>
        </View>

        {overrideWhy || card.analysis?.why ? (
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.sm,
              alignItems: 'flex-start',
            }}
          >
            <Ionicons
              name="sparkles-outline"
              size={15}
              color={theme.colors.accent}
              style={{ marginTop: 3 }}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                numberOfLines={isCompact ? 2 : undefined}
                style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.body }]}
              >
                {overrideWhy || card.analysis?.why}
              </Text>
              <Text
                style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
              >
                {t('card.aiNote')}
              </Text>
            </View>
          </View>
        ) : null}

        {isCompact && onPress ? (
          <View
            style={{
              borderTopWidth: theme.borders.hairline,
              borderTopColor: theme.colors.ruleSubtle,
              paddingTop: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 36,
            }}
          >
            <Text
              style={[
                typeScale.caption,
                { color: theme.colors.accent, fontFamily: fonts.bodyBold },
              ]}
            >
              {t('card.readMore')}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.accent} />
          </View>
        ) : null}
      </View>
    </Container>
  );
}
