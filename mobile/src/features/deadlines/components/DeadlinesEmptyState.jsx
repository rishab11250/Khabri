import { Text, View } from 'react-native';
import { Kabootar } from '@/components/Kabootar';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';

export function DeadlinesEmptyState({ theme, fonts, t, isLoading, showAdd, onShowAdd }) {
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
        {isLoading ? t('common.loading') : t('deadlines.empty')}
      </Text>
      {!showAdd ? (
        <View style={{ width: '100%' }}>
          <NewspaperButton icon="add" label={t('deadlines.addTitle')} onPress={onShowAdd} />
        </View>
      ) : null}
    </View>
  );
}
