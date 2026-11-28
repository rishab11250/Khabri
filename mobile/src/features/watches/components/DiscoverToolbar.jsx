/**
 * @file Discover header toolbar combining Link/Photo intake buttons, clipboard suggestion, search input, and category filter pills.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { INTEREST_CATEGORIES } from '@/constants/india';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  ctaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  flexOne: {
    flex: 1,
  },
  clipboardCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.accent,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  clipboardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clipboardLabel: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyBold,
  },
  clipboardUrl: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.body,
  },
  clipboardBtns: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  searchInput: {
    ...typeScale.body,
    flex: 1,
    color: theme.colors.ink,
    fontFamily: fonts.body,
    paddingVertical: theme.spacing.md,
  },
  clearBtn: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.xs,
  },
  pillsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: theme.spacing.md,
  },
  pillsContent: {
    gap: theme.spacing.xs,
    alignItems: 'center',
    paddingVertical: 2,
  },
  pill: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  pillText: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
  pillTextActive: {
    color: theme.colors.onAccent,
  },
});

/**
 * Renders intake entry actions, optional clipboard URL prompt, search bar, and category filter strip.
 *
 * @param {object} props - Component props.
 * @param {Function} props.t - Translation helper.
 * @param {string | null} props.clipboardUrl - Detected HTTP(S) URL read from device clipboard.
 * @param {Function} props.onClearClipboard - Dismisses the clipboard prompt.
 * @param {Function} props.onWatchClipboard - Navigates directly to link intake with the clipboard URL.
 * @param {Function} props.onPressPasteLink - Opens manual paste-link intake flow.
 * @param {Function} props.onPressScanPhoto - Opens circular photo scanner flow.
 * @param {string} props.search - Controlled catalog search text.
 * @param {Function} props.onChangeSearch - Updates catalog search query.
 * @param {string | null} props.category - Selected category slug or `null` for all.
 * @param {Function} props.onChangeCategory - Selects active category filter.
 * @param {string | null} [props.actionError] - Inline follow/unfollow error message.
 * @returns {JSX.Element} Discover screen filter toolbar.
 */
export function DiscoverToolbar({
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
  const theme = useTheme();
  const styles = useStyles(createStyles);

  return (
    <>
      <View style={styles.ctaRow}>
        <View style={styles.flexOne}>
          <NewspaperButton
            variant="card"
            icon="link-outline"
            label={t('add.pasteLink')}
            onPress={onPressPasteLink}
          />
        </View>
        <View style={styles.flexOne}>
          <NewspaperButton
            variant="primary"
            icon="camera-outline"
            label={t('add.scanPhoto')}
            onPress={onPressScanPhoto}
          />
        </View>
      </View>

      {clipboardUrl ? (
        <View style={styles.clipboardCard}>
          <View style={styles.clipboardHead}>
            <Ionicons name="clipboard-outline" size={14} color={theme.colors.accent} />
            <Text style={styles.clipboardLabel}>{t('add.clipboardTitle')}</Text>
          </View>
          <Text numberOfLines={1} style={styles.clipboardUrl}>
            {clipboardUrl}
          </Text>
          <View style={styles.clipboardBtns}>
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

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={theme.colors.muted} />
        <TextInput
          value={search}
          onChangeText={onChangeSearch}
          placeholder={t('discover.searchPlaceholder')}
          placeholderTextColor={theme.colors.muted}
          accessibilityLabel={t('discover.searchPlaceholder')}
          style={styles.searchInput}
        />
        {search ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChangeSearch('')}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillsScroll}
        contentContainerStyle={styles.pillsContent}
      >
        {['', ...INTEREST_CATEGORIES].map((cat) => {
          const active = category === cat;
          return (
            <Pressable
              key={cat || 'all'}
              accessibilityRole="button"
              onPress={() => onChangeCategory(cat)}
              style={[styles.pill, active ? styles.pillActive : null]}
            >
              <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
                {cat ? t(`onboarding.categories.${cat}`) : t('discover.allCategories')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}
