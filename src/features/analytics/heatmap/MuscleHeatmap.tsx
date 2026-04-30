import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import GlassCard from '../../../components/GlassCard';
import { LoadingState, EmptyState } from '../../../components/StateView';
import { colors, spacing, radii } from '../../../styles/theme';
import { BodySilhouette } from './BodySilhouette';
import {
  BACK_REGIONS,
  FRONT_REGIONS,
  MuscleId,
  MUSCLE_GROUP_TO_REGION,
} from './muscleRegions';
import { useMuscleVolume } from './useMuscleVolume';
import { Activity } from 'lucide-react-native';

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
  const live = useMuscleVolume(userId, staticIntensities ? null : days);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selected, setSelected] = useState<MuscleId | null>(null);

  const intensities = staticIntensities ?? live.intensities;
  const isLoading = !staticIntensities && live.loading;
  const isEmpty = !staticIntensities && !live.loading && live.setCount === 0;

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
          <View style={styles.titleRow}>
            <Activity size={18} color={colors.primary} />
            <Text style={styles.title}>MUSCLE COVERAGE</Text>
          </View>
          {showRangePicker && !staticIntensities && (
            <View style={styles.rangePicker}>
              {RANGES.map(r => (
                <TouchableOpacity
                  key={r.label}
                  onPress={() => setDays(r.days)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show last ${r.label}`}
                  accessibilityState={{ selected: days === r.days }}
                  style={[styles.rangePill, days === r.days && styles.rangePillActive]}
                >
                  <Text style={[styles.rangeText, days === r.days && styles.rangeTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
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

          {/* Color legend */}
          <View style={styles.legendRow}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.surface }]} />
            <Text style={styles.legendLabel}>None</Text>
            <View style={[styles.legendSwatch, { backgroundColor: colors.cyan }]} />
            <Text style={styles.legendLabel}>Light</Text>
            <View style={[styles.legendSwatch, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendLabel}>Heavy</Text>
          </View>

          {selected && (
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>{allRegionLabels.get(selected)?.toUpperCase()}</Text>
              <Text style={styles.detailValue}>
                {live.byRegion[selected]
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

const styles = StyleSheet.create({
  card: { padding: spacing.lg, marginBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: '#f8fafc', fontSize: 14, fontWeight: '700', letterSpacing: 1.2 },
  rangePicker: { flexDirection: 'row', gap: 4 },
  rangePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  rangePillActive: { backgroundColor: 'rgba(249,115,22,0.18)' },
  rangeText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  rangeTextActive: { color: colors.primary },
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  legendSwatch: { width: 14, height: 14, borderRadius: 4 },
  legendLabel: { color: colors.muted, fontSize: 11, marginRight: spacing.sm },
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
