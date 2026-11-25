import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settings';
import { getFontFamilies, typeScale } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

function getImpactStamp(impact, theme, t) {
  if (impact === 'HIGH') {
    return {
      text: t('card.impactHigh'),
      bg: theme.colors.accent,
      fg: theme.colors.onAccent,
      border: theme.colors.ink,
    };
  }
  if (impact === 'MEDIUM') {
    return {
      text: t('card.impactMedium'),
      bg: theme.colors.haldi,
      fg: theme.colors.haldiInk,
      border: theme.colors.ink,
    };
  }
  return {
    text: t('card.impactLow'),
    bg: theme.colors.card,
    fg: theme.colors.muted,
    border: theme.colors.muted,
  };
}

function getTrustBadge(trust, theme, t) {
  if (trust === 'official') {
    return {
      stamp: t('card.trustOfficial'),
      subtitle: t('card.trustOfficialSub'),
      bg: theme.colors.neem,
      fg: theme.colors.onNeem,
    };
  }
  if (trust === 'reported') {
    return {
      stamp: t('card.trustReported'),
      subtitle: t('card.trustReportedSub'),
      bg: theme.colors.haldi,
      fg: theme.colors.haldiInk,
    };
  }
  return {
    stamp: t('card.trustUnverified'),
    subtitle: t('card.trustUnverifiedSub'),
    bg: theme.colors.muted,
    fg: theme.colors.onAccent,
  };
}

export function KhabarCard({ card, onPress, compact = true }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  const impact = getImpactStamp(card.impact, theme, t);
  const trust = getTrustBadge(card.trust, theme, t);
  const detectedStr = new Date(card.detectedAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const sourceUrl = card.evidence?.[0]?.url || card.source?.url;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'none'}
      onPress={onPress}
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.rule,
        borderWidth: theme.borders.hairline,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
      }}
    >
      <View style={[styles.topRow, { marginBottom: theme.spacing.sm, gap: theme.spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <Text
            style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headlineSemi }]}
          >
            {card.source?.name || t('card.unknownSource')}
          </Text>
          <Text
            style={[
              typeScale.caption,
              typeScale.tabular,
              { color: theme.colors.muted, fontFamily: fonts.body, marginTop: 2 },
            ]}
          >
            {detectedStr}
          </Text>
        </View>

        <View
          style={[
            styles.stampOuter,
            {
              borderColor: impact.border,
              borderWidth: theme.borders.double,
              backgroundColor: impact.bg,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
            },
          ]}
        >
          <Text style={[typeScale.caption, { color: impact.fg, fontFamily: fonts.bodyBold }]}>
            {impact.text}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.trustRow,
          {
            borderBottomColor: theme.colors.ruleSubtle,
            borderBottomWidth: theme.borders.hairline,
            paddingBottom: theme.spacing.sm,
            marginBottom: theme.spacing.md,
            gap: theme.spacing.sm,
          },
        ]}
      >
        <View
          style={{
            backgroundColor: trust.bg,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 2,
          }}
        >
          <Text style={[typeScale.caption, { color: trust.fg, fontFamily: fonts.bodyBold }]}>
            {trust.stamp}
          </Text>
        </View>
        <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {trust.subtitle}
        </Text>
      </View>

      <View style={[styles.diffGrid, { gap: theme.spacing.sm, marginBottom: theme.spacing.md }]}>
        <View
          style={{
            flex: 1,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            padding: theme.spacing.sm,
          }}
        >
          <Text
            style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.bodyBold }]}
          >
            {t('card.before')}
          </Text>
          <Text
            numberOfLines={compact ? 3 : undefined}
            style={[
              typeScale.caption,
              { color: theme.colors.ink, fontFamily: fonts.body, marginTop: theme.spacing.xs },
            ]}
          >
            {card.before}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            borderColor: theme.colors.rule,
            borderWidth: theme.borders.hairline,
            padding: theme.spacing.sm,
          }}
        >
          <Text
            style={[typeScale.caption, { color: theme.colors.accent, fontFamily: fonts.bodyBold }]}
          >
            {t('card.after')}
          </Text>
          <Text
            numberOfLines={compact ? 3 : undefined}
            style={[
              typeScale.caption,
              {
                color: theme.colors.ink,
                fontFamily: fonts.bodyMedium,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {card.after}
          </Text>
        </View>
      </View>

      {card.analysis?.why ? (
        <View style={{ marginBottom: theme.spacing.sm }}>
          <Text style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.body }]}>
            {card.analysis.why}
          </Text>
          <Text
            style={[
              typeScale.caption,
              { color: theme.colors.muted, fontFamily: fonts.body, marginTop: theme.spacing.xs },
            ]}
          >
            {t('card.aiNote')}
          </Text>
        </View>
      ) : null}

      {sourceUrl ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(sourceUrl)}
          style={{ paddingTop: theme.spacing.xs }}
        >
          <Text
            style={[typeScale.caption, { color: theme.colors.neel, fontFamily: fonts.bodyBold }]}
          >
            {t('card.openSource')}
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stampOuter: {
    transform: [{ rotate: '-3deg' }],
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diffGrid: {
    flexDirection: 'row',
  },
});
