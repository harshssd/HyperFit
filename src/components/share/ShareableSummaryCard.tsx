import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BodySilhouette } from '../../features/analytics/heatmap/BodySilhouette';
import type { MuscleId } from '../../features/analytics/heatmap/muscleRegions';
import { palette, text, fonts } from '../../styles/theme';

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

export type SharePayload = ShareWorkoutPayload | SharePlanPayload;

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
    <View ref={ref} collapsable={false} style={styles.card}>
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
    </View>
  );
});

ShareableSummaryCard.displayName = 'ShareableSummaryCard';

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
