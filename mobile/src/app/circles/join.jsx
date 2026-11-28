/**
 * @file Circle invite-code redemption screen.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FormField } from '@/components/FormField';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useJoinCircle } from '@/features/circles/hooks/useJoinCircle';
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
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
  },
});

/**
 * Accepts a Circle invite code (optionally deep-linked) and joins the group.
 *
 * @returns {JSX.Element} Join Circle screen.
 */
export default function JoinCircleScreen() {
  const { code: paramCode } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles(createStyles);
  const { code, setCode, error, isJoining, joinCircle } = useJoinCircle(paramCode);

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

      <Masthead title={t('circles.joinTitle')} />

      <View style={styles.card}>
        <FormField
          label={t('circles.codeLabel')}
          placeholder={t('circles.codePlaceholder')}
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
          error={error}
        />

        <NewspaperButton
          disabled={isJoining || code.trim().length < 4}
          label={isJoining ? t('common.loading') : t('circles.joinBtn')}
          onPress={joinCircle}
        />
      </View>
    </ScreenShell>
  );
}
