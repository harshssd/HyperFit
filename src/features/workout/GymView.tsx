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
import { ChevronRight, Play } from 'lucide-react-native';
import TemplatePickerModal from '../../components/TemplatePickerModal';
import AddExerciseOverlay from '../../components/AddExerciseOverlay';
import SaveTemplateModal from '../../components/SaveTemplateModal';
import CreateFolderModal from '../../components/CreateFolderModal';
import SharePlanModal from '../../components/SharePlanModal';
import WorkoutOverview from './components/WorkoutOverview';
import WorkoutPlanner from './components/WorkoutPlanner';
import ActiveSessionView from './components/ActiveSessionView';
import workoutStyles from '../../styles/workout';
import { colors, spacing, radii } from '../../styles/theme';
import { getAllExerciseNames } from './workoutConfig';
import { useUser } from '../../contexts/UserContext';
import { Template, UserData, UserWorkoutPlan, WorkoutPlan, WorkoutExercise } from '../../types/workout';
import type { User } from '@supabase/supabase-js';
import { calculateTotalVolume, getNextScheduledWorkout } from './helpers';

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
  data: UserData;
  updateData: (d: UserData) => void;
  user: User | null;
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
  /** One-shot action to perform once on mount (planner mode only). Consumed
   *  by Home's actions so the user lands directly on the relevant surface
   *  inside Plans without an extra tap.
   *  - 'open-library-pick': surface the library in session-pick mode
   *  - 'open-manual-overview': open the empty workout overview / exercise
   *    picker (same effect as tapping LOG MANUAL WORKOUT manually) */
  initialAction?: 'open-library-pick' | 'open-manual-overview';
  /** Cleared by the parent after `initialAction` is consumed so it doesn't
   *  fire again on subsequent mounts/focuses. */
  onConsumeInitialAction?: () => void;
};

import WorkoutPlansLibrary from './components/WorkoutPlansLibrary';

