import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { MUSCLE_GROUP_TO_REGION, MuscleId } from './muscleRegions';

export type MuscleVolumeBreakdown = {
  /** Total volume per muscle region. */
  byRegion: Partial<Record<MuscleId, number>>;
  /** Each region as a fraction of the heaviest region (0..1) — feed to the heatmap. */
  intensities: Partial<Record<MuscleId, number>>;
  /** Total volume across all regions. */
  total: number;
  /** Distinct (date, muscle_group) bucket count contributing to the breakdown. */
  setCount: number;
};

const EMPTY: MuscleVolumeBreakdown = { byRegion: {}, intensities: {}, total: 0, setCount: 0 };

/**
 * Aggregates per-muscle volume over the last `daysBack` days for the given
 * user. Reads from the `muscle_volume_view` Postgres view (per-day,
 * per-muscle pre-aggregate), then folds in JS to map `exercises.muscle_group`
 * (free text) onto the canonical region space via `MUSCLE_GROUP_TO_REGION`.
 *
 * If `daysBack` is null, aggregates over all time.
 */
export const useMuscleVolume = (userId: string | null | undefined, daysBack: number | null = 7) => {
  const [data, setData] = useState<MuscleVolumeBreakdown>(EMPTY);
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
        let query = supabase
          .from('muscle_volume_view')
          .select('muscle_group, volume, set_count, workout_date')
          .eq('user_id', userId);

        if (daysBack !== null) {
          const since = new Date();
          since.setDate(since.getDate() - daysBack);
          query = query.gte('workout_date', since.toISOString().split('T')[0]);
        }

        const { data: rows, error: rowsError } = await query;
        if (rowsError) throw rowsError;
        if (cancelled) return;

        const byRegion: Partial<Record<MuscleId, number>> = {};
        let total = 0;
        let setCount = 0;

        (rows ?? []).forEach((row: any) => {
          const groupRaw: string | undefined = row.muscle_group;
          if (!groupRaw) return;

          const regions = MUSCLE_GROUP_TO_REGION[groupRaw.trim().toLowerCase()];
          if (!regions || regions.length === 0) return;

          const volume = Number(row.volume) || 0;
          if (volume <= 0) return;

          // Multi-region groups (e.g. "legs") distribute evenly so a leg
          // day doesn't double-count vs an isolation movement.
          const share = volume / regions.length;
          regions.forEach(r => {
            byRegion[r] = (byRegion[r] ?? 0) + share;
          });
          total += volume;
          setCount += Number(row.set_count) || 0;
        });

        const max = Math.max(0, ...Object.values(byRegion).map(v => v ?? 0));
        const intensities: Partial<Record<MuscleId, number>> = {};
        if (max > 0) {
          (Object.keys(byRegion) as MuscleId[]).forEach(k => {
            intensities[k] = (byRegion[k] ?? 0) / max;
          });
        }

        setData({ byRegion, intensities, total, setCount });
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
  }, [userId, daysBack]);

  return { ...data, loading, error };
};
