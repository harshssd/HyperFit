import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

export type Trajectory = {
  /** Up to 8 prior volume_load values (oldest -> newest, EXCLUDING this session). */
  sparkPoints: number[];
  /** Trend signal vs prior series. 'up' = improving, 'down' = regressing. */
  trend: 'up' | 'flat' | 'down' | 'none';
};

export type TrajectoryMap = Record<string, Trajectory>;

/**
 * Pulls the user's last ~100 sessions from session_summary_view and groups
 * them by session "type" (plan_session_id when available, else session_name)
 * to compute a per-session inline sparkline + trend dot for each visible row.
 *
 * Trend rule: compare this session's volume_load vs the average of the prior
 * 8 sessions of the same type. Difference < 5% => flat. Above => up. Below
 * => down. Sessions with fewer than 2 prior of same type get 'none'.
 *
 * One DB read per mount; client-side grouping. Keeps History row rendering
 * cheap even on long history.
 */
export const useSessionTrajectories = (
  userId: string | null | undefined,
  // Bumping this version (or the user) forces a re-fetch — useful when the
  // user just logged a new session and we want the trajectory updated.
  version = 0
): { byId: TrajectoryMap; loading: boolean } => {
  const [byId, setById] = useState<TrajectoryMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setById({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('session_summary_view')
          .select('id, plan_session_id, session_name, volume_load, workout_date, start_time')
          .eq('user_id', userId)
          .order('workout_date', { ascending: true })
          .order('start_time', { ascending: true, nullsFirst: false })
          .limit(200);
        if (error || !data) {
          if (!cancelled) {
            setById({});
            setLoading(false);
          }
          return;
        }

        // Bucket by type-key. Prefer plan_session_id, fall back to session_name.
        const buckets = new Map<string, { id: string; volume: number }[]>();
        for (const r of data as any[]) {
          const key = (r.plan_session_id as string | null) ?? `name:${r.session_name ?? ''}`;
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key)!.push({
            id: String(r.id),
            volume: Number(r.volume_load ?? 0) || 0,
          });
        }

        const map: TrajectoryMap = {};
        for (const series of buckets.values()) {
          for (let i = 0; i < series.length; i++) {
            const prior = series.slice(Math.max(0, i - 8), i);
            const sparkPoints = prior.map(p => p.volume);
            let trend: Trajectory['trend'] = 'none';
            if (prior.length >= 2) {
              const avg = prior.reduce((a, p) => a + p.volume, 0) / prior.length;
              const here = series[i].volume;
              if (avg <= 0) {
                trend = here > 0 ? 'up' : 'flat';
              } else {
                const ratio = here / avg;
                if (ratio > 1.05) trend = 'up';
                else if (ratio < 0.95) trend = 'down';
                else trend = 'flat';
              }
            }
            map[series[i].id] = { sparkPoints, trend };
          }
        }
        if (cancelled) return;
        setById(map);
      } catch {
        if (!cancelled) setById({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  return { byId, loading };
};
