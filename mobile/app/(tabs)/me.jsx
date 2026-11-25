import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenShell } from '../../src/components/ScreenShell';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

export default function MeScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const { language, setLanguage, themePreference, setThemePreference } = useSettingsStore();

  const themeOptions = [
    { key: 'system', label: t('me.themeSystem') },
    { key: 'light', label: t('me.themeLight') },
    { key: 'dark', label: t('me.themeDark') },
  ];

  return (
    <ScreenShell>
      <View
        style={{
          borderBottomColor: theme.colors.rule,
          borderBottomWidth: theme.borders.rule,
          paddingBottom: theme.spacing.sm,
          marginBottom: theme.spacing.lg,
        }}
      >
        <Text style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
          {t('me.title')}
        </Text>
      </View>

      <Text
        style={[
          typeScale.section,
          { color: theme.colors.ink, fontFamily: fonts.bodyBold, marginBottom: theme.spacing.sm },
        ]}
      >
        {t('me.language')}
      </Text>
      <View style={[styles.row, { gap: theme.spacing.sm, marginBottom: theme.spacing.xl }]}>
        {LANGUAGES.map((item) => {
          const active = language === item.code;
          return (
            <Pressable
              key={item.code}
              accessibilityRole="button"
              onPress={() => setLanguage(item.code)}
              style={{
                borderWidth: theme.borders.hairline,
                borderColor: active ? theme.colors.accent : theme.colors.rule,
                backgroundColor: active ? theme.colors.accent : theme.colors.card,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }}
            >
              <Text
                style={[
                  typeScale.caption,
                  {
                    color: active ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: fonts.bodyMedium,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text
        style={[
          typeScale.section,
          { color: theme.colors.ink, fontFamily: fonts.bodyBold, marginBottom: theme.spacing.sm },
        ]}
      >
        {t('me.theme')}
      </Text>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
        {themeOptions.map((item) => {
          const active = themePreference === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={() => setThemePreference(item.key)}
              style={{
                borderWidth: theme.borders.hairline,
                borderColor: active ? theme.colors.accent : theme.colors.rule,
                backgroundColor: active ? theme.colors.accent : theme.colors.card,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }}
            >
              <Text
                style={[
                  typeScale.body,
                  {
                    color: active ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: fonts.bodyMedium,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
        {t('app.unofficialDisclaimer')}
      </Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
