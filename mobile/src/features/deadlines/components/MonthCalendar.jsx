/**
 * @file Compact 7-column month calendar highlighting active deadline dates.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  navBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    ...typeScale.section,
    color: theme.colors.ink,
    fontFamily: fonts.headlineSemi,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    // 7 weekday columns per row (100 / 7 = ~14.28%).
    width: '14.28%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.radii.xs,
  },
  cellDue: {
    backgroundColor: theme.colors.accent,
  },
  cellText: {
    ...typeScale.caption,
    ...typeScale.tabular,
    color: theme.colors.ink,
    fontFamily: fonts.body,
  },
  cellTextDue: {
    color: theme.colors.onAccent,
    fontFamily: fonts.bodyBold,
  },
});

/**
 * Renders a navigable month grid marking days that have active deadlines.
 *
 * @param {object} props - Component props.
 * @param {Array<object>} props.deadlines - Deadline objects inspected for `status === 'active'`.
 * @returns {JSX.Element} Interactive month calendar card.
 */
export function MonthCalendar({ deadlines }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const theme = useTheme();
  const styles = useStyles(createStyles);

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
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMonthOffset((m) => m - 1)}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-back" size={18} color={theme.colors.ink} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMonthOffset((m) => m + 1)}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.colors.ink} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {cells.map((day, idx) => {
          const hasDue = day !== null && dueDays.has(day);
          return (
            <View key={idx} style={[styles.cell, hasDue ? styles.cellDue : null]}>
              <Text style={[styles.cellText, hasDue ? styles.cellTextDue : null]}>{day ?? ''}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
