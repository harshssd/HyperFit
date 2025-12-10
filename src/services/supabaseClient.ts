import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { UserData } from '../types/workout';
import { fetchWorkoutPlans, fetchWorkoutSessions, fetchUserWorkoutPlans, createWorkoutPlan, createUserWorkoutPlan, logWorkoutSession } from './workoutService';

export const getInitialSession = () => supabase.auth.getSession();

export const onAuthStateChange = (callback: (session: Session | null) => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
};

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signInWithGoogle = (redirectTo: string) =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: false,
    },
  });

export const setSessionFromTokens = (access_token: string, refresh_token: string) =>
  supabase.auth.setSession({ access_token, refresh_token });

export const signOut = () => supabase.auth.signOut();

/**
 * MIGRATION ADAPTER: loadUserData
 * ------------------------------
 * Loads data from the new normalized tables and reconstructs the UserData object
 * for backward compatibility with the frontend.
 */
export const loadUserData = async (userId: string, defaultData: UserData) => {
  try {
    // 1. Fetch Logs (Workout Sessions)
    const sessions = await fetchWorkoutSessions(userId);
    
    // Transform normalized sessions back to "workouts" map and "gymLogs" array
    const workouts: Record<string, any[]> = {};
    const gymLogs: string[] = [];
    const workoutStatus: any = {};

    // We need to fetch exercises for each session to fully reconstruct 'workouts'
    // For performance, in a real app we might lazy load this or have a view.
    // Here we'll do a best effort reconstruction.
    
    // Note: This adapter is a temporary bridge. ideally the frontend should consume
    // the normalized data directly via hooks.
    
    // 2. Fetch User Plans
    const userPlans = await fetchUserWorkoutPlans(userId);
    
    // 3. Fetch All Templates (User + Public)
    // The workout_plans table contains both system and user plans.
    // We should return ALL plans so the UI can filter between public/private.
    const allPlans = await fetchWorkoutPlans();
    // Previously we filtered by user_id, but now we need public plans too.
    // The service 'fetchWorkoutPlans' already respects RLS (own + public).
    
    return {
      ...defaultData,
      gymLogs,
      workouts,
      workoutStatus,
      userWorkoutPlans: userPlans, // Active instances
      workoutPlans: allPlans,      // Templates (Public + User created)
      // Add other mapped fields as we migrate them
    };
  } catch (error) {
    console.error("Error loading user data from new schema:", error);
    return defaultData;
  }
};

/**
 * MIGRATION ADAPTER: upsertUserData
 * --------------------------------
 * This function previously saved the entire big JSON blob.
 * Now it should coordinate updates to the specific normalized tables.
 * 
 * NOTE: The frontend currently calls this with the WHOLE state.
 * We need to detect WHAT changed and update the corresponding table.
 * For now, we might log a warning or perform specific updates if critical.
 */
export const upsertUserData = async (userId: string, newData: UserData) => {
  // In the new architecture, specific actions (save log, create plan)
  // call specific service functions (logWorkoutSession, createWorkoutPlan).
  // This generic "save everything" function is deprecated.
  
  // We can leave it empty or implement partial updates if needed.
  console.log("upsertUserData called - this is deprecated in favor of granular service calls.");
};

export const subscribeToUserData = (
  userId: string,
  handler: (data: any) => void
) => {
  // Realtime subscription logic needs to be updated to listen to multiple tables
  // or specific events. For now, we'll disable the legacy monolithic subscription.
  return () => {}; 
};
