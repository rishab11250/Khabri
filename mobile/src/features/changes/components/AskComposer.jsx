import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export function AskComposer({ question, onChangeQuestion, isSending, error, onSend }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  return (
    <View>
      {error ? (
        <Text
          style={[
            typeScale.caption,
            {
              color: theme.colors.accent,
              fontFamily: fonts.bodyMedium,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.xs,
          paddingVertical: theme.spacing.md,
          alignItems: 'center',
        }}
      >
        <TextInput
          value={question}
          onChangeText={onChangeQuestion}
          placeholder={t('ask.placeholder')}
          placeholderTextColor={theme.colors.muted}
          style={[
            typeScale.body,
            {
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
          ]}
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
