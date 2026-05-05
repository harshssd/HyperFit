import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BodySilhouette } from '../../features/analytics/heatmap/BodySilhouette';
import type { MuscleId } from '../../features/analytics/heatmap/muscleRegions';
import { palette, text, accent, fonts } from '../../styles/theme';

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

/**
 * One row in the share card's TOP EXERCISES section.
 * For a workout: `count` is the number of completed sets logged for that
 *   exercise during the session.
 * For a plan: `count` is the total planned sets across every session in
 *   the plan that includes the exercise (a 3-day split with 4 sets of
 *   bench on each day = 12).
 */
export type ShareExerciseRow = {
  name: string;
  count: number;
};

export type ShareWorkoutPayload = {
  kind: 'workout';
  title: string;
  date: string;
  durationMin: number | null;
  totalVolume: number;
  totalSets: number;
  exerciseCount: number;
  /** Number of exercises that beat the user's prior heaviest weight. */
  prCount?: number;
  /** Per-exercise set counts, in the order they were performed. */
  exercises: ShareExerciseRow[];
  intensities: Partial<Record<MuscleId, number>>;
};

export type SharePlanPayload = {
  kind: 'plan';
  title: string;
  date: string;
  /** e.g. "4-DAY SPLIT" — shown under the title. */
  subtitle: string;
  sessionsPerWeek: number;
  exerciseCount: number;
  /** Distinct muscle ids that the plan recruits at all. */
  muscleCount: number;
  /** Plan length in weeks (from `WorkoutPlan.duration`). Falls back to null. */
  durationWeeks: number | null;
  /** Optional deep link to import this plan; rendered as the card footer. */
  shareUrl?: string | null;
  /** Distinct exercise names + total planned sets across the plan. */
  exercises: ShareExerciseRow[];
  intensities: Partial<Record<MuscleId, number>>;
};

export type ShareMealPayload = {
  kind: 'meal';
  /** Meal name (e.g. "Grilled Chicken Bowl"). */
  title: string;
  /** Display date string (already formatted by the caller, e.g. "FRI · MAY 02"). */
  date: string;
  /** Optional eyebrow above the title (slot label or custom meal label). */
  slotLabel?: string | null;
  /** Optional time-of-day eyebrow (e.g. "12:34 PM"). */
  timeLabel?: string | null;
  /** Optional portion label (e.g. "3 eggs", "200 g"). Renders below the title. */
  quantityLabel?: string | null;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  fiber_g: number;
  /** Highlights this meal as part of a planned cheat day. */
  cheat?: boolean;
};

export type ShareNutritionDayPayload = {
  kind: 'nutrition-day';
  /** Display date string (e.g. "FRI · MAY 02"). */
  title: string;
  /** Brand-row date (already formatted, e.g. "MAY 02 2026"). */
  date: string;
  kcal_total: number;
  kcal_target: number;
  protein_total_g: number;
  protein_target_g: number;
  carb_total_g: number;
  carb_target_g: number;
  fat_total_g: number;
  fat_target_g: number;
  fiber_total_g: number;
  water_total_ml: number;
  /** 'hit' | 'over' | 'under' | 'empty' from nutrition_day_summary_view. */
  status: 'hit' | 'over' | 'under' | 'empty';
  is_cheat_day: boolean;
  /** Up to 6 entries (any beyond shown as "+N more"). Newest-first or top-kcal — caller's call. */
  entries: { name: string; kcal: number; slotLabel: string }[];
};

export type SharePayload =
  | ShareWorkoutPayload
  | SharePlanPayload
  | ShareMealPayload
  | ShareNutritionDayPayload;

type Props = {
  payload: SharePayload;
};

const EXERCISE_LIST_LIMIT = 6;

const formatVolume = (v: number) => {
  if (v >= 10_000) return `${(v / 1000).toFixed(1)}k`;
  return Math.round(v).toLocaleString();
};

/**
 * Fixed-size (1080×1350) shareable card. Designed to be rendered off-screen
 * and captured by `useShareCard`. The visual language matches the in-app
 * heatmap so users see a consistent silhouette across post-workout, history,
 * and (later) plan views.
 *
 * Forwarded ref attaches to the captured root <View>. Pass it to
 * `react-native-view-shot`'s `captureRef`.
 */
