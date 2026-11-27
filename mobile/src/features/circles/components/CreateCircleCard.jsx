import { View } from 'react-native';
import { FormField } from '@/components/FormField';
import { NewspaperButton } from '@/components/NewspaperButton';

export function CreateCircleCard({
  theme,
  t,
  name,
  onChangeName,
  error,
  isCreating,
  onCreate,
  onOpenJoin,
}) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
      }}
    >
      <FormField
        label={t('circles.createLabel')}
        placeholder={t('circles.createPlaceholder')}
        autoCapitalize="words"
        value={name}
        onChangeText={onChangeName}
        error={error}
      />

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            disabled={isCreating || name.trim().length < 2}
            icon="add"
            label={t('circles.createBtn')}
            onPress={onCreate}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant="secondary"
            icon="enter-outline"
            label={t('circles.joinBtn')}
            onPress={onOpenJoin}
          />
        </View>
      </View>
    </View>
  );
}
