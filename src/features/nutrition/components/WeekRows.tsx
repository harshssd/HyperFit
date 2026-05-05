import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import type { NutritionDaySummary } from '../../../services/nutritionService';
import { isoDateMinus, isoDateRange } from '../helpers';
import { NutritionRow } from './NutritionRow';

/**
 * In-tab "this week" preview — last 7 days, today on top. The full
 * paginated history lives in the History modal under the NUTRITION
 * segment; tap the footer link to deep-link there.
 */
type Props = {
  today: string;
  summaries: NutritionDaySummary[];
  onSeeAll?: () => void;
};

export const WeekRows = ({ today, summaries, onSeeAll }: Props) => {
  const byDate = useMemo(() => {
    const m = new Map<string, NutritionDaySummary>();
    for (const s of summaries) m.set(s.date, s);
    return m;
  }, [summaries]);

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
      {dates.map(iso => (
        <NutritionRow
          key={iso}
          iso={iso}
          today={today}
          summary={byDate.get(iso) ?? null}
        />
      ))}

      {onSeeAll ? (
        <TouchableOpacity
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel="View full nutrition history"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: palette.borderStrong,
            backgroundColor: palette.bg,
          }}
        >
          <Text
            style={{
              color: accent.lift,
              fontFamily: fonts.family.black,
              fontSize: 11,
              letterSpacing: 1.4,
            }}
          >
            VIEW ALL HISTORY
          </Text>
          <ChevronRight size={14} color={accent.lift} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
