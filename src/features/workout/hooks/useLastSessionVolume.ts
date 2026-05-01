import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

export type LastVolume = {
  /** Volume load (sum of weight × reps) of the prior session of same type. */
  volume: number | null;
  /** ISO date of that session, for context. */
  date: string | null;
  loading: boolean;
};

const EMPTY: LastVolume = { volume: null, date: null, loading: false };

/**
 * Looks up the user's most recent prior workout session matching the current
 * session's "type" — preferring plan_session_id when available (so two
 * different "Push Day" plan-sessions don't collide), falling back to
 * session name when there's no plan linkage.
 *
 * Used by the GymView hero to render the "▲ +1,180 vs last leg day" delta.
 */
export const useLastSessionVolume = (
  userId: string | null | undefined,
  planSessionId: string | null | undefined,
  sessionName: string | null | undefined,
  /** ISO date of the *current* session — excludes itself from the lookup. */
  currentDate: string | null | undefined
): LastVolume => {
  const [state, setState] = useState<LastVolume>(EMPTY);

  useEffect(() => {
    if (!userId) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setState(s => ({ ...s, loading: true }));
      try {
        // Build the query against session_summary_view (volume_load is
        // pre-aggregated; never re-aggregate in JS — see CLAUDE.md).
        let q = supabase
          .from('session_summary_view')
          .select('volume_load, workout_date, plan_session_id, session_name')
          .eq('user_id', userId)
          .order('workout_date', { ascending: false })
          .limit(1);

        if (planSessionId) {
          q = q.eq('plan_session_id', planSessionId);
        } else if (sessionName) {
          q = q.eq('session_name', sessionName).is('plan_session_id', null);
        } else {
          // Nothing to match against — bail.
          if (!cancelled) setState(EMPTY);
          return;
        }

        if (currentDate) {
          q = q.lt('workout_date', currentDate);
        }

        const { data } = await q;
        const row: any = data?.[0];
        if (!row) {
          if (!cancelled) setState(EMPTY);
          return;
        }

        if (cancelled) return;
        setState({
          volume: Number(row.volume_load ?? 0) || 0,
          date: row.workout_date ?? null,
          loading: false,
        });
      } catch {
        if (!cancelled) setState(EMPTY);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, planSessionId, sessionName, currentDate]);

  return state;
};
