/**
 * Row normalizers — single source of truth for DB-row → app-shape
 * conversions. The DB returns snake_case; the app speaks camelCase.
 * Centralizing the mapping here means a column rename only edits one
 * place, and adding a column doesn't silently get dropped because some
 * call site forgot to map it.
 *
 * Inline mappings should not exist anywhere else in the codebase.
 * Reach for these helpers instead.
 */

import type { Database } from '../types/supabase';
import type { UserWorkoutPlan, WorkoutPlan } from '../types/workout';

/** user_workout_plans + (optional) embedded plan from PostgREST. */
type UserWorkoutPlanJoinedRow =
  Database['public']['Tables']['user_workout_plans']['Row']
  & { plan?: WorkoutPlan | null };

/**
 * user_workout_plans row + (optional) embedded `plan` join → app's
 * UserWorkoutPlan instance shape. The embedded plan only carries
 * top-level workout_plans columns (no schedule/sessions/exercises);
 * callers that need the full tree must hydrate via fetchWorkoutPlanDetails.
 *
 * `endsAt` / `updatedAt` stay on the output type for callers but are
 * always `undefined` — the underlying table doesn't store them.
 */
export const normalizeUserWorkoutPlan = (
  row: UserWorkoutPlanJoinedRow,
): UserWorkoutPlan => ({
  id: row.id,
  userId: row.user_id,
  planId: row.plan_id,
  planData: row.plan ?? undefined,
  customName: row.custom_name ?? undefined,
  startedAt: row.started_at,
  endsAt: undefined,
  isActive: !!row.is_active,
  createdAt: row.created_at,
  updatedAt: undefined,
});

type SessionSummaryRow = Database['public']['Views']['session_summary_view']['Row'];

/**
 * Output of `normalizeSessionSummary` — the History list / gymLogs
 * hydration shape. Numeric coercion on volume_load + null-coalesce on
 * notes happen here so callers don't repeat them.
 */
export type NormalizedSessionSummary = {
  id: string;
  user_id: string;
  date: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  plan_id: string | null;
  plan_session_id: string | null;
  total_sets: number;
  exercise_count: number;
  volume_load: number;
  duration_seconds: number | null;
  status: 'empty' | 'completed' | 'incomplete';
  notes: string | null;
  created_at: string;
};

/**
 * session_summary_view row → the WorkoutSession-ish shape the History
 * list and gymLogs hydration consume. The view already pre-aggregates
 * total_sets / exercise_count / volume_load so callers don't re-fold
 * over workout_sets in JS.
 */
export const normalizeSessionSummary = (
  row: SessionSummaryRow,
): NormalizedSessionSummary => ({
  id: row.id,
  user_id: row.user_id,
  date: row.workout_date,
  name: row.session_name,
  start_time: row.start_time,
  end_time: row.end_time,
  plan_id: row.plan_id,
  plan_session_id: row.plan_session_id,
  total_sets: row.total_sets,
  exercise_count: row.exercise_count,
  volume_load: Number(row.volume_load) || 0,
  duration_seconds: row.duration_seconds,
  status: row.status,
  notes: row.notes ?? null,
  created_at: row.start_time ?? new Date().toISOString(),
});
