import { Text, View } from 'react-native';
import { Kabootar } from '@/components/Kabootar';
import { typeScale } from '@/theme/typography';

export function AboutContent({ theme, fonts, t }) {
  const sections = [
    {
      heading: t('about.disclaimerHeading'),
      body: t('about.disclaimerBody'),
      accent: true,
      marginBottom: theme.spacing.md,
    },
    {
      heading: t('about.privacyHeading'),
      body: t('about.privacyBody'),
      accent: false,
      marginBottom: theme.spacing.md,
    },
    {
      heading: t('about.sourcesHeading'),
      body: t('about.sourcesBody'),
      accent: false,
      marginBottom: theme.spacing.lg,
    },
  ];

  return (
    <>
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.lg,
          alignItems: 'center',
          padding: theme.spacing.xl,
          marginBottom: theme.spacing.md,
          gap: theme.spacing.sm,
        }}
      >
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Kabootar size={58} flap />
        </View>
        <Text
          style={[
            typeScale.masthead,
            { color: theme.colors.ink, fontFamily: fonts.headline, textAlign: 'center' },
          ]}
        >
          {t('app.name')}
        </Text>
        <Text
          style={[
            typeScale.section,
            { color: theme.colors.muted, fontFamily: fonts.bodyMedium, textAlign: 'center' },
          ]}
        >
          {t('app.tagline')}
        </Text>
        <View
          style={{
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radii.pill,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: 4,
          }}
        >
          <Text
            style={[
              typeScale.caption,
              typeScale.tabular,
              { color: theme.colors.muted, fontFamily: fonts.bodyBold },
            ]}
          >
            {t('about.version', { version: '0.1.0' })}
          </Text>
        </View>
      </View>

      {sections.map((section) => (
        <View
          key={section.heading}
          style={{
            backgroundColor: theme.colors.card,
            borderColor: section.accent ? theme.colors.accent : theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
            marginBottom: section.marginBottom,
            gap: theme.spacing.xs,
          }}
        >
          <Text
            style={[
              typeScale.section,
              {
                color: section.accent ? theme.colors.accent : theme.colors.ink,
                fontFamily: fonts.bodyBold,
              },
            ]}
          >
            {section.heading}
          </Text>
          <Text
            style={[
              typeScale.body,
              {
                color: section.accent ? theme.colors.ink : theme.colors.muted,
                fontFamily: fonts.body,
              },
            ]}
          >
            {section.body}
          </Text>
        </View>
      ))}
    </>
  );
}
