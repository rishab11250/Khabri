import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SectionHeader } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { SegmentedOptionBar } from '@/features/settings/components/SegmentedOptionBar';
import { DIGEST_TIMES } from '@/features/settings/constants';
import { typeScale } from '@/theme/typography';

export function DigestSettingsSection({
  theme,
  fonts,
  t,
  digestTime,
  quietHours,
  onSelectDigestTime,
  onToggleQuietHours,
  onToggleBypassUrgent,
}) {
  return (
    <>
      <SectionHeader label={t('me.digestSection')} />
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
        <Text style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {t('me.digestTimeHelp')}
        </Text>
        <SegmentedOptionBar
          options={DIGEST_TIMES.map((d) => ({ key: d.time, label: d.label }))}
          value={digestTime}
          onSelect={onSelectDigestTime}
          theme={theme}
          fonts={fonts}
          tabular
        />

        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
            marginTop: theme.spacing.xs,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: theme.spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
              >
                {t('me.quietHoursTitle')}
              </Text>
              <Text
                style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
              >
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
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                paddingTop: theme.spacing.sm,
                minHeight: 40,
                borderTopWidth: theme.borders.hairline,
                borderTopColor: theme.colors.ruleSubtle,
              }}
            >
              <Ionicons
                name={quietHours.bypassUrgent ? 'checkbox' : 'square-outline'}
                size={20}
                color={quietHours.bypassUrgent ? theme.colors.accent : theme.colors.muted}
              />
              <Text
                style={[
                  typeScale.caption,
                  { color: theme.colors.ink, fontFamily: fonts.body, flex: 1 },
                ]}
              >
                {t('me.quietHoursBypass')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </>
  );
}
