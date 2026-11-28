/**
 * @file Grounded conversational Q&A screen ("Ask Khabri") scoped to user's watched portals.
 */
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
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  remainingText: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.muted,
    fontFamily: fonts.bodyBold,
  },
  list: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
  },
  emptyText: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
});

/**
 * Renders scope filters, chat transcript with clickable citations, remaining quota, and composer.
 *
 * @returns {JSX.Element} Ask Khabri screen.
 */
export default function AskKhabriScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles(createStyles);

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
      <View style={styles.headerRow}>
        <NewspaperButton
          size="sm"
          variant="card"
          icon="arrow-back"
          label={t('common.back')}
          onPress={() => router.back()}
        />
        <Text style={styles.remainingText}>{t('ask.remaining', { count: remaining })}</Text>
      </View>

      <Masthead title={t('ask.title')} subtitle={t('ask.subtitle')} />

      <AskScopeFilter scope={scope} watches={watches} onSelect={setScope} />

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <AskMessageBubble item={item} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('ask.empty')}</Text>
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
