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
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
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
import RestTimerBar from './components/RestTimerBar';
import WorkoutHeader from './components/WorkoutHeader';
import WorkoutFocusHeader from './components/WorkoutFocusHeader';
import WorkoutPlanner, { WorkoutPlanCreator } from './components/WorkoutPlanner';
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
import { useLastSessionSets } from './hooks/useLastSessionSets';
import { useActiveWorkoutSession } from '../../contexts/WorkoutSessionContext';

let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // Optional native module — gracefully degrade.
}
import { fetchWorkoutPlanDetails, createWorkoutPlan, createUserWorkoutPlan, updateUserWorkoutPlan, fetchExercises } from '../../services/workoutService';
import { confirmAction, showError, showSuccess } from '../../utils/alerts';
import { ABORT_SESSION_TITLE, ABORT_SESSION_MESSAGE } from '../../constants/text';

type GymViewProps = {
  data: any;
  updateData: (d: any) => void;
  user: any;
};

import WorkoutPlansLibrary from './components/WorkoutPlansLibrary';

const GymView = ({ data, updateData, user }: GymViewProps) => {
  const [showPlanLibrary, setShowPlanLibrary] = useState(false);

  const { user: contextUser } = useUser();
  const userId = contextUser?.id || user?.id;

  // Active user plan — used for session-context defaults and finish-time logging.
  const activeUserPlan = (data.userWorkoutPlans || []).find((plan: any) => plan.isActive);

  // Workout session + rest timer come from a single app-level provider so the
  // upcoming ActiveWorkout modal route reads the same instance.
  const { session, restTimer } = useActiveWorkoutSession();
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
      const allNames = getAllExerciseNames(data, exerciseOptions);
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

  const handleCreatePlan = async (planData: Omit<WorkoutPlan, 'id' | 'createdAt' | 'isTemplate'>) => {
    if (!user?.id) {
      showError('You must be signed in to create a plan.');
      return;
    }

    try {
      // Transform the plan data to database format
      const planForDb = {
        name: planData.name,
        description: planData.description,
        frequency: planData.frequency,
        equipment: planData.equipment,
        duration: planData.duration,
        difficulty: planData.difficulty,
        tags: planData.tags || [],
        is_public: false, // User-created plans are private by default
        user_id: user.id,
      };

      // Transform sessions to database format
      // All sessions are copies in the unified model
      const sessionsForDb = planData.sessions
        .map((session, index) => ({
          session: {
            id: session.id, // preserve client session id so schedule can reference it
            name: session.name,
            description: session.description || '',
            focus: session.focus as string,
            order_index: index + 1, // Use array index as order
            original_session_id: (session as any).originalSessionId || null, // Track lineage for analytics
          } as any,
          exercises: session.exercises.map(exercise => ({
            exercise_id: exercise.id,
            sets: exercise.sets,
            reps_min: exercise.repRange.min,
            reps_max: exercise.repRange.max,
            rest_seconds: exercise.restSeconds || 60,
            order_index: exercise.order,
          } as any))
        })) as any;

      // Transform schedule to database format
      const scheduleForDb = Object.entries(planData.schedule || {}).flatMap(([day, sessions]) =>
        (sessions || []).map(session => {
          return {
            // In the unified model, we always reference the session ID from the sessions list
            // The service layer maps this client ID to the newly created DB ID
            session_id: session.sessionId,
            day_of_week: day,
          } as any;
        })
      );

      // Save to database
      const savedPlan = await createWorkoutPlan(planForDb, sessionsForDb, scheduleForDb);

      // Fetch the complete plan with all details from the database
      const completePlan = await fetchWorkoutPlanDetails(savedPlan.id);

      // Update local state with the complete plan data
      const updatedPlans = [...(data.workoutPlans || []), completePlan];
      updateData({ ...data, workoutPlans: updatedPlans });

      // Close the plan creator
      setShowPlanCreator(false);
      
      showSuccess(`Plan "${completePlan.name}" created successfully!`);

      // Prompt to activate the newly created plan
      setTimeout(() => {
        Alert.alert(
          "Plan Created",
          "Would you like to activate this plan now?",
          [
            { 
              text: "Not Now", 
              style: "cancel",
              onPress: () => {
                // Refresh to show the new plan in the library
                setShowPlanLibrary(true);
              }
            },
            { 
              text: "Activate", 
              onPress: async () => {
                await handleActivatePlan(savedPlan.id);
                // Force a refresh by toggling plan library visibility
                setShowPlanLibrary(false);
              }
            }
          ]
        );
      }, 500);

    } catch (error) {
      console.error('Error creating plan:', error);
      showError('Failed to create plan. Please try again.');
    }
  };

  const handleActivatePlan = async (planId: string) => {
    if (!user?.id) {
      showError('You must be signed in to activate a plan.');
      return;
    }

    const userPlans = data.userWorkoutPlans || [];
    const targetPlan = userPlans.find((p: any) => p.planId === planId);

    try {
      // Fetch complete plan details from database to ensure we have all data
      let planDetails = targetPlan?.planData;
      if (!planDetails || !planDetails.sessions) {
        planDetails = await fetchWorkoutPlanDetails(planId);
      }

      // Deactivate other plans in DB
      await Promise.all(
        userPlans
          .filter((p: any) => p.isActive && p.planId !== planId && p.id)
          .map((p: any) => updateUserWorkoutPlan(p.id, { is_active: false }))
      );

      // Activate selected plan in DB (create it if it doesn't exist locally)
      let activePlanRecordId = targetPlan?.id;
      if (targetPlan?.id) {
        await updateUserWorkoutPlan(targetPlan.id, { is_active: true });
      } else {
        const newUserPlan = await createUserWorkoutPlan({
          user_id: user.id,
          plan_id: planId,
          is_active: true,
          started_at: new Date().toISOString(),
        });
        activePlanRecordId = newUserPlan.id;
      }

      // Update local state
      const updatedUserPlans = userPlans
        .map((p: any) => ({
          ...p,
          isActive: p.planId === planId,
          // Update plan data if it's the active plan
          planData: p.planId === planId ? planDetails : p.planData,
        }))
        .map((p: any) =>
          p.planId === planId && activePlanRecordId
            ? { ...p, id: activePlanRecordId, isActive: true }
            : { ...p, isActive: false }
        );

      // If the plan wasn't in userPlans, add it now
      if (!targetPlan && activePlanRecordId && planDetails) {
        updatedUserPlans.push({
          id: activePlanRecordId,
          userId: user.id,
          planId: planId,
          planData: planDetails, // Use complete plan details
          startedAt: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          customName: planDetails.name,
        });
      }

      updateData({
        ...data,
        userWorkoutPlans: updatedUserPlans,
        activePlanId: planId,
      });

      const activePlan = updatedUserPlans.find((p: any) => p.isActive);
      showSuccess(`${activePlan?.customName || activePlan?.planData?.name || 'Plan'} activated!`);
    } catch (error) {
      console.error('Error activating plan:', error);
      showError('Failed to activate plan. Please try again.');
    }
  };

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
          onCreatePlan={(suggestedType) => {
            setSuggestedPlanType(suggestedType);
            setShowPlanCreator(true);
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
                const existingUserPlan = userPlans.find((p: any) => p.planId === plan.id);

                // Deactivate any currently active plans in DB
                await Promise.all(
                  userPlans
                    .filter((p: any) => p.isActive && p.planId !== plan.id && p.id)
                    .map((p: any) => updateUserWorkoutPlan(p.id, { is_active: false }))
                );

                let userPlanId = existingUserPlan?.id;

                if (existingUserPlan?.id) {
                  // Activate existing record in DB
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
              setShowPlanCreator(true);
            }}
            onEditPlan={handleEditPlan}
            onSyncPlan={handleSyncPlan}
            userPlans={(data.userWorkoutPlans || []).map((p: any) => p.planData).filter(Boolean)}
            userCreatedPlans={(data.workoutPlans || []).filter((p: WorkoutPlan) => !p.is_public)}
            publicPlans={(data.workoutPlans || []).filter((p: WorkoutPlan) => p.is_public)}
            userEquipment="gym"
            userFrequency={3}
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

  const handleCloseFinished = () => {
    session.startNewSession();
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
      <RestTimerBar
        restSeconds={restSeconds}
        totalSeconds={restTimer.totalSeconds}
        onExtend={extendRest}
        onSkip={skipRest}
      />
    </>
  );
};

export default GymView;