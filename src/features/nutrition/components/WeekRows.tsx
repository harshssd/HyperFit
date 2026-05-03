import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import type { NutritionDaySummary } from '../../../services/nutritionService';
import { isoDateMinus, isoDateRange } from '../helpers';

/**
 * WeekRows — dense History-style readout for the last 7 days.
 *
 * Reads from the hook's recentSummaries (already loaded for streak math
 * + cheat budget). Generates 7 ISO dates client-side so days the user
 * hasn't logged still get a row, rendered as a placeholder. The view
 * doesn't return rows for days with no nutrition_days parent, so we
 * have to fill the gaps.
 *
 * Read-only in PR 3 (per D4). Tap-to-edit-past-day is a PR 4 feature.
 *
 * Each row: date · status pill · "kcal/target" · macro suffix · water suffix.
 */

const FIBER_COLOR = '#4fb3a8';
const CHEAT_END = '#a855f7';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const formatRowDate = (iso: string, today: string) => {
  const d = new Date(`${iso}T00:00:00`);
  const dayName = DAY_NAMES[d.getDay()];
  const month = MONTH_NAMES[d.getMonth()];
  const dom = String(d.getDate()).padStart(2, '0');
  if (iso === today) return `TODAY · ${month} ${dom}`;
  return `${dayName} · ${month} ${dom}`;
};

type Props = {
  today: string;
  summaries: NutritionDaySummary[];
};

export const WeekRows = ({ today, summaries }: Props) => {
  // Build a lookup so the per-row render is O(1).
  const byDate = useMemo(() => {
    const m = new Map<string, NutritionDaySummary>();
    for (const s of summaries) m.set(s.date, s);
    return m;
  }, [summaries]);

  // Last 7 days, today on top → 6 days back.
  const dates = useMemo(
    () => isoDateRange(isoDateMinus(today, 6), 7).reverse(),
    [today],
  );

  return (
    <View
      style={{
        marginBottom: spacing.xl,
        backgroundColor: palette.surface,
        borderColor: palette.borderStrong,
        borderWidth: 1,
        borderRadius: radii.lg,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
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
          This week
        </Text>
      </View>
      {dates.map((iso, i) => (
        <Row
          key={iso}
          iso={iso}
          today={today}
          summary={byDate.get(iso) ?? null}
          isLast={i === dates.length - 1}
        />
      ))}
    </View>
  );
};

const Row = ({
  iso,
  today,
  summary,
  isLast,
}: {
  iso: string;
  today: string;
  summary: NutritionDaySummary | null;
  isLast: boolean;
}) => {
  const isToday = iso === today;
  const cheat = summary?.is_cheat_day ?? false;
  const status = summary?.status ?? 'empty';
  const empty = !summary || status === 'empty';

  // Status chip semantics:
  //   cheat → diamond gradient marker, "CHEAT" text
  //   over  → red, "OVER"
  //   under → quaternary, "UNDER"
  //   hit   → green, "HIT"
  //   empty → disabled, "—"
  const chipColor = cheat
    ? CHEAT_END
    : empty
      ? text.disabled
      : status === 'hit'
        ? accent.sessionUp
        : status === 'over'
          ? accent.regression
          : text.tertiary;
  const chipLabel = cheat
    ? 'CHEAT'
    : empty
      ? '—'
      : status.toUpperCase();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.borderStrong,
        gap: spacing.md,
        backgroundColor: isToday ? 'rgba(252, 76, 2, 0.04)' : 'transparent',
      }}
    >
      <Text
        style={{
          fontFamily: fonts.family.mono,
          fontSize: 11,
          letterSpacing: 1.4,
          color: isToday ? accent.lift : text.tertiary,
          fontWeight: '800',
          width: 92,
        }}
        numberOfLines={1}
      >
        {formatRowDate(iso, today)}
      </Text>

      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: radii.sm,
          borderWidth: 1,
          borderColor: chipColor,
          backgroundColor: 'transparent',
        }}
      >
        <Text
          style={{
            color: chipColor,
            fontFamily: fonts.family.mono,
            fontSize: 9,
            letterSpacing: 1.4,
            fontWeight: '800',
          }}
        >
          {chipLabel}
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {empty ? (
          <Text
            style={{
              color: text.disabled,
              fontFamily: fonts.family.mono,
              fontSize: 12,
            }}
          >
            no log
          </Text>
        ) : (
          <>
            <Text
              style={{
                color: text.primary,
                fontFamily: fonts.family.mono,
                fontSize: 13,
                fontWeight: '800',
                fontVariant: fonts.tabularNums,
              }}
            >
              {summary!.kcal_total.toLocaleString()}
              <Text style={{ color: text.quaternary, fontWeight: '600' }}>
                {' / '}
                {summary!.kcal_target.toLocaleString()}
              </Text>
            </Text>
            <Text
              style={{
                marginTop: 2,
                color: text.quaternary,
                fontFamily: fonts.family.mono,
                fontSize: 10,
                letterSpacing: 0.4,
                fontVariant: fonts.tabularNums,
              }}
            >
              {summary!.protein_total_g}P · {summary!.carb_total_g}C ·{' '}
              {summary!.fat_total_g}F ·{' '}
              <Text style={{ color: FIBER_COLOR }}>
                {summary!.fiber_total_g}fib
              </Text>
              {summary!.water_total_ml > 0 ? (
                <Text style={{ color: accent.sessionUp }}>
                  {' · '}
                  {summary!.water_total_ml.toLocaleString()}ml
                </Text>
              ) : null}
            </Text>
          </>
        )}
      </View>
      {isLast ? null : null}
    </View>
  );
};
