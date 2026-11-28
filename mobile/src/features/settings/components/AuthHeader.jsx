/**
 * @file Branded masthead and language switcher rendered above sign-in and sign-up cards.
 */
import { Text, View } from 'react-native';

import { Kabootar } from '@/components/Kabootar';
import { SegmentedOptionBar } from '@/features/settings/components/SegmentedOptionBar';
import { SETTINGS_LANGUAGES } from '@/features/settings/constants';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    ...typeScale.masthead,
    color: theme.colors.ink,
    fontFamily: fonts.headline,
  },
  subtitle: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  mascotWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Renders the Khabri title, mascot emblem, and quick UI language selector bar.
 *
 * @param {object} props - Component props.
 * @param {string} props.language - Active UI language code (`en`, `hi`, `gu`).
 * @param {Function} props.onSelectLanguage - Language change callback.
 * @param {Function} props.t - Translation helper.
 * @returns {JSX.Element} Auth header fragment.
 */
export function AuthHeader({ language, onSelectLanguage, t }) {
  const styles = useStyles(createStyles);

  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>
        <View style={styles.mascotWrap}>
          <Kabootar size={40} flap />
        </View>
      </View>

      <SegmentedOptionBar
        options={SETTINGS_LANGUAGES.map((l) => ({ key: l.code, label: l.label }))}
        value={language}
        onSelect={onSelectLanguage}
        minHeight={40}
        marginBottom={16}
      />
    </>
  );
}
