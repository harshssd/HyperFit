import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

export type GhostSet = { weight: number | null; reps: number | null };

export type LastSession = {
  sets: GhostSet[];
  /** ISO date (YYYY-MM-DD) of the prior session, or null if none. */
  date: string | null;
  loading: boolean;
};

const EMPTY: GhostSet[] = [];

/**
 * Fetches the user's most recent prior session that included `exerciseId`
 * and returns its sets ordered by set_number. Used as ghost-value
 * placeholders so empty inputs hint at what the user did last time.
 *
 * Reads from the new workout_sessions / workout_sets schema:
 *   - find latest session that has any set for this exercise
 *   - return that session's sets for the exercise, ordered by set_number
 */
export const useLastSessionSets = (
  userId: string | null | undefined,
  exerciseId: string | null | undefined
): LastSession => {
  const [sets, setSets] = useState<GhostSet[]>(EMPTY);
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !exerciseId) {
      setSets(EMPTY);
      setDate(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Latest session containing this exercise. Tiebreaker: workout_date
        // desc, then session start_time desc.
        const { data: sessionRows } = await supabase
          .from('workout_sets')
          .select('session_id, session:workout_sessions!inner(workout_date,start_time,user_id)')
          .eq('exercise_id', exerciseId)
          .eq('session.user_id', userId)
          .order('workout_date', { referencedTable: 'session', ascending: false })
          .order('start_time', { referencedTable: 'session', ascending: false, nullsFirst: false })
          .limit(1);

        const latest: any = sessionRows?.[0];
        if (!latest?.session_id) {
          if (!cancelled) {
            setSets(EMPTY);
            setDate(null);
          }
          return;
        }

        const { data: rows } = await supabase
          .from('workout_sets')
          .select('set_number, weight, reps')
          .eq('session_id', latest.session_id)
          .eq('exercise_id', exerciseId)
          .order('set_number', { ascending: true });

        if (cancelled) return;

        const ordered: GhostSet[] = [];
        (rows ?? []).forEach((r: any) => {
          const idx = Math.max(0, (r.set_number ?? 1) - 1);
          ordered[idx] = { weight: r.weight, reps: r.reps };
        });
        setSets(ordered);
        setDate(latest.session?.workout_date ?? null);
      } catch {
        if (!cancelled) {
          setSets(EMPTY);
          setDate(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, exerciseId]);

  return { sets, date, loading };
};
