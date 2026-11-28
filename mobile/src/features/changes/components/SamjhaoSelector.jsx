/**
 * @file Language switcher ("Samjhao") for translating change summaries into English, Hindi, or Gujarati.
 */
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const SAMJHAO_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

const createStyles = (theme, fonts) => ({
  wrap: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.bodyBold,
    marginBottom: theme.spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.sm,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: 40,
    borderRadius: theme.radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: theme.colors.accent,
  },
  optionText: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.bodyMedium,
  },
  optionTextActive: {
    color: theme.colors.onAccent,
    fontFamily: fonts.bodyBold,
  },
});

/**
 * Renders a segmented selector triggering plain-language change translation.
 *
 * @param {object} props - Component props.
 * @param {string} props.explainLang - Currently active explanation language code.
 * @param {boolean} props.disabled - Disables switching while translation request runs.
 * @param {Function} props.onSelect - Callback invoked with selected language code (`en`, `hi`, `gu`).
 * @returns {JSX.Element} Language selector block.
 */
export function SamjhaoSelector({ explainLang, disabled, onSelect }) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('card.explainIn')}</Text>
      <View style={styles.bar}>
        {SAMJHAO_LANGS.map((l) => {
          const active = explainLang === l.code;
          return (
            <Pressable
              key={l.code}
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => onSelect(l.code)}
              style={[styles.option, active ? styles.optionActive : null]}
            >
              <Text style={[styles.optionText, active ? styles.optionTextActive : null]}>
                {l.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
