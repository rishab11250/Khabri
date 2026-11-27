import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useTheme } from '@/theme/useTheme';

export default function AddHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

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
      <Masthead title={t('add.title')} />
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
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
