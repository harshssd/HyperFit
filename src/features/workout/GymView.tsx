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
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
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
  Play,
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
import SharePlanModal from '../../components/SharePlanModal';
import WorkoutOverview from './components/WorkoutOverview';
import WorkoutListView from './components/WorkoutListView';
import WorkoutFocusSets from './components/WorkoutFocusSets';
import WorkoutFocusActions from './components/WorkoutFocusActions';
import RestTimerBar from './components/RestTimerBar';
import WorkoutHeader from './components/WorkoutHeader';
import WorkoutFocusHeader from './components/WorkoutFocusHeader';
import WorkoutPlanner from './components/WorkoutPlanner';
import FinishedSessionView from './components/FinishedSessionView';
import NeonButton from '../../components/NeonButton';
import GlassCard from '../../components/GlassCard';
import workoutStyles from '../../styles/workout';
import { colors, spacing, radii } from '../../styles/theme';
import { getAllExerciseNames } from './workoutConfig';
import { useUser } from '../../contexts/UserContext';
import { logWorkoutSession } from '../../services/workoutService';
import { WorkoutExercise, WorkoutPlan } from '../../types/workout';
import { 
  calculateTotalVolume, 
  getExerciseConfig, 
  renameExercise,
  moveExerciseInWorkout,
  deleteExerciseFromWorkout,
  addSetToExercise,
  updateSetValue,
  isExerciseEmpty,
  getNextScheduledWorkout
} from './helpers';

import { useSessionView } from './hooks/useSessionView';
import { useTemplates } from './hooks/useTemplates';
import { useRecentWorkouts } from './hooks/useRecentWorkouts';
import { useLastSessionSets } from './hooks/useLastSessionSets';
import { useActiveWorkoutSession } from '../../contexts/WorkoutSessionContext';

let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // Optional native module — gracefully degrade.
}
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { usePlanActions } from './hooks/usePlanActions';
import { fetchWorkoutPlanDetails, createUserWorkoutPlan, updateUserWorkoutPlan, deactivateUserWorkoutPlans, findUserWorkoutPlan, fetchExercises } from '../../services/workoutService';
import { confirmAction, showError, showSuccess } from '../../utils/alerts';
import { ABORT_SESSION_TITLE, ABORT_SESSION_MESSAGE } from '../../constants/text';

type GymViewProps = {
  data: any;
  updateData: (d: any) => void;
  user: any;
  /**
   * Which surface this mount is rendering:
   * - "planner" (default): the Gym/Plans tab. Plan management, templates,
   *   quick-start tiles, and a Resume Workout CTA when a session is active.
   * - "session": the ActiveWorkout modal route. Renders only the focused
   *   workout / list / finished UI.
   */
  mode?: 'planner' | 'session';
  /** Called when the modal should dismiss itself (session mode only). */
  onDismissSession?: () => void;
  /** Called from planner when user wants to open the active workout modal. */
  onOpenSession?: () => void;
};

import WorkoutPlansLibrary from './components/WorkoutPlansLibrary';

