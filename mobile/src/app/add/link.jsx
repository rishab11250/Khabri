/**
 * @file Paste-link intake screen validating an official URL and previewing extractability before watching.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { CheckedLinkCard } from '@/features/watches/components/CheckedLinkCard';
import { useAddLink } from '@/features/watches/hooks/useAddLink';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  backWrap: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginTop: theme.spacing.md,
  },
});

/**
 * Validates user-submitted URLs via `/v1/intake/link` and confirms watch subscription.
 *
 * @returns {JSX.Element} Add-by-link screen.
 */
export default function AddLinkScreen() {
  const { url: paramUrl } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles(createStyles);
  const { control, errors, checked, errMsg, isChecking, isConfirming, submitCheck, confirmWatch } =
    useAddLink(paramUrl);

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
        <Masthead title={t('add.linkTitle')} />

        <View style={styles.card}>
          <Controller
            control={control}
            name="url"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label={t('add.urlLabel')}
                placeholder={t('add.urlPlaceholder')}
                keyboardType="url"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.url?.message}
              />
            )}
          />

          <NewspaperButton
            disabled={isChecking}
            icon="search-outline"
            label={isChecking ? t('common.loading') : t('add.checkUrl')}
            onPress={submitCheck}
          />
        </View>

        {errMsg ? <Text style={styles.errorText}>{errMsg}</Text> : null}

        <CheckedLinkCard
          checked={checked}
          t={t}
          isConfirming={isConfirming}
          onConfirm={confirmWatch}
        />
      </ScrollView>
    </ScreenShell>
  );
}
