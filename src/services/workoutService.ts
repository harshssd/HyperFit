import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';
import { WorkoutPlan, UserWorkoutPlan, ActiveWorkoutSession, WorkoutExercise } from '../types/workout';

// TypedSupabaseClient
type SupabaseClient = typeof supabase;

/**
 * WORKOUT SERVICE
 * =================
 * Handles all interactions with the normalized workout database tables.
 */

// --- Exercises ---

export const fetchExercises = async () => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};

export const createExercise = async (exercise: Database['public']['Tables']['exercises']['Insert']) => {
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
  // Fetch public plans and user's plans
  // Note: RLS policies handle the filtering (auth.uid() = user_id OR is_public = true)
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchWorkoutPlanDetails = async (planId: string) => {
  // Fetch plan with nested sessions, exercises, and schedule
  // Note: Supabase JS doesn't support deep nested joins easily in one query for this structure 
  // without precise foreign key hints or views. 
  // We'll fetch related data in parallel or sequence for now to ensure correctness.
  
  const planPromise = supabase.from('workout_plans').select('*').eq('id', planId).single();
  const sessionsPromise = supabase.from('plan_sessions').select('*').eq('plan_id', planId).order('order_index');
  const schedulePromise = supabase.from('plan_schedule').select('*').eq('plan_id', planId);
  
  const [planRes, sessionsRes, scheduleRes] = await Promise.all([planPromise, sessionsPromise, schedulePromise]);
  
  if (planRes.error) throw planRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (scheduleRes.error) throw scheduleRes.error;
  
  const plan = planRes.data;
  const sessions = sessionsRes.data;
  const schedule = scheduleRes.data;
  
  // Fetch exercises for all sessions
  const sessionIds = sessions.map(s => s.id);
  let planExercises: any[] = [];
  
  if (sessionIds.length > 0) {
    const { data: exercises, error: exError } = await supabase
      .from('plan_exercises')
      .select('*, exercise:exercises(*)') // Join with master exercises
      .in('session_id', sessionIds)
      .order('order_index');
      
    if (exError) throw exError;
    planExercises = exercises;
  }
  
  // Assemble the full plan object structure matching internal types if needed
  // For now returning raw normalized data might be better for the service
  return {
    ...plan,
    sessions: sessions.map(session => ({
      ...session,
      exercises: planExercises.filter(e => e.session_id === session.id)
    })),
    schedule: schedule
  };
};

export const createWorkoutPlan = async (
  plan: Database['public']['Tables']['workout_plans']['Insert'],
  sessions: {
    session: Database['public']['Tables']['plan_sessions']['Insert'],
    exercises: Database['public']['Tables']['plan_exercises']['Insert'][]
  }[],
  schedule: Database['public']['Tables']['plan_schedule']['Insert'][]
) => {
  // 1. Create Plan
  const { data: newPlan, error: planError } = await supabase
    .from('workout_plans')
    .insert(plan)
    .select()
    .single();
    
  if (planError) throw planError;
  
  // 2. Create Sessions and Exercises
  for (const sessionData of sessions) {
    const { data: newSession, error: sessionError } = await supabase
      .from('plan_sessions')
      .insert({ ...sessionData.session, plan_id: newPlan.id })
      .select()
      .single();
      
    if (sessionError) throw sessionError;
    
    if (sessionData.exercises.length > 0) {
      const exercisesWithIds = sessionData.exercises.map(ex => ({
        ...ex,
        session_id: newSession.id
      }));
      
      const { error: exError } = await supabase
        .from('plan_exercises')
        .insert(exercisesWithIds);
        
      if (exError) throw exError;
    }
  }
  
  // 3. Create Schedule
  if (schedule.length > 0) {
    const scheduleWithId = schedule.map(s => ({ ...s, plan_id: newPlan.id }));
    const { error: schedError } = await supabase
      .from('plan_schedule')
      .insert(scheduleWithId);
      
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

export const createUserWorkoutPlan = async (userPlan: Database['public']['Tables']['user_workout_plans']['Insert']) => {
  const { data, error } = await supabase
    .from('user_workout_plans')
    .insert(userPlan)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateUserWorkoutPlan = async (id: string, updates: Database['public']['Tables']['user_workout_plans']['Update']) => {
  const { data, error } = await supabase
    .from('user_workout_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// --- Workout Sessions (Logging) ---

export const fetchWorkoutSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const logWorkoutSession = async (
  session: Database['public']['Tables']['workout_sessions']['Insert'],
  exercises: {
    exercise: Database['public']['Tables']['workout_exercises']['Insert'],
    sets: Database['public']['Tables']['workout_sets']['Insert'][]
  }[]
) => {
  // 1. Create Session
  const { data: newSession, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert(session)
    .select()
    .single();
    
  if (sessionError) throw sessionError;
  
  // 2. Create Exercises and Sets
  for (const exData of exercises) {
    const { data: newExercise, error: exError } = await supabase
      .from('workout_exercises')
      .insert({ ...exData.exercise, session_id: newSession.id })
      .select()
      .single();
      
    if (exError) throw exError;
    
    if (exData.sets.length > 0) {
      const setsWithId = exData.sets.map(s => ({
        ...s,
        exercise_id: newExercise.id
      }));
      
      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(setsWithId);
        
      if (setsError) throw setsError;
    }
  }
  
  return newSession;
};

