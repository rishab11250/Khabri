/**
 * @file Daily digest schedule picker and quiet-hours / urgent-bypass controls.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { SectionHeader } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { SegmentedOptionBar } from '@/features/settings/components/SegmentedOptionBar';
import { DIGEST_TIMES } from '@/features/settings/constants';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  root: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  helpText: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  quietRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  quietTextCol: {
    flex: 1,
  },
  quietTitle: {
    ...typeScale.body,
    color: theme.colors.ink,
    fontFamily: fonts.bodyBold,
  },
  quietHours: {
    ...typeScale.caption,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
  bypassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    minHeight: 40,
    borderTopWidth: theme.borders.hairline,
    borderTopColor: theme.colors.ruleSubtle,
  },
  bypassText: {
    ...typeScale.caption,
    color: theme.colors.ink,
    fontFamily: fonts.body,
    flex: 1,
  },
});

/**
 * Renders digest delivery time selection and quiet-hours toggle settings.
 *
 * @param {object} props - Component props.
 * @param {Function} props.t - Translation helper.
 * @param {string} props.digestTime - Preferred IST digest slot (`08:00`, `09:00`, `20:00`).
 * @param {object} props.quietHours - Quiet-hours config (`enabled`, `start`, `end`, `bypassUrgent`).
 * @param {Function} props.onSelectDigestTime - Updates preferred digest time.
 * @param {Function} props.onToggleQuietHours - Toggles quiet-hours suppression on or off.
 * @param {Function} props.onToggleBypassUrgent - Toggles urgent-deadline quiet-hours bypass.
 * @returns {JSX.Element} Digest settings section.
 */
export function DigestSettingsSection({
  t,
  digestTime,
  quietHours,
  onSelectDigestTime,
  onToggleQuietHours,
  onToggleBypassUrgent,
}) {
  const theme = useTheme();
  const styles = useStyles(createStyles);

  return (
    <>
      <SectionHeader label={t('me.digestSection')} />
      <View style={styles.root}>
        <Text style={styles.helpText}>{t('me.digestTimeHelp')}</Text>
        <SegmentedOptionBar
          options={DIGEST_TIMES.map((d) => ({ key: d.time, label: d.label }))}
          value={digestTime}
          onSelect={onSelectDigestTime}
          tabular
        />

        <View style={styles.card}>
          <View style={styles.quietRow}>
            <View style={styles.quietTextCol}>
              <Text style={styles.quietTitle}>{t('me.quietHoursTitle')}</Text>
              <Text style={styles.quietHours}>
                {t('me.quietHoursHours', { start: quietHours.start, end: quietHours.end })}
              </Text>
            </View>
            <NewspaperButton
              size="sm"
              variant={quietHours.enabled ? 'primary' : 'secondary'}
              label={quietHours.enabled ? t('common.enabled') : t('common.disabled')}
              onPress={onToggleQuietHours}
            />
          </View>

          {quietHours.enabled ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: quietHours.bypassUrgent }}
              onPress={onToggleBypassUrgent}
              style={styles.bypassRow}
            >
              <Ionicons
                name={quietHours.bypassUrgent ? 'checkbox' : 'square-outline'}
                size={20}
                color={quietHours.bypassUrgent ? theme.colors.accent : theme.colors.muted}
              />
              <Text style={styles.bypassText}>{t('me.quietHoursBypass')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </>
  );
}
