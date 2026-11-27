import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export function Masthead({ title, subtitle, eyebrowRight, rightAction }) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text
            style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}
          >
            {title}
          </Text>
          {subtitle || eyebrowRight ? (
            <View style={[styles.metaRow, { gap: theme.spacing.xs, marginTop: 6 }]}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: theme.colors.neem,
                }}
              />
              {subtitle ? (
                <Text
                  style={[
                    typeScale.caption,
                    typeScale.tabular,
                    { color: theme.colors.muted, fontFamily: fonts.bodyMedium },
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
              {subtitle && eyebrowRight ? (
                <Text style={[typeScale.caption, { color: theme.colors.muted }]}>·</Text>
              ) : null}
              {eyebrowRight ? (
                <Text
                  style={[
                    typeScale.caption,
                    typeScale.tabular,
                    { color: theme.colors.ink, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {eyebrowRight}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        {rightAction ?? null}
      </View>
    </View>
  );
}

export function SectionHeader({ label, rightLabel, onPressRight }) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  return (
    <View style={[styles.sectionRow, { marginBottom: theme.spacing.sm }]}>
      <Text
        style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.headlineSemi }]}
      >
        {label}
      </Text>
      {rightLabel ? (
        <Pressable accessibilityRole="button" onPress={onPressRight} style={styles.sectionAction}>
          <Text
            style={[typeScale.caption, { color: theme.colors.accent, fontFamily: fonts.bodyBold }]}
          >
            {rightLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  sectionAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
