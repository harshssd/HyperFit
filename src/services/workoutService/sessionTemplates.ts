import { supabase } from '../supabase';
import { Database } from '../../types/supabase';
import { resolveExerciseDirectory } from './exercises';

type Tables = Database['public']['Tables'];

/**
 * Reusable plan-session blueprints (templates with `kind = 'plan_session'`).
 * Distinct from quick templates — those live in `services/templates.ts`.
 */
export const fetchSessionTemplates = async () => {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      exercises:template_exercises (*)
    `)
    .eq('kind', 'plan_session')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // FK on template_exercises.exercise_id was dropped when user_exercises
  // split out, so the embedded exercise join is gone. Resolve directory
  // rows in one batch and stitch them in.
  const allIds: string[] = [];
  (data ?? []).forEach((t: any) => {
    (t.exercises ?? []).forEach((te: any) => {
      if (te.exercise_id) allIds.push(te.exercise_id);
    });
  });
  const dir = await resolveExerciseDirectory(allIds);

  return (data ?? []).map((t: any) => ({
    ...t,
    exercises: (t.exercises ?? []).map((te: any) => ({
      ...te,
      exercise: dir.get(te.exercise_id) ?? null,
    })),
  }));
};

export const createSessionTemplate = async (
  template: Omit<Tables['templates']['Insert'], 'kind'>,
  exercises: Omit<Tables['template_exercises']['Insert'], 'template_id'>[]
) => {
  const { data: newTemplate, error: templateError } = await supabase
    .from('templates')
    .insert({ ...template, kind: 'plan_session' })
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
