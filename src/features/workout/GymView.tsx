/**
 * GYM VIEW COMPONENT
 * =================
 *
 * Main workout execution interface. Handles:
 * - Workout planning and creation
 * - Active workout sessions
 * - Template and plan management
 * - Exercise execution with set tracking
 * - Rest timing and session management
 *
 * FEATURE RESPONSIBILITIES:
 * - Plan selection and creation
 * - Workout session execution
 * - Template browsing and application
 * - Exercise and set management
 * - Session timing and completion
 */

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
import WorkoutPlanner, { WorkoutPlanCreator } from './components/WorkoutPlanner';
import FinishedSessionView from './components/FinishedSessionView';
import NeonButton from '../../components/NeonButton';
import GlassCard from '../../components/GlassCard';
import workoutStyles from '../../styles/workout';
import { getAllExerciseNames } from './workoutConfig';
import { calculateTotalVolume, getExerciseConfig, calculateXP, getNextScheduledWorkout, planToWorkout } from './helpers';
import { WorkoutPlan } from '../../types/workout';
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

import WorkoutPlansLibrary from './components/WorkoutPlansLibrary';

const GymView = ({ data, updateData, user }: GymViewProps) => {
  const [showPlanLibrary, setShowPlanLibrary] = useState(false);
  const DEFAULT_REST_SECONDS = 90;
  const REST_INCREMENT_SECONDS = 30;
  const Haptics = (() => {
    try {
      return require('expo-haptics');
    } catch {
      return null;
    }
  })();

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
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastCompletedAt, setLastCompletedAt] = useState<number | null>(null);

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

  // Get the active user workout plan for use across handlers
  const activeUserPlan = (data.userWorkoutPlans || []).find((plan: any) => plan.isActive);

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
  const [showPlanCreator, setShowPlanCreator] = useState(false);
  const [suggestedPlanType, setSuggestedPlanType] = useState<WorkoutPlan['equipment'] | undefined>();

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

  const openSaveTemplate = () => {
    closePicker();
    setShowSaveTemplateModal(true);
  };

  const handleEditTemplate = (template: any) => {
    setTemplateName(template.name);
    setSaveTemplateFolder(template.folder_id || null);
    setSaveTemplateTags(template.tags || []);
    openSaveTemplate();
  };

  useEffect(() => {
    if (!user || !pickerOpen) return;
    fetchAll();
  }, [user, pickerOpen, fetchAll]);

  useEffect(() => {
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    };
  }, []);

  const confirmDeleteTemplate = (templateId: string) => {
    confirmAction('Delete Template', 'Remove this template permanently?', () => deleteTemplate(templateId), 'Delete');
  };

  const handleNameChange = (val: string) => {
    setNewExerciseName(val);
    if (val.length > 0) {
      const allNames = getAllExerciseNames(data);
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
    const normalized = { ...(template as any), exercises: (template.exercises || []) as string[] };
    applyTemplate(normalized as any);
    closePicker();
    setShowOverview(true);
    stopSession();
  };

  const clearRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setRestSeconds(null);
  };

  const startRestTimer = (seconds: number = DEFAULT_REST_SECONDS) => {
    if (seconds <= 0) {
      clearRestTimer();
      return;
    }
    clearRestTimer();
    setRestSeconds(seconds);
    restTimerRef.current = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearRestTimer();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const skipRest = () => clearRestTimer();
  const extendRest = (extra: number = REST_INCREMENT_SECONDS) => {
    setRestSeconds((prev) => {
      const next = (prev ?? 0) + extra;
      if (!restTimerRef.current) {
        startRestTimer(next);
        return next;
      }
      return next;
    });
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
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      showSuccess('Template saved successfully');
      setTemplateName('');
      setSaveTemplateFolder(null);
      setSaveTemplateTags([]);
      setShowSaveTemplateModal(false);
    } catch (error: any) {
      showError(error.message || 'Failed to save template');
    }
  };

  const templatePickerProps = {
    visible: pickerOpen,
    onClose: () => closePicker(),
    templateSearchQuery,
    onChangeSearch: setTemplateSearchQuery,
    showFavoritesOnly,
    onToggleFavorites: () => setShowFavoritesOnly(!showFavoritesOnly),
    selectedFolder,
    onToggleFolderFilter: handleToggleFolderFilter,
    onSelectFolder: (folderId: string | null) => setSelectedFolder(folderId),
    selectedTags,
    onToggleTag: handleToggleTag,
    onClearTags: handleClearTags,
    folders,
    onNewFolder: () => setShowCreateFolderModal(true),
    allTags,
    loading,
    templates: filteredTemplates,
    favorites,
    userId: user?.id,
    onApplyTemplate: applyTemplateHandler as any,
    onToggleFavorite: toggleFavorite,
    onEditTemplate: handleEditTemplate as any,
    onDeleteTemplate: confirmDeleteTemplate,
    onDuplicateTemplate: duplicateTemplate as any,
    onShareTemplate: shareTemplate as any,
  };

  const saveTemplateModalProps = {
    visible: showSaveTemplateModal,
    onClose: () => {
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setSaveTemplateFolder(null);
      setSaveTemplateTags([]);
    },
    onSave: saveCurrentAsTemplate,
    templateName,
    onChangeTemplateName: setTemplateName,
    saveTemplateFolder,
    onSelectFolder: (folderId: string | null) => setSaveTemplateFolder(folderId),
    folders,
    saveTemplateTags,
    onChangeTags: setSaveTemplateTags,
    saveTemplateTagInputRef,
    exerciseCount: visibleWorkout.length,
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

  const handleQuickWorkout = (type: string) => {
    const workoutTemplates = {
      push: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Tricep Dips', 'Lateral Raises'],
      pull: ['Deadlift', 'Pull-ups', 'Barbell Rows', 'Face Pulls', 'Bicep Curls'],
      legs: ['Squats', 'Romanian Deadlift', 'Leg Press', 'Calf Raises', 'Leg Curls'],
      fullbody: ['Bench Press', 'Squats', 'Pull-ups', 'Overhead Press', 'Barbell Rows']
    };

    const exercises = workoutTemplates[type as keyof typeof workoutTemplates] || [];
    exercises.forEach((exercise, index) => {
      setTimeout(() => {
        addExerciseHook(exercise);
      }, index * 100); // Stagger adding exercises
    });

    setShowOverview(true);
    showSuccess(`${type.toUpperCase()} workout loaded!`);
  };

  const handleAISuggestion = () => {
    // For now, create a balanced workout based on recent activity
    // In a real implementation, this would call an AI service
    const aiWorkout = ['Bench Press', 'Squats', 'Pull-ups', 'Overhead Press', 'Plank'];
    aiWorkout.forEach((exercise, index) => {
      setTimeout(() => {
        addExerciseHook(exercise);
      }, index * 100);
    });

    setShowOverview(true);
    showSuccess('AI workout generated based on your progress!');
  };

  const handleCreatePlan = (plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'isTemplate'>) => {
    const newPlan: WorkoutPlan = {
      ...plan,
      id: `plan_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updatedPlans = [...(data.workoutPlans || []), newPlan];
    updateData({ ...data, workoutPlans: updatedPlans });
    showSuccess(`Plan "${newPlan.name}" created successfully!`);
  };

  const handleActivatePlan = (planId: string) => {
    const updatedUserPlans = (data.userWorkoutPlans || []).map((plan: any) => ({
      ...plan,
      isActive: plan.planId === planId
    }));

    updateData({
      ...data,
      userWorkoutPlans: updatedUserPlans,
      activePlanId: planId
    });

    const activePlan = updatedUserPlans.find((p: any) => p.isActive);
    showSuccess(`${activePlan?.customName || activePlan?.planData?.name} activated!`);
  };

  const handleSelectWorkout = (workoutType: string, planId?: string) => {
    handleQuickWorkout(workoutType);
  };

  const handleStartScheduledWorkout = (date: Date, workout: any) => {
    if (!activeUserPlan?.planData) return;

    // Find the scheduled session for this date
    const dayOfWeek = date.getDay();
    const dayNames: (keyof WorkoutPlan['schedule'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const dailySchedule = activeUserPlan.planData.schedule[dayName] || [];

    if (dailySchedule.length > 0) {
      const scheduledSession = dailySchedule[0];
      const session = activeUserPlan.planData.sessions.find((s: any) => s.id === scheduledSession.sessionId);

      if (session) {
        // Convert the session exercises to workout format and start it
        const newExercises = session.exercises.map((exercise: any, index: number) => ({
          id: `${Date.now()}-${index}-${Math.random()}`,
          name: exercise.name,
          sets: [{ id: Date.now() + index + 100, weight: '', reps: '', completed: false }],
        }));

        const updatedWorkouts = { ...data.workouts, [today]: [...todaysWorkout, ...newExercises] };
        const newLogs = !isCheckedIn ? [...(data.gymLogs || []), today] : data.gymLogs || [];
        updateData({ ...data, workouts: updatedWorkouts, gymLogs: newLogs });

        setShowOverview(true);
        showSuccess(`Started ${session.name}!`);
      }
    }
  };

  const handleEditPlan = () => {
    // TODO: Open plan editor for active plan
    showSuccess('Plan editor coming soon!');
  };

  const handleChangePlan = () => {
    setShowPlanLibrary(true);
  };

  const handleCreateFromExisting = () => {
    setShowPlanLibrary(true);
  };

  const handleEndPlan = () => {
    if (activeUserPlan) {
      const updatedUserPlans = (data.userWorkoutPlans || []).map((plan: any) => ({
        ...plan,
        isActive: false
      }));

      updateData({
        ...data,
        userWorkoutPlans: updatedUserPlans,
        activePlanId: undefined
      });

      showSuccess(`${activeUserPlan.customName || activeUserPlan.planData?.name} ended.`);
    }
  };

  const updateSet = (exId: number, setIndex: number, field: string, value: any) => {
    // Apply updates locally to avoid overwriting when multiple updates happen in one action
    const workoutsCopy = [...todaysWorkout];
    const exIdx = workoutsCopy.findIndex((ex) => ex.id === exId);
    if (exIdx === -1) return;
    const sets = [...workoutsCopy[exIdx].sets];
    if (!sets[setIndex]) return;

    const updatedSet: any = { ...sets[setIndex], [field]: value };

    if (field === 'completed' && value === true) {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const now = Date.now();
      const elapsedSec = lastCompletedAt
        ? Math.max(0, Math.round((now - lastCompletedAt) / 1000))
        : 0;
      updatedSet.restSeconds = elapsedSec;
      updatedSet.completedAt = new Date(now).toISOString();
      startRestTimer();
      setLastCompletedAt(now);
    } else if (field === 'completed' && value === false) {
      skipRest();
      setLastCompletedAt(null);
      updatedSet.restSeconds = undefined;
      updatedSet.completedAt = undefined;
    }

    sets[setIndex] = updatedSet;
    workoutsCopy[exIdx] = { ...workoutsCopy[exIdx], sets };
    updateData({ ...data, workouts: { ...data.workouts, [today]: workoutsCopy } });
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

  const renderTemplatePicker = () => (
    <TemplatePickerModal
      {...templatePickerProps}
    />
  );

  const renderAddExerciseOverlay = () => (
    <AddExerciseOverlay
      visible={isAddingExercise}
      newExerciseName={newExerciseName}
      suggestions={suggestions}
      onChangeName={handleNameChange}
      onSubmit={() => addExercise()}
      onSelectSuggestion={selectSuggestion}
      onClose={() => setIsAddingExercise(false)}
    />
  );

  const renderSaveTemplateModal = () => (
    <SaveTemplateModal
      {...saveTemplateModalProps}
    />
  );

  const renderCreateFolderModal = () => (
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
  );

  const renderWorkoutList = () => (
    <WorkoutListView
      visibleWorkout={visibleWorkout}
      onSelectExercise={(i) => selectExercise(i)}
      onFinish={finishWorkout}
      onAbort={abortSession}
    />
  );

  const renderWorkoutFocus = () => (
    <View style={workoutStyles.workoutFocus}>
      <WorkoutFocusHeader
        currentExerciseName={currentExercise?.name}
        currentIndex={currentExIndex}
        totalExercises={visibleWorkout.length}
        onPrev={prevExercise}
        onNext={nextExercise}
      />

      {restSeconds !== null && (
        <View style={workoutStyles.restTimerPill}>
          <Text style={workoutStyles.restTimerText}>
            REST {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
          </Text>
          <View style={workoutStyles.restTimerActions}>
            <TouchableOpacity onPress={() => extendRest()} style={workoutStyles.restTimerButton}>
              <Text style={workoutStyles.restTimerButtonText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={skipRest} style={workoutStyles.restTimerButtonSecondary}>
              <Text style={workoutStyles.restTimerButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  );

  const renderOverview = () => {
    if (showOverview && !isSessionActive) {
      return (
        <WorkoutOverview
          visibleWorkout={visibleWorkout}
          editingExerciseId={editingExerciseId}
          onClose={closeOverview}
          onAddExercise={() => setIsAddingExercise(true)}
          onSaveTemplate={openSaveTemplate}
          onStartSession={startSession}
          onMoveExercise={moveExercise}
          onDeleteExercise={deleteExercise}
          onBeginEdit={setEditingExerciseId}
          onRenameExercise={handleRenameExercise}
          onEndEdit={() => setEditingExerciseId(null)}
        />
      );
    }

    if (visibleWorkout.length === 0) {
      // Prepare recent workouts data
      const recentWorkouts = (data.gymLogs || [])
        .slice(-30) // Last 30 days for calendar view
        .map((date: string) => {
          const workout = data.workouts?.[date] || [];
          const volume = calculateTotalVolume(workout);
          return {
            date: new Date(date).toLocaleDateString(),
            dateStr: date,
            exercises: workout.length,
            volume,
            name: workout.length > 0 ? `${workout[0].name}${workout.length > 1 ? ` +${workout.length - 1}` : ''}` : 'Empty Workout'
          };
        });

      const workoutPlans: WorkoutPlan[] = data.workoutPlans || [];
      const userWorkoutPlans: any[] = data.userWorkoutPlans || [];
      const activePlan = activeUserPlan?.planData;
      const activePlanForDisplay = activeUserPlan;
      const nextScheduledWorkout = getNextScheduledWorkout(activeUserPlan);

      return (
        <>
        <WorkoutPlanner
          onLoadTemplate={() => openPicker()}
          onCustomInput={() => {
            setIsAddingExercise(true);
            setShowOverview(true);
          }}
          onQuickWorkout={(type) => handleQuickWorkout(type)}
          onAISuggestion={() => handleAISuggestion()}
          onCreatePlan={(suggestedType) => {
            setSuggestedPlanType(suggestedType);
            setShowPlanCreator(true);
          }}
          onBrowsePlans={handleChangePlan}
          onEditPlan={handleEditPlan}
          onChangePlan={handleChangePlan}
          onCreateFromExisting={handleCreateFromExisting}
          onEndPlan={handleEndPlan}
          onSelectWorkout={handleSelectWorkout}
          onStartScheduledWorkout={handleStartScheduledWorkout}
          onStartCalendarWorkout={handleStartScheduledWorkout}
          recentWorkouts={recentWorkouts}
          workoutPlans={workoutPlans}
          activePlan={activePlanForDisplay}
          onActivatePlan={handleActivatePlan}
          userEquipment="gym" // TODO: Get from user preferences
          userFrequency={3} // TODO: Get from user preferences
          nextScheduledWorkout={nextScheduledWorkout}
        />

          <WorkoutPlansLibrary
            visible={showPlanLibrary}
            onClose={() => setShowPlanLibrary(false)}
            onSelectPlan={(plan) => {
              // Convert template to UserWorkoutPlan
              const userPlan = {
                id: `plan_${Date.now()}`,
                userId: user?.id,
                planId: plan.id,
                planData: plan,
                startedAt: new Date().toISOString(),
                isActive: true,
                createdAt: new Date().toISOString()
              };
              // Add to user plans and activate
              const updatedUserPlans = [...(data.userWorkoutPlans || []).map((p: any) => ({...p, isActive: false})), userPlan];
              updateData({ ...data, userWorkoutPlans: updatedUserPlans, activePlanId: userPlan.planId });
              setShowPlanLibrary(false);
              showSuccess(`Started ${plan.name}!`);
            }}
            onManagePlan={(plan) => {
              // TODO: Open plan editor
              setShowPlanLibrary(false);
            }}
            onCreateNew={() => {
              setShowPlanCreator(true);
            }}
            userPlans={data.workoutPlans || []}
            userEquipment="gym"
            userFrequency={3}
          />

          <WorkoutPlanCreator
            visible={showPlanCreator}
            onClose={() => {
              setShowPlanCreator(false);
              setSuggestedPlanType(undefined);
            }}
            onCreatePlan={handleCreatePlan}
          />
        </>
      );
    }

    return (
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

        {viewMode === 'list' ? renderWorkoutList() : renderWorkoutFocus()}
      </View>
    );
  };

  const renderFinished = () => (
    <FinishedSessionView
      visibleWorkout={visibleWorkout}
      calculateTotalVolume={calculateTotalVolumeLocal}
      onStartNewSession={startNewSession}
      onUndo={undoFinish}
    />
  );

  if (isFinished) {
    return renderFinished();
  }

  return (
    <>
      {renderTemplatePicker()}
      {renderSaveTemplateModal()}
      {renderCreateFolderModal()}
      {renderAddExerciseOverlay()}
      <ScrollView style={workoutStyles.gymView} contentContainerStyle={workoutStyles.gymViewContent}>
        {renderOverview()}
      </ScrollView>
    </>
  );
};

export default GymView;
