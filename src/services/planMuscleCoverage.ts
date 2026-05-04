import { supabase } from './supabase';
import type { MuscleId } from '../features/analytics/heatmap/muscleRegions';

export type PlanMuscleCoverage = {
  /** Sum of (sets × recruitment) per muscle across the entire plan. */
  byMuscle: Partial<Record<MuscleId, number>>;
  /** Same map normalized to [0, 1] — the heaviest-hit muscle is 1. */
  intensities: Partial<Record<MuscleId, number>>;
};

/**
 * Reads `plan_muscle_coverage_view` for a plan and returns recruitment
 * sums + normalized intensities suitable for the body silhouette / share
 * card. Pass `planSessionId` to scope to a single session.
 *
 * The view is recruitment-weighted (primary=1.0 / secondary=0.5) and
 * multiplied by `plan_exercises.sets`, so isolation work doesn't drown
 * out heavy compounds.
 */
export const fetchPlanMuscleCoverage = async (
  planId: string,
  planSessionId?: string
): Promise<PlanMuscleCoverage> => {
  let q = supabase
    .from('plan_muscle_coverage_view')
    .select('muscle_id, recruitment_score')
    .eq('plan_id', planId);
  if (planSessionId) q = q.eq('plan_session_id', planSessionId);

  const { data, error } = await q;
  if (error) throw error;

  const byMuscle: Partial<Record<MuscleId, number>> = {};
  (data ?? []).forEach(row => {
    const id = row.muscle_id as MuscleId;
    byMuscle[id] = (byMuscle[id] ?? 0) + Number(row.recruitment_score);
  });

  const max = Math.max(0, ...Object.values(byMuscle).map(v => v ?? 0));
  const intensities: Partial<Record<MuscleId, number>> = {};
  if (max > 0) {
    (Object.keys(byMuscle) as MuscleId[]).forEach(k => {
      intensities[k] = (byMuscle[k] ?? 0) / max;
    });
  }

  return { byMuscle, intensities };
};
