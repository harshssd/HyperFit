import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Folder,
  FolderPlus,
  Heart,
  Layout,
  Maximize2,
  Medal,
  Plus,
  PlusCircle,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  User,
} from 'lucide-react-native';
import TemplatePickerModal from '../../components/TemplatePickerModal';
import AddExerciseOverlay from '../../components/AddExerciseOverlay';
import SaveTemplateModal from '../../components/SaveTemplateModal';
import CreateFolderModal from '../../components/CreateFolderModal';
import WorkoutOverview from './components/WorkoutOverview';
import WorkoutListView from './components/WorkoutListView';
import WorkoutFocusSets from './components/WorkoutFocusSets';
import WorkoutFocusActions from './components/WorkoutFocusActions';
import WorkoutHeader from './components/WorkoutHeader';
import WorkoutFocusHeader from './components/WorkoutFocusHeader';
import EmptyWorkoutCard from './components/EmptyWorkoutCard';
import FinishedSessionView from './components/FinishedSessionView';
import NeonButton from '../../components/NeonButton';
import GlassCard from '../../components/GlassCard';
import workoutStyles from '../../styles/workout';
import { Template, TemplateFolder, WorkoutExercise } from '../../types/workout';
import {
  ASSETS,
  WORKOUT_TEMPLATES,
  DEFAULT_EXERCISES,
} from '../../constants/appConstants';
import {
  isExerciseEmpty,
  renameExercise,
  updateSetValue,
  addSetToExercise,
  deleteExerciseFromWorkout,
  moveExerciseInWorkout,
  calculateTotalVolume,
  finishWorkoutState,
  undoFinishState,
  startNewSessionState,
  abortSessionState,
  getExerciseConfig,
} from './helpers';
import { ABORT_SESSION_MESSAGE, ABORT_SESSION_TITLE } from '../../constants/text';
import {
  createTemplateFolder,
  deleteTemplateById,
  fetchFavoritesForUser,
  fetchFoldersForUser,
  fetchTemplatesForUser,
  saveTemplate,
  toggleFavoriteTemplate,
} from '../../services/templates';
import { confirmAction, showError, showSuccess } from '../../utils/alerts';

type GymViewProps = {
  data: any;
  updateData: (d: any) => void;
  user: any;
};

