import { supabase } from './supabase';
import type { Template, TemplateFolder } from '../types/workout';

export const fetchTemplatesForUser = async (userId: string | undefined) => {
  if (!userId) return { templates: [] as Template[], tags: [] as string[] };

  const { data: userTemplates, error } = await supabase
    .from('workout_templates')
    .select('*')
    .or(`user_id.eq.${userId},is_standard.eq.true,is_public.eq.true`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const tagsSet = new Set<string>();
  userTemplates?.forEach((t: any) => {
    if (Array.isArray(t.tags)) {
      t.tags.forEach((tag: string) => tagsSet.add(tag));
    }
  });

  return {
    templates: (userTemplates as Template[]) || [],
    tags: Array.from(tagsSet).sort(),
  };
};

export const fetchFoldersForUser = async (userId: string | undefined) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('workout_template_folders')
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

export const saveTemplate = async (
  userId: string | undefined,
  name: string,
  exercises: string[],
  folderId?: string | null,
  tags?: string[],
  createdByName: string = 'User'
) => {
  if (!userId) throw new Error('No user');

  const { data, error } = await supabase
    .from('workout_templates')
    .insert({
      user_id: userId,
      name,
      description: `${exercises.length} Exercises`,
      icon: '💾',
      exercises,
      created_by_username: createdByName || 'User',
      folder_id: folderId || null,
      tags: tags || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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
    .insert({
      user_id: userId,
      template_id: templateId,
    });
  if (error) throw error;
  return true;
};

export const deleteTemplateById = async (
  userId: string | undefined,
  templateId: string
) => {
  if (!userId) throw new Error('No user');
  await supabase
    .from('workout_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId);
};

export const createTemplateFolder = async (
  userId: string | undefined,
  name: string,
  color: string = '#f97316',
  icon: string = '📁'
) => {
  if (!userId) throw new Error('No user');
  const { data, error } = await supabase
    .from('workout_template_folders')
    .insert({
      user_id: userId,
      name,
      color,
      icon,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

