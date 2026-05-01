import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

export type GhostSet = { weight: number | null; reps: number | null };

const EMPTY: GhostSet[] = [];

/**
 * Fetches the user's most recent prior session for `exerciseId` and returns
 * its sets ordered by set_number. Used as ghost-value placeholders so empty
 * inputs hint at what the user did last time.
 */
export const useLastSessionSets = (
  userId: string | null | undefined,
  exerciseId: string | null | undefined
) => {
  const [sets, setSets] = useState<GhostSet[]>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !exerciseId) {
      setSets(EMPTY);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Find the most recent prior session for this user+exercise.
        // Tiebreaker on start_time then created_at so same-day repeats are stable.
        const { data: latestRows } = await supabase
          .from('workout_log')
          .select('workout_date, session_name, start_time, created_at')
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('workout_date', { ascending: false })
          .order('start_time', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false, nullsFirst: false })
          .limit(1);

        const latest = latestRows?.[0];
        if (!latest) {
          if (!cancelled) setSets(EMPTY);
          return;
        }

        const { data: rows } = await supabase
          .from('workout_log')
          .select('set_number, weight, reps')
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId)
          .eq('workout_date', latest.workout_date)
          .eq('session_name', latest.session_name)
          .order('set_number', { ascending: true });

        if (cancelled) return;

        const ordered: GhostSet[] = [];
        (rows ?? []).forEach(r => {
          const idx = Math.max(0, (r.set_number ?? 1) - 1);
          ordered[idx] = { weight: r.weight, reps: r.reps };
        });
        setSets(ordered);
      } catch {
        if (!cancelled) setSets(EMPTY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, exerciseId]);

  return { sets, loading };
};
