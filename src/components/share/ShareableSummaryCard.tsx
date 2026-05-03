import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BodySilhouette } from '../../features/analytics/heatmap/BodySilhouette';
import {
  BACK_REGIONS,
  FRONT_REGIONS,
  MuscleId,
} from '../../features/analytics/heatmap/muscleRegions';
import { palette, text, fonts } from '../../styles/theme';

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

export type ShareWorkoutPayload = {
  kind: 'workout';
  title: string;
  date: string;
  durationMin: number | null;
  totalVolume: number;
  totalSets: number;
  exerciseCount: number;
  byMuscle: Partial<Record<MuscleId, number>>;
  intensities: Partial<Record<MuscleId, number>>;
};

type Props = {
  payload: ShareWorkoutPayload;
};

/** Region labels keyed by id (deduped across front/back). */
const REGION_LABELS: Record<MuscleId, string> = (() => {
  const map = {} as Record<MuscleId, string>;
  [...FRONT_REGIONS, ...BACK_REGIONS].forEach(r => {
    if (!map[r.id]) map[r.id] = r.label;
  });
  return map;
})();

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
  const topMuscles = useMemo(() => {
    const entries = Object.entries(payload.byMuscle) as [MuscleId, number][];
    return entries
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [payload.byMuscle]);

  const topMax = topMuscles[0]?.[1] ?? 0;

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
      <Text style={styles.subtitle} allowFontScaling={false}>
        <Text style={styles.subtitleNum}>
          {payload.durationMin != null ? `${payload.durationMin} min` : '—'}
        </Text>
        {'  ·  '}
        <Text style={styles.subtitleNum}>{payload.totalSets} sets</Text>
        {'  ·  '}
        <Text style={styles.subtitleNum}>{payload.exerciseCount} lifts</Text>
      </Text>

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

      {/* Top muscles */}
      <Text style={styles.sectionLabel}>TOP MUSCLES</Text>
      {topMuscles.length === 0 ? (
        <Text style={styles.empty}>No muscle volume recorded.</Text>
      ) : (
        topMuscles.map(([id, vol]) => {
          const ratio = topMax > 0 ? vol / topMax : 0;
          return (
            <View key={id} style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {REGION_LABELS[id] ?? id}
              </Text>
              <Text
                style={styles.rowValue}
                allowFontScaling={false}
              >
                {formatVolume(vol)}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.round(ratio * 100)}%` }]} />
              </View>
            </View>
          );
        })
      )}

      <View style={styles.divider} />

      {/* Stat tiles */}
      <View style={styles.tileRow}>
        <Tile value={formatVolume(payload.totalVolume)} label="VOL" />
        <Tile value={String(payload.totalSets)} label="SETS" />
        <Tile value={String(payload.exerciseCount)} label="LIFTS" />
        <Tile
          value={payload.durationMin != null ? `${payload.durationMin}m` : '—'}
          label="TIME"
        />
      </View>

      <Text style={styles.footer}>hyperfit.app</Text>
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