const GymView = ({
  data,
  updateData,
  user,
  mode = 'planner',
  onDismissSession,
  onOpenSession,
}: GymViewProps) => {
  const [showPlanLibrary, setShowPlanLibrary] = useState(false);

  const { user: contextUser } = useUser();
  const userId = contextUser?.id || user?.id;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    activatePlan,
    submitForReview,
    withdrawFromReview,
    setShareable,
    rotateShareCode,
  } = usePlanActions({ userId, data, updateData });
  const [sharePlan, setSharePlan] = useState<WorkoutPlan | null>(null);
  const { recentWorkouts } = useRecentWorkouts(userId, 30);

  // Workout session, rest timer, and the active plan all come from a single
  // app-level provider so the upcoming ActiveWorkout modal route reads the
  // same instances and so GymView and the provider can't disagree about
  // which plan is active.
  const { session, restTimer, activeUserPlan } = useActiveWorkoutSession();
  const {
    sessionExercises,
    sessionStartTime,
    isSessionFinished,
    sessionContext,
    setSessionContext,
  } = session;

  // Aliases the rest of GymView reads.
  const visibleWorkout = sessionExercises;
  const restSeconds = restTimer.restSeconds;
  const startRestTimer = restTimer.startRest;
  const skipRest = restTimer.skipRest;
  const extendRest = restTimer.extendRest;

  // Pass-throughs preserved for now so the JSX below doesn't have to change in
  // a single mega-edit; the next PR replaces the call sites with `session.*`
  // and removes these.
  const addExerciseHook = session.addExercise;
  const renameExerciseHook = session.renameExerciseById;
  const moveExerciseHook = session.moveExercise;
  const deleteExerciseHook = session.deleteExercise;
  const addSetHook = session.addSet;
  const finishWorkoutHook = session.finishWorkout;
  const undoFinishHook = session.undoFinish;
  const startNewSessionHook = session.startNewSession;
  const abortSessionHook = session.abortSession;

  // Legacy mappings
  const today = new Date().toISOString().split('T')[0];
  const todaysWorkout = sessionExercises;
  const isCheckedIn = true;
  const isFinished = isSessionFinished;
  const toggleCheckIn = () => {};

  const [newExerciseName, setNewExerciseName] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [planSelectionMode, setPlanSelectionMode] = useState<'activate' | 'session'>('activate');
  const [sessionPickPlan, setSessionPickPlan] = useState<any | null>(null);
  const [sessionPickVisible, setSessionPickVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
  // restSeconds / startRestTimer / skipRest / extendRest now come from useRestTimer above.

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
    isCheckedIn,
    appendToSession: session.appendExercises,
  });

  const startSessionHandler = () => {
    startSessionView();
    closePicker();
    if (onOpenSession) onOpenSession();
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
    const loadExercises = async () => {
      try {
        const exercises = await fetchExercises();
        const names = exercises.map((e: any) => e.name).filter(Boolean);
        setExerciseOptions(names);
      } catch (err) {
        console.warn('Failed to load exercises', err);
      }
    };
    loadExercises();
  }, []);

  const confirmDeleteTemplate = (templateId: string) => {
    confirmAction('Delete Template', 'Remove this template permanently?', () => deleteTemplate(templateId), 'Delete');
  };

  const handleNameChange = (val: string) => {
    setNewExerciseName(val);
    if (val.length > 0) {
      const allNames = getAllExerciseNames(exerciseOptions);
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
    if (type === 'push' || type === 'pull' || type === 'legs' || type === 'fullbody') {
      session.startQuickWorkout(type);
      setShowOverview(true);
    }
  };

  const handleAISuggestion = () => {
    session.startAISuggestion();
    setShowOverview(true);
  };

  // Plan create + activate live in usePlanActions so PlanBuilderScreen and
  // GymView share one source of truth. The activation prompt is fired by the
  // hook itself after a successful create.
  const handleActivatePlan = activatePlan;

  const handleSelectWorkout = (workoutType: string, planId?: string) => {
    handleQuickWorkout(workoutType);
  };

  const startSessionFromPlan = (
    planData: any,
    sessionId: string,
    contextType: 'active_plan' | 'alternate_plan' | 'scheduled' = 'active_plan'
  ) => {
    session.startSessionFromPlan(planData, sessionId, contextType);
    setShowOverview(true);
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
        startSessionFromPlan(activeUserPlan.planData, session.id, 'scheduled');
      }
    }
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    // For now, just show a message. In the future, this would open the plan editor
    // with the existing plan data pre-populated
    showSuccess(`Edit plan: ${plan.name} - Coming soon!`);
  };

  const handleSyncPlan = (plan: WorkoutPlan) => {
    // Determine the source of truth for public plans
    // Since we removed DEFAULT_PLANS, we should look for a public plan with the same name
    // in the fetched plans list.
    const publicPlans = (data.workoutPlans || []).filter((p: WorkoutPlan) => p.is_public);
    const originalTemplate = publicPlans.find((p: WorkoutPlan) => p.name === plan.name);

    if (originalTemplate) {
      // Update the user's plan with the latest version from the original template
      const updatedPlans = (data.workoutPlans || []).map((p: WorkoutPlan) =>
        p.id === plan.id ? { ...originalTemplate, id: plan.id } : p
      );
      updateData({ ...data, workoutPlans: updatedPlans });
      showSuccess(`Synced ${plan.name} with latest template!`);
    } else {
      showSuccess('No updates available for this plan.');
    }
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

  const cleanupDuplicatePlans = () => {
    if (!data.userWorkoutPlans || data.userWorkoutPlans.length === 0) {
      showSuccess('No plans to clean up!');
      return;
    }

    // Group plans by planId to find duplicates
    const planGroups: { [planId: string]: any[] } = {};
    data.userWorkoutPlans.forEach((plan: any) => {
      const planId = plan.planId;
      if (!planGroups[planId]) {
        planGroups[planId] = [];
      }
      planGroups[planId].push(plan);
    });

    // For each group with duplicates, keep only the most recent one
    const cleanedPlans: any[] = [];
    let duplicatesRemoved = 0;

    Object.values(planGroups).forEach((plans: any[]) => {
      if (plans.length === 1) {
        // No duplicates, keep as is
        cleanedPlans.push(plans[0]);
      } else {
        // Has duplicates - sort by startedAt (most recent first) and keep the first one
        const sortedPlans = plans.sort((a, b) =>
          new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()
        );

        // Keep the most recent one (first in sorted array)
        cleanedPlans.push(sortedPlans[0]);
        duplicatesRemoved += plans.length - 1;
      }
    });

    // Preserve the active plan status
    const currentActiveId = data.activePlanId;
    const updatedPlans = cleanedPlans.map((plan: any) => ({
      ...plan,
      isActive: plan.planId === currentActiveId
    }));

    updateData({
      ...data,
      userWorkoutPlans: updatedPlans
    });

    showSuccess(`Cleaned up ${duplicatesRemoved} duplicate plan(s)!`);
  };

  const handleDeleteUserPlan = (userPlanId: string) => {
    const planToDelete = (data.userWorkoutPlans || []).find((p: any) => p.id === userPlanId);
    const planName = planToDelete?.planData?.name || 'this plan';

    confirmAction(
      'Delete Plan Instance',
      `Are you sure you want to delete your instance of "${planName}"? This will remove all progress tracking for this plan but keep your workout history.`,
      () => {
        // Remove the user plan instance
        const updatedUserPlans = (data.userWorkoutPlans || []).filter((p: any) => p.id !== userPlanId);

        // If we deleted the active plan, clear the active plan
        const deletedPlan = (data.userWorkoutPlans || []).find((p: any) => p.id === userPlanId);
        const newActivePlanId = deletedPlan?.isActive ? undefined : data.activePlanId;

        updateData({
          ...data,
          userWorkoutPlans: updatedUserPlans,
          activePlanId: newActivePlanId
        });

        showSuccess('Plan instance deleted!');
      },
      'Delete'
    );
  };

  const cleanupWorkoutPlans = () => {
    // Keep only plans that are public/standard templates
    const publicPlans = (data.workoutPlans || []).filter((plan: WorkoutPlan) => plan.is_public);
    // OR keep plans that match a known list of standard plan names/IDs if we had a constant source
    // For now, let's rely on the is_public flag which should be set on system plans

    // If we want to strictly enforce only "official" plans, we'd need a way to identify them.
    // Assuming data.workoutPlans contains both system and user plans.
    // The previous logic relied on DEFAULT_PLANS IDs.

    // New logic: Keep plans where is_public is true.
    const cleanedPlans = (data.workoutPlans || []).filter((plan: WorkoutPlan) => plan.is_public);

    updateData({ ...data, workoutPlans: cleanedPlans });
    showSuccess(`Cleaned up workout plans! Kept ${cleanedPlans.length} standard plans.`);
  };

  const updateSet = session.updateSet;

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
      abortSessionHook();
      stopSession();
      setIsAddingExercise(false);
      closePicker();
      setNewExerciseName('');
      setSuggestions([]);
    }, 'Discard');
  };

  const calculateTotalVolumeLocal = () => calculateTotalVolume(visibleWorkout as any);

  const currentExercise = visibleWorkout[currentExIndex];

  // Prefer the exerciseId already stamped on the WorkoutExercise (set when
  // adding from a plan or via addExercise). Fall back to the cache for
  // sessions hydrated before exerciseId was populated.
  const currentExerciseId = currentExercise
    ? (currentExercise as any).exerciseId
      ?? session.exerciseCache.get(currentExercise.name.toLowerCase())
      ?? null
    : null;
  const ghost = useLastSessionSets(userId, currentExerciseId);

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

      <WorkoutFocusSets
        currentExercise={currentExercise}
        getExerciseConfig={getExerciseConfig}
        updateSet={updateSet}
        ghostSets={ghost.sets}
        lastDate={ghost.date}
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

  // Defensive auto-dismiss: if the modal mounts (or stays mounted) without a
  // session, kick the user back to the planner. Done in an effect — calling
  // navigation.goBack() during render warns and can loop.
  useEffect(() => {
    if (mode === 'session' && visibleWorkout.length === 0 && !isFinished && onDismissSession) {
      onDismissSession();
    }
  }, [mode, visibleWorkout.length, isFinished, onDismissSession]);

  // After a finish flow that clears `sessionExercises`, the planner mount may
  // still have `showOverview=true` from the pre-session preview. Reset it so
  // the user lands on the regular planner instead of an empty WorkoutOverview.
  useEffect(() => {
    if (mode === 'planner' && visibleWorkout.length === 0 && showOverview) {
      setShowOverview(false);
    }
  }, [mode, visibleWorkout.length, showOverview, setShowOverview]);

  const renderOverview = () => {
    // SESSION MODE — skip every planner surface; only show the active workout.
    if (mode === 'session') {
      if (visibleWorkout.length === 0) {
        // Effect above handles the dismiss; render nothing in the meantime.
        return null;
      }
      return (
        <View style={workoutStyles.workoutContainer}>
          <WorkoutHeader
            isSessionActive={true}
            viewMode={viewMode}
            currentIndex={currentExIndex}
            totalExercises={visibleWorkout.length}
            onBackToOverview={() => {
              if (onDismissSession) onDismissSession();
            }}
            onToggleViewMode={toggleViewMode}
            onAddExercise={() => setIsAddingExercise(true)}
          />
          {viewMode === 'list' ? renderWorkoutList() : renderWorkoutFocus()}
        </View>
      );
    }

    // PLANNER MODE — show WorkoutOverview / WorkoutPlanner / Resume CTA.
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
      // recentWorkouts now comes from useRecentWorkouts (session_summary_view).
      const workoutPlans: WorkoutPlan[] = data.workoutPlans || [];
      const userWorkoutPlans: any[] = data.userWorkoutPlans || [];
      const activePlan = activeUserPlan?.planData;
      const activePlanForDisplay = activeUserPlan;
      const nextScheduledWorkout = getNextScheduledWorkout(activeUserPlan);

      return (
        <>
        <WorkoutPlanner
          onLoadTemplate={() => {
            setPlanSelectionMode('session');
            setShowPlanLibrary(true);
          }}
          onCustomInput={() => {
            setIsAddingExercise(true);
            setShowOverview(true);
          }}
          onQuickWorkout={(type) => handleQuickWorkout(type)}
          onAISuggestion={() => handleAISuggestion()}
          onCreatePlan={() => {
            navigation.navigate('PlanBuilder');
          }}
          onBrowsePlans={() => {
            setPlanSelectionMode('activate');
            handleChangePlan();
          }}
          onChangePlan={() => {
            setPlanSelectionMode('activate');
            handleChangePlan();
          }}
          onCreateFromExisting={handleCreateFromExisting}
          onEndPlan={handleEndPlan}
          onSelectWorkout={handleSelectWorkout}
          onStartScheduledWorkout={handleStartScheduledWorkout}
          onStartCalendarWorkout={handleStartScheduledWorkout}
          recentWorkouts={recentWorkouts}
          workoutPlans={workoutPlans}
          activePlan={activePlanForDisplay}
          onCleanupPlans={cleanupWorkoutPlans}
          userEquipment="gym" // TODO: Get from user preferences
          userFrequency={3} // TODO: Get from user preferences
          nextScheduledWorkout={nextScheduledWorkout}
        />

          <WorkoutPlansLibrary
            visible={showPlanLibrary}
            onClose={() => setShowPlanLibrary(false)}
            selectionMode={planSelectionMode}
            onSelectPlan={async (plan) => {
              try {
                // Always fetch the latest plan details
                const detailedPlan = await fetchWorkoutPlanDetails(plan.id);

                if (planSelectionMode === 'session') {
                  // Session pick mode: show sessions to choose and start
                  setSessionPickPlan({ ...plan, details: detailedPlan });
                  setSessionPickVisible(true);
                  setShowPlanLibrary(false);
                  setPlanSelectionMode('activate');
                  return;
                }

                if (!user?.id && !userId) {
                  showError('You must be signed in to select a plan.');
                  return;
                }

                const userPlans = data.userWorkoutPlans || [];

                // Always clear the active slot first, then look up the
                // existing (user, plan) row from the DB — local state can
                // be stale or missing the row entirely.
                const ownerId = user?.id || userId;
                await deactivateUserWorkoutPlans(ownerId);
                const existingUserPlan = await findUserWorkoutPlan(ownerId, plan.id);

                let userPlanId = existingUserPlan?.id;

                if (existingUserPlan?.id) {
                  await updateUserWorkoutPlan(existingUserPlan.id, { is_active: true });
                } else {
                  // Create new record in DB
                  const newUserPlan = await createUserWorkoutPlan({
                    user_id: user?.id || userId,
                    plan_id: plan.id,
                    is_active: true,
                    started_at: new Date().toISOString(),
                    custom_name: plan.name,
                  });
                  userPlanId = newUserPlan.id;
                }

                // Update local state to reflect activation and store details
                const updatedUserPlans = [
                  ...(userPlans || []).map((p: any) => ({
                    ...p,
                    isActive: p.planId === plan.id,
                    planData: p.planId === plan.id ? detailedPlan : p.planData,
                  })),
                ];

                // If we created a new plan record, add it locally
                if (!existingUserPlan) {
                  updatedUserPlans.push({
                    id: userPlanId,
                    userId: user?.id || userId,
                    planId: plan.id,
                    planData: detailedPlan,
                    startedAt: new Date().toISOString(),
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    customName: plan.name,
                  });
                }

                // Ensure only the selected plan is active locally
                const normalizedPlans = updatedUserPlans.map((p: any) => ({
                  ...p,
                  isActive: p.planId === plan.id,
                }));

                updateData({ ...data, userWorkoutPlans: normalizedPlans, activePlanId: plan.id });
                setShowPlanLibrary(false);
                showSuccess(`Activated ${plan.name}!`);
              } catch (error: any) {
                console.error('Error selecting plan:', error);
                if (error?.message?.includes('not found')) {
                  showError(`Plan "${plan.name}" is not available. Please refresh.`);
                } else {
                  showError('Failed to load plan details. Please try again.');
                }
              }
            }}
            onManagePlan={(plan) => {
              // TODO: Open plan editor
              setShowPlanLibrary(false);
            }}
            onCreateNew={() => {
              setShowPlanLibrary(false);
              navigation.navigate('PlanBuilder');
            }}
            onEditPlan={handleEditPlan}
            onSyncPlan={handleSyncPlan}
            onSubmitForReview={(p: WorkoutPlan) => submitForReview(p.id)}
            onWithdrawFromReview={(p: WorkoutPlan) => withdrawFromReview(p.id)}
            onOpenShare={(p: WorkoutPlan) => setSharePlan(p)}
            userPlans={(data.userWorkoutPlans || []).map((p: any) => p.planData).filter(Boolean)}
            // Owner-based partition keeps an approved+published user plan in
            // *their* library (so they keep seeing the status badge), while
            // also surfacing it in the public templates list for everyone.
            // While userId is still hydrating (auth/data race) the partition
            // would silently exclude every owned plan; fall back to the
            // legacy `!is_public` filter until userId arrives.
            userCreatedPlans={
              userId
                ? (data.workoutPlans || []).filter((p: WorkoutPlan) => p.user_id === userId)
                : (data.workoutPlans || []).filter((p: WorkoutPlan) => !p.is_public)
            }
            publicPlans={(data.workoutPlans || []).filter((p: WorkoutPlan) => p.is_public)}
            userEquipment="gym"
            userFrequency={3}
          />

          <SharePlanModal
            visible={!!sharePlan}
            plan={sharePlan}
            onClose={() => setSharePlan(null)}
            onToggleShareable={async (p, value) => {
              const fields = await setShareable(p.id, value);
              if (fields) setSharePlan({ ...p, ...fields });
            }}
            onRotateCode={async (p) => {
              const code = await rotateShareCode(p.id);
              if (code) setSharePlan({ ...p, share_code: code });
            }}
          />

          <Modal
            visible={sessionPickVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setSessionPickVisible(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.md }}>
              <View style={{ backgroundColor: '#0f172a', borderRadius: spacing.md, padding: spacing.lg }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: spacing.sm }}>
                  {sessionPickPlan?.name || sessionPickPlan?.details?.name || 'Plan'}
                </Text>
                <Text style={{ color: colors.muted, marginBottom: spacing.md }}>
                  Select a session to start
                </Text>

                <ScrollView style={{ maxHeight: 320 }}>
                  {sessionPickPlan?.details?.sessions?.map((session: any) => (
                    <TouchableOpacity
                      key={session.id}
                      onPress={() => {
                        startSessionFromPlan(sessionPickPlan.details, session.id, 'alternate_plan');
                        setSessionPickVisible(false);
                        setSessionPickPlan(null);
                      }}
                      style={{
                        paddingVertical: spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                        {session.name}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                        {session.focus?.toUpperCase() || 'GENERAL'} • {session.exercises?.length || 0} exercises
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  onPress={() => {
                    setSessionPickVisible(false);
                    setSessionPickPlan(null);
                  }}
                  style={{ marginTop: spacing.md, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </>
      );
    }

    // Planner mode + active session → "Resume Workout" CTA. The actual
    // workout UI lives in the ActiveWorkout modal route now.
    return (
      <View style={{ padding: spacing.lg }}>
        <TouchableOpacity
          onPress={() => onOpenSession && onOpenSession()}
          accessibilityRole="button"
          accessibilityLabel="Resume active workout"
          style={{
            padding: spacing.lg,
            borderRadius: radii.lg,
            backgroundColor: 'rgba(249,115,22,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(249,115,22,0.45)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <Play size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
              IN PROGRESS
            </Text>
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '700', marginTop: 2 }}>
              {sessionContext.customName || sessionContext.sessionName || 'Workout'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
              {visibleWorkout.length} exercises · tap to resume
            </Text>
          </View>
          <ChevronRight size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const handleCloseFinished = () => {
    session.startNewSession();
    if (mode === 'session' && onDismissSession) onDismissSession();
  };

  const renderFinished = () => (
    <FinishedSessionView
      visibleWorkout={visibleWorkout}
      calculateTotalVolume={calculateTotalVolumeLocal}
      onStartNewSession={startNewSession}
      onUndo={undoFinish}
      onClose={handleCloseFinished}
    />
  );

  // FinishedSessionView only renders in session mode (the modal). In planner
  // mode the user has to re-open the modal via the Resume CTA to acknowledge.
  if (isFinished && mode === 'session') {
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
      {/* Only the modal route owns the rest-timer bar. Otherwise both mounts
          would pin one to the bottom of the screen and they'd visually stack
          and steal touches in any uncovered region. */}
      {mode === 'session' && (
        <RestTimerBar
          restSeconds={restSeconds}
          totalSeconds={restTimer.totalSeconds}
          onExtend={extendRest}
          onSkip={skipRest}
        />
      )}
    </>
  );
};

export default GymView;