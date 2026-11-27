import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export function AskMessageBubble({ item }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);
  const isUser = item.role === 'user';

  return (
    <View
      style={{
        backgroundColor: isUser ? theme.colors.accent : theme.colors.card,
        borderColor: isUser ? theme.colors.accent : theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.xs,
      }}
    >
      <Text
        style={[
          typeScale.body,
          { color: isUser ? theme.colors.onAccent : theme.colors.ink, fontFamily: fonts.body },
        ]}
      >
        {item.text}
      </Text>
      {!isUser ? (
        <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('card.aiNote')}
        </Text>
      ) : null}
      {item.citations?.map((c) => (
        <Pressable
          key={c.changeId}
          accessibilityRole="link"
          onPress={() => router.push(`/change/${c.changeId}`)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
            minHeight: 36,
          }}
        >
          <Ionicons name="document-text-outline" size={14} color={theme.colors.neel} />
          <Text
            style={[
              typeScale.caption,
              { color: theme.colors.neel, fontFamily: fonts.bodyBold, flex: 1 },
            ]}
          >
            {c.sourceName} · {c.after.slice(0, 60)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
