import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Kabootar } from '@/components/Kabootar';
import { SectionHeader } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export function TodayEmptyState({
  isLoading,
  isError,
  errorMessage,
  watches,
  syncingWatches,
  onRetry,
  onSyncMonitors,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.md,
          padding: theme.spacing.xl,
          alignItems: 'center',
        }}
      >
        <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.accent,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.md,
          padding: theme.spacing.xl,
          gap: theme.spacing.md,
        }}
      >
        <Text style={[typeScale.body, { color: theme.colors.accent, fontFamily: fonts.body }]}>
          {errorMessage || t('common.errorGeneric')}
        </Text>
        <NewspaperButton label={t('common.retry')} onPress={onRetry} />
      </View>
    );
  }

  if (watches.length > 0) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: theme.colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Kabootar size={36} flap />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typeScale.section,
                { color: theme.colors.ink, fontFamily: fonts.headlineSemi },
              ]}
            >
              {t('today.emptyTitle')}
            </Text>
            <Text
              style={[
                typeScale.caption,
                { color: theme.colors.muted, fontFamily: fonts.body, marginTop: 2 },
              ]}
            >
              {t('watching.title')} · {watches.length}
            </Text>
          </View>
        </View>

        <SectionHeader
          label={t('tabs.watching')}
          rightLabel={t('watching.refresh')}
          onPressRight={onSyncMonitors}
        />

        <View style={{ gap: theme.spacing.xs }}>
          {watches.slice(0, 4).map((w) => (
            <Pressable
              key={w.id}
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/watching')}
              style={{
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radii.sm,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.spacing.sm,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: w.muted ? theme.colors.muted : theme.colors.neem,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    typeScale.body,
                    { color: theme.colors.ink, fontFamily: fonts.bodyMedium, flex: 1 },
                  ]}
                >
                  {w.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <NewspaperButton
              size="sm"
              variant="primary"
              icon="refresh-outline"
              disabled={syncingWatches}
              label={syncingWatches ? t('common.loading') : t('watching.refresh')}
              onPress={onSyncMonitors}
            />
          </View>
          <View style={{ flex: 1 }}>
            <NewspaperButton
              size="sm"
              variant="secondary"
              icon="compass-outline"
              label={t('tabs.discover')}
              onPress={() => router.push('/(tabs)/discover')}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.lg,
        padding: theme.spacing.xl,
        alignItems: 'center',
        gap: theme.spacing.md,
      }}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: theme.colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Kabootar size={56} flap />
      </View>
      <Text
        style={[
          typeScale.title,
          { color: theme.colors.ink, fontFamily: fonts.headlineSemi, textAlign: 'center' },
        ]}
      >
        {t('today.emptyTitle')}
      </Text>
      <Text
        style={[
          typeScale.body,
          { color: theme.colors.muted, fontFamily: fonts.body, textAlign: 'center' },
        ]}
      >
        {t('today.emptySubtitle')}
      </Text>
      <View style={{ width: '100%', marginTop: theme.spacing.xs }}>
        <NewspaperButton
          icon="compass-outline"
          label={t('tabs.discover')}
          onPress={() => router.push('/(tabs)/discover')}
        />
      </View>
    </View>
  );
}
