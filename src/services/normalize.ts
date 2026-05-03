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

import type { UserWorkoutPlan } from '../types/workout';

/**
 * user_workout_plans row + (optional) embedded `plan` join → app's
 * UserWorkoutPlan instance shape. The embedded plan only carries
 * top-level workout_plans columns (no schedule/sessions/exercises);
 * callers that need the full tree must hydrate via fetchWorkoutPlanDetails.
 */
export const normalizeUserWorkoutPlan = (row: any): UserWorkoutPlan => ({
  id: row.id,
  userId: row.user_id,
  planId: row.plan_id,
  planData: row.plan ?? undefined,
  customName: row.custom_name ?? undefined,
  startedAt: row.started_at,
  endsAt: row.ends_at ?? undefined,
  isActive: !!row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? undefined,
});

/**
 * session_summary_view row → the WorkoutSession-ish shape the History
 * list and gymLogs hydration consume. The view already pre-aggregates
 * total_sets / exercise_count / volume_load so callers don't re-fold
 * over workout_sets in JS.
 */
export const normalizeSessionSummary = (row: any) => ({
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
