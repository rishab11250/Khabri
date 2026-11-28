/**
 * @file Inline Circle creation form paired with navigation to the invite-code join screen.
 */
import { View } from 'react-native';

import { FormField } from '@/components/FormField';
import { NewspaperButton } from '@/components/NewspaperButton';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  btnRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  flexOne: {
    flex: 1,
  },
});

/**
 * Renders the new Circle name input along with Create and Join actions.
 *
 * @param {object} props - Component props.
 * @param {Function} props.t - Translation helper.
 * @param {string} props.name - Controlled Circle name draft.
 * @param {Function} props.onChangeName - Draft update callback.
 * @param {string | null} [props.error] - API or validation error label.
 * @param {boolean} props.isCreating - True while Circle creation mutation runs.
 * @param {Function} props.onCreate - Submits new Circle creation.
 * @param {Function} props.onOpenJoin - Navigates to the invite-code join screen.
 * @returns {JSX.Element} Circle creation card.
 */
export function CreateCircleCard({
  t,
  name,
  onChangeName,
  error,
  isCreating,
  onCreate,
  onOpenJoin,
}) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.card}>
      <FormField
        label={t('circles.createLabel')}
        placeholder={t('circles.createPlaceholder')}
        autoCapitalize="words"
        value={name}
        onChangeText={onChangeName}
        error={error}
      />

      <View style={styles.btnRow}>
        <View style={styles.flexOne}>
          <NewspaperButton
            disabled={isCreating || name.trim().length < 2}
            icon="add"
            label={t('circles.createBtn')}
            onPress={onCreate}
          />
        </View>
        <View style={styles.flexOne}>
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