const GymView = ({
  data,
  updateData,
  user,
  mode = 'planner',
  onDismissSession,
  onOpenSession,
  initialAction,
  onConsumeInitialAction,
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
  const { session, activeUserPlan } = useActiveWorkoutSession();
  const {
    sessionExercises,
    sessionStartTime,
    isSessionFinished,
    lastSavedSessionId,
    sessionContext,
    setSessionContext,
  } = session;

  // Aliases the rest of GymView reads.
  const visibleWorkout = sessionExercises;

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
  const [sessionPickPlan, setSessionPickPlan] = useState<{ name?: string; details: WorkoutPlan } | null>(null);
  const [sessionPickVisible, setSessionPickVisible] = useState(false);
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

  // Consume the one-shot navigation intent on mount/focus. Run once, then
  // clear via the callback so re-entering the tab manually doesn't re-fire.
  useEffect(() => {
    if (mode !== 'planner' || !initialAction) return;
    if (initialAction === 'open-library-pick') {
      setPlanSelectionMode('session');
      setShowPlanLibrary(true);
    } else if (initialAction === 'open-manual-overview') {
      setShowOverview(true);
      setIsAddingExercise(true);
    }
    onConsumeInitialAction?.();
  }, [mode, initialAction, onConsumeInitialAction, setShowOverview]);

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
  // Synchronously-checked dedupe guard for the Add Exercise overlay. The
  // visibleWorkout dedupe in selectSuggestion / addExercise reads from
  // React state, which doesn't flush until the next render — two rapid
  // taps within a single render both see the pre-add state and slip
  // through. This ref mutates synchronously inside the handler and
  // clears on a microtask + a 250ms safety net, so back-to-back taps on
  // the same name collapse to a single insert.
  const inFlightAddRef = useRef<Set<string>>(new Set());
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

  const handleEditTemplate = (template: Template) => {
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
        const names = exercises.map(e => e.name).filter(Boolean);
        setExerciseOptions(names);
      } catch (err) {
        console.warn('Failed to load exercises', err);
      }
    };
    loadExercises();
  }, []);

  // When the Add Exercise overlay opens, prime the list with the full library
  // so users see browsable rows immediately instead of an empty box.
  useEffect(() => {
    if (!isAddingExercise) return;
    setSuggestions(getAllExerciseNames(exerciseOptions));
  }, [isAddingExercise, exerciseOptions]);

  const confirmDeleteTemplate = (templateId: string) => {
    confirmAction('Delete Template', 'Remove this template permanently?', () => deleteTemplate(templateId), 'Delete');
  };

  // The overlay is now scrollable, so we no longer cap at 5 suggestions —
  // empty query shows the whole library so users can browse, and a partial
  // query narrows it. The free-text fallback ("Add 'X' as new exercise")
  // surfaces only when the query is non-empty and has no exact match.
  const handleNameChange = (val: string) => {
    setNewExerciseName(val);
    const allNames = getAllExerciseNames(exerciseOptions);
    if (val.length > 0) {
      setSuggestions(
        allNames.filter((name) => name.toLowerCase().includes(val.toLowerCase())),
      );
    } else {
      setSuggestions(allNames);
    }
  };

  // Tap-to-add: previously this just stuffed the name into the input and
  // forced a second tap on ADD. Tapping a known exercise should add it
  // directly — the overlay stays open for rapid multi-add.
  const selectSuggestion = (name: string) => {
    const key = name.toLowerCase();
    // Synchronous in-flight check beats the React-state-only dedupe:
    // two taps in the same render both saw pre-add visibleWorkout
    // before this guard was added.
    if (inFlightAddRef.current.has(key)) {
      setNewExerciseName('');
      return;
    }
    const exists = visibleWorkout.some(
      e => e.name?.toLowerCase() === key,
    );
    if (exists) {
      setNewExerciseName('');
      return;
    }
    inFlightAddRef.current.add(key);
    setTimeout(() => inFlightAddRef.current.delete(key), 250);
    addExerciseHook(name, 'bottom');
    setNewExerciseName('');
    // Reset suggestions to the full library so the user keeps seeing
    // browsable rows after picking — without this the filtered list from
    // before the pick would linger even though the search input is cleared.
    setSuggestions(getAllExerciseNames(exerciseOptions));
  };

  const applyTemplateHandler = (template: Template) => {
    const normalized: Template = { ...template, exercises: (template.exercises || []) as string[] };
    applyTemplate(normalized);
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
      const exercises = visibleWorkout.map(ex => ex.name);
      await saveTemplateToSupabase(templateName, exercises, saveTemplateFolder, saveTemplateTags);
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      showSuccess('Template saved successfully');
      setTemplateName('');
      setSaveTemplateFolder(null);
      setSaveTemplateTags([]);
      setShowSaveTemplateModal(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save template');
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
    onApplyTemplate: applyTemplateHandler,
    onToggleFavorite: toggleFavorite,
    onEditTemplate: handleEditTemplate,
    onDeleteTemplate: confirmDeleteTemplate,
    onDuplicateTemplate: duplicateTemplate,
    onShareTemplate: shareTemplate,
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
    const trimmed = newExerciseName.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (inFlightAddRef.current.has(key)) {
      setNewExerciseName('');
      return;
    }
    // Belt-and-suspenders dedupe: the overlay disables ADDED rows, but if
    // the user types a name already in the session and hits the free-text
    // path, drop it silently here too. Prevents the "tapped 20 times by
    // accident" failure mode at the source.
    const exists = visibleWorkout.some(
      e => e.name?.toLowerCase() === key,
    );
    if (exists) {
      setNewExerciseName('');
      return;
    }
    inFlightAddRef.current.add(key);
    setTimeout(() => inFlightAddRef.current.delete(key), 250);
    addExerciseHook(trimmed, position);
    // Clear the input but keep the overlay open so the user can rapid-add
    // several exercises in one pass. Closing on the first add forced users
    // to re-open the picker for every exercise — high friction for the
    // common case of building a multi-exercise manual session.
    setNewExerciseName('');
    setEditingExerciseId(null);
    setSuggestions(getAllExerciseNames(exerciseOptions));
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
      onOpenSession?.();
    }
  };

  const handleAISuggestion = () => {
    session.startAISuggestion();
    setShowOverview(true);
    onOpenSession?.();
  };

  // Plan create + activate live in usePlanActions so PlanBuilderScreen and
  // GymView share one source of truth. The activation prompt is fired by the
  // hook itself after a successful create.
  const handleActivatePlan = activatePlan;

  const handleSelectWorkout = (workoutType: string, planId?: string) => {
    handleQuickWorkout(workoutType);
  };

  const startSessionFromPlan = (
    planData: WorkoutPlan,
    sessionId: string,
    contextType: 'active_plan' | 'alternate_plan' | 'scheduled' = 'active_plan'
  ) => {
    session.startSessionFromPlan(planData, sessionId, contextType);
    setShowOverview(true);
    // Push the ActiveWorkout modal so the user actually lands on the
    // session overview instead of staring at the Plans tab.
    onOpenSession?.();
  };

  const handleStartScheduledWorkout = (date: Date, _workout: unknown) => {
    if (!activeUserPlan?.planData) return;

    // Find the scheduled session for this date
    const dayOfWeek = date.getDay();
    const dayNames: (keyof WorkoutPlan['schedule'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const dailySchedule = activeUserPlan.planData.schedule[dayName] || [];

    if (dailySchedule.length > 0) {
      const scheduledSession = dailySchedule[0];
      const session = activeUserPlan.planData.sessions.find(s => s.id === scheduledSession.sessionId);

      if (session) {
        // Convert the session exercises to workout format and start it
        startSessionFromPlan(activeUserPlan.planData, session.id, 'scheduled');
      }
    }
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    setShowPlanLibrary(false);
    navigation.navigate('PlanBuilder', { mode: 'edit', planId: plan.id });
  };

  const handleDuplicatePlan = (plan: WorkoutPlan) => {
    setShowPlanLibrary(false);
    navigation.navigate('PlanBuilder', { mode: 'duplicate', planId: plan.id });
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
      const updatedUserPlans = (data.userWorkoutPlans || []).map(plan => ({
        ...plan,
        isActive: false,
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
    const planGroups: { [planId: string]: UserWorkoutPlan[] } = {};
    data.userWorkoutPlans.forEach(plan => {
      const planId = plan.planId;
      if (!planGroups[planId]) {
        planGroups[planId] = [];
      }
      planGroups[planId].push(plan);
    });

    // For each group with duplicates, keep only the most recent one
    const cleanedPlans: UserWorkoutPlan[] = [];
    let duplicatesRemoved = 0;

    Object.values(planGroups).forEach(plans => {
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
    const updatedPlans = cleanedPlans.map(plan => ({
      ...plan,
      isActive: plan.planId === currentActiveId,
    }));

    updateData({
      ...data,
      userWorkoutPlans: updatedPlans
    });

    showSuccess(`Cleaned up ${duplicatesRemoved} duplicate plan(s)!`);
  };

  const handleDeleteUserPlan = (userPlanId: string) => {
    const planToDelete = (data.userWorkoutPlans || []).find(p => p.id === userPlanId);
    const planName = planToDelete?.planData?.name || 'this plan';

    confirmAction(
      'Delete Plan Instance',
      `Are you sure you want to delete your instance of "${planName}"? This will remove all progress tracking for this plan but keep your workout history.`,
      () => {
        // Remove the user plan instance
        const updatedUserPlans = (data.userWorkoutPlans || []).filter(p => p.id !== userPlanId);

        // If we deleted the active plan, clear the active plan
        const deletedPlan = (data.userWorkoutPlans || []).find(p => p.id === userPlanId);
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

  // Auto-commit any uncompleted set on the given exercise that the user
  // has actually filled in. Lets users skip the explicit checkmark tap
  // when they advance via "Add Set", "Next Exercise", or "Finish".
  //
  // "Filled in" rules:
  //   - reps must be a finite number > 0 (you can't have done zero reps)
  //   - weight must be user-entered (not the default empty string), but
  //     can be 0 — that's how bodyweight exercises log
  //
  // Side-effect note: each updateSet call into useWorkoutSession will
  // fire the rest timer for that set. When multiple sets get batched in
  // a single advance (rare: user filled 2+ sets without ticking either),
  // the first set captures real rest seconds, subsequent ones capture
  // ~0. That's correct: the user didn't actually rest between them.
  // Multiple setSessionExercises calls inside this loop are also fine —
  // React batches them within one event handler, so the user sees a
  // single render.
  const commitFilledSets = (exId: number) => {
    const exercise = visibleWorkout.find(e => e.id === exId);
    if (!exercise) return;
    exercise.sets.forEach((set, idx) => {
      if (set.completed) return;
      const r = Number(set.reps);
      if (!Number.isFinite(r) || r <= 0) return;
      // Treat empty string / null / undefined as "weight not entered".
      // Numeric 0 (or "0") is a deliberate bodyweight log and IS valid.
      const weightRaw = set.weight;
      if (weightRaw === '' || weightRaw === null || weightRaw === undefined) return;
      const w = Number(weightRaw);
      if (!Number.isFinite(w) || w < 0) return;
      updateSet(exId, idx, 'completed', true);
    });
  };

  const addSet = (exId: number) => {
    commitFilledSets(exId);
    addSetHook(exId);
  };

  const nextExerciseWithCommit = () => {
    if (currentExercise) commitFilledSets(currentExercise.id);
    nextExercise();
  };

  const deleteExercise = (exId: number) => {
    deleteExerciseHook(exId);
  };

  const moveExercise = (exId: number, direction: 'up' | 'down') => {
    moveExerciseHook(exId, direction);
  };

  const finishWorkout = () => {
    // Catch any last-exercise sets the user filled in but didn't tick.
    visibleWorkout.forEach(ex => commitFilledSets(ex.id));
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

  const calculateTotalVolumeLocal = () => calculateTotalVolume(visibleWorkout);

  const currentExercise = visibleWorkout[currentExIndex];

  // Prefer the exerciseId already stamped on the WorkoutExercise (set when
  // adding from a plan or via addExercise). Fall back to the cache for
  // sessions hydrated before exerciseId was populated.
  const currentExerciseId = currentExercise
    ? currentExercise.exerciseId
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
      alreadyAdded={visibleWorkout.map(e => e.name)}
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

  // Defensive auto-dismiss: if the modal mounts (or stays mounted) without a
  // session, kick the user back to the planner. Done in an effect — calling
  // navigation.goBack() during render warns and can loop.
  //
  // Race guard: when the user starts a session from another surface (e.g.
  // tap-to-start on a Plan Library schedule row), `navigation.navigate` and
  // `setSessionExercises` fire in the same handler. ActiveWorkoutScreen can
  // mount and read stale empty context one tick before the new exercises
  // propagate. Defer the dismiss; if the new exercises arrive on the next
  // render, the effect cleanup cancels the timer before it fires.
  useEffect(() => {
    if (mode !== 'session') return;
    if (visibleWorkout.length > 0) return;
    if (isFinished || !onDismissSession) return;
    const t = setTimeout(() => onDismissSession(), 0);
    return () => clearTimeout(t);
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
      const userWorkoutPlans: UserWorkoutPlan[] = data.userWorkoutPlans || [];
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
            activePlanId={activeUserPlan?.planId || data.activePlanId}
            onStartSession={(plan, session) => {
              // Tap-to-start from the WEEKLY SCHEDULE list. Loads that day's
              // workout as an alternate session — no plan activation needed.
              // startSessionFromPlan handles the ActiveWorkout nav.
              setShowPlanLibrary(false);
              startSessionFromPlan(plan, session.id, 'alternate_plan');
            }}
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
                if (!ownerId) {
                  showError('You must be signed in to activate a plan.');
                  return;
                }
                await deactivateUserWorkoutPlans(ownerId);
                const existingUserPlan = await findUserWorkoutPlan(ownerId, plan.id);

                let userPlanId = existingUserPlan?.id;

                if (existingUserPlan?.id) {
                  await updateUserWorkoutPlan(existingUserPlan.id, { is_active: true });
                } else {
                  // Create new record in DB
                  const newUserPlan = await createUserWorkoutPlan({
                    user_id: ownerId,
                    plan_id: plan.id,
                    is_active: true,
                    started_at: new Date().toISOString(),
                    custom_name: plan.name,
                  });
                  userPlanId = newUserPlan.id;
                }

                // Update local state to reflect activation and store details
                const updatedUserPlans: UserWorkoutPlan[] = [
                  ...(userPlans || []).map(p => ({
                    ...p,
                    isActive: p.planId === plan.id,
                    planData: p.planId === plan.id ? detailedPlan : p.planData,
                  })),
                ];

                // If we created a new plan record, add it locally
                if (!existingUserPlan && userPlanId) {
                  updatedUserPlans.push({
                    id: userPlanId,
                    userId: ownerId,
                    planId: plan.id,
                    planData: detailedPlan,
                    startedAt: new Date().toISOString(),
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    customName: plan.name,
                  });
                }

                // Ensure only the selected plan is active locally
                const normalizedPlans = updatedUserPlans.map(p => ({
                  ...p,
                  isActive: p.planId === plan.id,
                }));

                updateData({ ...data, userWorkoutPlans: normalizedPlans, activePlanId: plan.id });
                setShowPlanLibrary(false);
                showSuccess(`Activated ${plan.name}!`);
              } catch (error) {
                console.error('Error selecting plan:', error);
                const message = error instanceof Error ? error.message : '';
                if (message.includes('not found')) {
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
            onDuplicatePlan={handleDuplicatePlan}
            onSyncPlan={handleSyncPlan}
            onSubmitForReview={(p: WorkoutPlan) => submitForReview(p.id)}
            onWithdrawFromReview={(p: WorkoutPlan) => withdrawFromReview(p.id)}
            onOpenShare={(p: WorkoutPlan) => setSharePlan(p)}
            userPlans={(data.userWorkoutPlans || []).map(p => p.planData).filter((pd): pd is WorkoutPlan => Boolean(pd))}
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
          >
            {/* Nested inside the library Modal so iOS will present it on top.
                As a sibling it silently failed — UIKit only shows one Modal
                at a time at any given parent level. */}
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
          </WorkoutPlansLibrary>

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
                  {sessionPickPlan?.details?.sessions?.map(session => (
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

  // SESSION MODE — delegate the entire focused/list/finished surface to
  // ActiveSessionView. Add Exercise overlay still mounts at the GymView
  // level so it works in both modes from the same state machine.
  if (mode === 'session') {
    return (
      <>
        {renderAddExerciseOverlay()}
        <ActiveSessionView
          visibleWorkout={visibleWorkout}
          currentExercise={currentExercise}
          currentExIndex={currentExIndex}
          viewMode={viewMode}
          ghost={ghost}
          isFinished={isFinished}
          finishedSessionId={lastSavedSessionId}
          sessionStartTime={sessionStartTime}
          sessionName={sessionContext.sessionName ?? sessionContext.customName ?? null}
          onBack={() => onDismissSession?.()}
          onToggleViewMode={toggleViewMode}
          onAddExercise={() => setIsAddingExercise(true)}
          onSelectExercise={selectExercise}
          onPrev={prevExercise}
          onNext={nextExerciseWithCommit}
          onAddSet={addSet}
          onUpdateSet={updateSet}
          onFinish={finishWorkout}
          onAbort={abortSession}
          onStartNewSession={startNewSession}
          onUndoFinish={undoFinish}
          calculateTotalVolume={calculateTotalVolumeLocal}
        />
      </>
    );
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
      {/* Rest timer hidden — see BACKLOG BL-18. The auto-fire from
          commitFilledSets means it pops up unprompted while logging, which
          isn't the right UX yet. Bring back when intentional rest cues
          (post-set tap, programmatic rest target) land. */}
    </>
  );
};

export default GymView;