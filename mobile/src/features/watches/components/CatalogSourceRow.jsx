/**
 * @file Discover catalog row displaying category indicator, state badge, demo pill, and follow toggle.
 */
import { Text, View } from 'react-native';

import { NewspaperButton } from '@/components/NewspaperButton';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  row: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rowWatched: {
    borderColor: theme.colors.neem,
  },
  leftCol: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  dotNeel: {
    backgroundColor: theme.colors.neel,
  },
  dotHaldi: {
    backgroundColor: theme.colors.haldi,
  },
  dotNeem: {
    backgroundColor: theme.colors.neem,
  },
  catText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyBold,
  },
  catNeel: {
    color: theme.colors.neel,
  },
  catHaldi: {
    color: theme.colors.haldi,
  },
  catNeem: {
    color: theme.colors.neem,
  },
  stateText: {
    ...typeScale.caption,
    color: theme.colors.muted,
  },
  demoBadge: {
    backgroundColor: theme.colors.haldiSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radii.xs,
  },
  demoText: {
    ...typeScale.caption,
    color: theme.colors.haldi,
    fontFamily: fonts.bodyBold,
  },
  nameText: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
});

function getCategoryStyles(cat, styles) {
  if (cat === 'recruitment') return { dot: styles.dotNeel, text: styles.catNeel };
  if (cat === 'scholarship') return { dot: styles.dotHaldi, text: styles.catHaldi };
  if (cat === 'scheme') return { dot: styles.dotNeem, text: styles.catNeem };
  return { dot: null, text: null };
}

/**
 * Renders a verified catalog source with a follow/following action button.
 *
 * @param {object} props - Component props.
 * @param {object} props.item - Catalog source metadata (`name`, `category`, `state`, `isDemo`).
 * @param {object | undefined} props.existingWatch - Active watch if the user already follows this source.
 * @param {Function} props.t - Translation helper.
 * @param {boolean} props.isToggling - Disables button while watch mutation runs.
 * @param {Function} props.onToggle - Follow/unfollow toggle handler.
 * @returns {JSX.Element} Catalog source row card.
 */
export function CatalogSourceRow({ item, existingWatch, t, isToggling, onToggle }) {
  const styles = useStyles(createStyles);
  const catStyles = getCategoryStyles(item.category, styles);

  return (
    <View style={[styles.row, existingWatch ? styles.rowWatched : null]}>
      <View style={styles.leftCol}>
        <View style={styles.metaRow}>
          <View style={[styles.dot, catStyles.dot]} />
          <Text style={[styles.catText, catStyles.text]}>{item.category || 'notice'}</Text>
          <Text style={styles.stateText}>· {item.state}</Text>
          {item.isDemo ? (
            <View style={styles.demoBadge}>
              <Text style={styles.demoText}>{t('discover.demoBadge')}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.nameText}>{item.name}</Text>
      </View>
      <NewspaperButton
        size="sm"
        variant={existingWatch ? 'secondary' : 'primary'}
        icon={existingWatch ? 'checkmark' : 'add'}
        disabled={isToggling}
        label={existingWatch ? t('discover.following') : t('discover.follow')}
        onPress={() => onToggle(item, existingWatch)}
      />
    </View>
  );
}
