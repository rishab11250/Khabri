import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NewspaperButton } from '../src/components/NewspaperButton';
import { ScreenShell } from '../src/components/ScreenShell';
import { api } from '../src/lib/api';
import { getFontFamilies, typeScale } from '../src/theme/typography';
import { useTheme } from '../src/theme/useTheme';

export default function AskKhabriScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);

  const [scope, setScope] = useState('all');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [remaining, setRemaining] = useState(10);
  const [error, setError] = useState('');

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const askMutation = useMutation({
    mutationFn: (q) => api.askKhabri({ scope, question: q }),
    onSuccess: (data, q) => {
      setError('');
      setRemaining(data.remainingToday ?? 0);
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text: q },
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.answer,
          citations: data.citations || [],
        },
      ]);
      setQuestion('');
    },
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
  });

  const watches = watchesQuery.data?.watches ?? [];

  return (
    <ScreenShell>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.sm,
        }}
      >
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
        <Text
          style={[
            typeScale.caption,
            typeScale.tabular,
            { color: theme.colors.muted, fontFamily: fonts.bodyMedium },
          ]}
        >
          {t('ask.remaining', { count: remaining })}
        </Text>
      </View>

      <Text style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
        {t('ask.title')}
      </Text>
      <Text
        style={[
          typeScale.caption,
          { color: theme.colors.muted, fontFamily: fonts.body, marginBottom: theme.spacing.sm },
        ]}
      >
        {t('ask.subtitle')}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44, marginBottom: theme.spacing.sm }}
        contentContainerStyle={{ gap: theme.spacing.xs, alignItems: 'center' }}
      >
        {[
          { id: 'all', label: t('ask.scopeAll') },
          ...watches.map((w) => ({ id: w.sourceId, label: w.title })),
        ].map((item) => {
          const active = scope === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => setScope(item.id)}
              style={{
                backgroundColor: active ? theme.colors.accent : theme.colors.card,
                borderColor: active ? theme.colors.accent : theme.colors.rule,
                borderWidth: theme.borders.hairline,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
              }}
            >
              <Text
                style={[
                  typeScale.caption,
                  {
                    color: active ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: fonts.bodyMedium,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: item.role === 'user' ? theme.colors.background : theme.colors.card,
              borderColor: theme.colors.rule,
              borderWidth: theme.borders.hairline,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.sm,
              gap: theme.spacing.xs,
            }}
          >
            <Text style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.body }]}>
              {item.text}
            </Text>
            {item.role === 'assistant' ? (
              <Text
                style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
              >
                {t('card.aiNote')}
              </Text>
            ) : null}
            {item.citations?.map((c) => (
              <Pressable
                key={c.changeId}
                accessibilityRole="link"
                onPress={() => router.push(`/change/${c.changeId}`)}
              >
                <Text
                  style={[
                    typeScale.caption,
                    { color: theme.colors.neel, fontFamily: fonts.bodyBold },
                  ]}
                >
                  [{c.sourceName}] {c.after.slice(0, 60)} {'->'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
            {t('ask.empty')}
          </Text>
        }
      />

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
          onChangeText={setQuestion}
          placeholder={t('ask.placeholder')}
          placeholderTextColor={theme.colors.muted}
          style={[
            typeScale.body,
            {
              flex: 1,
              color: theme.colors.ink,
              fontFamily: fonts.body,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.rule,
              borderWidth: theme.borders.hairline,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
            },
          ]}
        />
        <NewspaperButton
          disabled={askMutation.isPending || question.trim().length < 2}
          label={askMutation.isPending ? t('common.loading') : t('ask.send')}
          onPress={() => askMutation.mutate(question.trim())}
        />
      </View>
    </ScreenShell>
  );
}
