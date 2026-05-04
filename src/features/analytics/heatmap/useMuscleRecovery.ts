import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import type { MuscleId } from './muscleRegions';

export type MuscleRecovery = {
  /** Decayed fatigue per muscle (sum of recent volume × exp-decay). */
  byMuscle: Partial<Record<MuscleId, number>>;
  /** Per-muscle 0..1 score normalized to the most-fatigued muscle. */
  intensities: Partial<Record<MuscleId, number>>;
  /** Number of muscles with any non-zero fatigue. */
  fatiguedCount: number;
};

const EMPTY: MuscleRecovery = { byMuscle: {}, intensities: {}, fatiguedCount: 0 };

const DEFAULT_HALF_LIFE_HOURS = 48;
const DEFAULT_LOOKBACK_DAYS = 7;

/**
 * Per-muscle recovery / fatigue model. Reads `muscle_volume_v2_view` rows
 * for the last `lookbackDays` days, weights each row by an exponential
 * decay since the workout date (`half_life = halfLifeHours`), and returns
 * a `[0, 1]` intensity map normalized to the most-fatigued muscle.
 *
 * Hot = recently trained, still recovering. Faded = ready to train. The
 * complement of `useMuscleVolume`'s "what did I hit recently" — recovery
 * mode tells you "what should I leave alone today."
 *
 * Decay is computed in JS (no view changes) so the half-life can be tuned
 * per-call without a migration. workout_date is treated as midnight local;
 * good enough for a coaching cue, not a clinical model.
 */
export const useMuscleRecovery = (
  userId: string | null | undefined,
  lookbackDays: number = DEFAULT_LOOKBACK_DAYS,
  halfLifeHours: number = DEFAULT_HALF_LIFE_HOURS,
) => {
  const [data, setData] = useState<MuscleRecovery>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setData(EMPTY);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const since = new Date();
        since.setDate(since.getDate() - lookbackDays);
        const sinceIso = since.toISOString().split('T')[0];

        const { data: rows, error: rowsError } = await supabase
          .from('muscle_volume_v2_view')
          .select('muscle_id, effective_volume, workout_date')
          .eq('user_id', userId)
          .gte('workout_date', sinceIso);

        if (rowsError) throw rowsError;
        if (cancelled) return;

        const now = Date.now();
        const lambda = Math.LN2 / (halfLifeHours * 3600 * 1000); // ms^-1

        const byMuscle: Partial<Record<MuscleId, number>> = {};
        (rows ?? []).forEach((row: any) => {
          const id = row.muscle_id as MuscleId;
          const volume = Number(row.effective_volume) || 0;
          if (volume <= 0) return;

          // Treat workout_date as midnight local, then weight by elapsed
          // ms since. A 48h half-life means a 4-set squat from 2 days ago
          // contributes ~50% of its volume to today's fatigue score.
          const ts = new Date(row.workout_date).getTime();
          const elapsed = Math.max(0, now - ts);
          const weight = Math.exp(-lambda * elapsed);

          byMuscle[id] = (byMuscle[id] ?? 0) + volume * weight;
        });

        const max = Math.max(0, ...Object.values(byMuscle).map(v => v ?? 0));
        const intensities: Partial<Record<MuscleId, number>> = {};
        if (max > 0) {
          (Object.keys(byMuscle) as MuscleId[]).forEach(k => {
            intensities[k] = (byMuscle[k] ?? 0) / max;
          });
        }

        const fatiguedCount = Object.values(byMuscle).filter(v => (v ?? 0) > 0).length;
        setData({ byMuscle, intensities, fatiguedCount });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, lookbackDays, halfLifeHours]);

  return { ...data, loading, error };
};