export const ShareableSummaryCard = forwardRef<View, Props>(({ payload }, ref) => {
  if (payload.kind === 'meal') {
    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <MealCardBody payload={payload} />
      </View>
    );
  }
  if (payload.kind === 'nutrition-day') {
    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <DayCardBody payload={payload} />
      </View>
    );
  }
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <WorkoutOrPlanBody payload={payload} />
    </View>
  );
});

ShareableSummaryCard.displayName = 'ShareableSummaryCard';

const WorkoutOrPlanBody = ({
  payload,
}: {
  payload: ShareWorkoutPayload | SharePlanPayload;
}) => {
  // Top exercises by set count. Names + counts read more impactful than
  // muscle-group volume scores ("Bench Press 12" beats "Chest 1,025").
  // Silhouettes still carry the muscle-coverage story visually above.
  const topExercises = useMemo(() => {
    return [...payload.exercises]
      .filter(e => e.name?.trim() && e.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, EXERCISE_LIST_LIMIT);
  }, [payload.exercises]);

  const topMax = topExercises[0]?.count ?? 0;
  const isPlan = payload.kind === 'plan';

  return (
    <>
      {/* Brand row */}
      <View style={styles.brandRow}>
        <Text style={styles.brand}>HYPERFIT</Text>
        <Text style={styles.brandDate}>{payload.date}</Text>
      </View>

      <View style={styles.divider} />

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {payload.title.toUpperCase()}
      </Text>
      {payload.kind === 'workout' && payload.prCount && payload.prCount > 0 ? (
        <View style={styles.prBadge}>
          <Text style={styles.prBadgeText} allowFontScaling={false}>
            🔥 {payload.prCount} {payload.prCount === 1 ? 'PR' : 'PRs'} THIS SESSION
          </Text>
        </View>
      ) : null}
      {payload.kind === 'workout' ? (
        <Text style={styles.subtitle} allowFontScaling={false}>
          <Text style={styles.subtitleNum}>
            {payload.durationMin != null ? `${payload.durationMin} min` : '—'}
          </Text>
          {'  ·  '}
          <Text style={styles.subtitleNum}>{payload.totalSets} sets</Text>
          {'  ·  '}
          <Text style={styles.subtitleNum}>{payload.exerciseCount} lifts</Text>
        </Text>
      ) : (
        <Text style={styles.subtitle} allowFontScaling={false}>
          <Text style={styles.subtitleNum}>{payload.subtitle}</Text>
          {'  ·  '}
          <Text style={styles.subtitleNum}>{payload.exerciseCount} lifts</Text>
        </Text>
      )}

      {/* Silhouettes */}
      <View style={styles.silhouetteRow}>
        <View style={styles.silhouetteCol}>
          <Text style={styles.viewLabel}>FRONT</Text>
          <BodySilhouette view="front" intensities={payload.intensities} size={360} />
        </View>
        <View style={styles.silhouetteCol}>
          <Text style={styles.viewLabel}>BACK</Text>
          <BodySilhouette view="back" intensities={payload.intensities} size={360} />
        </View>
      </View>

      <View style={styles.divider} />

      {/* Top exercises — name + set count, ranked by sets descending. */}
      <Text style={styles.sectionLabel}>
        {isPlan ? 'EXERCISES IN PLAN' : 'TOP EXERCISES'}
      </Text>
      {topExercises.length === 0 ? (
        <Text style={styles.empty}>
          {isPlan ? 'No exercises in this plan yet.' : 'No exercises logged.'}
        </Text>
      ) : (
        topExercises.map((row, idx) => {
          const ratio = topMax > 0 ? row.count / topMax : 0;
          return (
            <View key={`${row.name}-${idx}`} style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {row.name}
              </Text>
              <Text style={styles.rowValue} allowFontScaling={false}>
                {row.count}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.round(ratio * 100)}%` }]} />
              </View>
            </View>
          );
        })
      )}
      {payload.exercises.length > EXERCISE_LIST_LIMIT ? (
        <Text style={styles.moreLine}>
          +{payload.exercises.length - EXERCISE_LIST_LIMIT} more
        </Text>
      ) : null}

      <View style={styles.divider} />

      {/* Stat tiles */}
      {payload.kind === 'workout' ? (
        <View style={styles.tileRow}>
          <Tile value={formatVolume(payload.totalVolume)} label="VOL" />
          <Tile value={String(payload.totalSets)} label="SETS" />
          <Tile value={String(payload.exerciseCount)} label="LIFTS" />
          <Tile
            value={payload.durationMin != null ? `${payload.durationMin}m` : '—'}
            label="TIME"
          />
        </View>
      ) : (
        <View style={styles.tileRow}>
          <Tile value={String(payload.sessionsPerWeek)} label="SESS/WK" />
          <Tile value={String(payload.exerciseCount)} label="LIFTS" />
          <Tile value={String(payload.muscleCount)} label="MUSCLES" />
          <Tile
            value={payload.durationWeeks != null ? `${payload.durationWeeks}W` : '—'}
            label="WEEKS"
          />
        </View>
      )}

      <Text
        style={styles.footer}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {payload.kind === 'plan' && payload.shareUrl ? payload.shareUrl : 'hyperfit.app'}
      </Text>
    </>
  );
};

// -- Meal share body -----------------------------------------------------------

const MealCardBody = ({ payload }: { payload: ShareMealPayload }) => {
  const macros: { value: number; label: string; color: string }[] = [
    { value: payload.protein_g, label: 'PROTEIN', color: accent.lift },
    { value: payload.carb_g, label: 'CARBS', color: accent.sessionUp },
    { value: payload.fat_g, label: 'FAT', color: accent.macroFat },
    { value: payload.fiber_g, label: 'FIBER', color: '#4fb3a8' },
  ];
  return (
    <>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>HYPERFIT</Text>
        <Text style={styles.brandDate}>{payload.date}</Text>
      </View>
      <View style={styles.divider} />

      {payload.slotLabel || payload.timeLabel ? (
        <View style={mealStyles.eyebrowRow}>
          {payload.slotLabel ? (
            <View style={mealStyles.slotChip}>
              <Text style={mealStyles.slotChipText} allowFontScaling={false}>
                {payload.slotLabel.toUpperCase()}
              </Text>
            </View>
          ) : null}
          {payload.timeLabel ? (
            <Text style={mealStyles.timeText} allowFontScaling={false}>
              {payload.timeLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.title} numberOfLines={3}>
        {payload.title.toUpperCase()}
      </Text>
      {payload.quantityLabel ? (
        <Text style={mealStyles.quantityText} allowFontScaling={false}>
          {payload.quantityLabel}
        </Text>
      ) : null}
      {payload.cheat ? (
        <View style={mealStyles.cheatBadge}>
          <Text style={mealStyles.cheatBadgeText} allowFontScaling={false}>
            CHEAT DAY
          </Text>
        </View>
      ) : null}

      <View style={mealStyles.kcalBlock}>
        <Text style={mealStyles.kcalValue} allowFontScaling={false}>
          {payload.kcal.toLocaleString()}
        </Text>
        <Text style={mealStyles.kcalLabel} allowFontScaling={false}>
          KCAL
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={mealStyles.macroGrid}>
        {macros.map(m => (
          <View key={m.label} style={mealStyles.macroTile}>
            <Text style={[mealStyles.macroValue, { color: m.color }]} allowFontScaling={false}>
              {m.value}
              <Text style={mealStyles.macroUnit}>g</Text>
            </Text>
            <Text style={mealStyles.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <Text
        style={styles.footer}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        hyperfit.app
      </Text>
    </>
  );
};

// -- Nutrition day body --------------------------------------------------------

const DayCardBody = ({ payload }: { payload: ShareNutritionDayPayload }) => {
  const target = Math.max(1, payload.kcal_target);
  const ratio = Math.min(1.2, payload.kcal_total / target);
  const statusColor =
    payload.is_cheat_day
      ? '#a855f7'
      : payload.status === 'hit'
        ? accent.sessionUp
        : payload.status === 'over'
          ? accent.regression
          : payload.status === 'under'
            ? text.tertiary
            : text.disabled;
  const statusLabel = payload.is_cheat_day ? 'CHEAT DAY' : payload.status.toUpperCase();
  const topEntries = payload.entries.slice(0, 6);
  const overflow = payload.entries.length - topEntries.length;

  return (
    <>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>HYPERFIT</Text>
        <Text style={styles.brandDate}>{payload.date}</Text>
      </View>
      <View style={styles.divider} />

      <Text style={styles.title} numberOfLines={2}>
        {payload.title.toUpperCase()}
      </Text>
      <View style={dayStyles.statusRow}>
        <View style={[dayStyles.statusChip, { borderColor: statusColor }]}>
          <Text
            style={[dayStyles.statusChipText, { color: statusColor }]}
            allowFontScaling={false}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={dayStyles.kcalBlock}>
        <Text style={dayStyles.kcalValue} allowFontScaling={false}>
          {payload.kcal_total.toLocaleString()}
          <Text style={dayStyles.kcalTarget}>
            {' / '}
            {payload.kcal_target.toLocaleString()}
          </Text>
        </Text>
        <Text style={dayStyles.kcalLabel} allowFontScaling={false}>
          KCAL
        </Text>
        <View style={dayStyles.kcalBar}>
          <View
            style={[
              dayStyles.kcalBarFill,
              {
                width: `${Math.round(ratio * 100)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>MACROS</Text>
      <MacroBar label="PROTEIN" value={payload.protein_total_g} target={payload.protein_target_g} color={accent.lift} />
      <MacroBar label="CARBS" value={payload.carb_total_g} target={payload.carb_target_g} color={accent.sessionUp} />
      <MacroBar label="FAT" value={payload.fat_total_g} target={payload.fat_target_g} color={accent.macroFat} />

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>TOP MEALS</Text>
      {topEntries.length === 0 ? (
        <Text style={styles.empty}>No meals logged.</Text>
      ) : (
        topEntries.map((e, idx) => (
          <View key={`${e.name}-${idx}`} style={dayStyles.entryRow}>
            <Text style={dayStyles.entrySlot} allowFontScaling={false}>
              {e.slotLabel}
            </Text>
            <Text style={dayStyles.entryName} numberOfLines={1}>
              {e.name}
            </Text>
            <Text style={dayStyles.entryKcal} allowFontScaling={false}>
              {e.kcal.toLocaleString()}
            </Text>
          </View>
        ))
      )}
      {overflow > 0 ? (
        <Text style={styles.moreLine}>+{overflow} more</Text>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.tileRow}>
        <Tile value={payload.kcal_total.toLocaleString()} label="KCAL" />
        <Tile value={`${payload.protein_total_g}g`} label="PROT" />
        <Tile value={`${payload.fiber_total_g}g`} label="FIBER" />
        <Tile
          value={
            payload.water_total_ml >= 1000
              ? `${(payload.water_total_ml / 1000).toFixed(1)}L`
              : `${payload.water_total_ml}ml`
          }
          label="WATER"
        />
      </View>

      <Text
        style={styles.footer}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        hyperfit.app
      </Text>
    </>
  );
};

const MacroBar = ({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) => {
  const safeTarget = Math.max(1, target);
  const ratio = Math.min(1.2, value / safeTarget);
  return (
    <View style={dayStyles.macroBarRow}>
      <Text style={dayStyles.macroBarLabel}>{label}</Text>
      <Text style={dayStyles.macroBarValue} allowFontScaling={false}>
        {value}
        <Text style={dayStyles.macroBarTarget}>
          {' / '}
          {target}g
        </Text>
      </Text>
      <View style={dayStyles.macroBarTrack}>
        <View
          style={[
            dayStyles.macroBarFill,
            { width: `${Math.round(ratio * 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

const Tile = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.tile}>
    <Text style={styles.tileValue} allowFontScaling={false}>
      {value}
    </Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: palette.bg,
    paddingHorizontal: 64,
    paddingVertical: 56,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: palette.liftActive,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandDate: {
    color: text.tertiary,
    fontSize: 22,
    fontVariant: fonts.tabularNums,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: palette.borderStrong,
    marginVertical: 28,
  },
  title: {
    color: text.primary,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 60,
  },
  subtitle: {
    color: text.tertiary,
    fontSize: 26,
    marginTop: 12,
    letterSpacing: 1,
  },
  subtitleNum: {
    color: text.secondary,
    fontVariant: fonts.tabularNums,
    fontWeight: '600',
  },
  prBadge: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.liftActive,
    backgroundColor: 'rgba(252, 76, 2, 0.14)',
  },
  prBadgeText: {
    color: palette.liftActive,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  silhouetteRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 36,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  silhouetteCol: {
    alignItems: 'center',
  },
  viewLabel: {
    color: text.quaternary,
    fontSize: 18,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionLabel: {
    color: text.quaternary,
    fontSize: 18,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 16,
  },
  moreLine: {
    color: text.tertiary,
    fontSize: 18,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  empty: {
    color: text.tertiary,
    fontSize: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rowLabel: {
    color: text.primary,
    fontSize: 26,
    fontWeight: '700',
    width: 280,
  },
  rowValue: {
    color: text.secondary,
    fontSize: 24,
    fontVariant: fonts.tabularNums,
    width: 140,
    textAlign: 'right',
    marginRight: 24,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: palette.surface,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: palette.liftActive,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  tileValue: {
    color: text.primary,
    fontSize: 44,
    fontWeight: '900',
    fontVariant: fonts.tabularNums,
  },
  tileLabel: {
    color: text.quaternary,
    fontSize: 18,
    letterSpacing: 3,
    fontWeight: '700',
    marginTop: 6,
  },
  footer: {
    color: text.tertiary,
    fontSize: 22,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 'auto',
  },
});

const mealStyles = StyleSheet.create({
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.liftActive,
    backgroundColor: 'rgba(252, 76, 2, 0.14)',
  },
  slotChipText: {
    color: palette.liftActive,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  timeText: {
    color: text.tertiary,
    fontSize: 22,
    letterSpacing: 1.2,
    fontVariant: fonts.tabularNums,
  },
  quantityText: {
    color: text.tertiary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 12,
    fontVariant: fonts.tabularNums,
  },
  cheatBadge: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
  },
  cheatBadgeText: {
    color: '#a855f7',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  kcalBlock: {
    marginTop: 36,
    alignItems: 'flex-start',
  },
  kcalValue: {
    color: text.primary,
    fontSize: 180,
    fontWeight: '900',
    fontVariant: fonts.tabularNums,
    lineHeight: 180,
  },
  kcalLabel: {
    color: text.quaternary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 4,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  macroTile: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  macroValue: {
    fontSize: 52,
    fontWeight: '900',
    fontVariant: fonts.tabularNums,
  },
  macroUnit: {
    fontSize: 26,
    fontWeight: '700',
  },
  macroLabel: {
    color: text.quaternary,
    fontSize: 16,
    letterSpacing: 2.4,
    fontWeight: '700',
    marginTop: 6,
  },
});

const dayStyles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statusChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  statusChipText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  kcalBlock: {
    marginTop: 28,
  },
  kcalValue: {
    color: text.primary,
    fontSize: 96,
    fontWeight: '900',
    fontVariant: fonts.tabularNums,
    lineHeight: 100,
  },
  kcalTarget: {
    color: text.quaternary,
    fontWeight: '700',
    fontSize: 60,
  },
  kcalLabel: {
    color: text.quaternary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 4,
    marginBottom: 16,
  },
  kcalBar: {
    height: 14,
    backgroundColor: palette.surface,
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  kcalBarFill: {
    height: '100%',
  },
  macroBarRow: {
    marginBottom: 18,
  },
  macroBarLabel: {
    color: text.quaternary,
    fontSize: 16,
    letterSpacing: 2.4,
    fontWeight: '700',
  },
  macroBarValue: {
    color: text.primary,
    fontSize: 28,
    fontWeight: '900',
    fontVariant: fonts.tabularNums,
    marginTop: 4,
    marginBottom: 8,
  },
  macroBarTarget: {
    color: text.quaternary,
    fontSize: 22,
    fontWeight: '700',
  },
  macroBarTrack: {
    height: 10,
    backgroundColor: palette.surface,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  macroBarFill: {
    height: '100%',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  entrySlot: {
    color: accent.lift,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.6,
    width: 110,
  },
  entryName: {
    flex: 1,
    color: text.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  entryKcal: {
    color: text.secondary,
    fontSize: 24,
    fontWeight: '900',
    fontVariant: fonts.tabularNums,
    width: 140,
    textAlign: 'right',
  },
});
