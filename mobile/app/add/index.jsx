import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function AddHubScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);

  return (
    <ScreenShell>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>
      <Text style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
        {t('add.title')}
      </Text>
      <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
        <NewspaperButton label={t('add.pasteLink')} onPress={() => router.push('/add/link')} />
        <NewspaperButton label={t('add.scanPhoto')} onPress={() => router.push('/add/photo')} />
        <NewspaperButton
          variant="secondary"
          label={t('add.browseCatalog')}
          onPress={() => router.replace('/(tabs)/discover')}
        />
      </View>
    </ScreenShell>
  );
}
