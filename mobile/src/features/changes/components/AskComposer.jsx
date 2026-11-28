/**
 * @file Bottom input bar for submitting natural-language questions to Ask Khabri.
 */
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  input: {
    ...typeScale.body,
    flex: 1,
    color: theme.colors.ink,
    fontFamily: fonts.body,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 50,
  },
});

/**
 * Renders the question text input, inline error label, and send button.
 *
 * @param {object} props - Component props.
 * @param {string} props.question - Controlled question draft text.
 * @param {Function} props.onChangeQuestion - Text update callback.
 * @param {boolean} props.isSending - True while an Ask Khabri request is in flight.
 * @param {string | null} [props.error] - Optional API error banner message.
 * @param {Function} props.onSend - Submit callback.
 * @returns {JSX.Element} Question composer container.
 */
export function AskComposer({ question, onChangeQuestion, isSending, error, onSend }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.row}>
        <TextInput
          value={question}
          onChangeText={onChangeQuestion}
          placeholder={t('ask.placeholder')}
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />
        <NewspaperButton
          disabled={isSending || question.trim().length < 2}
          icon="send"
          label={isSending ? t('common.loading') : t('ask.send')}
          onPress={onSend}
        />
      </View>
    </View>
  );
}
