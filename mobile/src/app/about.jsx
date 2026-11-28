/**
 * @file About screen displaying version metadata, independence disclaimer, privacy note, and catalog link.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { AboutContent } from '@/features/settings/components/AboutContent';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme) => ({
  backWrap: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
});

/**
 * Renders app attribution, non-government disclaimer, and shortcut to the verified catalog.
 *
 * @returns {JSX.Element} About screen.
 */
export default function AboutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles(createStyles);

  return (
    <ScreenShell>
      <View style={styles.backWrap}>
        <NewspaperButton
          size="sm"
          variant="card"
          icon="arrow-back"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AboutContent t={t} />

        <NewspaperButton
          icon="compass-outline"
          label={t('about.viewCatalog')}
          onPress={() => router.push('/(tabs)/discover')}
        />
      </ScrollView>
    </ScreenShell>
  );
}
