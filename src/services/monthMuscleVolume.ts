import { supabase } from './supabase';
import type { MuscleId } from '../features/analytics/heatmap/muscleRegions';

export type DayMuscleVolume = {
  byMuscle: Partial<Record<MuscleId, number>>;
  intensities: Partial<Record<MuscleId, number>>;
};

/**
 * Reads `muscle_volume_v2_view` over a date range and groups by workout_date,
 * collapsing multiple sessions per day into one map. Intensities are
 * normalized per-day (peak muscle for that day = 1.0) so a calendar grid
 * shows relative emphasis day-to-day rather than absolute volume.
 *
 * The view is RLS-fenced (security_invoker = on) so this only ever returns
 * the caller's own rows.
 *
 * @param userId  caller — passed for index pruning, redundant under RLS
 * @param startIso inclusive YYYY-MM-DD
 * @param endIso   inclusive YYYY-MM-DD
 */
export const fetchMonthMuscleVolume = async (
  userId: string,
  startIso: string,
  endIso: string,
): Promise<Map<string, DayMuscleVolume>> => {
  const { data, error } = await supabase
    .from('muscle_volume_v2_view')
    .select('workout_date, muscle_id, effective_volume')
    .eq('user_id', userId)
    .gte('workout_date', startIso)
    .lte('workout_date', endIso);

  if (error) throw error;

  const byDay = new Map<string, Partial<Record<MuscleId, number>>>();
  (data ?? []).forEach(row => {
    const date = String(row.workout_date);
    const muscle = row.muscle_id as MuscleId;
    const map = byDay.get(date) ?? {};
    map[muscle] = (map[muscle] ?? 0) + Number(row.effective_volume);
    byDay.set(date, map);
  });

  const out = new Map<string, DayMuscleVolume>();
  byDay.forEach((byMuscle, date) => {
    const max = Math.max(0, ...Object.values(byMuscle).map(v => v ?? 0));
    const intensities: Partial<Record<MuscleId, number>> = {};
    if (max > 0) {
      (Object.keys(byMuscle) as MuscleId[]).forEach(k => {
        intensities[k] = (byMuscle[k] ?? 0) / max;
      });
    }
    out.set(date, { byMuscle, intensities });
  });
  return out;
};