const GymView = ({ data, updateData, user }: GymViewProps) => {
  const today = new Date().toISOString().split('T')[0];
  const isCheckedIn = data.gymLogs.includes(today);
  const isFinished = data.workoutStatus?.[today]?.finished || false;
  const [newExerciseName, setNewExerciseName] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'focus'>('focus');
  const [showOverview, setShowOverview] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
  const todaysWorkout: WorkoutExercise[] = data.workouts?.[today] || [];
  const visibleWorkout = todaysWorkout.filter((ex) => !ex.archived);
  const customTemplates: Template[] = data.customTemplates || [];
  const [collapsedExercises, setCollapsedExercises] = useState<string[]>([]);

  // Template management state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null | undefined>(undefined);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTemplateFolder, setSaveTemplateFolder] = useState<string | null>(null);
  const [saveTemplateTags, setSaveTemplateTags] = useState<string[]>([]);
  const saveTemplateTagInputRef = useRef<TextInput | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const closeOverview = () => {
    setShowOverview(false);
    const preservedWorkouts = todaysWorkout.filter((ex) => ex.archived);
    updateData({ ...data, workouts: { ...data.workouts, [today]: preservedWorkouts } });
  };

  const handleRenameExercise = (id: number, name: string) => {
    const updated = renameExercise(todaysWorkout, id, name);
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
  };

  const handleToggleFolderFilter = () => {
    if (selectedFolder === undefined) {
      setSelectedFolder(null);
    } else {
      setSelectedFolder(undefined);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleClearTags = () => setSelectedTags([]);

  const handleEditTemplate = (template: any) => {
    setTemplateName(template.name);
    setSaveTemplateFolder(template.folder_id || null);
    setSaveTemplateTags(template.tags || []);
    setShowSaveTemplateModal(true);
  };

  useEffect(() => {
    if (visibleWorkout.length > 0 && currentExIndex >= visibleWorkout.length) {
      setCurrentExIndex(Math.max(0, visibleWorkout.length - 1));
    }
  }, [visibleWorkout.length]);

  useEffect(() => {
    if (!user || !showTemplatePicker) return;
    fetchTemplates();
    fetchFolders();
    fetchFavorites();
  }, [user, showTemplatePicker]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const { templates: userTemplates, tags } = await fetchTemplatesForUser(user?.id);
      setAllTags(tags);
      setTemplates(userTemplates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([...WORKOUT_TEMPLATES, ...customTemplates]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const data = await fetchFoldersForUser(user?.id);
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const favoriteIds = await fetchFavoritesForUser(user?.id);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const saveTemplateToSupabase = async (name: string, exercises: string[], folderId?: string | null, tags?: string[]) => {
    try {
      const username = user?.email?.split('@')[0] || user?.user_metadata?.full_name || 'User';
      await saveTemplate(user?.id, name, exercises, folderId, tags, username);
      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      const newTemplate = {
        id: Date.now(),
        name: name,
        icon: '💾',
        description: `${exercises.length} Exercises`,
        exercises: exercises
      };
      updateData({ ...data, customTemplates: [newTemplate, ...customTemplates] });
      throw error;
    }
  };

  const toggleFavorite = async (templateId: string) => {
    try {
      const isFavorite = favorites.has(templateId);
      const nowFavorite = await toggleFavoriteTemplate(user?.id, templateId, isFavorite);
      setFavorites(prev => {
        const next = new Set(prev);
        if (nowFavorite) {
          next.add(templateId);
        } else {
          next.delete(templateId);
        }
        return next;
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user?.id) return;
    try {
      await deleteTemplateById(user?.id, templateId);
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const confirmDeleteTemplate = (templateId: string) => {
    confirmAction('Delete Template', 'Remove this template permanently?', () => deleteTemplate(templateId), 'Delete');
  };

  const duplicateTemplate = (template: any) => {
    const duplicated = {
      ...template,
      id: `local-${Date.now()}`,
      name: `${template.name} (Copy)`,
      user_id: user?.id,
    };
    setTemplates(prev => [duplicated, ...prev]);
  };

  const shareTemplate = (template: any) => {
    showSuccess(`${template.name}\n${template.description || ''}`, 'Share Template');
  };

  const createFolder = async (name: string, color: string = '#f97316', icon: string = '📁') => {
    if (!user?.id) return;
    try {
      const data = await createTemplateFolder(user?.id, name, color, icon);
      await fetchFolders();
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      showError('Failed to create folder');
    }
  };

  const getAllExerciseNames = () => {
    const historyNames = Object.values(data.workouts || {}).flat().map((w: any) => w.name);
    const uniqueNames = [...new Set([...DEFAULT_EXERCISES, ...historyNames])];
    return uniqueNames.sort();
  };

  const handleNameChange = (val: string) => {
    setNewExerciseName(val);
    if (val.length > 0) {
      const allNames = getAllExerciseNames();
      const filtered = allNames.filter(name => name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (name: string) => {
    setNewExerciseName(name);
    setSuggestions([]);
  };

  const toggleCheckIn = () => {
    let newLogs = isCheckedIn ? data.gymLogs.filter((d: string) => d !== today) : [...data.gymLogs, today];
    updateData({ ...data, gymLogs: newLogs });
  };

  const applyTemplate = (template: any) => {
    const newExercises: WorkoutExercise[] = template.exercises.map((name: string, index: number) => ({
      id: `${Date.now()}-${index}-${Math.random()}`,
      name: name,
      sets: [{ id: Date.now() + index + 100, weight: '', reps: '', completed: false }]
    }));
    const updatedWorkouts = { ...data.workouts, [today]: [...todaysWorkout, ...newExercises] };
    const newLogs = !isCheckedIn ? [...data.gymLogs, today] : data.gymLogs;
    updateData({ ...data, workouts: updatedWorkouts, gymLogs: newLogs });
    setShowTemplatePicker(false);
    setShowOverview(true);
    setIsSessionActive(false);
  };

  const saveCurrentAsTemplate = async () => {
    if (!templateName.trim()) {
      showError('Please enter a template name');
      return;
    }
    if (visibleWorkout.length === 0) {
      showError('Cannot save empty workout');
      return;
    }
    try {
      const exercises = visibleWorkout.map((ex: any) => ex.name);
      await saveTemplateToSupabase(templateName, exercises, saveTemplateFolder, saveTemplateTags);
      showSuccess('Template saved successfully');
      setTemplateName('');
      setSaveTemplateFolder(null);
      setSaveTemplateTags([]);
      setShowSaveTemplateModal(false);
    } catch (error: any) {
      showError(error.message || 'Failed to save template');
    }
  };

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (templateSearchQuery.trim()) {
      const query = templateSearchQuery.toLowerCase();
      filtered = filtered.filter((t: any) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.created_by_username?.toLowerCase().includes(query) ||
        t.exercises?.some((ex: string) => ex.toLowerCase().includes(query))
      );
    }

    if (selectedFolder) {
      filtered = filtered.filter((t: any) => t.folder_id === selectedFolder);
    } else if (selectedFolder === null && showTemplatePicker) {
      // no-op; UI handles no-folder display
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((t: any) => favorites.has(t.id));
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((t: any) =>
        t.tags && Array.isArray(t.tags) &&
        selectedTags.some(tag => t.tags.includes(tag))
      );
    }

    return filtered;
  }, [templates, templateSearchQuery, selectedFolder, showFavoritesOnly, selectedTags, favorites, showTemplatePicker]);

  const addExercise = (position: 'top' | 'bottom' = 'bottom') => {
    if (!newExerciseName.trim()) return;
    const newExercise: WorkoutExercise = {
      id: Date.now(),
      name: newExerciseName,
      sets: [{ id: Date.now() + 1, weight: '', reps: '', completed: false }]
    };
    const updatedList = position === 'top' ? [newExercise, ...todaysWorkout] : [...todaysWorkout, newExercise];
    const newLogs = !isCheckedIn ? [...data.gymLogs, today] : data.gymLogs;
    updateData({ ...data, workouts: { ...data.workouts, [today]: updatedList }, gymLogs: newLogs });
    setNewExerciseName('');
    setIsAddingExercise(false);
    setEditingExerciseId(null);
  };

  const startSession = () => {
    if (visibleWorkout.length === 0) return;
    setIsSessionActive(true);
    setShowOverview(false);
    setViewMode('focus');
    setCurrentExIndex(0);
    setShowTemplatePicker(false);
  };

  const editExerciseName = (exId: number, newName: string) => {
    const updated = renameExercise(todaysWorkout, exId, newName);
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
    setEditingExerciseId(null);
  };

  const updateSet = (exId: number, setIndex: number, field: string, value: any) => {
    const updated = updateSetValue(todaysWorkout, exId, setIndex, field, value);
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
  };

  const addSet = (exId: number) => {
    const updated = addSetToExercise(todaysWorkout, exId);
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
  };

  const deleteExercise = (exId: number) => {
    const updated = deleteExerciseFromWorkout(todaysWorkout, exId);
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
  };

  const moveExercise = (exId: number, direction: 'up' | 'down') => {
    const updated = moveExerciseInWorkout(todaysWorkout, exId, direction);
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
  };

  const finishWorkout = () => {
    updateData(finishWorkoutState(data, today, todaysWorkout));
    setIsSessionActive(false);
    setShowOverview(false);
  };

  const undoFinish = () => {
    updateData(undoFinishState(data, today));
    setShowOverview(true);
    setIsSessionActive(false);
  };

  const startNewSession = () => {
    updateData(startNewSessionState(data, today, todaysWorkout));
    setIsSessionActive(false);
    setShowOverview(false);
    setTimeout(() => setShowTemplatePicker(true), 100);
  };

  const abortSession = () => {
    confirmAction(ABORT_SESSION_TITLE, ABORT_SESSION_MESSAGE, () => {
      updateData(abortSessionState(data, today));
      setIsAddingExercise(false);
      setShowTemplatePicker(false);
      setNewExerciseName('');
      setSuggestions([]);
    }, 'Discard');
  };

  const calculateTotalVolumeLocal = () => calculateTotalVolume(visibleWorkout as any);

  const currentExercise = visibleWorkout[currentExIndex];

  if (isFinished) {
    return (
      <FinishedSessionView
        visibleWorkout={visibleWorkout}
        calculateTotalVolume={calculateTotalVolumeLocal}
        onStartNewSession={startNewSession}
        onUndo={undoFinish}
      />
    );
  }

  return (
    <>
      <TemplatePickerModal
        visible={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        templateSearchQuery={templateSearchQuery}
        onChangeSearch={setTemplateSearchQuery}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
        selectedFolder={selectedFolder}
        onToggleFolderFilter={handleToggleFolderFilter}
        onSelectFolder={(folderId) => setSelectedFolder(folderId)}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        onClearTags={handleClearTags}
        folders={folders}
        onNewFolder={() => setShowCreateFolderModal(true)}
        allTags={allTags}
        loading={loadingTemplates}
        templates={filteredTemplates}
        favorites={favorites}
        userId={user?.id}
        onApplyTemplate={applyTemplate}
        onToggleFavorite={toggleFavorite}
        onEditTemplate={handleEditTemplate}
        onDeleteTemplate={confirmDeleteTemplate}
        onDuplicateTemplate={duplicateTemplate}
        onShareTemplate={shareTemplate}
      />

      <ScrollView style={workoutStyles.gymView} contentContainerStyle={workoutStyles.gymViewContent}>
        <AddExerciseOverlay
          visible={isAddingExercise}
          newExerciseName={newExerciseName}
          suggestions={suggestions}
          onChangeName={handleNameChange}
          onSubmit={() => addExercise()}
          onSelectSuggestion={selectSuggestion}
          onClose={() => setIsAddingExercise(false)}
        />

        <SaveTemplateModal
          visible={showSaveTemplateModal}
          onClose={() => {
            setShowSaveTemplateModal(false);
            setTemplateName('');
            setSaveTemplateFolder(null);
            setSaveTemplateTags([]);
          }}
          onSave={saveCurrentAsTemplate}
          templateName={templateName}
          onChangeTemplateName={setTemplateName}
          saveTemplateFolder={saveTemplateFolder}
          onSelectFolder={(folderId) => setSaveTemplateFolder(folderId)}
          folders={folders}
          saveTemplateTags={saveTemplateTags}
          onChangeTags={setSaveTemplateTags}
          saveTemplateTagInputRef={saveTemplateTagInputRef}
          exerciseCount={visibleWorkout.length}
        />

        <CreateFolderModal
          visible={showCreateFolderModal}
          newFolderName={newFolderName}
          onChangeFolderName={setNewFolderName}
          onCreate={() => {
            const name = newFolderName.trim();
            if (name) {
              createFolder(name);
              setShowCreateFolderModal(false);
              setNewFolderName('');
            }
          }}
          onClose={() => {
            setShowCreateFolderModal(false);
            setNewFolderName('');
          }}
        />

        {showOverview && !isSessionActive ? (
          <WorkoutOverview
            visibleWorkout={visibleWorkout}
            editingExerciseId={editingExerciseId}
            onClose={closeOverview}
            onAddExercise={() => setIsAddingExercise(true)}
            onSaveTemplate={() => setShowSaveTemplateModal(true)}
            onStartSession={startSession}
            onMoveExercise={moveExercise}
            onDeleteExercise={deleteExercise}
            onBeginEdit={setEditingExerciseId}
            onRenameExercise={handleRenameExercise}
            onEndEdit={() => setEditingExerciseId(null)}
          />
        ) : visibleWorkout.length === 0 ? (
          <EmptyWorkoutCard
            onLoadTemplate={() => setShowTemplatePicker(true)}
            onCustomInput={() => {
              setIsAddingExercise(true);
              setShowOverview(true);
            }}
          />
        ) : (
          <View style={workoutStyles.workoutContainer}>
            <WorkoutHeader
              isSessionActive={isSessionActive}
              viewMode={viewMode}
              currentIndex={currentExIndex}
              totalExercises={visibleWorkout.length}
              onBackToOverview={() => {
                setShowOverview(true);
                setIsSessionActive(false);
              }}
              onToggleViewMode={() => setViewMode(viewMode === 'list' ? 'focus' : 'list')}
              onAddExercise={() => setIsAddingExercise(true)}
            />

            {viewMode === 'list' ? (
              <WorkoutListView
                visibleWorkout={visibleWorkout}
                onSelectExercise={(i) => {
                  setCurrentExIndex(i);
                  setViewMode('focus');
                }}
                onFinish={finishWorkout}
                onAbort={abortSession}
              />
            ) : (
              <View style={workoutStyles.workoutFocus}>
                <WorkoutFocusHeader
                  currentExerciseName={currentExercise?.name}
                  currentIndex={currentExIndex}
                  totalExercises={visibleWorkout.length}
                  onPrev={() => setCurrentExIndex(Math.max(0, currentExIndex - 1))}
                  onNext={() => setCurrentExIndex(Math.min(visibleWorkout.length - 1, currentExIndex + 1))}
                />

                <WorkoutFocusSets
                  currentExercise={currentExercise}
                  getExerciseConfig={getExerciseConfig}
                  updateSet={updateSet}
                />

                <TouchableOpacity
                  onPress={() => currentExercise && addSet(currentExercise.id)}
                  style={workoutStyles.addSetButton}
                  disabled={!currentExercise}
                >
                  <Plus size={16} color="#64748b" />
                  <Text style={workoutStyles.addSetButtonText}>ADD SET</Text>
                </TouchableOpacity>

                <WorkoutFocusActions
                  hasNext={currentExIndex < visibleWorkout.length - 1}
                  onNext={() => setCurrentExIndex(currentExIndex + 1)}
                  onFinish={finishWorkout}
                  onAbort={abortSession}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
};

export default GymView;
