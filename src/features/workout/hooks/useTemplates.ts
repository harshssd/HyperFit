import { useState, useCallback } from 'react';
import { showSuccess } from '../../../utils/alerts';
import {
  fetchTemplatesForUser,
  fetchFoldersForUser,
  fetchFavoritesForUser,
  saveTemplate,
  toggleFavoriteTemplate,
  deleteTemplateById,
  createTemplateFolder,
} from '../../../services/templates';
import { Template } from '../../../types/workout';
import { WORKOUT_TEMPLATES } from '../../../constants/appConstants';

type UseTemplatesArgs = {
  userId?: string;
  data: any;
  updateData: (d: any) => void;
  today: string;
  todaysWorkout: any[];
  isCheckedIn: boolean;
};

export const useTemplates = ({
  userId,
  data,
  updateData,
  today,
  todaysWorkout,
  isCheckedIn,
}: UseTemplatesArgs) => {
  const [templates, setTemplates] = useState<Template[]>(WORKOUT_TEMPLATES);
  const [folders, setFolders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!userId) return;
    const { templates: t, tags } = await fetchTemplatesForUser(userId);
    setTemplates(t || WORKOUT_TEMPLATES);
    setAllTags(tags || []);
  }, [userId]);

  const fetchFolders = useCallback(async () => {
    if (!userId) return;
    const f = await fetchFoldersForUser(userId);
    setFolders(f || []);
  }, [userId]);

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    const fav = await fetchFavoritesForUser(userId);
    setFavorites(fav || new Set());
  }, [userId]);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await Promise.all([fetchTemplates(), fetchFolders(), fetchFavorites()]);
    } catch (err) {
      // fallback: keep defaults
      setTemplates((prev) => prev.length ? prev : WORKOUT_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, [fetchFavorites, fetchFolders, fetchTemplates, userId]);

  const applyTemplateToDay = useCallback(
    (template: any) => {
      const newExercises = template.exercises.map((name, index) => ({
        id: `${Date.now()}-${index}-${Math.random()}`,
        name,
        sets: [{ id: Date.now() + index + 100, weight: '', reps: '', completed: false }],
      }));
      const updatedWorkouts = { ...data.workouts, [today]: [...todaysWorkout, ...newExercises] };
      const newLogs = !isCheckedIn ? [...(data.gymLogs || []), today] : data.gymLogs || [];
      updateData({ ...data, workouts: updatedWorkouts, gymLogs: newLogs });
    },
    [data, isCheckedIn, today, todaysWorkout, updateData]
  );

  const saveTemplateToSupabase = useCallback(
    async (name: string, exercises: string[], folderId?: string | null, tags?: string[]) => {
      if (!userId) throw new Error('No user');
      await saveTemplate(userId, name, exercises, folderId, tags, userId.split('@')[0] || 'User');
      await fetchAll();
    },
    [fetchAll, userId]
  );

  const shareTemplate = useCallback((template: any) => {
    showSuccess(`${template.name}\n${template.description || ''}`, 'Share Template');
  }, []);

  const applyTemplate = useCallback(
    (template: any) => applyTemplateToDay(template),
    [applyTemplateToDay]
  );

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  const toggleFavorite = useCallback(
    async (templateId: string) => {
      const nowFavorite = await toggleFavoriteTemplate(userId, templateId, favorites.has(templateId));
      setFavorites((prev) => {
        const next = new Set(prev);
        if (nowFavorite) next.add(templateId);
        else next.delete(templateId);
        return next;
      });
    },
    [favorites, userId]
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      if (!userId) return;
      await deleteTemplateById(userId, templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    },
    [userId]
  );

  const duplicateTemplate = useCallback((template: any) => {
    const duplicated = {
      ...template,
      id: `local-${Date.now()}`,
      name: `${template.name} (Copy)`,
      user_id: userId,
    };
    setTemplates((prev) => [duplicated, ...prev]);
  }, [userId]);

  const createFolder = useCallback(
    async (name: string, color: string = '#f97316', icon: string = '📁') => {
      if (!userId) return;
      await createTemplateFolder(userId, name, color, icon);
      await fetchAll();
    },
    [fetchAll, userId]
  );

  const filteredTemplates = useCallback(
    (all: Template[]) => {
      let filtered = all;
      if (templateSearchQuery.trim()) {
        const q = templateSearchQuery.toLowerCase();
        filtered = filtered.filter(
          (t: any) =>
            t.name.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.created_by_username?.toLowerCase().includes(q) ||
            t.exercises?.some((ex: string) => ex.toLowerCase().includes(q))
        );
      }
      if (selectedFolder) {
        filtered = filtered.filter((t: any) => t.folder_id === selectedFolder);
      }
      if (showFavoritesOnly) {
        filtered = filtered.filter((t: any) => favorites.has(t.id));
      }
      if (selectedTags.length) {
        filtered = filtered.filter(
          (t: any) => t.tags && Array.isArray(t.tags) && selectedTags.some((tag) => t.tags.includes(tag))
        );
      }
      return filtered;
    },
    [favorites, selectedFolder, selectedTags, showFavoritesOnly, templateSearchQuery]
  );

  return {
    templates,
    folders,
    favorites,
    loading,
    templateSearchQuery,
    selectedFolder,
    selectedTags,
    showFavoritesOnly,
    setTemplateSearchQuery,
    setSelectedFolder,
    setSelectedTags,
    setShowFavoritesOnly,
    pickerOpen,
    openPicker,
    closePicker,
    fetchTemplates,
    fetchFolders,
    fetchFavorites,
    fetchAll,
    applyTemplate,
    applyTemplateToDay,
    saveTemplateToSupabase,
    toggleFavorite,
    deleteTemplate,
    duplicateTemplate,
    createFolder,
    shareTemplate,
    filteredTemplates: filteredTemplates(templates),
    allTags,
  };
};

export type UseTemplatesReturn = ReturnType<typeof useTemplates>;

