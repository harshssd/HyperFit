import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import type { NutritionDaySummary } from '../../../services/nutritionService';

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
  iso: string;
  today: string;
  summary: NutritionDaySummary | null;
  /** Whether to render the top hairline divider. First row in a list should pass false. */
  showTopBorder?: boolean;
  /** Tap → open the day-detail modal. When omitted, row is non-interactive. */
  onPress?: () => void;
};

/**
 * Single dense day row used by both the in-tab WeekRows preview and the
 * History modal's paginated NUTRITION list. Date · status pill · totals.
 */
export const NutritionRow = ({ iso, today, summary, showTopBorder = true, onPress }: Props) => {
  const isToday = iso === today;
  const cheat = summary?.is_cheat_day ?? false;
  const status = summary?.status ?? 'empty';
  const empty = !summary || status === 'empty';

  const chipColor = cheat
    ? CHEAT_END
    : empty
      ? text.disabled
      : status === 'hit'
        ? accent.sessionUp
        : status === 'over'
          ? accent.regression
          : text.tertiary;
  const chipLabel = cheat ? 'CHEAT' : empty ? '—' : status.toUpperCase();

  const Wrapper: any = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress
    ? {
        onPress,
        activeOpacity: 0.7,
        accessibilityRole: 'button' as const,
        accessibilityLabel: `Open nutrition for ${iso}`,
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: showTopBorder ? 1 : 0,
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
            <MacroSuffix summary={summary!} />
          </>
        )}
      </View>
      {onPress ? (
        <ChevronRight size={14} color={text.quaternary} />
      ) : null}
    </Wrapper>
  );
};

/**
 * Macro suffix line — protein always shows (required goal). Carbs/fat/fiber
 * each appear only when the user has a target > 0 for that macro. Water
 * is gated on whether any was logged (the view doesn't carry a water target).
 */
const MacroSuffix = ({ summary }: { summary: NutritionDaySummary }) => {
  const parts: React.ReactNode[] = [];
  parts.push(
    <Text key="p">{summary.protein_total_g}P</Text>,
  );
  if (summary.carb_target_g > 0) {
    parts.push(<Text key="c">{' · '}{summary.carb_total_g}C</Text>);
  }
  if (summary.fat_target_g > 0) {
    parts.push(<Text key="f">{' · '}{summary.fat_total_g}F</Text>);
  }
  if (summary.fiber_target_g > 0) {
    parts.push(
      <Text key="fi" style={{ color: FIBER_COLOR }}>
        {' · '}{summary.fiber_total_g}fib
      </Text>,
    );
  }
  if (summary.water_total_ml > 0) {
    parts.push(
      <Text key="w" style={{ color: accent.sessionUp }}>
        {' · '}{summary.water_total_ml.toLocaleString()}ml
      </Text>,
    );
  }
  return (
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
      {parts}
    </Text>
  );
};
