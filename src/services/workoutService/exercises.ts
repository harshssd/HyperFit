import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type Tables = Database['public']['Tables'];

/**
 * Master library + the caller's own free-text entries, merged for the
 * Add Exercise autocomplete. Master `exercises` is the bounded
 * public/system list; `user_exercises` is the per-user growth table
 * (RLS scopes it to the caller). Two reads are cheap, indexed by user
 * and name, and the merge happens in JS so we don't pay a UNION ALL on
 * every keystroke.
 */
export const fetchExercises = async (): Promise<Array<{ id: string; name: string; muscle_group: string | null; equipment: string | null }>> => {
  const [master, custom] = await Promise.all([
    supabase
      .from('exercises')
      .select('id, name, muscle_group, equipment')
      .order('name'),
    supabase
      .from('user_exercises')
      .select('id, name, muscle_group, equipment')
      .order('name'),
  ]);

  if (master.error) throw master.error;
  if (custom.error) throw custom.error;

  const seen = new Set<string>();
  const merged: Array<{ id: string; name: string; muscle_group: string | null; equipment: string | null }> = [];
  for (const row of [...(master.data ?? []), ...(custom.data ?? [])]) {
    const key = row.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged.sort((a, b) => a.name.localeCompare(b.name));
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

export type ExerciseDirRow = {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
};

/**
 * Resolve a batch of exercise ids to their {name, muscle_group,
 * equipment} rows by checking both the master `exercises` library and
 * `user_exercises`. Replaces PostgREST's `exercise:exercises(*)`
 * embedded joins, which stopped working when the FK on
 * workout_sets/plan_exercises/template_exercises was dropped to allow
 * either table to satisfy the reference.
 */
export const resolveExerciseDirectory = async (
  ids: string[],
): Promise<Map<string, ExerciseDirRow>> => {
  const out = new Map<string, ExerciseDirRow>();
  if (ids.length === 0) return out;
  const unique = Array.from(new Set(ids));
  const [master, custom] = await Promise.all([
    supabase
      .from('exercises')
      .select('id, name, muscle_group, equipment')
      .in('id', unique),
    supabase
      .from('user_exercises')
      .select('id, name, muscle_group, equipment')
      .in('id', unique),
  ]);
  if (master.error) throw master.error;
  if (custom.error) throw custom.error;
  [...(master.data ?? []), ...(custom.data ?? [])].forEach((row) =>
    out.set(row.id, row as ExerciseDirRow),
  );
  return out;
};

/**
 * Resolve a free-text exercise name to a row in either the master
 * `exercises` library (public/system) or the user's `user_exercises`
 * (per-user growth table), creating a row in the latter on first
 * sight. Used at session persist time so the silent-drop guard at
 * logWorkoutSession (which skips exercises without exercise_id) never
 * fires for typed-in names.
 *
 * Lookup order:
 *   1. master `exercises` — case-insensitive name match
 *   2. caller's own `user_exercises` — same
 *   3. miss → insert into `user_exercises` and return the new row
 *
 * Hitting the master first keeps custom entries from shadowing
 * canonical names ("Squat" already lives in the bounded library, so
 * we use its row id rather than minting a duplicate).
 */
export const ensureExercise = async (
  rawName: string,
  userId: string,
): Promise<{ id: string; name: string }> => {
  const name = rawName.trim();
  if (!name) throw new Error('Exercise name required');

  // ilike with no wildcard = case-insensitive equality.
  const masterHit = await supabase
    .from('exercises')
    .select('id, name')
    .ilike('name', name)
    .limit(1);
  if (masterHit.error) throw masterHit.error;
  if (masterHit.data && masterHit.data.length > 0) return masterHit.data[0];

  const customHit = await supabase
    .from('user_exercises')
    .select('id, name')
    .ilike('name', name)
    .limit(1);
  if (customHit.error) throw customHit.error;
  if (customHit.data && customHit.data.length > 0) return customHit.data[0];

  const { data: created, error: insertErr } = await supabase
    .from('user_exercises')
    .insert({ name, user_id: userId })
    .select('id, name')
    .single();
  if (insertErr) throw insertErr;
  return created;
};
