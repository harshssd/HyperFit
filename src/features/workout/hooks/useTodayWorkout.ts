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

type UpdateData = (data: UserData) => void;

export const useTodayWorkout = (data: UserData, updateData: UpdateData, todayOverride?: string) => {
  const today = useMemo(() => todayOverride ?? new Date().toISOString().split('T')[0], [todayOverride]);

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

  const finishWorkout = useCallback(() => {
    updateData(finishWorkoutState(data, today, todaysWorkout));
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

