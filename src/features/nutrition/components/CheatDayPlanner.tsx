import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import type { NutritionDaySummary } from '../../../services/nutritionService';
import { isoDateRange } from '../helpers';

/**
 * CheatDayPlanner — forward-looking 14-day strip for pre-planning cheats.
 *
 * Why this exists: cheat day is a budget, not a discount. If you know
 * Saturday is pizza night, marking it ahead of time stops you from
 * burning the cheat earlier in the week. The toggle disables when the
 * weekly budget is hit, including planned-but-not-yet-arrived days.
 *
 * Implementation: pre-marking creates a nutrition_days row with
 * is_cheat_day=true for that future date (no entries, status='empty').
 * When that day arrives and becomes "today", useNutritionDay finds the
 * pre-existing row and the hero immediately reads "TODAY · CHEAT DAY".
 *
 * Tap behavior: today is read-only here (use the toggle below the focus
 * card for that). Future days toggle planned/unplanned. Past days are
 * shown in WeekRows, not the planner.
 */

const CHEAT_START = '#fc4c02';
const CHEAT_END = '#a855f7';

const DAY_NAMES_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Props = {
  today: string;
  summaries: NutritionDaySummary[];
  onToggle: (iso: string, on: boolean) => Promise<void>;
};

export const CheatDayPlanner = ({ today, summaries, onToggle }: Props) => {
  const [busyIso, setBusyIso] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const m = new Map<string, NutritionDaySummary>();
    for (const s of summaries) m.set(s.date, s);
    return m;
  }, [summaries]);

  // 14 days starting today (today + 13 forward).
  const dates = useMemo(() => isoDateRange(today, 14), [today]);

  const handleTap = async (iso: string, isPlanned: boolean) => {
    if (busyIso) return;
    if (iso === today) return; // today's toggle lives below the focus card
    setBusyIso(iso);
    try { await onToggle(iso, !isPlanned); } finally { setBusyIso(null); }
  };

  return (
    <View
      style={{
        marginBottom: spacing.xl,
        backgroundColor: palette.surface,
        borderColor: palette.borderStrong,
        borderWidth: 1,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Text
          style={{
            color: text.quaternary,
            fontFamily: fonts.family.mono,
            fontSize: 11,
            letterSpacing: 2.2,
            fontWeight: '800',
            textTransform: 'uppercase',
          }}
        >
          Plan ahead
        </Text>
        <Text
          style={{
            color: text.disabled,
            fontFamily: fonts.family.mono,
            fontSize: 9,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            fontWeight: '700',
          }}
        >
          Tap a day to plan a cheat
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
      >
        {dates.map(iso => {
          const summary = byDate.get(iso);
          const planned = summary?.is_cheat_day ?? false;
          const isToday = iso === today;
          const busy = busyIso === iso;
          return (
            <DayCell
              key={iso}
              iso={iso}
              planned={planned}
              isToday={isToday}
              busy={busy}
              onPress={() => handleTap(iso, planned)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const DayCell = ({
  iso,
  planned,
  isToday,
  busy,
  onPress,
}: {
  iso: string;
  planned: boolean;
  isToday: boolean;
  busy: boolean;
  onPress: () => void;
}) => {
  const d = new Date(`${iso}T00:00:00`);
  const dom = d.getDate();
  const dayLetter = DAY_NAMES_SHORT[d.getDay()];
  const showMonth = dom === 1 || iso === iso; // always show month for clarity at small size? simpler: show on first-of-month only
  const month = MONTH_NAMES[d.getMonth()];

  // Visual states:
  //   today + not planned: orange ring, neutral fill
  //   today + planned:     orange ring, gradient fill (the toggle put it here)
  //   future planned:      gradient fill, purple ring
  //   future unplanned:    neutral surfaceAlt
  const ringColor = isToday
    ? accent.lift
    : planned
      ? CHEAT_END
      : palette.borderStrong;

  return (
    <TouchableOpacity
      testID={`planner-day-${iso}`}
      onPress={onPress}
      disabled={busy || isToday}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${planned ? 'Unplan cheat day' : 'Plan cheat day'} for ${iso}`}
      style={{
        width: 44,
        paddingVertical: 8,
        borderRadius: radii.sm,
        borderWidth: 1.5,
        borderColor: ringColor,
        backgroundColor: planned
          ? 'rgba(168, 85, 247, 0.18)'
          : isToday
            ? 'rgba(252, 76, 2, 0.06)'
            : palette.surfaceAlt,
        alignItems: 'center',
        opacity: busy ? 0.5 : isToday && !planned ? 0.85 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.family.mono,
          fontSize: 9,
          letterSpacing: 1.2,
          fontWeight: '800',
          color: planned
            ? CHEAT_END
            : isToday
              ? accent.lift
              : text.quaternary,
          textTransform: 'uppercase',
        }}
      >
        {dayLetter}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontFamily: fonts.family.mono,
          fontSize: 16,
          fontWeight: '800',
          fontVariant: fonts.tabularNums,
          color: planned
            ? CHEAT_END
            : isToday
              ? accent.lift
              : text.primary,
        }}
      >
        {dom}
      </Text>
      {planned ? (
        <View
          style={{
            marginTop: 4,
            width: 6,
            height: 6,
            backgroundColor: CHEAT_START,
            transform: [{ rotate: '45deg' }],
          }}
        />
      ) : null}
    </TouchableOpacity>
  );
};
