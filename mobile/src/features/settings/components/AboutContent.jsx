/**
 * @file Brand hero and disclosure cards rendered on the About screen.
 */
import { Text, View } from 'react-native';

import { Kabootar } from '@/components/Kabootar';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  heroCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  mascotWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...typeScale.masthead,
    color: theme.colors.ink,
    fontFamily: fonts.headline,
    textAlign: 'center',
  },
  tagline: {
    ...typeScale.section,
    color: theme.colors.muted,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
  },
  versionPill: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
  },
  versionText: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.muted,
    fontFamily: fonts.bodyBold,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  sectionCardAccent: {
    borderColor: theme.colors.accent,
  },
  sectionCardLast: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeading: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
  sectionHeadingAccent: {
    color: theme.colors.accent,
  },
  sectionBody: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  sectionBodyAccent: {
    color: theme.colors.ink,
  },
});

/**
 * Renders app version, independent disclaimer, privacy pledge, and source attribution sections.
 *
 * @param {object} props - Component props.
 * @param {Function} props.t - Translation helper.
 * @returns {JSX.Element} About content fragment.
 */
export function AboutContent({ t }) {
  const styles = useStyles(createStyles);

  const sections = [
    { heading: t('about.disclaimerHeading'), body: t('about.disclaimerBody'), accent: true },
    { heading: t('about.privacyHeading'), body: t('about.privacyBody'), accent: false },
    { heading: t('about.sourcesHeading'), body: t('about.sourcesBody'), accent: false, last: true },
  ];

  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.mascotWrap}>
          <Kabootar size={58} flap />
        </View>
        <Text style={styles.appName}>{t('app.name')}</Text>
        <Text style={styles.tagline}>{t('app.tagline')}</Text>
        <View style={styles.versionPill}>
          <Text style={styles.versionText}>{t('about.version', { version: '0.1.0' })}</Text>
        </View>
      </View>

      {sections.map((section) => (
        <View
          key={section.heading}
          style={[
            styles.sectionCard,
            section.accent ? styles.sectionCardAccent : null,
            section.last ? styles.sectionCardLast : null,
          ]}
        >
          <Text
            style={[styles.sectionHeading, section.accent ? styles.sectionHeadingAccent : null]}
          >
            {section.heading}
          </Text>
          <Text style={[styles.sectionBody, section.accent ? styles.sectionBodyAccent : null]}>
            {section.body}
          </Text>
        </View>
      ))}
    </>
  );
}
