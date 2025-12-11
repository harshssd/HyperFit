import { supabase } from './supabase';
import { Database } from '../types/supabase';
import { WorkoutPlan, UserWorkoutPlan, ActiveWorkoutSession, WorkoutExercise, DayOfWeek, ScheduledSession } from '../types/workout';

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

  // Handle case where plan doesn't exist
  if (planRes.error) {
    if (planRes.error.code === 'PGRST116') {
      throw new Error(`Plan with ID ${planId} not found in database. This plan may have been deleted or never existed.`);
    }
    throw planRes.error;
  }

  if (sessionsRes.error) throw sessionsRes.error;
  if (scheduleRes.error) throw scheduleRes.error;
  
  const plan = planRes.data;
  const sessions = sessionsRes.data;
  const schedule = scheduleRes.data;
  
  // Fetch exercises for all sessions
  // Need to handle both regular sessions and library-referenced sessions
  const sessionIds = sessions.map(s => s.id);
  const librarySessionIds = sessions.filter(s => s.library_session_id).map(s => s.library_session_id);
  
  let planExercises: any[] = [];
  let libraryExercises: any[] = [];
  
  // Fetch exercises for custom (non-library) sessions
  const customSessionIds = sessions.filter(s => !s.library_session_id).map(s => s.id);
  if (customSessionIds.length > 0) {
    const { data: exercises, error: exError } = await supabase
      .from('plan_exercises')
      .select('*, exercise:exercises(*)') // Join with master exercises
      .in('session_id', customSessionIds)
      .order('order_index');
      
    if (exError) throw exError;
    planExercises = exercises || [];
  }
  
  // Fetch exercises for library-referenced sessions
  if (librarySessionIds.length > 0) {
    const { data: exercises, error: exError } = await supabase
      .from('library_exercises')
      .select('*, exercise:exercises(*)') // Join with master exercises
      .in('library_session_id', librarySessionIds as string[])
      .order('order_index');
      
    if (exError) throw exError;
    libraryExercises = exercises || [];
  }
  
  // Transform schedule data to match TypeScript interface
  // Group schedule entries by day and convert to expected format
  const transformedSchedule: { [K in DayOfWeek]?: ScheduledSession[] } = {};
  schedule.forEach(entry => {
    const day = entry.day_of_week as DayOfWeek;
    if (!transformedSchedule[day]) {
      transformedSchedule[day] = [];
    }
    transformedSchedule[day]!.push({
      sessionId: entry.session_id,
      order: transformedSchedule[day]!.length + 1,
      isOptional: false // Default to required for now
    });
  });

  // Transform exercises to match expected format
  const transformedSessions = sessions.map(session => {
    let sessionExercises: any[] = [];
    
    if (session.library_session_id) {
      // Use library exercises for referenced sessions
      sessionExercises = libraryExercises.filter(e => e.library_session_id === session.library_session_id);
    } else {
      // Use plan exercises for custom sessions
      sessionExercises = planExercises.filter(e => e.session_id === session.id);
    }
    
    const transformedExercises = sessionExercises.map(ex => ({
      id: ex.exercise.id,
      name: ex.exercise.name,
      primaryMuscleGroup: ex.exercise.muscle_group as any, // Map to expected type
      secondaryMuscleGroups: [], // Could be extended later
      sets: ex.sets,
      reps_min: ex.reps_min,
      reps_max: ex.reps_max,
      repRange: { min: ex.reps_min, max: ex.reps_max },
      restSeconds: ex.rest_seconds || 60,
      order: ex.order_index
    }));

    return {
      ...session,
      exercises: transformedExercises,
      isLibraryReference: !!session.library_session_id // Flag to indicate this is a library reference
    };
  });

  return {
    ...plan,
    sessions: transformedSessions,
    schedule: transformedSchedule
  };
};

// --- Session Library Functions ---

