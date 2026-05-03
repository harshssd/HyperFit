import { supabase } from '../supabase';
import { Database } from '../../types/supabase';
import { normalizeUserWorkoutPlan } from '../normalize';
import { fetchWorkoutPlanDetails } from './plans';

type Tables = Database['public']['Tables'];

export const fetchUserWorkoutPlans = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_workout_plans')
    .select('*, plan:workout_plans(*)')
    .eq('user_id', userId);

  if (error) throw error;

  // Normalize DB snake_case to camelCase. Without this, code like
  // `data.userWorkoutPlans.find(p => p.isActive)` quietly returns undefined
  // even when the DB has is_active=true — the symptom users see is "No
  // Active Plan" on the Plans tab right after activating from Browse.
  //
  // The embedded `plan` join only carries top-level workout_plans columns —
  // no schedule, no sessions, no exercises. Anything that walks the plan
  // (Home week strip, getNextScheduledWorkout, Calendar) silently fails
  // until those nested arrays are hydrated. Active plan(s) get the full
  // details fetch below; inactive ones can stay shallow until selected.
  const rows = (data ?? []).map(normalizeUserWorkoutPlan);

  // Hydrate the active plan(s) with schedule + sessions + exercises.
  await Promise.all(
    rows
      .filter(r => r.isActive && r.planId)
      .map(async r => {
        try {
          r.planData = await fetchWorkoutPlanDetails(r.planId);
        } catch (err) {
          console.warn('fetchUserWorkoutPlans: failed to hydrate active plan', r.planId, err);
        }
      }),
  );

  return rows;
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
 * Server-side deactivation of every is_active row for a user. No exceptions
 * — we always clear the active slot before re-activating the target. This
 * guarantees the unique partial index (one is_active row per user) can
 * never collide, regardless of local cache state.
 */
export const deactivateUserWorkoutPlans = async (userId: string) => {
  const { error } = await supabase
    .from('user_workout_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw error;
};

/**
 * Authoritative lookup of an existing (user_id, plan_id) row, regardless of
 * its is_active state. Used by activation flows that can't trust the local
 * userPlans cache.
 */
export const findUserWorkoutPlan = async (userId: string, planId: string) => {
  const { data, error } = await supabase
    .from('user_workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
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
