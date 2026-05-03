import { supabase } from '../supabase';
import { Database } from '../../types/supabase';
import { DayOfWeek, ScheduledSession } from '../../types/workout';
import { resolveExerciseDirectory } from './exercises';

type Tables = Database['public']['Tables'];

export const fetchWorkoutPlans = async () => {
  // RLS handles filtering: own plans + public plans.
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchWorkoutPlanDetails = async (planId: string) => {
  const [planRes, sessionsRes, scheduleRes] = await Promise.all([
    supabase.from('workout_plans').select('*').eq('id', planId).single(),
    supabase.from('plan_sessions').select('*').eq('plan_id', planId).order('order_index'),
    supabase.from('plan_schedule').select('*').eq('plan_id', planId),
  ]);

  if (planRes.error) {
    if (planRes.error.code === 'PGRST116') {
      throw new Error(`Plan ${planId} not found.`);
    }
    throw planRes.error;
  }
  if (sessionsRes.error) throw sessionsRes.error;
  if (scheduleRes.error) throw scheduleRes.error;

  const plan = planRes.data;
  const sessions = sessionsRes.data ?? [];
  const schedule = scheduleRes.data ?? [];

  // Plan sessions own their exercises directly (the legacy template_id
  // coupling was decoupled in commit 52428db and dropped in the greenfield
  // schema).
  const sessionIds = sessions.map(s => s.id);
  const { data: planExercises, error: planExError } = sessionIds.length
    ? await supabase
        .from('plan_exercises')
        .select('*')
        .in('session_id', sessionIds)
        .order('order_index')
    : { data: [] as any[], error: null };

  if (planExError) throw planExError;

  // PostgREST embedded joins to exercises stopped working when the FK
  // was dropped (either master `exercises` or per-user `user_exercises`
  // can satisfy the reference now). Resolve in JS instead.
  const exerciseDir = await resolveExerciseDirectory(
    (planExercises ?? []).map((e: any) => e.exercise_id),
  );

  const transformedSchedule: { [K in DayOfWeek]?: ScheduledSession[] } = {};
  schedule.forEach(entry => {
    const day = entry.day_of_week as DayOfWeek;
    if (!transformedSchedule[day]) transformedSchedule[day] = [];
    transformedSchedule[day]!.push({
      sessionId: entry.session_id,
      order: transformedSchedule[day]!.length + 1,
      isOptional: false,
    });
  });

  const transformedSessions = sessions.map(session => {
    const rows = (planExercises ?? []).filter((e: any) => e.session_id === session.id);

    const exercises = rows
      .map((ex: any) => {
        const dir = exerciseDir.get(ex.exercise_id);
        if (!dir) return null;
        return {
          id: dir.id,
          name: dir.name,
          primaryMuscleGroup: dir.muscle_group,
          secondaryMuscleGroups: [],
          sets: ex.sets,
          reps_min: ex.reps_min,
          reps_max: ex.reps_max,
          repRange: { min: ex.reps_min, max: ex.reps_max },
          restSeconds: ex.rest_seconds ?? 60,
          order: ex.order_index,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return {
      ...session,
      exercises,
      isTemplateReference: false,
    };
  });

  return { ...plan, sessions: transformedSessions, schedule: transformedSchedule };
};

export type PlanSessionInput = {
  session: Tables['plan_sessions']['Insert'];
  exercises: Omit<Tables['plan_exercises']['Insert'], 'session_id'>[];
};

export const createWorkoutPlan = async (
  plan: Tables['workout_plans']['Insert'],
  sessions: PlanSessionInput[],
  schedule: Tables['plan_schedule']['Insert'][]
) => {
  const { data: newPlan, error: planError } = await supabase
    .from('workout_plans')
    .insert(plan)
    .select()
    .single();

  if (planError) throw planError;

  // Map caller-provided session IDs (often temporary client IDs) to the
  // server-generated IDs so we can rewrite the schedule.
  const sessionIdMap = new Map<string, string>();

  for (const { session, exercises } of sessions) {
    const oldId = session.id;
    const insertPayload: Tables['plan_sessions']['Insert'] = {
      ...session,
      plan_id: newPlan.id,
    };
    delete (insertPayload as any).id;

    const { data: newSession, error: sessionError } = await supabase
      .from('plan_sessions')
      .insert(insertPayload)
      .select()
      .single();

    if (sessionError) throw sessionError;
    if (oldId) sessionIdMap.set(oldId, newSession.id);

    if (exercises.length > 0) {
      const rows = exercises.map(ex => ({ ...ex, session_id: newSession.id }));
      const { error: exError } = await supabase.from('plan_exercises').insert(rows);
      if (exError) throw exError;
    }
  }

  if (schedule.length > 0) {
    const rows = schedule.map(s => ({
      plan_id: newPlan.id,
      session_id: sessionIdMap.get(s.session_id) ?? s.session_id,
      day_of_week: s.day_of_week,
      order_index: s.order_index,
    }));
    const { error: schedError } = await supabase.from('plan_schedule').insert(rows);
    if (schedError) throw schedError;
  }

  return newPlan;
};

/**
 * Replace an existing plan's metadata + sessions + schedule with the supplied
 * draft, atomically. Wraps `replace_workout_plan_contents` (Postgres RPC) so
 * the wipe-and-reinsert runs in a single transaction — a client crash mid-
 * flight rolls back instead of leaving the plan with no sessions/schedule.
 *
 * RLS gate: the RPC is SECURITY INVOKER, so the UPDATE on workout_plans still
 * fires `plans_write` (user_id = auth.uid()). Standard plans (user_id null)
 * stay read-only.
 *
 * Historical workout_sessions: their `plan_session_id` FK is `on delete set
 * null` in the schema, so logged workouts retain plan attribution but lose
 * the specific session-template label after an edit. That's intentional —
 * preserving History over a fragile FK is the right trade-off.
 *
 * `sessions` and `schedule` are normalized for the RPC: the schedule
 * references sessions by ordinal index in `sessions[]` instead of UUIDs,
 * since the new session UUIDs don't exist until the RPC inserts them.
 */
export const updateWorkoutPlan = async (
  planId: string,
  plan: Tables['workout_plans']['Update'],
  sessions: PlanSessionInput[],
  schedule: Tables['plan_schedule']['Insert'][]
) => {
  const sessionsPayload = sessions.map((s, i) => ({
    name: s.session.name,
    description: (s.session as any).description,
    focus: (s.session as any).focus,
    order_index: (s.session as any).order_index ?? i + 1,
    exercises: s.exercises.map((ex: any, j: number) => ({
      exercise_id: ex.exercise_id,
      order_index: ex.order_index ?? j + 1,
      sets: ex.sets,
      reps_min: ex.reps_min,
      reps_max: ex.reps_max,
      rest_seconds: ex.rest_seconds,
    })),
  }));

  // Map the caller's session_id (a temp client id used as a join key) to the
  // index in sessionsPayload — the RPC then resolves index → real new UUID.
  const indexById = new Map<string, number>();
  sessions.forEach((s, i) => {
    if (s.session.id) indexById.set(s.session.id as string, i);
  });
  const schedulePayload = schedule
    .map((row) => ({
      session_index: indexById.get(row.session_id as string),
      day_of_week: row.day_of_week,
      order_index: (row as any).order_index ?? 0,
    }))
    .filter((row) => row.session_index !== undefined);

  const planPatch: any = { ...plan };
  delete planPatch.updated_at; // RPC sets it server-side

  const { error } = await supabase.rpc('replace_workout_plan_contents', {
    p_plan_id: planId,
    p_plan_patch: planPatch,
    p_sessions: sessionsPayload,
    p_schedule: schedulePayload,
  });
  if (error) throw error;

  return await fetchWorkoutPlanDetails(planId);
};
