import React, { useEffect, useRef, useState } from 'react';
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
import { DEFAULT_EXERCISES } from '../../constants/appConstants';
import { calculateTotalVolume, getExerciseConfig } from './helpers';
import { ABORT_SESSION_MESSAGE, ABORT_SESSION_TITLE } from '../../constants/text';
import { confirmAction, showError, showSuccess } from '../../utils/alerts';
import { useTodayWorkout } from './hooks/useTodayWorkout';
import { useSessionView } from './hooks/useSessionView';
import { useTemplates } from './hooks/useTemplates';

type GymViewProps = {
  data: any;
  updateData: (d: any) => void;
  user: any;
};

const GymView = ({ data, updateData, user }: GymViewProps) => {
  const {
    today,
    todaysWorkout,
    visibleWorkout,
    isCheckedIn,
    isFinished,
    toggleCheckIn,
    addExercise: addExerciseHook,
    rename: renameExerciseHook,
    move: moveExerciseHook,
    remove: deleteExerciseHook,
    addSet: addSetHook,
    updateSet: updateSetHook,
    finishWorkout: finishWorkoutHook,
    undoFinish: undoFinishHook,
    startNewSession: startNewSessionHook,
    abortSession: abortSessionHook,
  } = useTodayWorkout(data, updateData);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);

  const {
    viewMode,
    currentExIndex,
    showOverview,
    isSessionActive,
    selectExercise,
    nextExercise,
    prevExercise,
    toggleViewMode,
    startSession: startSessionView,
    stopSession,
    openOverview,
    closeOverview: closeOverviewView,
    setCurrentExIndex,
    setViewMode,
    setShowOverview,
  } = useSessionView(visibleWorkout);

  const {
    templates,
    folders,
    favorites,
    loading,
    templateSearchQuery,
    selectedFolder,
    selectedTags,
    showFavoritesOnly,
    pickerOpen,
    openPicker,
    closePicker,
    setTemplateSearchQuery,
    setSelectedFolder,
    setSelectedTags,
    setShowFavoritesOnly,
    fetchAll,
    applyTemplate,
    saveTemplateToSupabase,
    toggleFavorite,
    deleteTemplate,
    duplicateTemplate,
    createFolder,
    shareTemplate,
    filteredTemplates,
    allTags,
  } = useTemplates({
    userId: user?.id,
    data,
    updateData,
    today,
    todaysWorkout,
    isCheckedIn,
  });

  const startSessionHandler = () => {
    startSessionView();
    closePicker();
  };
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTemplateFolder, setSaveTemplateFolder] = useState<string | null>(null);
  const [saveTemplateTags, setSaveTemplateTags] = useState<string[]>([]);
  const saveTemplateTagInputRef = useRef<TextInput | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const closeOverview = closeOverviewView;

  const handleRenameExercise = (id: number, name: string) => {
    renameExerciseHook(id, name);
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
    if (!user || !pickerOpen) return;
    fetchAll();
  }, [user, pickerOpen, fetchAll]);

  const confirmDeleteTemplate = (templateId: string) => {
    confirmAction('Delete Template', 'Remove this template permanently?', () => deleteTemplate(templateId), 'Delete');
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

  const applyTemplateHandler = (template: any) => {
    applyTemplate(template);
    closePicker();
    setShowOverview(true);
    stopSession();
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

  const addExercise = (position: 'top' | 'bottom' = 'bottom') => {
    if (!newExerciseName.trim()) return;
    addExerciseHook(newExerciseName, position);
    setNewExerciseName('');
    setIsAddingExercise(false);
    setEditingExerciseId(null);
  };

  const startSession = startSessionHandler;

  const editExerciseName = (exId: number, newName: string) => {
    renameExerciseHook(exId, newName);
    setEditingExerciseId(null);
  };

  const updateSet = (exId: number, setIndex: number, field: string, value: any) => {
    updateSetHook(exId, setIndex, field, value);
  };

  const addSet = (exId: number) => {
    addSetHook(exId);
  };

  const deleteExercise = (exId: number) => {
    deleteExerciseHook(exId);
  };

  const moveExercise = (exId: number, direction: 'up' | 'down') => {
    moveExerciseHook(exId, direction);
  };

  const finishWorkout = () => {
    finishWorkoutHook();
    stopSession();
    setShowOverview(false);
  };

  const undoFinish = () => {
    undoFinishHook();
    setShowOverview(true);
    stopSession();
  };

  const startNewSession = () => {
    startNewSessionHook();
    stopSession();
    setShowOverview(false);
    setViewMode('focus');
    setCurrentExIndex(0);
    setTimeout(() => openPicker(), 100);
  };

  const abortSession = () => {
    confirmAction(ABORT_SESSION_TITLE, ABORT_SESSION_MESSAGE, () => {
      abortSessionHook(true);
      stopSession();
      setIsAddingExercise(false);
      closePicker();
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
        visible={pickerOpen}
        onClose={() => closePicker()}
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
        loading={loading}
        templates={filteredTemplates}
        favorites={favorites}
        userId={user?.id}
        onApplyTemplate={applyTemplateHandler}
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
            onLoadTemplate={() => openPicker()}
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
                stopSession();
              }}
              onToggleViewMode={toggleViewMode}
              onAddExercise={() => setIsAddingExercise(true)}
            />

            {viewMode === 'list' ? (
              <WorkoutListView
                visibleWorkout={visibleWorkout}
                onSelectExercise={(i) => selectExercise(i)}
                onFinish={finishWorkout}
                onAbort={abortSession}
              />
            ) : (
              <View style={workoutStyles.workoutFocus}>
                <WorkoutFocusHeader
                  currentExerciseName={currentExercise?.name}
                  currentIndex={currentExIndex}
                  totalExercises={visibleWorkout.length}
                  onPrev={prevExercise}
                  onNext={nextExercise}
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
                  onNext={nextExercise}
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
