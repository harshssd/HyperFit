import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

export type RecentWorkout = {
  /** Locale-formatted date for display ("5/1/2026"). */
  date: string;
  /** ISO date (YYYY-MM-DD), stable across timezones. */
  dateStr: string;
  exercises: number;
  volume: number;
  /** "Bench Press +2" — first exercise plus a count of remaining. */
  name: string;
};

const EMPTY: RecentWorkout[] = [];

/**
 * Last `daysBack` days of completed sessions for the user, derived from
 * `session_summary_view`. Replaces the previous in-memory derivation off
 * `data.workouts`, which was never populated and silently produced empty
 * tiles for every date in `gymLogs`.
 *
 * The view already folds workout_sets into one row per session with
 * `total_sets`, `exercise_count`, `volume_load` — never re-aggregate in JS.
 */
export const useRecentWorkouts = (
  userId: string | null | undefined,
  daysBack: number = 30
) => {
  const [data, setData] = useState<RecentWorkout[]>(EMPTY);
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
        since.setDate(since.getDate() - daysBack);
        const sinceStr = since.toISOString().split('T')[0];

        const { data: rows, error: rowsErr } = await supabase
          .from('session_summary_view')
          .select('id, workout_date, session_name, exercise_count, volume_load')
          .eq('user_id', userId)
          .gte('workout_date', sinceStr)
          .order('workout_date', { ascending: false });

        if (rowsErr) throw rowsErr;
        if (cancelled) return;

        const mapped: RecentWorkout[] = (rows ?? []).map((r: any) => {
          const count = Number(r.exercise_count) || 0;
          const baseName: string = r.session_name || 'Workout';
          return {
            date: new Date(r.workout_date).toLocaleDateString(),
            dateStr: r.workout_date,
            exercises: count,
            volume: Number(r.volume_load) || 0,
            name: count > 1 ? `${baseName} +${count - 1}` : baseName,
          };
        });

        setData(mapped);
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

  return { recentWorkouts: data, loading, error };
};