export const fetchLibrarySessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('session_library')
    .select(`
      *,
      exercises:library_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .or(`created_by.eq.${userId},is_public.eq.true`)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const createLibrarySession = async (
  session: Database['public']['Tables']['session_library']['Insert'],
  exercises: Database['public']['Tables']['library_exercises']['Insert'][]
) => {
  // 1. Create library session
  const { data: newSession, error: sessionError } = await supabase
    .from('session_library')
    .insert(session)
    .select()
    .single();
    
  if (sessionError) throw sessionError;
  
  // 2. Create exercises for the library session
  if (exercises.length > 0) {
    const exercisesWithIds = exercises.map(ex => ({
      ...ex,
      library_session_id: newSession.id
    }));
    
    const { error: exError } = await supabase
      .from('library_exercises')
      .insert(exercisesWithIds);
      
    if (exError) throw exError;
  }
  
  return newSession;
};

export const promoteSessionToLibrary = async (sessionId: string, isPublic: boolean = false) => {
  const { data, error } = await supabase.rpc('promote_session_to_library', {
    p_session_id: sessionId,
    p_is_public: isPublic
  });
  
  if (error) throw error;
  return data;
};

// --- Workout Plans ---

export const createWorkoutPlan = async (
  plan: Database['public']['Tables']['workout_plans']['Insert'],
  sessions: {
    session: Database['public']['Tables']['plan_sessions']['Insert'] & { 
      library_session_id?: string  // Optional reference to library session
    },
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
  const sessionIdMap = new Map<string, string>(); // Map old IDs to new IDs
  
  for (const sessionData of sessions) {
    const oldSessionId = sessionData.session.id;
    
    // Check if this is a reference to a library session
    if (sessionData.session.library_session_id) {
      // Create a reference session (no exercises needed, they're in the library)
      const { data: newSession, error: sessionError } = await supabase
        .from('plan_sessions')
        .insert({
          plan_id: newPlan.id,
          library_session_id: sessionData.session.library_session_id,
          name: sessionData.session.name,
          description: sessionData.session.description,
          focus: sessionData.session.focus,
          order_index: sessionData.session.order_index
        })
        .select()
        .single();
        
      if (sessionError) throw sessionError;
      if (oldSessionId) {
        sessionIdMap.set(oldSessionId, newSession.id);
      }
    } else {
      // Create a custom session with exercises
      const { data: newSession, error: sessionError } = await supabase
        .from('plan_sessions')
        .insert({ ...sessionData.session, plan_id: newPlan.id, library_session_id: null })
        .select()
        .single();
        
      if (sessionError) throw sessionError;
      if (oldSessionId) {
        sessionIdMap.set(oldSessionId, newSession.id);
      }
      
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
  }
  
  // 3. Create Schedule (map old session IDs to new ones)
  if (schedule.length > 0) {
    const scheduleWithId = schedule.map(s => ({
      plan_id: newPlan.id,
      session_id: sessionIdMap.get(s.session_id) || s.session_id, // Use mapped ID if available
      day_of_week: s.day_of_week,
      order_index: s.order_index,
      is_optional: s.is_optional
    }));
    
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
    .from('session_log')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const logWorkoutSession = async (
  session: Database['public']['Tables']['session_log']['Insert'],
  exercises: {
    exercise: Omit<Database['public']['Tables']['workout_log']['Insert'], 'session_id' | 'set_number' | 'weight' | 'reps' | 'rpe' | 'completed'>,
    sets: Pick<Database['public']['Tables']['workout_log']['Insert'], 'set_number' | 'weight' | 'reps' | 'rpe' | 'completed'>[]
  }[]
) => {
  // 1. Create Session
  const { data: newSession, error: sessionError } = await supabase
    .from('session_log')
    .insert(session)
    .select()
    .single();

  if (sessionError) throw sessionError;

  // 2. Create Workout Log entries (one per set)
  const workoutLogEntries: Database['public']['Tables']['workout_log']['Insert'][] = [];

  for (const exData of exercises) {
    for (const setData of exData.sets) {
      workoutLogEntries.push({
        session_id: newSession.id,
        exercise_id: exData.exercise.exercise_id,
        user_id: exData.exercise.user_id,
        order_index: exData.exercise.order_index,
        notes: exData.exercise.notes,
        set_number: setData.set_number,
        weight: setData.weight,
        reps: setData.reps,
        rpe: setData.rpe,
        completed: setData.completed,
        created_at: setData.created_at
      });
    }
  }

  if (workoutLogEntries.length > 0) {
    const { error: logError } = await supabase
      .from('workout_log')
      .insert(workoutLogEntries);

    if (logError) throw logError;
  }

  return newSession;
};


