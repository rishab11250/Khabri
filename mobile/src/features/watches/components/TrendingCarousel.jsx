import { Pressable, ScrollView, Text, View } from 'react-native';
import { SectionHeader } from '@/components/Masthead';
import { getCategoryColor } from '@/features/watches/categoryColor';
import { typeScale } from '@/theme/typography';

export function TrendingCarousel({ sources, watchBySourceId, theme, fonts, t, onToggleFollow }) {
  if (!sources || sources.length === 0) return null;

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <SectionHeader label={t('discover.trendingTitle')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm }}
      >
        {sources.slice(0, 6).map((src, idx) => {
          const watched = watchBySourceId.get(src.id);
          const catColor = getCategoryColor(src.category, theme);
          return (
            <Pressable
              key={src.id}
              accessibilityRole="button"
              onPress={() => onToggleFollow(src, watched)}
              style={({ pressed }) => ({
                backgroundColor: theme.colors.card,
                borderColor: watched ? theme.colors.neem : theme.colors.ruleSubtle,
                borderWidth: theme.borders.hairline,
                borderRadius: theme.radii.md,
                overflow: 'hidden',
                width: 200,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <View
                style={{
                  height: 3,
                  backgroundColor: watched ? theme.colors.neem : catColor,
                }}
              />
              <View style={{ padding: theme.spacing.md, gap: 6 }}>
                <Text
                  style={[
                    typeScale.caption,
                    typeScale.tabular,
                    {
                      color: theme.colors.muted,
                      fontFamily: fonts.bodyBold,
                    },
                  ]}
                >
                  #{idx + 1} · {src.category || 'notice'}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    typeScale.section,
                    {
                      color: theme.colors.ink,
                      fontFamily: fonts.headlineSemi,
                    },
                  ]}
                >
                  {src.name}
                </Text>
                <Text
                  style={[
                    typeScale.caption,
                    {
                      color: watched ? theme.colors.neem : theme.colors.accent,
                      fontFamily: fonts.bodyBold,
                    },
                  ]}
                >
                  {watched ? `✓ ${t('discover.following')}` : `+ ${t('discover.follow')}`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
