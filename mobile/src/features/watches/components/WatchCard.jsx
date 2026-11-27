import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';

export function WatchCard({
  item,
  theme,
  fonts,
  t,
  onToggleMute,
  onTogglePriority,
  onRefresh,
  onDelete,
}) {
  const src = item.source;
  const checkedStr = src?.lastFetchedAt
    ? t('watching.lastChecked', {
        time: new Date(src.lastFetchedAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    : t('watching.neverChecked');

  const statusBg = item.muted
    ? theme.colors.surfaceAlt
    : item.priority === 'instant'
      ? theme.colors.accentSoft
      : theme.colors.neemSoft;
  const statusFg = item.muted
    ? theme.colors.muted
    : item.priority === 'instant'
      ? theme.colors.accent
      : theme.colors.neem;

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 4, backgroundColor: statusFg }} />
        <View style={{ flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: theme.spacing.sm,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={[
                  typeScale.title,
                  { color: theme.colors.ink, fontFamily: fonts.headlineSemi },
                ]}
              >
                {item.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="time-outline" size={13} color={theme.colors.muted} />
                <Text
                  style={[
                    typeScale.caption,
                    typeScale.tabular,
                    { color: theme.colors.muted, fontFamily: fonts.body },
                  ]}
                >
                  {src?.category || 'notice'} · {checkedStr}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: statusBg,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.radii.xs,
              }}
            >
              <Text
                style={[
                  typeScale.caption,
                  {
                    color: statusFg,
                    fontFamily: fonts.bodyBold,
                  },
                ]}
              >
                {item.muted
                  ? t('watching.muted')
                  : item.priority === 'instant'
                    ? t('watching.instant')
                    : t('watching.normal')}
              </Text>
            </View>
          </View>

          {src?.unsupported ? (
            <Text
              style={[typeScale.caption, { color: theme.colors.accent, fontFamily: fonts.body }]}
            >
              {t('watching.unsupported')}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: theme.spacing.xs,
            }}
          >
            <NewspaperButton
              size="sm"
              variant={item.muted ? 'primary' : 'secondary'}
              icon={item.muted ? 'notifications-off-outline' : 'notifications-outline'}
              label={item.muted ? t('watching.muted') : t('watching.mute')}
              onPress={() => onToggleMute(item)}
            />
            <NewspaperButton
              size="sm"
              variant={item.priority === 'instant' ? 'ink' : 'secondary'}
              icon="flash-outline"
              label={item.priority === 'instant' ? t('watching.instant') : t('watching.normal')}
              onPress={() => onTogglePriority(item)}
            />
            <NewspaperButton
              size="sm"
              variant="secondary"
              icon="refresh-outline"
              label={t('watching.refresh')}
              onPress={() => onRefresh(item.id)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('watching.remove')}
              onPress={() => onDelete(item.id)}
              style={{
                minWidth: 40,
                minHeight: 40,
                borderRadius: theme.radii.sm,
                backgroundColor: theme.colors.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: theme.spacing.sm,
              }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.accent} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
