import { supabase } from './supabase';
import { Database } from '../types/supabase';
import { DayOfWeek, ScheduledSession } from '../types/workout';

/**
 * WORKOUT SERVICE
 * =================
 * All interactions with the normalized workout tables. Schema lives in
 * supabase/migrations/20260430000000_initial_schema.sql.
 */

type Tables = Database['public']['Tables'];

// --- Exercises ---

export const fetchExercises = async () => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

export const createExercise = async (exercise: Tables['exercises']['Insert']) => {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- Workout Plans ---

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
        .select('*, exercise:exercises(*)')
        .in('session_id', sessionIds)
        .order('order_index')
    : { data: [] as any[], error: null };

  if (planExError) throw planExError;

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

    const exercises = rows.map((ex: any) => ({
      id: ex.exercise.id,
      name: ex.exercise.name,
      primaryMuscleGroup: ex.exercise.muscle_group,
      secondaryMuscleGroups: [],
      sets: ex.sets,
      reps_min: ex.reps_min,
      reps_max: ex.reps_max,
      repRange: { min: ex.reps_min, max: ex.reps_max },
      restSeconds: ex.rest_seconds ?? 60,
      order: ex.order_index,
    }));

    return {
      ...session,
      exercises,
      isTemplateReference: false,
    };
  });

  return { ...plan, sessions: transformedSessions, schedule: transformedSchedule };
};

// --- Session Templates (reusable plan sessions, kind = 'plan_session') ---

export const fetchSessionTemplates = async () => {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      exercises:template_exercises (
        *,
        exercise:exercises (*)
      )
    `)
    .eq('kind', 'plan_session')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createSessionTemplate = async (
  template: Omit<Tables['templates']['Insert'], 'kind'>,
  exercises: Omit<Tables['template_exercises']['Insert'], 'template_id'>[]
) => {
  const { data: newTemplate, error: templateError } = await supabase
    .from('templates')
    .insert({ ...template, kind: 'plan_session' })
    .select()
    .single();

  if (templateError) throw templateError;

  if (exercises.length > 0) {
    const rows = exercises.map(ex => ({ ...ex, template_id: newTemplate.id }));
    const { error: exError } = await supabase.from('template_exercises').insert(rows);
    if (exError) throw exError;
  }

  return newTemplate;
};

// --- Plan creation ---

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

// --- User Workout Plans ---

export const fetchUserWorkoutPlans = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_workout_plans')
    .select('*, plan:workout_plans(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

export const createUserWorkoutPlan = async (userPlan: Tables['user_workout_plans']['Insert']) => {
  const { data, error } = await supabase
    .from('user_workout_plans')
    .insert(userPlan)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Server-side deactivation of every is_active row for a user, optionally
 * excluding one plan_id. Use this before activating a plan so the unique
 * partial index (one is_active row per user) can never collide on a stale
 * local cache.
 */
export const deactivateUserWorkoutPlans = async (
  userId: string,
  exceptPlanId?: string
) => {
  let query = supabase
    .from('user_workout_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);
  if (exceptPlanId) query = query.neq('plan_id', exceptPlanId);
  const { error } = await query;
  if (error) throw error;
};

export const updateUserWorkoutPlan = async (
  id: string,
  updates: Tables['user_workout_plans']['Update']
) => {
  const { data, error } = await supabase
    .from('user_workout_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- Plan moderation ---

/**
 * Flip review_status on a plan the caller owns. The DB enforces that the
 * only legal user-driven transitions are private<->pending_review (with
 * is_public=false); approve_plan / reject_plan are admin-only RPCs.
 */
export const setPlanReviewStatus = async (
  planId: string,
  next: 'private' | 'pending_review'
) => {
  // Defense in depth: the type narrows callers to two values, but a future
  // dynamic call site could pass something else and PostgREST would silently
  // no-op on `{review_status: undefined}`.
  if (next !== 'private' && next !== 'pending_review') {
    throw new Error(`setPlanReviewStatus: invalid status ${next}`);
  }
  const { data, error } = await supabase
    .from('workout_plans')
    .update({ review_status: next })
    .eq('id', planId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// --- Plan sharing ---

/** Toggle whether the plan accepts incoming share-by-code lookups. */
export const setPlanShareable = async (planId: string, value: boolean) => {
  const { data, error } = await supabase
    .from('workout_plans')
    .update({ is_shareable: value })
    .eq('id', planId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Server-side gen_random_uuid swap; old links 404 immediately. */
export const rotatePlanShareCode = async (planId: string) => {
  const { data, error } = await supabase.rpc('rotate_plan_share_code', { p_plan_id: planId });
  if (error) throw error;
  return data as string;
};

/**
 * Resolve a share code to a plan blob (plan + sessions + exercises +
 * schedule). Returns null if the code is unknown or sharing was revoked.
 * Backed by the get_plan_by_share_code SECURITY DEFINER RPC.
 */
export const getPlanByShareCode = async (code: string) => {
  const { data, error } = await supabase.rpc('get_plan_by_share_code', { p_code: code });
  if (error) throw error;
  return data as null | {
    id: string;
    name: string;
    description: string | null;
    frequency: number | null;
    equipment: string | null;
    duration: string | null;
    difficulty: string | null;
    tags: string[];
    sessions: any[];
    schedule: any[];
  };
};

/** Clone a shared plan tree under the calling user. Returns the new id. */
export const importSharedPlan = async (code: string) => {
  const { data, error } = await supabase.rpc('import_shared_plan', { p_code: code });
  if (error) throw error;
  return data as string;
};

// --- Workout logging ---

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

  return (data ?? []).map(row => ({
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
  }));
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
