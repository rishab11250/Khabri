/**
 * @file Onboarding Step 1 screen for choosing UI and Samjhao explanation language.
 */
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Kabootar } from '@/components/Kabootar';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StepBar } from '@/components/StepBar';
import { ONBOARDING_LANGUAGES } from '@/features/settings/constants';
import { useOnboardingLanguage } from '@/features/settings/hooks/useOnboarding';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
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
  },
  mascotBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
    flex: 1,
    marginTop: theme.spacing.sm,
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
  cardPressed: {
    opacity: 0.9,
  },
  cardCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  cardTitle: {
    ...typeScale.leadTitle,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  cardSubtitle: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
    marginTop: 4,
  },
  footer: {
    paddingBottom: theme.spacing.lg,
  },
});

/**
 * Renders English, Hindi, and Gujarati language selection cards.
 *
 * @returns {JSX.Element} Onboarding language screen.
 */
export default function OnboardingLanguageScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const { selected, choose, handleContinue } = useOnboardingLanguage();

  return (
    <ScreenShell>
      <StepBar step={1} />

      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{t('onboarding.languageTitle')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.languageSubtitle')}</Text>
        </View>
        <View style={styles.mascotBadge}>
          <Kabootar size={42} flap />
        </View>
      </View>

      <View style={styles.list}>
        {ONBOARDING_LANGUAGES.map((item) => {
          const active = selected === item.code;
          return (
            <Pressable
              key={item.code}
              accessibilityRole="button"
              onPress={() => choose(item.code)}
              style={({ pressed }) => [
                styles.card,
                active && styles.cardActive,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={active ? theme.colors.accent : theme.colors.muted}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <NewspaperButton label={t('common.continue')} onPress={handleContinue} />
      </View>
    </ScreenShell>
  );
}
