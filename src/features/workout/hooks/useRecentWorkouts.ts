import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

export type RecentWorkout = {
  /** Locale-formatted date for display ("5/1/2026"). */
  date: string;
  /** ISO date (YYYY-MM-DD), stable across timezones. */
  dateStr: string;
  exercises: number;
  volume: number;
  /** Display label for the calendar tile — session name plus a count of
   *  additional exercises when the session has more than one. */
  name: string;
};

/** YYYY-MM-DD in the user's local timezone. `new Date('YYYY-MM-DD')`
 *  parses as UTC midnight and renders the prior day in negative-offset
 *  zones, so build a local Date from the components instead. */
const localDateFromISO = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

const todayLocalISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
        // Compute the cutoff in local time so users near midnight in
        // negative-offset zones don't get a one-day-shifted window.
        const today = todayLocalISO();
        const cutoff = localDateFromISO(today);
        cutoff.setDate(cutoff.getDate() - daysBack);
        const sinceStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;

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
            date: localDateFromISO(r.workout_date).toLocaleDateString(),
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
