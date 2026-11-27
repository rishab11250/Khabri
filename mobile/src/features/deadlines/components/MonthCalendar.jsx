import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { typeScale } from '@/theme/typography';

export function MonthCalendar({ deadlines, theme, fonts }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date();
  const viewDate = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = viewDate.getDay();

  const dueDays = new Set(
    deadlines
      .filter((d) => d.status === 'active')
      .map((d) => new Date(d.dueAt))
      .filter((dt) => dt.getFullYear() === year && dt.getMonth() === month)
      .map((dt) => dt.getDate()),
  );

  const cells = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setMonthOffset((m) => m - 1)}
          style={{
            minWidth: 44,
            minHeight: 44,
            borderRadius: theme.radii.xs,
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={18} color={theme.colors.ink} />
        </Pressable>
        <Text
          style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.headlineSemi }]}
        >
          {monthLabel}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMonthOffset((m) => m + 1)}
          style={{
            minWidth: 44,
            minHeight: 44,
            borderRadius: theme.radii.xs,
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.colors.ink} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, idx) => {
          const hasDue = day !== null && dueDays.has(day);
          return (
            <View
              key={idx}
              style={{
                width: '14.28%',
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: theme.radii.xs,
                backgroundColor: hasDue ? theme.colors.accent : 'transparent',
              }}
            >
              <Text
                style={[
                  typeScale.caption,
                  typeScale.tabular,
                  {
                    color: hasDue ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: hasDue ? fonts.bodyBold : fonts.body,
                  },
                ]}
              >
                {day ?? ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
