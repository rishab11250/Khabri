import { Text, View } from 'react-native';
import { Kabootar } from '@/components/Kabootar';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';

export function WatchesEmptyState({ theme, fonts, t, isLoading, onBrowseDiscover }) {
  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.md,
          padding: theme.spacing.xl,
          alignItems: 'center',
        }}
      >
        <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.lg,
        padding: theme.spacing.xl,
        alignItems: 'center',
        gap: theme.spacing.md,
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
        <Kabootar size={56} />
      </View>
      <Text
        style={[
          typeScale.body,
          { color: theme.colors.muted, fontFamily: fonts.body, textAlign: 'center' },
        ]}
      >
        {t('watching.empty')}
      </Text>
      <View style={{ width: '100%' }}>
        <NewspaperButton
          icon="compass-outline"
          label={t('tabs.discover')}
          onPress={onBrowseDiscover}
        />
      </View>
    </View>
  );
}
