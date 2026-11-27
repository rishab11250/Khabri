import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { AskComposer } from '@/features/changes/components/AskComposer';
import { AskMessageBubble } from '@/features/changes/components/AskMessageBubble';
import { AskScopeFilter } from '@/features/changes/components/AskScopeFilter';
import { useAskKhabri } from '@/features/changes/hooks/useAskKhabri';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function AskKhabriScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  const {
    scope,
    setScope,
    question,
    setQuestion,
    messages,
    remaining,
    error,
    watches,
    isSending,
    sendQuestion,
  } = useAskKhabri();

  return (
    <ScreenShell>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <NewspaperButton
          size="sm"
          variant="card"
          icon="arrow-back"
          label={t('common.back')}
          onPress={() => router.back()}
        />
        <Text
          style={[
            typeScale.caption,
            typeScale.tabular,
            { color: theme.colors.muted, fontFamily: fonts.bodyBold },
          ]}
        >
          {t('ask.remaining', { count: remaining })}
        </Text>
      </View>

      <Masthead title={t('ask.title')} subtitle={t('ask.subtitle')} />

      <AskScopeFilter scope={scope} watches={watches} onSelect={setScope} />

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <AskMessageBubble item={item} />}
        ListEmptyComponent={
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.ruleSubtle,
              borderWidth: theme.borders.hairline,
              borderRadius: theme.radii.md,
              padding: theme.spacing.lg,
            }}
          >
            <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
              {t('ask.empty')}
            </Text>
          </View>
        }
      />

      <AskComposer
        question={question}
        onChangeQuestion={setQuestion}
        isSending={isSending}
        error={error}
        onSend={sendQuestion}
      />
    </ScreenShell>
  );
}
