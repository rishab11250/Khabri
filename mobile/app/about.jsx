import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { Kabootar } from '../src/components/Kabootar';
import { NewspaperButton } from '../src/components/NewspaperButton';
import { ScreenShell } from '../src/components/ScreenShell';
import { getFontFamilies, typeScale } from '../src/theme/typography';
import { useTheme } from '../src/theme/useTheme';

export default function AboutScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);

  return (
    <ScreenShell>
      <View style={{ marginBottom: theme.spacing.md }}>
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        <View
          style={{
            alignItems: 'center',
            borderBottomColor: theme.colors.rule,
            borderBottomWidth: theme.borders.double,
            paddingBottom: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            gap: theme.spacing.sm,
          }}
        >
          <Kabootar size={64} flap />
          <Text
            style={[
              typeScale.masthead,
              { color: theme.colors.ink, fontFamily: fonts.headline, textAlign: 'center' },
            ]}
          >
            {t('app.name')}
          </Text>
          <Text
            style={[
              typeScale.section,
              { color: theme.colors.muted, fontFamily: fonts.bodyMedium, textAlign: 'center' },
            ]}
          >
            {t('app.tagline')}
          </Text>
          <Text
            style={[
              typeScale.caption,
              typeScale.tabular,
              { color: theme.colors.muted, fontFamily: fonts.body },
            ]}
          >
            {t('about.version', { version: '0.1.0' })}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.accent,
            borderWidth: theme.borders.hairline,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            gap: theme.spacing.xs,
          }}
        >
          <Text
            style={[typeScale.section, { color: theme.colors.accent, fontFamily: fonts.bodyBold }]}
          >
            {t('about.disclaimerHeading')}
          </Text>
          <Text
            style={[
              typeScale.body,
              { color: theme.colors.ink, fontFamily: fonts.body, lineHeight: 22 },
            ]}
          >
            {t('about.disclaimerBody')}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.rule,
            borderWidth: theme.borders.hairline,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            gap: theme.spacing.xs,
          }}
        >
          <Text
            style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
          >
            {t('about.privacyHeading')}
          </Text>
          <Text
            style={[
              typeScale.body,
              { color: theme.colors.muted, fontFamily: fonts.body, lineHeight: 22 },
            ]}
          >
            {t('about.privacyBody')}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.rule,
            borderWidth: theme.borders.hairline,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            gap: theme.spacing.xs,
          }}
        >
          <Text
            style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
          >
            {t('about.sourcesHeading')}
          </Text>
          <Text
            style={[
              typeScale.body,
              { color: theme.colors.muted, fontFamily: fonts.body, lineHeight: 22 },
            ]}
          >
            {t('about.sourcesBody')}
          </Text>
        </View>

        <NewspaperButton
          variant="secondary"
          label={t('about.viewCatalog')}
          onPress={() => router.push('/(tabs)/discover')}
        />
      </ScrollView>
    </ScreenShell>
  );
}
