import { supabase } from '../supabase';
import { Database } from '../../types/supabase';
import { normalizeSessionSummary } from '../normalize';

type Tables = Database['public']['Tables'];

/**
 * Per-session rollups for the History list. Backed by the
 * session_summary_view migration so the grouping happens in Postgres,
 * not over a Map() in JS.
 */
export const fetchWorkoutSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('session_summary_view')
    .select('*')
    .eq('user_id', userId)
    .order('workout_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(normalizeSessionSummary);
};

/**
 * Distinct workout_dates the user has logged at least one set on, newest first.
 * Used to hydrate gymLogs (streaks, calendar dots) on app load so they survive
 * a refresh.
 */
export const fetchUserWorkoutDates = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('session_summary_view')
    .select('workout_date')
    .eq('user_id', userId)
    .order('workout_date', { ascending: false });

  if (error) throw error;

  const seen = new Set<string>();
  const out: string[] = [];
  (data ?? []).forEach(row => {
    if (row.workout_date && !seen.has(row.workout_date)) {
      seen.add(row.workout_date);
      out.push(row.workout_date);
    }
  });
  return out;
};

export type LoggedExerciseInput = {
  exercise: {
    /** Nullable so callers can pass entries before exercises are matched to
     *  master records; rows missing exercise_id are dropped before insert. */
    exercise_id: string | null;
    order_index: number;
  };
  sets: {
    set_number: number;
    weight?: number;
    reps?: number;
    completed: boolean;
  }[];
};

/**
 * Writes a finished session to Supabase as one workout_sessions parent row
 * plus N workout_sets child rows. If the parent insert succeeds but the set
 * insert fails, the parent row is rolled back so we don't strand an empty
 * session in History.
 */
export const logWorkoutSession = async (
  session: {
    user_id: string;
    date: string;
    name: string;
    start_time?: string | null;
    end_time?: string | null;
    plan_id?: string | null;
    plan_session_id?: string | null;
  },
  exercises: LoggedExerciseInput[]
) => {
  const setRows: Omit<Tables['workout_sets']['Insert'], 'session_id'>[] = [];
  let totalVolume = 0;

  for (const exData of exercises) {
    if (!exData.exercise.exercise_id) {
      console.warn('logWorkoutSession: dropping exercise without exercise_id');
      continue;
    }
    const exerciseId = exData.exercise.exercise_id;
    for (const setData of exData.sets) {
      setRows.push({
        exercise_id: exerciseId,
        order_index: exData.exercise.order_index,
        set_number: setData.set_number,
        weight: setData.weight ?? null,
        reps: setData.reps ?? null,
        completed: setData.completed,
      });
      totalVolume += (setData.weight ?? 0) * (setData.reps ?? 0);
    }
  }

  if (setRows.length === 0) return null;

  const { data: parent, error: parentError } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: session.user_id,
      plan_id: session.plan_id ?? null,
      plan_session_id: session.plan_session_id ?? null,
      workout_date: session.date,
      name: session.name,
      start_time: session.start_time ?? null,
      end_time: session.end_time ?? null,
    })
    .select()
    .single();

  if (parentError) throw parentError;

  const { error: setsError } = await supabase
    .from('workout_sets')
    .insert(setRows.map(r => ({ ...r, session_id: parent.id })));

  if (setsError) {
    // Roll back the parent so the session doesn't show up as empty in History.
    await supabase.from('workout_sessions').delete().eq('id', parent.id);
    throw setsError;
  }

  return {
    id: parent.id,
    user_id: parent.user_id,
    date: parent.workout_date,
    name: parent.name,
    start_time: parent.start_time,
    end_time: parent.end_time,
    plan_id: parent.plan_id,
    plan_session_id: parent.plan_session_id,
    total_sets: setRows.length,
    volume_load: totalVolume,
    status: 'completed' as const,
    created_at: parent.created_at,
  };
};
