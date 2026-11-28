/**
 * @file Watch-addition hub letting users pick paste-link intake, photo scan, or catalog browsing.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme) => ({
  backWrap: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
});

/**
 * Renders the three entry routes for monitoring a new official notice source.
 *
 * @returns {JSX.Element} Add-watch hub screen.
 */
export default function AddHubScreen() {
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
      <Masthead title={t('add.title')} />
      <View style={styles.card}>
        <NewspaperButton
          icon="link-outline"
          label={t('add.pasteLink')}
          onPress={() => router.push('/add/link')}
        />
        <NewspaperButton
          icon="camera-outline"
          label={t('add.scanPhoto')}
          onPress={() => router.push('/add/photo')}
        />
        <NewspaperButton
          variant="secondary"
          icon="compass-outline"
          label={t('add.browseCatalog')}
          onPress={() => router.replace('/(tabs)/discover')}
        />
      </View>
    </ScreenShell>
  );
}
