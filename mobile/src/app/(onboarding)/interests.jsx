/**
 * @file Onboarding Step 3 screen for selecting tracked government/exam topic categories.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StepBar } from '@/components/StepBar';
import { INTEREST_CATEGORIES } from '@/constants/india';
import { INTEREST_CATEGORY_ICONS } from '@/features/settings/constants';
import { useOnboardingInterests } from '@/features/settings/hooks/useOnboarding';
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
    marginBottom: theme.spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  list: {
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActive: {
    borderColor: theme.colors.accent,
    borderWidth: theme.borders.double,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeActive: {
    backgroundColor: theme.colors.accent,
  },
  cardLabel: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.sm,
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
 * Renders multi-select interest category cards during initial profile setup.
 *
 * @returns {JSX.Element} Onboarding interests screen.
 */
export default function OnboardingInterestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const { selected, error, toggle, handleContinue } = useOnboardingInterests();

  return (
    <ScreenShell>
      <StepBar step={3} />

      <Text style={styles.title}>{t('onboarding.interestsTitle')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.interestsSubtitle')}</Text>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {INTEREST_CATEGORIES.map((cat) => {
            const active = selected.includes(cat);
            return (
              <Pressable
                key={cat}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                onPress={() => toggle(cat)}
                style={[styles.card, active && styles.cardActive]}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.iconBadge, active && styles.iconBadgeActive]}>
                    <Ionicons
                      name={INTEREST_CATEGORY_ICONS[cat] || 'bookmark-outline'}
                      size={20}
                      color={active ? theme.colors.onAccent : theme.colors.ink}
                    />
                  </View>
                  <Text style={styles.cardLabel}>{t(`onboarding.categories.${cat}`)}</Text>
                </View>
                <Ionicons
                  name={active ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={active ? theme.colors.accent : theme.colors.muted}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
