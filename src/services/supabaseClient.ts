import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { UserData } from '../types/workout';
import { fetchWorkoutPlans, fetchUserWorkoutPlans } from './workoutService';

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
    options: { redirectTo, skipBrowserRedirect: false },
  });

export const setSessionFromTokens = (access_token: string, refresh_token: string) =>
  supabase.auth.setSession({ access_token, refresh_token });

export const signOut = () => supabase.auth.signOut();

/**
 * Loads the slice of UserData that maps onto normalized tables. Fields not
 * yet migrated (gymLogs, workouts, customTemplates, currentSession, etc.)
 * remain on the in-memory DEFAULT_DATA blob; see slice 2.
 */
export const loadUserData = async (userId: string, defaultData: UserData) => {
  try {
    const [userPlans, allPlans] = await Promise.all([
      fetchUserWorkoutPlans(userId),
      fetchWorkoutPlans(),
    ]);

    return {
      ...defaultData,
      userWorkoutPlans: userPlans,
      workoutPlans: allPlans,
    } as UserData;
  } catch (error) {
    console.error('loadUserData failed:', error);
    return defaultData;
  }
};
