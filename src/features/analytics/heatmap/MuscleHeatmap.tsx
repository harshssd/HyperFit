import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import GlassCard from '../../../components/GlassCard';
import { LoadingState, EmptyState } from '../../../components/StateView';
import { colors, spacing, radii, palette, accent, text, fonts } from '../../../styles/theme';
import { BodySilhouette, HEATMAP_FILL, HEATMAP_BORDER } from './BodySilhouette';
import {
  BACK_REGIONS,
  FRONT_REGIONS,
  MuscleId,
  MUSCLE_GROUP_TO_REGION,
} from './muscleRegions';
import { useMuscleVolume } from './useMuscleVolume';
import { useMuscleRecovery } from './useMuscleRecovery';
import { Activity } from 'lucide-react-native';

type HeatmapMode = 'volume' | 'recovery';

type Props = {
  userId: string | null | undefined;
  /** Optional preset intensities (used when driven by a session, not a query). */
  staticIntensities?: Partial<Record<MuscleId, number>>;
  /** When true, show the day-range picker. */
  showRangePicker?: boolean;
  /** Default day range. */
  defaultDays?: 7 | 30 | 90 | null;
  /** Hide the title/header (used when embedded in another card). */
  compact?: boolean;
};

const RANGES: { label: string; days: 7 | 30 | 90 | null }[] = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'ALL', days: null },
];

/**
 * Convenience: build intensities from a list of exercise muscle-group strings,
 * useful for "this session targets X" previews where we don't have volume data.
 */
export const intensitiesFromMuscleGroups = (
  groups: (string | null | undefined)[]
): Partial<Record<MuscleId, number>> => {
  const counts: Partial<Record<MuscleId, number>> = {};
  groups.forEach(g => {
    if (!g) return;
    const regions = MUSCLE_GROUP_TO_REGION[g.toLowerCase()];
    if (!regions) return;
    regions.forEach(r => {
      counts[r] = (counts[r] ?? 0) + 1;
    });
  });
  const max = Math.max(0, ...Object.values(counts).map(v => v ?? 0));
  if (max === 0) return {};
  const out: Partial<Record<MuscleId, number>> = {};
  (Object.keys(counts) as MuscleId[]).forEach(k => {
    out[k] = (counts[k] ?? 0) / max;
  });
  return out;
};

