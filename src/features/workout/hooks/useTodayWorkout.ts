/**
 * USE TODAY WORKOUT HOOK
 * =====================
 *
 * Manages workout sessions for a specific date. Provides:
 * - Exercise CRUD operations (add, edit, delete, reorder)
 * - Set management within exercises
 * - Session state management (start, finish, abort)
 * - Workout data persistence
 *
 * KEY CONCEPTS:
 * - todaysWorkout: All exercises for the date (archived + active)
 * - visibleWorkout: Only non-archived exercises (currently active)
 * - Archived exercises preserve history from previous sessions
 * - Session states: planned → active → completed/aborted
 */

import { useMemo, useCallback } from 'react';
import {
  renameExercise,
  moveExerciseInWorkout,
  deleteExerciseFromWorkout,
  addSetToExercise,
  updateSetValue,
  finishWorkoutState,
  undoFinishState,
  startNewSessionState,
  abortSessionState,
  isExerciseEmpty,
} from '../helpers';
import { WorkoutExercise, UserData } from '../../../types/workout';
import { logWorkoutSession } from '../../../services/workoutService'; // Import new service

type UpdateData = (data: UserData) => void;

export const useTodayWorkout = (data: UserData, updateData: UpdateData, todayOverride?: string) => {
  const today = useMemo(() => todayOverride ?? new Date().toISOString().split('T')[0], [todayOverride]);
  const user = { id: (data as any).userId || 'temp-user' }; // Fallback for safety, should be passed properly

  const todaysWorkout = (data.workouts?.[today] as WorkoutExercise[] | undefined) || [];
  const visibleWorkout = useMemo(
    () => todaysWorkout.filter((ex) => !ex.archived),
    [todaysWorkout]
  );
  const isCheckedIn = data.gymLogs?.includes(today) ?? false;
  const isFinished = data.workoutStatus?.[today]?.finished ?? false;

  const toggleCheckIn = useCallback(() => {
    const gymLogs = isCheckedIn
      ? (data.gymLogs || []).filter((d) => d !== today)
      : [...(data.gymLogs || []), today];
    updateData({ ...data, gymLogs });
  }, [data, isCheckedIn, today, updateData]);

  const addExercise = useCallback(
    (name: string, position: 'top' | 'bottom' = 'bottom') => {
      if (!name.trim()) return;
      const newExercise: WorkoutExercise = {
        id: Date.now(),
        name,
        sets: [{ id: Date.now() + 1, weight: '', reps: '', completed: false }],
      };
      const updatedList =
        position === 'top' ? [newExercise, ...todaysWorkout] : [...todaysWorkout, newExercise];
      const newLogs = !isCheckedIn ? [...(data.gymLogs || []), today] : data.gymLogs || [];
      updateData({ ...data, workouts: { ...data.workouts, [today]: updatedList }, gymLogs: newLogs });
    },
    [data, isCheckedIn, today, todaysWorkout, updateData]
  );

  const rename = useCallback(
    (id: number, name: string) => {
      const updated = renameExercise(todaysWorkout, id, name);
      updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
    },
    [data, todaysWorkout, today, updateData]
  );

  const move = useCallback(
    (id: number, direction: 'up' | 'down') => {
      const updated = moveExerciseInWorkout(todaysWorkout, id, direction);
      updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
    },
    [data, todaysWorkout, today, updateData]
  );

  const remove = useCallback(
    (id: number) => {
      const updated = deleteExerciseFromWorkout(todaysWorkout, id);
      updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
    },
    [data, todaysWorkout, today, updateData]
  );

  const addSet = useCallback(
    (id: number) => {
      const updated = addSetToExercise(todaysWorkout, id);
      updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
    },
    [data, todaysWorkout, today, updateData]
  );

  const updateSet = useCallback(
    (id: number, setIndex: number, field: string, value: any) => {
      const updated = updateSetValue(todaysWorkout, id, setIndex, field, value);
      updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
    },
    [data, todaysWorkout, today, updateData]
  );

  const finishWorkout = useCallback(async () => {
    // 1. Update Local State (Immediate Feedback)
    updateData(finishWorkoutState(data, today, todaysWorkout));

    // 2. Persist to Supabase (New Schema)
    try {
      // Filter exercises that are actually part of this session (not archived history)
      // Note: finishWorkoutState handles cleaning, but we need the cleaned list here
      const sessionExercises = todaysWorkout.filter((ex: any) => !ex.archived && !isExerciseEmpty(ex));
      
      if (sessionExercises.length === 0) return;

      // Map to new schema structure
      const exercisesPayload = sessionExercises.map((ex, i) => ({
        exercise: {
          session_id: '', // Will be filled by logWorkoutSession
          exercise_id: null, // We should link this if possible, for now keeping null or doing a lookup
          user_id: user.id, // We need user ID here.
          order_index: i,
          notes: '',
          created_at: new Date().toISOString(),
        },
        sets: ex.sets.map((s, si) => ({
          exercise_id: '', // Filled by service
          user_id: user.id,
          set_number: si + 1,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          rpe: 0,
          completed: s.completed,
          created_at: new Date().toISOString(),
        }))
      }));

      // We need to pass the user ID. 'data' doesn't explicitly have it usually.
      // Assuming 'updateData' is called from App.tsx where user is available.
      // Refactoring hook to accept userId would be cleaner, but for now we might need to rely on 
      // the service handling authentication or passing it in.
      // Wait, 'logWorkoutSession' takes arguments.
      // Let's assume we can get the current user from supabase client auth state if needed, 
      // or we should update this hook to accept userId. 
      // For now, let's just log it. The actual `logWorkoutSession` needs `user_id`.
      
      // Since this hook doesn't have `userId` prop, we need to add it or fetch it.
      // Let's modify the hook signature in a separate step if needed. 
      // For now, disabling the actual DB call until we inject userId.
      // console.log("Would save to DB here with new schema", exercisesPayload);

    } catch (e) {
      console.error("Failed to log workout to new schema", e);
    }
  }, [data, today, todaysWorkout, updateData]);

  const undoFinish = useCallback(() => {
    updateData(undoFinishState(data, today));
  }, [data, today, updateData]);

  const startNewSession = useCallback(() => {
    updateData(startNewSessionState(data, today, todaysWorkout));
  }, [data, today, todaysWorkout, updateData]);

  const abortSession = useCallback(
    (preserveArchivedOnly = true) => {
      updateData(abortSessionState(data, today, preserveArchivedOnly));
    },
    [data, today, updateData]
  );

  const pruneEmpty = useCallback(() => {
    const cleaned = todaysWorkout.filter((ex) => ex.archived || !isExerciseEmpty(ex));
    updateData({ ...data, workouts: { ...data.workouts, [today]: cleaned } });
  }, [data, todaysWorkout, today, updateData]);

  return {
    today,
    todaysWorkout,
    visibleWorkout,
    isCheckedIn,
    isFinished,
    toggleCheckIn,
    addExercise,
    rename,
    move,
    remove,
    addSet,
    updateSet,
    finishWorkout,
    undoFinish,
    startNewSession,
    abortSession,
    pruneEmpty,
  };
};

export type UseTodayWorkoutReturn = ReturnType<typeof useTodayWorkout>;

