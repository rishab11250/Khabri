/**
 * @file Chat bubble component displaying user questions, grounded answers, and cited change links.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  bubble: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  bubbleUser: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  messageText: {
    ...typeScale.body,
    color: theme.colors.ink,
    fontFamily: fonts.body,
  },
  messageTextUser: {
    color: theme.colors.onAccent,
  },
  aiNote: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    minHeight: 36,
  },
  citationText: {
    ...typeScale.caption,
    color: theme.colors.neel,
    fontFamily: fonts.bodyBold,
    flex: 1,
  },
});

/**
 * Renders an Ask Khabri conversation message and tappable source citations.
 *
 * @param {object} props - Component props.
 * @param {object} props.item - Message entry containing `role`, `text`, and optional `citations`.
 * @returns {JSX.Element} Chat bubble view.
 */
export function AskMessageBubble({ item }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const isUser = item.role === 'user';

  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : null]}>
      <Text style={[styles.messageText, isUser ? styles.messageTextUser : null]}>{item.text}</Text>
      {!isUser ? <Text style={styles.aiNote}>{t('card.aiNote')}</Text> : null}
      {item.citations?.map((c) => (
        <Pressable
          key={c.changeId}
          accessibilityRole="link"
          onPress={() => router.push(`/change/${c.changeId}`)}
          style={styles.citationRow}
        >
          <Ionicons name="document-text-outline" size={14} color={theme.colors.neel} />
          <Text style={styles.citationText}>
            {c.sourceName} · {c.after.slice(0, 60)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
