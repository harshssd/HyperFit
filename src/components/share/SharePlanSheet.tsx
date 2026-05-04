import React, { useEffect, useMemo, useState } from 'react';
import { fetchPlanMuscleCoverage } from '../../services/planMuscleCoverage';
import {
  type SharePlanPayload,
} from './ShareableSummaryCard';
import { SharePreviewSheet } from './SharePreviewSheet';
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
 * Thin wrapper around `SharePreviewSheet` that fetches plan-coverage muscle
 * intensities from `plan_muscle_coverage_view` and assembles the
 * `SharePlanPayload` consumed by the preview/capture card.
 */
export const SharePlanSheet = ({ visible, plan, onClose }: Props) => {
  const [intensities, setIntensities] = useState<Partial<Record<MuscleId, number>>>({});
  const [byMuscle, setByMuscle] = useState<Partial<Record<MuscleId, number>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      shareUrl:
        plan.is_shareable && plan.share_code
          ? `hyperfit.app/p/${plan.share_code}`
          : null,
      byMuscle,
      intensities,
    };
  }, [plan, byMuscle, intensities]);

  return (
    <SharePreviewSheet
      visible={visible}
      payload={payload}
      loading={loading}
      error={error}
      onClose={onClose}
    />
  );
};

export default SharePlanSheet;
