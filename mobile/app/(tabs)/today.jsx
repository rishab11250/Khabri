import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenShell } from '../../src/components/ScreenShell';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <ScreenShell>
      <View
        style={[
          styles.masthead,
          {
            borderBottomColor: theme.colors.rule,
            borderBottomWidth: theme.borders.double,
            paddingBottom: theme.spacing.sm,
            marginBottom: theme.spacing.lg,
          },
        ]}
      >
        <Text style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
          {t('today.masthead')}
        </Text>
        <Text
          style={[
            typeScale.caption,
            typeScale.tabular,
            { color: theme.colors.muted, fontFamily: fonts.body, marginTop: theme.spacing.xs },
          ]}
        >
          {t('today.dateline', { date: formattedDate })}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.rule,
            borderWidth: theme.borders.hairline,
            padding: theme.spacing.lg,
          },
        ]}
      >
        <Text
          style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headlineSemi }]}
        >
          {t('today.emptyTitle')}
        </Text>
        <Text
          style={[
            typeScale.body,
            { color: theme.colors.muted, fontFamily: fonts.body, marginTop: theme.spacing.sm },
          ]}
        >
          {t('today.emptySubtitle')}
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  masthead: {},
  card: {},
});
