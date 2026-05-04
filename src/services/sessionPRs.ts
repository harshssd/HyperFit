import { supabase } from './supabase';

/**
 * Counts the number of exercises in `sessionId` where the user hit a new
 * weight PR — i.e. the heaviest set in this session beats every prior set
 * for the same exercise. First-ever sessions for an exercise count as a PR
 * (the lift IS the previous best by definition).
 *
 * Bodyweight / weight-0 sets are ignored. A reps or e1RM (Epley) PR model
 * is more accurate but adds noise; weight-only is the brag-worthy signal
 * lifters intuit. Upgrade to e1RM later if needed.
 *
 * Cost: 1 + N queries where N = distinct exercises in the session. For a
 * typical 5-lift session, ~6 round trips. Cheap enough for a one-shot
 * post-session call; collapse into a single RPC if it ever becomes hot.
 */
export const countSessionPRs = async (
  userId: string,
  sessionId: string,
): Promise<number> => {
  if (!userId || !sessionId) return 0;

  const { data: sessionRows, error } = await supabase
    .from('workout_sets')
    .select('exercise_id, weight, session:workout_sessions!inner(user_id)')
    .eq('session_id', sessionId)
    .eq('session.user_id', userId);

  if (error) throw error;
  if (!sessionRows || sessionRows.length === 0) return 0;

  // Heaviest set per exercise within this session.
  const sessionMaxByEx = new Map<string, number>();
  sessionRows.forEach(row => {
    const exId = row.exercise_id as string | null;
    const w = Number(row.weight);
    if (!exId || !Number.isFinite(w) || w <= 0) return;
    sessionMaxByEx.set(exId, Math.max(sessionMaxByEx.get(exId) ?? 0, w));
  });

  if (sessionMaxByEx.size === 0) return 0;

  // Heaviest set per exercise across every OTHER session for this user.
  // Parallel-fetch — each query returns at most one row.
  const priorMaxes = await Promise.all(
    Array.from(sessionMaxByEx.keys()).map(async exId => {
      const { data, error: priorError } = await supabase
        .from('workout_sets')
        .select('weight, session:workout_sessions!inner(user_id)')
        .eq('exercise_id', exId)
        .eq('session.user_id', userId)
        .neq('session_id', sessionId)
        .order('weight', { ascending: false, nullsFirst: false })
        .limit(1);
      if (priorError) throw priorError;
      const prior = Number(data?.[0]?.weight) || 0;
      return [exId, prior] as const;
    }),
  );
  const priorMaxByEx = new Map(priorMaxes);

  let prs = 0;
  sessionMaxByEx.forEach((currentMax, exId) => {
    const prior = priorMaxByEx.get(exId) ?? 0;
    if (currentMax > prior) prs += 1;
  });
  return prs;
};
