import { supabase } from './supabase';
import { Database } from '../types/supabase';
import { DayOfWeek, ScheduledSession } from '../types/workout';

/**
 * WORKOUT SERVICE
 * =================
 * All interactions with the normalized workout tables. Schema lives in
 * supabase/migrations/20250101000000_clean_initial_schema.sql.
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

  // Two kinds of sessions: those that reference a session_template, and
  // custom ones whose exercises live in plan_exercises.
  const templateIds = sessions
    .map(s => s.template_id)
    .filter((id): id is string => Boolean(id));
  const customSessionIds = sessions.filter(s => !s.template_id).map(s => s.id);

  const [planExResult, templateExResult] = await Promise.all([
    customSessionIds.length
      ? supabase
          .from('plan_exercises')
          .select('*, exercise:exercises(*)')
          .in('session_id', customSessionIds)
          .order('order_index')
      : Promise.resolve({ data: [], error: null }),
    templateIds.length
      ? supabase
          .from('template_exercises')
          .select('*, exercise:exercises(*)')
          .in('template_id', templateIds)
          .order('order_index')
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (planExResult.error) throw planExResult.error;
  if (templateExResult.error) throw templateExResult.error;

  const planExercises = (planExResult.data ?? []) as any[];
  const templateExercises = (templateExResult.data ?? []) as any[];

  const transformedSchedule: { [K in DayOfWeek]?: ScheduledSession[] } = {};
  schedule.forEach(entry => {
    const day = entry.day_of_week as DayOfWeek;
    if (!transformedSchedule[day]) transformedSchedule[day] = [];
    transformedSchedule[day]!.push({
      sessionId: entry.session_id,
      order: transformedSchedule[day]!.length + 1,
      isOptional: entry.is_optional ?? false,
    });
  });

  const transformedSessions = sessions.map(session => {
    const rows = session.template_id
      ? templateExercises.filter(e => e.template_id === session.template_id)
      : planExercises.filter(e => e.session_id === session.id);

    const exercises = rows.map(ex => ({
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
      isTemplateReference: Boolean(session.template_id),
    };
  });

  return { ...plan, sessions: transformedSessions, schedule: transformedSchedule };
};

// --- Session Templates (reusable workout sessions) ---

export const fetchSessionTemplates = async () => {
  // RLS filters: created_by = auth.uid() or is_public = true.
  const { data, error } = await supabase
    .from('session_templates')
    .select(`
      *,
      exercises:template_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createSessionTemplate = async (
  template: Tables['session_templates']['Insert'],
  exercises: Omit<Tables['template_exercises']['Insert'], 'template_id'>[]
) => {
  const { data: newTemplate, error: templateError } = await supabase
    .from('session_templates')
    .insert(template)
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

    // Custom sessions bring their own exercises; template-backed sessions
    // pull exercises from template_exercises at read time.
    if (!session.template_id && exercises.length > 0) {
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
      is_optional: s.is_optional,
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

// --- Workout logging ---

/**
 * Reads workout_log and groups rows into per-session aggregates client-side.
 * For users with very long histories this should move to a Postgres view or
 * RPC; flagged for slice 4.
 */
export const fetchWorkoutSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('workout_log')
    .select('*')
    .eq('user_id', userId)
    .order('workout_date', { ascending: false });

  if (error) throw error;

  const sessionsMap = new Map<string, {
    id: string;
    user_id: string;
    date: string;
    name: string;
    start_time: string | null;
    end_time: string | null;
    plan_id: string | null;
    session_id: string | null;
    total_sets: number;
    volume_load: number;
    status: 'completed';
    notes: null;
    created_at: string;
  }>();

  (data ?? []).forEach(row => {
    const key = `${row.workout_date}-${row.session_name}`;
    let session = sessionsMap.get(key);
    if (!session) {
      session = {
        id: key,
        user_id: userId,
        date: row.workout_date,
        name: row.session_name,
        start_time: row.start_time,
        end_time: row.end_time,
        plan_id: row.plan_id,
        session_id: row.session_id,
        total_sets: 0,
        volume_load: 0,
        status: 'completed',
        notes: null,
        created_at: row.start_time ?? row.created_at ?? new Date().toISOString(),
      };
      sessionsMap.set(key, session);
    }
    session.total_sets += 1;
    session.volume_load += (row.weight ?? 0) * (row.reps ?? 0);
  });

  return Array.from(sessionsMap.values());
};

export type LoggedExerciseInput = {
  exercise: {
    // Nullable so callers can pass entries before exercises are matched to
    // master records; rows missing exercise_id are dropped before insert.
    exercise_id: string | null;
    user_id: string;
    order_index: number;
    notes?: string;
    muscle_groups?: string[];
    equipment_used?: string;
  };
  sets: {
    set_number: number;
    weight?: number;
    reps?: number;
    rpe?: number;
    completed: boolean;
    rest_duration_seconds?: number;
  }[];
};

export const logWorkoutSession = async (
  session: {
    user_id: string;
    date: string;
    name: string;
    start_time?: string | null;
    end_time?: string | null;
    plan_id?: string | null;
    session_id?: string | null;
  },
  exercises: LoggedExerciseInput[]
) => {
  const rows: Tables['workout_log']['Insert'][] = [];

  for (const exData of exercises) {
    if (!exData.exercise.exercise_id) {
      console.warn('logWorkoutSession: dropping exercise without exercise_id');
      continue;
    }
    const exerciseId = exData.exercise.exercise_id;
    for (const setData of exData.sets) {
      rows.push({
        user_id: session.user_id,
        plan_id: session.plan_id ?? undefined,
        session_id: session.session_id ?? undefined,
        exercise_id: exerciseId,
        workout_date: session.date,
        session_name: session.name,
        start_time: session.start_time ?? undefined,
        end_time: session.end_time ?? undefined,
        set_number: setData.set_number,
        weight: setData.weight,
        reps: setData.reps,
        rpe: setData.rpe,
        rest_duration_seconds: setData.rest_duration_seconds,
        completed: setData.completed,
        notes: exData.exercise.notes,
        muscle_groups: exData.exercise.muscle_groups,
        equipment_used: exData.exercise.equipment_used,
        workout_type: 'planned',
      });
    }
  }

  if (rows.length === 0) return null;

  const { error } = await supabase.from('workout_log').insert(rows);
  if (error) throw error;

  return {
    id: `${session.date}-${session.name}`,
    user_id: session.user_id,
    date: session.date,
    name: session.name,
    start_time: session.start_time,
    end_time: session.end_time,
    plan_id: session.plan_id,
    session_id: session.session_id,
    total_sets: rows.length,
    volume_load: rows.reduce((sum, r) => sum + ((r.weight ?? 0) * (r.reps ?? 0)), 0),
    status: 'completed' as const,
    created_at: new Date().toISOString(),
  };
};
