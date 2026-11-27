import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { INTEREST_CATEGORIES } from '@/constants/india';
import { typeScale } from '@/theme/typography';

export function DiscoverToolbar({
  theme,
  fonts,
  t,
  clipboardUrl,
  onClearClipboard,
  onWatchClipboard,
  onPressPasteLink,
  onPressScanPhoto,
  search,
  onChangeSearch,
  category,
  onChangeCategory,
  actionError,
}) {
  return (
    <>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant="card"
            icon="link-outline"
            label={t('add.pasteLink')}
            onPress={onPressPasteLink}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant="primary"
            icon="camera-outline"
            label={t('add.scanPhoto')}
            onPress={onPressScanPhoto}
          />
        </View>
      </View>

      {clipboardUrl ? (
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.accent,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            gap: theme.spacing.xs,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="clipboard-outline" size={14} color={theme.colors.accent} />
            <Text
              style={[
                typeScale.caption,
                { color: theme.colors.accent, fontFamily: fonts.bodyBold },
              ]}
            >
              {t('add.clipboardTitle')}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[typeScale.caption, { color: theme.colors.ink, fontFamily: fonts.body }]}
          >
            {clipboardUrl}
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: 4 }}>
            <NewspaperButton size="sm" label={t('add.watchLink')} onPress={onWatchClipboard} />
            <NewspaperButton
              size="sm"
              variant="secondary"
              label={t('common.skip')}
              onPress={onClearClipboard}
            />
          </View>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.sm,
          paddingHorizontal: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          gap: theme.spacing.sm,
        }}
      >
        <Ionicons name="search-outline" size={18} color={theme.colors.muted} />
        <TextInput
          value={search}
          onChangeText={onChangeSearch}
          placeholder={t('discover.searchPlaceholder')}
          placeholderTextColor={theme.colors.muted}
          accessibilityLabel={t('discover.searchPlaceholder')}
          style={[
            typeScale.body,
            {
              flex: 1,
              color: theme.colors.ink,
              fontFamily: fonts.body,
              paddingVertical: theme.spacing.md,
            },
          ]}
        />
        {search ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChangeSearch('')}
            style={{
              minWidth: 32,
              minHeight: 32,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {actionError ? (
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
          {actionError}
        </Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, marginBottom: theme.spacing.md }}
        contentContainerStyle={{ gap: theme.spacing.xs, alignItems: 'center', paddingVertical: 2 }}
      >
        {['', ...INTEREST_CATEGORIES].map((cat) => {
          const active = category === cat;
          return (
            <Pressable
              key={cat || 'all'}
              accessibilityRole="button"
              onPress={() => onChangeCategory(cat)}
              style={{
                backgroundColor: active ? theme.colors.accent : theme.colors.card,
                borderColor: active ? theme.colors.accent : theme.colors.ruleSubtle,
                borderWidth: theme.borders.hairline,
                borderRadius: theme.radii.pill,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 8,
                minHeight: 38,
                justifyContent: 'center',
              }}
            >
              <Text
                style={[
                  typeScale.caption,
                  {
                    color: active ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: fonts.bodyBold,
                  },
                ]}
              >
                {cat ? t(`onboarding.categories.${cat}`) : t('discover.allCategories')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}
