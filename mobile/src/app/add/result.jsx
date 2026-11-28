/**
 * @file Review screen listing AI-proposed portal matches extracted from a scanned notice photo.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { PhotoProposalsList } from '@/features/watches/components/PhotoProposalsList';
import { usePhotoResult } from '@/features/watches/hooks/usePhotoResult';
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
 * Displays extracted notice entities and lets the user confirm a proposed watch.
 *
 * @returns {JSX.Element} Photo scan results screen.
 */
export default function AddPhotoResultScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles(createStyles);
  const { extracted, proposals, error, isConfirming, confirmProposal } = usePhotoResult();

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
        <Masthead title={t('add.proposalsTitle')} />
        <PhotoProposalsList
          extracted={extracted}
          proposals={proposals}
          error={error}
          t={t}
          isConfirming={isConfirming}
          onConfirm={confirmProposal}
        />
      </ScrollView>
    </ScreenShell>
  );
}
