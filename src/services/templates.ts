import { supabase } from './supabase';
import type { Template, TemplateFolder } from '../types/workout';

/**
 * Quick-save templates: a user-named exercise list to recall as a starting
 * point for an ad-hoc session. Maps onto the merged `templates` table with
 * `kind = 'quick'` and a `template_exercises` join FK'd to `exercises.id`.
 *
 * The app surface still works with exercise NAMES (string[]) on read and
 * write — this module resolves to/from exercise_ids at the boundary so the
 * caller doesn't have to.
 */

type TemplateRow = {
  id: string;
  user_id: string | null;
  folder_id: string | null;
  kind: 'plan_session' | 'quick';
  name: string;
  description: string | null;
  icon: string | null;
  tags: string[];
  is_public: boolean;
};

const rowToTemplate = (
  row: TemplateRow,
  exerciseNames: string[]
): Template => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  icon: row.icon ?? undefined,
  exercises: exerciseNames,
  user_id: row.user_id ?? undefined,
  folder_id: row.folder_id,
  tags: row.tags,
  is_public: row.is_public,
});

export const fetchTemplatesForUser = async (userId: string | undefined) => {
  if (!userId) return { templates: [] as Template[], tags: [] as string[] };

  // Quick templates: own + public. RLS already filters; the .eq is a safety belt.
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      template_exercises:template_exercises (
        order_index,
        exercise:exercises (name)
      )
    `)
    .eq('kind', 'quick')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const tagsSet = new Set<string>();
  const templates: Template[] = (data ?? []).map((row: any) => {
    (row.tags ?? []).forEach((t: string) => tagsSet.add(t));
    const ordered = [...(row.template_exercises ?? [])].sort(
      (a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );
    const names: string[] = ordered
      .map((te: any) => te.exercise?.name)
      .filter(Boolean);
    return rowToTemplate(row, names);
  });

  return { templates, tags: Array.from(tagsSet).sort() };
};

export const fetchFoldersForUser = async (userId: string | undefined) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('template_folders')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data as TemplateFolder[]) || [];
};

export const fetchFavoritesForUser = async (userId: string | undefined) => {
  if (!userId) return new Set<string>();
  const { data, error } = await supabase
    .from('user_template_favorites')
    .select('template_id')
    .eq('user_id', userId);

  if (error) throw error;
  return new Set(data?.map((f: any) => f.template_id) || []);
};

/**
 * Resolves exercise names to IDs (case-insensitive). Returns an array
 * aligned with the input — entries with no match are dropped.
 */
const resolveExerciseIds = async (names: string[]): Promise<{ id: string; name: string }[]> => {
  if (names.length === 0) return [];
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name')
    .in('name', names);
  if (error) throw error;

  const byName = new Map<string, string>();
  (data ?? []).forEach((row: any) => byName.set(row.name.toLowerCase(), row.id));

  return names
    .map(n => {
      const id = byName.get(n.toLowerCase());
      return id ? { id, name: n } : null;
    })
    .filter((x): x is { id: string; name: string } => x !== null);
};

export const saveTemplate = async (
  userId: string | undefined,
  name: string,
  exercises: string[],
  folderId?: string | null,
  tags?: string[]
) => {
  if (!userId) throw new Error('No user');

  const resolved = await resolveExerciseIds(exercises);
  if (resolved.length === 0 && exercises.length > 0) {
    throw new Error('None of the supplied exercises matched the master library.');
  }

  const { data: template, error: tplErr } = await supabase
    .from('templates')
    .insert({
      user_id: userId,
      kind: 'quick',
      name,
      description: `${resolved.length} Exercises`,
      icon: '💾',
      folder_id: folderId ?? null,
      tags: tags ?? [],
    })
    .select()
    .single();

  if (tplErr) throw tplErr;

  if (resolved.length > 0) {
    const rows = resolved.map((r, i) => ({
      template_id: template.id,
      exercise_id: r.id,
      order_index: i,
    }));
    const { error: exErr } = await supabase.from('template_exercises').insert(rows);
    if (exErr) throw exErr;
  }

  return rowToTemplate(template as TemplateRow, resolved.map(r => r.name));
};

export const toggleFavoriteTemplate = async (
  userId: string | undefined,
  templateId: string,
  isFavorite: boolean
) => {
  if (!userId) throw new Error('No user');

  if (isFavorite) {
    const { error } = await supabase
      .from('user_template_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('template_id', templateId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from('user_template_favorites')
    .insert({ user_id: userId, template_id: templateId });
  if (error) throw error;
  return true;
};

export const deleteTemplateById = async (
  userId: string | undefined,
  templateId: string
) => {
  if (!userId) throw new Error('No user');
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId);
  if (error) throw error;
};

export const createTemplateFolder = async (
  userId: string | undefined,
  name: string
) => {
  if (!userId) throw new Error('No user');
  const { data, error } = await supabase
    .from('template_folders')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return data;
};
