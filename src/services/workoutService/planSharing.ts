import { supabase } from '../supabase';

/**
 * Plan moderation + sharing — small surface, related lifecycle. Both
 * sit on `workout_plans` and the share/import RPCs.
 */

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
