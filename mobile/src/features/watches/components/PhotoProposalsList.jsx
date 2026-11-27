import { Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';

export function PhotoProposalsList({
  extracted,
  proposals,
  error,
  theme,
  fonts,
  t,
  isConfirming,
  onConfirm,
}) {
  return (
    <>
      {extracted ? (
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            gap: 4,
          }}
        >
          <Text
            style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
          >
            {extracted.examOrScheme || extracted.organization}
          </Text>
          {extracted.dates?.length > 0 ? (
            <Text
              style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
            >
              {extracted.dates.join(' · ')}
            </Text>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <Text
          style={[
            typeScale.caption,
            {
              color: theme.colors.accent,
              fontFamily: fonts.bodyMedium,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        {proposals.map((p, idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.ruleSubtle,
              borderWidth: theme.borders.hairline,
              borderRadius: theme.radii.md,
              padding: theme.spacing.lg,
              gap: theme.spacing.sm,
            }}
          >
            <Text
              style={[
                typeScale.section,
                { color: theme.colors.ink, fontFamily: fonts.headlineSemi },
              ]}
            >
              {p.title}
            </Text>
            <Text
              style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
            >
              {p.kind} · {p.trust}
            </Text>
            <NewspaperButton
              icon="checkmark-circle-outline"
              disabled={isConfirming}
              label={t('add.confirmWatch')}
              onPress={() => onConfirm(p)}
            />
          </View>
        ))}
      </View>
    </>
  );
}
