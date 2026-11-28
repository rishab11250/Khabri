/**
 * @file Onboarding Step 2 screen for selecting user state/UT manually or via GPS detection.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StepBar } from '@/components/StepBar';
import { INDIAN_STATES } from '@/constants/india';
import { useOnboardingState } from '@/features/settings/hooks/useOnboarding';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  title: {
    ...typeScale.masthead,
    color: theme.colors.ink,
    fontFamily: fonts.headline,
  },
  subtitle: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  statusText: {
    ...typeScale.caption,
    color: theme.colors.neel,
    fontFamily: fonts.bodyMedium,
    marginTop: theme.spacing.sm,
  },
  list: {
    flex: 1,
    marginVertical: theme.spacing.md,
  },
  stateItem: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  stateItemActive: {
    borderColor: theme.colors.accent,
    borderWidth: theme.borders.double,
  },
  stateText: {
    ...typeScale.body,
    color: theme.colors.ink,
    fontFamily: fonts.body,
  },
  stateTextActive: {
    fontFamily: fonts.bodyBold,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  backWrap: {
    flex: 1,
  },
  continueWrap: {
    flex: 2,
  },
});

/**
 * Renders the Indian states list with location-detection shortcut.
 *
 * @returns {JSX.Element} Onboarding state screen.
 */
export default function OnboardingStateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const { selectedState, selectState, detecting, statusMessage, detectLocation, handleContinue } =
    useOnboardingState();

  return (
    <ScreenShell>
      <StepBar step={2} />

      <Text style={styles.title}>{t('onboarding.stateTitle')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.stateSubtitle')}</Text>

      <NewspaperButton
        variant="card"
        icon="locate-outline"
        disabled={detecting}
        label={detecting ? t('onboarding.detectingLocation') : t('onboarding.detectLocation')}
        onPress={detectLocation}
      />

      {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

      <FlatList
        data={INDIAN_STATES}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        renderItem={({ item }) => {
          const active = selectedState === item;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => selectState(item)}
              style={[styles.stateItem, active && styles.stateItemActive]}
            >
              <Text style={[styles.stateText, active && styles.stateTextActive]}>
                {item === 'All India' ? t('onboarding.allIndia') : item}
              </Text>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={active ? theme.colors.accent : theme.colors.muted}
              />
            </Pressable>
          );
        }}
      />

      <View style={styles.actions}>
        <View style={styles.backWrap}>
          <NewspaperButton
            variant="secondary"
            label={t('common.back')}
            onPress={() => router.back()}
          />
        </View>
        <View style={styles.continueWrap}>
          <NewspaperButton label={t('common.continue')} onPress={handleContinue} />
        </View>
      </View>
    </ScreenShell>
  );
}
