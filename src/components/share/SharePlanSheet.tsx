import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Share2, X } from 'lucide-react-native';
import { BodySilhouette } from '../../features/analytics/heatmap/BodySilhouette';
import { palette, text, spacing } from '../../styles/theme';
import { fetchPlanMuscleCoverage } from '../../services/planMuscleCoverage';
import {
  ShareableSummaryCard,
  type SharePlanPayload,
} from './ShareableSummaryCard';
import { useShareCard } from './useShareCard';
import type { MuscleId } from '../../features/analytics/heatmap/muscleRegions';
import type { WorkoutPlan } from '../../types/workout';

type Props = {
  visible: boolean;
  plan: WorkoutPlan | null;
  onClose: () => void;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const sumExercises = (plan: WorkoutPlan) =>
  (plan.sessions ?? []).reduce((n, s) => n + (s.exercises?.length ?? 0), 0);

/**
 * Modal that previews a plan's recruitment-weighted body coverage and offers
 * a system-share button. Reuses ShareableSummaryCard in `kind: 'plan'` mode
 * and useShareCard for the capture-and-share flow.
 */
export const SharePlanSheet = ({ visible, plan, onClose }: Props) => {
  const [intensities, setIntensities] = useState<Partial<Record<MuscleId, number>>>({});
  const [byMuscle, setByMuscle] = useState<Partial<Record<MuscleId, number>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ref, share, state } = useShareCard();

  useEffect(() => {
    if (!visible || !plan) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Clear prior plan's coverage so a re-open for a different plan doesn't
    // briefly render the wrong silhouette while the new fetch is in flight.
    setIntensities({});
    setByMuscle({});
    fetchPlanMuscleCoverage(plan.id)
      .then(coverage => {
        if (cancelled) return;
        setIntensities(coverage.intensities);
        setByMuscle(coverage.byMuscle);
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load plan coverage.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, plan]);

  const payload: SharePlanPayload | null = useMemo(() => {
    if (!plan) return null;
    const sessionsPerWeek = plan.frequency || (plan.sessions?.length ?? 0);
    return {
      kind: 'plan',
      title: plan.name || 'WORKOUT PLAN',
      date: formatDate(new Date()),
      subtitle: `${sessionsPerWeek}-DAY SPLIT`,
      sessionsPerWeek,
      exerciseCount: sumExercises(plan),
      muscleCount: Object.values(byMuscle).filter(v => (v ?? 0) > 0).length,
      durationWeeks: typeof plan.duration === 'number' ? plan.duration : null,
      byMuscle,
      intensities,
    };
  }, [plan, byMuscle, intensities]);

  const shareDisabled =
    !plan || loading || !!error || state === 'capturing' || state === 'sharing';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SHARE PLAN</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
            <X size={22} color={text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {loading ? (
            <View style={styles.statusBlock}>
              <ActivityIndicator color={palette.liftActive} />
              <Text style={styles.statusText}>Computing coverage…</Text>
            </View>
          ) : error ? (
            <View style={styles.statusBlock}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : payload ? (
            <>
              <Text style={styles.previewLabel}>PREVIEW</Text>
              {/* Visible preview at scale — same intensities the share card uses. */}
              <View style={styles.previewRow}>
                <View style={styles.previewCol}>
                  <Text style={styles.previewSide}>FRONT</Text>
                  <BodySilhouette view="front" intensities={payload.intensities} size={140} />
                </View>
                <View style={styles.previewCol}>
                  <Text style={styles.previewSide}>BACK</Text>
                  <BodySilhouette view="back" intensities={payload.intensities} size={140} />
                </View>
              </View>
              <Text style={styles.previewMeta}>
                {payload.subtitle} · {payload.exerciseCount} lifts · {payload.muscleCount} muscles
              </Text>
            </>
          ) : null}

          <TouchableOpacity
            onPress={share}
            disabled={shareDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: shareDisabled }}
            style={[styles.shareButton, shareDisabled && styles.shareButtonDisabled]}
          >
            {state === 'capturing' || state === 'sharing' ? (
              <ActivityIndicator size="small" color={palette.liftActive} />
            ) : (
              <Share2 size={16} color={palette.liftActive} />
            )}
            <Text style={styles.shareLabel}>
              {state === 'capturing'
                ? 'CAPTURING…'
                : state === 'sharing'
                  ? 'SHARING…'
                  : 'SHARE PLAN'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Off-screen capture target. Pinned at the natural 1080x1350 size; the
            negative offset keeps it out of the layout box without unmounting. */}
        <View pointerEvents="none" style={styles.captureHost}>
          {payload && <ShareableSummaryCard ref={ref} payload={payload} />}
        </View>
      </View>
    </Modal>
  );
};

export default SharePlanSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
  },
  headerTitle: {
    color: text.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    fontFamily: 'monospace',
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  statusBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  statusText: {
    color: text.tertiary,
    fontSize: 13,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  previewLabel: {
    color: text.quaternary,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: palette.surface,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  previewCol: {
    alignItems: 'center',
  },
  previewSide: {
    color: text.quaternary,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 6,
  },
  previewMeta: {
    color: text.tertiary,
    fontSize: 13,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.liftActive,
    borderRadius: 8,
    marginTop: spacing.md,
    backgroundColor: 'rgba(252, 76, 2, 0.08)',
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareLabel: {
    color: palette.liftActive,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  captureHost: {
    position: 'absolute',
    left: -10000,
    top: -10000,
  },
});
