import { WorkoutExercise } from '../../../types/workout';

/**
 * Pure transforms over a `WorkoutExercise[]` — every function returns a new
 * array so React can rely on referential inequality. No Supabase, no React
 * state, no side effects.
 */

export const isExerciseEmpty = (exercise: WorkoutExercise) => {
  if (!exercise || !exercise.sets) return true;
  return !exercise.sets.some(
    (s) =>
      (s.weight && String(s.weight).trim() !== '') ||
      (s.reps && String(s.reps).trim() !== '')
  );
};

export const renameExercise = (workouts: WorkoutExercise[], exId: number, newName: string) => {
  const idx = workouts.findIndex((ex) => ex.id === exId);
  if (idx === -1) return workouts;
  const updated = [...workouts];
  updated[idx] = { ...updated[idx], name: newName };
  return updated;
};

export const updateSetValue = (
  workouts: WorkoutExercise[],
  exId: number,
  setIndex: number,
  field: string,
  value: any
) => {
  const idx = workouts.findIndex((ex) => ex.id === exId);
  if (idx === -1) return workouts;
  const updated = [...workouts];
  const ex = { ...updated[idx] };
  const sets = [...ex.sets];
  if (!sets[setIndex]) return workouts;
  sets[setIndex] = { ...sets[setIndex], [field]: value };
  ex.sets = sets;
  updated[idx] = ex;
  return updated;
};

export const addSetToExercise = (workouts: WorkoutExercise[], exId: number) => {
  const idx = workouts.findIndex((ex) => ex.id === exId);
  if (idx === -1) return workouts;
  const updated = [...workouts];
  const ex = { ...updated[idx] };
  const sets = [...ex.sets];
  const prev = sets[sets.length - 1];
  sets.push({
    id: Date.now(),
    weight: prev ? prev.weight : '',
    reps: '',
    completed: false,
  });
  ex.sets = sets;
  updated[idx] = ex;
  return updated;
};

export const deleteExerciseFromWorkout = (workouts: WorkoutExercise[], exId: number) => {
  return workouts.filter((ex) => ex.id !== exId);
};

export const moveExerciseInWorkout = (
  workouts: WorkoutExercise[],
  exId: number,
  direction: 'up' | 'down'
) => {
  const idx = workouts.findIndex((ex) => ex.id === exId);
  if (idx === -1) return workouts;
  const updated = [...workouts];
  if (direction === 'up' && idx > 0) {
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
  } else if (direction === 'down' && idx < updated.length - 1) {
    [updated[idx + 1], updated[idx]] = [updated[idx], updated[idx + 1]];
  }
  return updated;
};
