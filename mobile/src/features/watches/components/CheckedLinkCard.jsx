import { Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';

export function CheckedLinkCard({ checked, theme, fonts, t, isConfirming, onConfirm }) {
  if (!checked) return null;

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.neem,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        padding: theme.spacing.lg,
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      <Text
        style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.headlineSemi }]}
      >
        {checked.source.name}
      </Text>
      <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
        {checked.supported
          ? `${checked.source.type} · ${checked.source.trust}`
          : t('add.jsUnsupported')}
      </Text>
      {checked.preview ? (
        <Text
          numberOfLines={4}
          style={[typeScale.caption, { color: theme.colors.ink, fontFamily: fonts.body }]}
        >
          {checked.preview}
        </Text>
      ) : null}
      <NewspaperButton
        disabled={isConfirming}
        icon="checkmark-circle-outline"
        label={checked.supported ? t('add.confirmWatch') : t('add.confirmSearchWatch')}
        onPress={onConfirm}
      />
    </View>
  );
}