export const MuscleHeatmap = ({
  userId,
  staticIntensities,
  showRangePicker = true,
  defaultDays = 7,
  compact = false,
}: Props) => {
  const [days, setDays] = useState<7 | 30 | 90 | null>(defaultDays);
  const [mode, setMode] = useState<HeatmapMode>('volume');
  const live = useMuscleVolume(staticIntensities ? null : userId, days);
  // Recovery mode uses a fixed 7-day window with exponential decay rather
  // than the bucket window the user picked — fatigue past a week is noise.
  const recovery = useMuscleRecovery(staticIntensities || mode !== 'recovery' ? null : userId);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selected, setSelected] = useState<MuscleId | null>(null);

  const intensities =
    staticIntensities ??
    (mode === 'recovery' ? recovery.intensities : live.intensities);
  const isLoading =
    !staticIntensities && (mode === 'recovery' ? recovery.loading : live.loading);
  const isEmpty =
    !staticIntensities &&
    !isLoading &&
    (mode === 'recovery' ? recovery.fatiguedCount === 0 : live.setCount === 0);

  const allRegionLabels = useMemo(() => {
    const map = new Map<MuscleId, string>();
    [...FRONT_REGIONS, ...BACK_REGIONS].forEach(r => {
      if (!map.has(r.id)) map.set(r.id, r.label);
    });
    return map;
  }, []);

  return (
    <GlassCard style={styles.card}>
      {!compact && (
        <View style={styles.header}>
          {/* Top row: title + mode toggle (VOL / RECOV). Mode is the primary
              control so it sits next to the title. The day-range row drops
              below so 90D / ALL never clip on narrower devices. */}
          <View style={styles.headerTopRow}>
            <View style={styles.titleRow}>
              <Activity size={16} color={accent.lift} />
              <Text style={styles.title}>
                {mode === 'recovery' ? 'MUSCLE RECOVERY' : 'MUSCLE COVERAGE'}
              </Text>
            </View>
            {!staticIntensities && (
              <View style={styles.pillRow}>
                <ModePill
                  label="VOL"
                  active={mode === 'volume'}
                  onPress={() => setMode('volume')}
                  a11y="Show muscle coverage"
                />
                <ModePill
                  label="RECOV"
                  active={mode === 'recovery'}
                  onPress={() => setMode('recovery')}
                  a11y="Show muscle recovery"
                />
              </View>
            )}
          </View>
          {showRangePicker && !staticIntensities && mode === 'volume' && (
            <View style={styles.rangeRow}>
              {RANGES.map(r => (
                <ModePill
                  key={r.label}
                  label={r.label}
                  active={days === r.days}
                  onPress={() => setDays(r.days)}
                  a11y={`Show last ${r.label}`}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {isLoading ? (
        <LoadingState label="Computing heatmap…" />
      ) : isEmpty ? (
        <EmptyState
          title="No volume yet"
          message="Log a workout and your muscle coverage will light up here."
        />
      ) : (
        <>
          <View style={styles.silhouetteRow}>
            <View style={styles.silhouetteCol}>
              <Text style={styles.viewLabel}>FRONT</Text>
              <BodySilhouette view="front" intensities={intensities} onPressRegion={setSelected} size={140} />
            </View>
            <View style={styles.silhouetteCol}>
              <Text style={styles.viewLabel}>BACK</Text>
              <BodySilhouette view="back" intensities={intensities} onPressRegion={setSelected} size={140} />
            </View>
          </View>

          {/* Legend mirrors the body-silhouette ramp: surface grey → ember →
              burnt orange → bright strava. Hue carries intensity. Pairs are
              wrapped so flexWrap can't split a swatch from its label on a
              narrow screen — overflow lands on a second row instead. */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendSwatchNone]} />
              <Text style={styles.legendLabel}>None</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendSwatchLight]} />
              <Text style={styles.legendLabel}>Light</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendSwatchMid]} />
              <Text style={styles.legendLabel}>Mid</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendSwatchHeavy]} />
              <Text style={styles.legendLabel}>Heavy</Text>
            </View>
          </View>

          {selected && (
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>{allRegionLabels.get(selected)?.toUpperCase()}</Text>
              <Text style={styles.detailValue}>
                {mode === 'recovery'
                  ? recovery.byMuscle[selected]
                    ? `${Math.round((1 - (intensities[selected] ?? 0)) * 100)}% recovered`
                    : 'Fully recovered'
                  : live.byRegion[selected]
                    ? `${Math.round(live.byRegion[selected] ?? 0).toLocaleString()} volume`
                    : 'No work in window'}
              </Text>
              <TouchableOpacity onPress={() => setSelected(null)} accessibilityRole="button">
                <Text style={styles.detailDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </GlassCard>
  );
};

/**
 * Pill button used by both the mode toggle (VOL / RECOV) and the day-range
 * row (7D / 30D / 90D / ALL). Matches the app's segmented-control standard:
 * orange-tinted bg + accent.lift text+border when active, neutral surface
 * when inactive.
 */
const ModePill = ({
  label,
  active,
  onPress,
  a11y,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  a11y: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={a11y}
    accessibilityState={{ selected: active }}
    hitSlop={4}
    style={[styles.modePill, active && styles.modePillActive]}
  >
    <Text style={[styles.modePillText, active && styles.modePillTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { padding: spacing.lg, marginBottom: spacing.lg },
  header: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  title: {
    color: text.primary,
    fontFamily: fonts.family.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  pillRow: { flexDirection: 'row', gap: 6 },
  rangeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  modePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
  },
  modePillActive: {
    borderColor: accent.lift,
    backgroundColor: 'rgba(252, 76, 2, 0.10)',
  },
  modePillText: {
    color: text.tertiary,
    fontFamily: fonts.family.mono,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  modePillTextActive: { color: accent.lift },
  silhouetteRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  silhouetteCol: { alignItems: 'center' },
  viewLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    rowGap: 6,
    columnGap: 4,
  },
  // Legend pair = swatch + label, kept inseparable so wrap can't split them.
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.sm },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 4,
  },
  legendSwatchNone:  { backgroundColor: HEATMAP_FILL.none },
  legendSwatchLight: { backgroundColor: HEATMAP_FILL.light, borderColor: HEATMAP_BORDER.light },
  legendSwatchMid:   { backgroundColor: HEATMAP_FILL.mid,   borderColor: '#c44a18' },
  legendSwatchHeavy: { backgroundColor: HEATMAP_FILL.heavy, borderColor: HEATMAP_BORDER.heavy },
  legendLabel: { color: colors.muted, fontSize: 11 },
  detail: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.4)',
  },
  detailLabel: { color: colors.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  detailValue: { color: '#f8fafc', fontSize: 16, fontWeight: '700', marginTop: 4 },
  detailDismiss: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
    textDecorationLine: 'underline',
  },
});
