import { supabase } from './supabase';
import type { MuscleId } from '../features/analytics/heatmap/muscleRegions';

export type SessionMuscleVolumeRow = {
  muscle_id: MuscleId;
  effective_volume: number;
  effective_sets: number;
};

export type SessionMuscleVolume = {
  byMuscle: Partial<Record<MuscleId, number>>;
  intensities: Partial<Record<MuscleId, number>>;
  totalVolume: number;
  totalSets: number;
};

/**
 * Reads `muscle_volume_v2_view` for a single workout_session_id and returns
 * both raw effective volume per muscle and a normalized [0,1] intensity map
 * suitable for the body silhouette / share card.
 */
export const fetchSessionMuscleVolume = async (
  sessionId: string
): Promise<SessionMuscleVolume> => {
  const { data, error } = await supabase
    .from('muscle_volume_v2_view')
    .select('muscle_id, effective_volume, effective_sets')
    .eq('workout_session_id', sessionId);

  if (error) throw error;

  const byMuscle: Partial<Record<MuscleId, number>> = {};
  let totalVolume = 0;
  let totalSets = 0;

  (data ?? []).forEach(row => {
    const id = row.muscle_id as MuscleId;
    byMuscle[id] = (byMuscle[id] ?? 0) + Number(row.effective_volume);
    totalVolume += Number(row.effective_volume);
    totalSets += Number(row.effective_sets);
  });

  const max = Math.max(0, ...Object.values(byMuscle).map(v => v ?? 0));
  const intensities: Partial<Record<MuscleId, number>> = {};
  if (max > 0) {
    (Object.keys(byMuscle) as MuscleId[]).forEach(k => {
      intensities[k] = (byMuscle[k] ?? 0) / max;
    });
  }

  return { byMuscle, intensities, totalVolume, totalSets };
};
