import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { AboutContent } from '@/features/settings/components/AboutContent';
import { getFontFamilies } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function AboutScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);

  return (
    <ScreenShell>
      <View style={{ alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
        <NewspaperButton
          size="sm"
          variant="card"
          icon="arrow-back"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      >
        <AboutContent theme={theme} fonts={fonts} t={t} />

        <NewspaperButton
          icon="compass-outline"
          label={t('about.viewCatalog')}
          onPress={() => router.push('/(tabs)/discover')}
        />
      </ScrollView>
    </ScreenShell>
  );
}
