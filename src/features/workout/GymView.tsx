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
import { WorkoutExercise } from '../../types/workout';
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
  const DEFAULT_REST_SECONDS = 90;
  const REST_INCREMENT_SECONDS = 30;
  const Haptics = (() => {
    try {
      return require('expo-haptics');
    } catch {
      return null;
    }
  })();

  const { user: contextUser } = useUser();
  const userId = contextUser?.id || user?.id;

  // Session State
  const [sessionExercises, setSessionExercises] = useState<WorkoutExercise[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [sessionContext, setSessionContext] = useState<{
    type: 'active_plan' | 'alternate_plan' | 'manual' | 'scheduled';
    planName?: string;
    sessionName?: string;
    customName?: string;
  }>({ type: 'manual' });

  // Derived state
  const visibleWorkout = sessionExercises; 
  
  // Helper to update session exercises
  const updateSessionExercises = (exercises: WorkoutExercise[]) => {
    setSessionExercises(exercises);
    if (!sessionStartTime && exercises.length > 0) {
      setSessionStartTime(new Date().toISOString());
    }
  };

  // Actions
  const addExerciseHook = (name: string, position: 'top' | 'bottom' = 'bottom') => {
    const newExercise: WorkoutExercise = {
      id: Date.now(),
      name,
      sets: [{ id: Date.now() + 1, weight: '', reps: '', completed: false }],
    };
    const updated = position === 'top'
      ? [newExercise, ...sessionExercises]
      : [...sessionExercises, newExercise];
    updateSessionExercises(updated);

    // If this is the first exercise and it's a manual workout, prompt for custom name
    if (sessionExercises.length === 0 && sessionContext.type === 'manual') {
      setTimeout(() => {
        Alert.prompt(
          'Name Your Workout',
          'Enter a name for this workout session',
          [
            { text: 'Skip', style: 'cancel' },
            {
              text: 'Save',
              onPress: (customName?: string) => {
                if (customName?.trim()) {
                  setSessionContext(prev => ({ ...prev, customName: customName.trim() }));
                }
              }
            }
          ],
          'plain-text',
          sessionContext.customName || 'Custom Workout'
        );
      }, 500); // Small delay to let the exercise render first
    }
  };

  const renameExerciseHook = (id: number, name: string) => {
    updateSessionExercises(renameExercise(sessionExercises, id, name));
  };

  const moveExerciseHook = (id: number, direction: 'up' | 'down') => {
    updateSessionExercises(moveExerciseInWorkout(sessionExercises, id, direction));
  };

  const deleteExerciseHook = (id: number) => {
    updateSessionExercises(deleteExerciseFromWorkout(sessionExercises, id));
  };

  const addSetHook = (id: number) => {
    updateSessionExercises(addSetToExercise(sessionExercises, id));
  };

  const updateSetHook = (id: number, setIndex: number, field: string, value: any) => {
    updateSessionExercises(updateSetValue(sessionExercises, id, setIndex, field, value));
  };

  const finishWorkoutHook = async () => {
    if (sessionExercises.length === 0) return;
    
    try {
      const activeUserPlan = (data.userWorkoutPlans || []).find((plan: any) => plan.isActive);
      const userPlanId = activeUserPlan?.id || null;
      const totalVolume = calculateTotalVolume(sessionExercises);

      // Generate session name based on context
      let sessionName: string;
      switch (sessionContext.type) {
        case 'active_plan':
          sessionName = sessionContext.sessionName
            ? `${sessionContext.planName} - ${sessionContext.sessionName}`
            : `${sessionContext.planName || 'Workout'}`;
          break;
        case 'alternate_plan':
          sessionName = sessionContext.sessionName
            ? `${sessionContext.planName} - ${sessionContext.sessionName}`
            : `${sessionContext.planName || 'Alternate Workout'}`;
          break;
        case 'scheduled':
          sessionName = sessionContext.sessionName
            ? `${sessionContext.planName} - ${sessionContext.sessionName}`
            : `${sessionContext.planName || 'Scheduled Workout'}`;
          break;
        case 'manual':
        default:
          // For manual workouts, use custom name if provided, otherwise use timestamp for uniqueness
          if (sessionContext.customName && sessionContext.customName !== 'Manual Workout') {
            sessionName = sessionContext.customName;
          } else {
            // Format: "Manual Workout - Dec 10, 2025 2:30 PM"
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            const dateString = now.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            sessionName = `Manual Workout - ${dateString} ${timeString}`;
          }
          break;
      }

      const sessionPayload = {
        user_id: userId,
        user_plan_id: userPlanId,
        name: sessionName,
        date: new Date().toISOString().split('T')[0],
        start_time: sessionStartTime,
        end_time: new Date().toISOString(),
        duration_seconds: sessionStartTime ? Math.round((Date.now() - new Date(sessionStartTime).getTime()) / 1000) : 0,
        volume_load: totalVolume,
        status: 'completed',
        notes: '',
      };

      const exercisesPayload = sessionExercises.map((ex, i) => ({
        exercise: {
          session_id: '', 
          exercise_id: null,
          user_id: userId,
          order_index: i,
          notes: '',
          created_at: new Date().toISOString(),
        },
        sets: ex.sets.map((s, si) => ({
          exercise_id: '',
          user_id: userId,
          set_number: si + 1,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          rpe: 0,
          completed: s.completed || false,
          created_at: new Date().toISOString(),
        }))
      }));

      await logWorkoutSession(sessionPayload, exercisesPayload);
      setIsSessionFinished(true);
      showSuccess('Workout saved!');
    } catch (e: any) {
      console.error(e);
      showError('Failed to save workout');
    }
  };

  const undoFinishHook = () => setIsSessionFinished(false);
  
  const startNewSessionHook = () => {
    setSessionExercises([]);
    setSessionStartTime(null);
    setIsSessionFinished(false);
  };
  
  const abortSessionHook = () => {
    setSessionExercises([]);
    setSessionStartTime(null);
  };

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

    // Set session context for manual workout
    setSessionContext({
      type: 'manual',
      customName: `${type.charAt(0).toUpperCase() + type.slice(1)} Workout`
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
      const sessionsForDb = planData.sessions.map((session, index) => ({
        session: {
          id: session.id, // preserve client session id so schedule can reference it
          name: session.name,
          description: session.description || '',
          focus: session.focus as string,
          order_index: index + 1, // Use array index as order
        } as any, // Type assertion to bypass strict typing
        exercises: session.exercises.map(exercise => ({
          exercise_id: exercise.id,
          sets: exercise.sets,
          reps_min: exercise.repRange.min,
          reps_max: exercise.repRange.max,
          rest_seconds: exercise.restSeconds || 60,
          order_index: exercise.order,
        } as any)) // Type assertion to bypass strict typing
      })) as any; // Type assertion for the whole array

      // Transform schedule to database format
      const scheduleForDb = Object.entries(planData.schedule || {}).flatMap(([day, sessions]) =>
        (sessions || []).map(session => ({
          session_id: session.sessionId,
          day_of_week: day,
        } as any))
      );

      // Save to database
      const savedPlan = await createWorkoutPlan(planForDb, sessionsForDb, scheduleForDb);

      // Create the full plan object for local state
      const fullPlan: WorkoutPlan = {
        ...planData,
        id: savedPlan.id,
        createdAt: savedPlan.created_at,
        isTemplate: false,
        is_public: false,
      };

      // Update local state
      const updatedPlans = [...(data.workoutPlans || []), fullPlan];
      updateData({ ...data, workoutPlans: updatedPlans });

      showSuccess(`Plan "${fullPlan.name}" created successfully!`);
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
      // Deactivate other plans in DB
      await Promise.all(
        userPlans
          .filter((p: any) => p.isActive && p.planId !== planId && p.id)
          .map((p: any) => updateUserWorkoutPlan(p.id, { is_active: false }))
      );

      // Activate selected plan in DB (create it if it somehow doesn't exist locally)
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
        }))
        .map((p: any) =>
          p.planId === planId && activePlanRecordId
            ? { ...p, id: activePlanRecordId, isActive: true }
            : { ...p, isActive: false }
        );

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

  const startSessionFromPlan = (planData: any, sessionId: string, contextType: 'active_plan' | 'alternate_plan' | 'scheduled' = 'active_plan') => {
    const session = planData.sessions.find((s: any) => s.id === sessionId);
    if (!session) return;

    const newExercises = session.exercises.map((exercise: any, index: number) => ({
      id: `${Date.now()}-${index}-${Math.random()}`,
      name: exercise.name,
      sets: [{ id: Date.now() + index + 100, weight: '', reps: '', completed: false }],
    }));

    // Update session exercises directly
    updateSessionExercises(newExercises);

    // Set session context for proper naming
    setSessionContext({
      type: contextType,
      planName: planData.name,
      sessionName: session.name,
    });

    setShowOverview(true);
    showSuccess(`Started ${session.name}!`);
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

  const updateSet = (exId: number, setIndex: number, field: string, value: any) => {
    // Apply updates to session exercises
    const sessionCopy = [...sessionExercises];
    const exIdx = sessionCopy.findIndex((ex) => ex.id === exId);
    if (exIdx === -1) return;
    const sets = [...sessionCopy[exIdx].sets];
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
    sessionCopy[exIdx] = { ...sessionCopy[exIdx], sets };
    updateSessionExercises(sessionCopy);
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
          userWorkoutPlans={data.userWorkoutPlans}
          activePlan={activePlanForDisplay}
          onActivatePlan={handleActivatePlan}
          onDeleteUserPlan={handleDeleteUserPlan}
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
    // Reset session state to exit the finished view and return to main GymView
    setSessionExercises([]);
    setSessionStartTime(null);
    setIsSessionFinished(false);
    setSessionContext({ type: 'manual' });
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
    </>
  );
};

export default GymView;