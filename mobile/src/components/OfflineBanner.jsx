/**
 * @file Persistent banner indicating cached offline viewing when network connectivity drops.
 */
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useOnline } from '@/hooks/useOnline';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  banner: {
    backgroundColor: theme.colors.haldi,
    borderColor: theme.colors.rule,
    borderBottomWidth: theme.borders.hairline,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: theme.colors.accent,
  },
  label: {
    ...typeScale.caption,
    color: theme.colors.haldiInk,
    fontFamily: fonts.bodyBold,
  },
});

/**
 * Renders an amber offline indicator banner when the device lacks network connectivity.
 *
 * @returns {JSX.Element | null} Banner element when offline, or `null` when online.
 */
export function OfflineBanner() {
  const isOnline = useOnline();
  const { t } = useTranslation();
  const styles = useStyles(createStyles);

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.dot} />
      <Text style={styles.label}>{t('common.offlineBanner')}</Text>
    </View>
  );
}
