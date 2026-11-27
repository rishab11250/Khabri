import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { PhotoProposalsList } from '@/features/watches/components/PhotoProposalsList';
import { usePhotoResult } from '@/features/watches/hooks/usePhotoResult';
import { getFontFamilies } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function AddPhotoResultScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const { extracted, proposals, error, isConfirming, confirmProposal } = usePhotoResult();

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
        <Masthead title={t('add.proposalsTitle')} />
        <PhotoProposalsList
          extracted={extracted}
          proposals={proposals}
          error={error}
          theme={theme}
          fonts={fonts}
          t={t}
          isConfirming={isConfirming}
          onConfirm={confirmProposal}
        />
      </ScrollView>
    </ScreenShell>
  );
}
