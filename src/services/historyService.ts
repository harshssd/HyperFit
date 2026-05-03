import { supabase } from './supabase';
import { resolveExerciseDirectory } from './workoutService';

/**
 * History service — paginated session list + per-session detail fetch
 * for the History tab. Owns the row-shape mapping from
 * `session_summary_view` / `workout_sets` to the camelCase-ish shape the
 * UI consumes.
 *
 * Lives separate from `workoutService/sessions.ts` because the History
 * surface paginates and wants `set_count` / `session_id` aliases that
 * the rest of the app doesn't need. Keeping the alias logic local stops
 * it bleeding into the shared NormalizedSessionSummary.
 */

export type WorkoutSession = {
  id: string;
  name: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_seconds: number | null;
  volume_load: number;
  status: string;
  notes?: string | null;
  exercise_count?: number;
  set_count?: number;
  plan_id?: string | null;
  session_id?: string | null;
};

export type WorkoutLog = {
  id: string;
  session_id: string;
  exercise_id: string | null;
  order_index: number;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe?: number | null;
  notes?: string;
  exercise_name?: string;
  rest_duration_seconds?: number;
};

export type SessionWithLogs = WorkoutSession & {
  logs: WorkoutLog[];
};

const toHistorySession = (r: any): WorkoutSession => ({
  id: r.id,
  name: r.session_name,
  date: r.workout_date,
  start_time: r.start_time,
  end_time: r.end_time,
  duration_seconds: r.duration_seconds,
  volume_load: Number(r.volume_load) || 0,
  status: r.status,
  notes: r.notes,
  exercise_count: r.exercise_count,
  set_count: r.total_sets,
  plan_id: r.plan_id,
  session_id: r.plan_session_id,
});

/**
 * Fetch one page of session summaries newest-first, plus the total count
 * the History pager needs to render its 1..N controls.
 *
 * Range pagination over `session_summary_view` so the client never pulls
 * all rows for power users with hundreds of sessions.
 */
export const fetchUserSessions = async (
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ sessions: WorkoutSession[]; totalCount: number }> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const [{ data: rows, error }, { count, error: countError }] = await Promise.all([
    supabase
      .from('session_summary_view')
      .select('*')
      .eq('user_id', userId)
      .order('workout_date', { ascending: false })
      .order('start_time', { ascending: false, nullsFirst: false })
      .range(from, to),
    supabase
      .from('session_summary_view')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (error) throw error;
  if (countError) throw countError;

  const sessions = (rows ?? []).map(toHistorySession);
  return {
    sessions,
    totalCount: count ?? sessions.length,
  };
};

/**
 * Hydrate one session row + its sets, joining exercise names from either
 * the master `exercises` library or the caller's `user_exercises` (FK on
 * workout_sets.exercise_id was dropped when user_exercises split out).
 */
export const fetchSessionDetails = async (
  sessionId: string,
  userId: string,
): Promise<SessionWithLogs> => {
  const [{ data: parent, error: parentError }, { data: sets, error: setsError }] =
    await Promise.all([
      supabase
        .from('session_summary_view')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single(),
      supabase
        .from('workout_sets')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true })
        .order('set_number', { ascending: true }),
    ]);

  if (parentError) throw parentError;
  if (setsError) throw setsError;
  if (!parent) throw new Error('Session not found');

  const dir = await resolveExerciseDirectory(
    (sets ?? []).map((r: any) => r.exercise_id),
  );

  const logs: WorkoutLog[] = (sets ?? []).map((row: any) => ({
    id: row.id,
    session_id: sessionId,
    exercise_id: row.exercise_id,
    order_index: row.order_index,
    set_number: row.set_number,
    weight: row.weight,
    reps: row.reps,
    notes: undefined,
    exercise_name: dir.get(row.exercise_id)?.name || 'Unknown Exercise',
  }));

  return {
    ...toHistorySession(parent),
    logs,
  };
};
