import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenShell } from '../../src/components/ScreenShell';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function DeadlinesScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);

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
          {t('deadlines.title')}
        </Text>
      </View>
      <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
        {t('deadlines.empty')}
      </Text>
    </ScreenShell>
  );
}
