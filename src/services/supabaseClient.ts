import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { UserData } from '../types/workout';
import { fetchWorkoutPlans, fetchUserWorkoutPlans, fetchUserWorkoutDates } from './workoutService';

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
    options: { redirectTo, skipBrowserRedirect: true },
  });

export const signOut = () => supabase.auth.signOut();

/**
 * Loads the slice of UserData that maps onto normalized tables.
 *
 * - userWorkoutPlans / workoutPlans: from user_workout_plans / workout_plans.
 * - gymLogs: distinct workout_dates from session_summary_view, so the streak
 *   counter and calendar dots survive a reload.
 *
 * The remaining UserData fields (workouts, customTemplates, currentSession)
 * are still in-memory and reset on reload; they should move to dedicated
 * feature hooks that read on demand from workout_log.
 */
export const loadUserData = async (userId: string, defaultData: UserData) => {
  try {
    const [userPlans, allPlans, gymLogs] = await Promise.all([
      fetchUserWorkoutPlans(userId),
      fetchWorkoutPlans(),
      fetchUserWorkoutDates(userId).catch(err => {
        // Non-fatal: streak/calendar will look empty until next refresh.
        console.warn('fetchUserWorkoutDates failed:', err);
        return [] as string[];
      }),
    ]);

    return {
      ...defaultData,
      userWorkoutPlans: userPlans,
      workoutPlans: allPlans,
      gymLogs,
    } as UserData;
  } catch (error) {
    console.error('loadUserData failed:', error);
    return defaultData;
  }
};
