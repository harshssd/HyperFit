import { Clock, Hash } from 'lucide-react-native';

const RANKS = [
  { level: 1, title: "INITIATE", minXp: 0, color: "#94a3b8" },
  { level: 5, title: "KINETIC", minXp: 5000, color: "#fb923c" },
  { level: 10, title: "VOLTAGE", minXp: 15000, color: "#fbbf24" },
  { level: 20, title: "OVERDRIVE", minXp: 50000, color: "#fb7185" },
  { level: 50, title: "TITAN", minXp: 200000, color: "#34d399" },
  { level: 100, title: "HYPER GOD", minXp: 1000000, color: "#22d3ee" },
];

export type WorkoutExercise = {
  id: number;
  name: string;
  sets: Array<{
    id: number;
    weight: string | number;
    reps: string | number;
    completed: boolean;
  }>;
  archived?: boolean;
};

export const isExerciseEmpty = (exercise: WorkoutExercise) => {
  if (!exercise || !exercise.sets) return true;
  return !exercise.sets.some(
    (s) =>
      s.completed ||
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

export const calculateTotalVolume = (workout: WorkoutExercise[]) => {
  return workout.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, s) => {
        const weight = s.weight ? parseInt(String(s.weight), 10) : 0;
        const reps = s.reps ? parseInt(String(s.reps), 10) : 0;
        return sAcc + (s.completed ? weight * reps : 0);
      }, 0)
    );
  }, 0);
};

export const calculateXP = (data: any) => {
  if (!data) return 0;
  let xp = 0;
  const allWorkouts = Object.values(data.workouts || {}).flat() as WorkoutExercise[];
  xp += (data.gymLogs?.length || 0) * 100;
  allWorkouts.forEach((ex) => {
    if (ex.sets) {
      ex.sets.forEach((s: any) => {
        if (s.completed && s.weight && s.reps) xp += (parseInt(s.weight) * parseInt(s.reps)) * 0.05;
        if (s.completed && (!s.weight || s.weight === '')) xp += (parseInt(s.reps) || 0) * 2;
      });
    }
  });
  return Math.floor(xp);
};

export const getRank = (xp: number) => {
  const safeXp = xp || 0;
  return [...RANKS].reverse().find(r => safeXp >= r.minXp) || RANKS[0];
};

export const getRankProgress = (xp: number) => {
  const current = getRank(xp);
  const next = RANKS.find(r => r.minXp > current.minXp) || null;
  const range = next ? next.minXp - current.minXp : 1;
  const progress = next ? ((xp - current.minXp) / range) * 100 : 100;
  return { current, next, progress: Math.max(0, Math.min(100, progress)) };
};

export const getExerciseConfig = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('plank') || lower.includes('hold') || lower.includes('static') || lower.includes('wall sit')) {
    return { type: 'timed', weightLabel: 'LBS (OPT)', repLabel: 'TIME (S)', repIcon: Clock, weightPlaceholder: '-', repPlaceholder: '30s', weightStep: 5, repStep: 10 };
  }
  if (
    lower.includes('pushup') ||
    lower.includes('pull up') ||
    lower.includes('chin up') ||
    lower.includes('dip') ||
    lower.includes('burpee') ||
    lower.includes('lunge') ||
    (lower.includes('squat') && !lower.includes('barbell'))
  ) {
    if (name === 'Squats') return { type: 'weighted', weightLabel: 'LBS', repLabel: 'REPS', repIcon: Hash, weightPlaceholder: '135', repPlaceholder: '10', weightStep: 5, repStep: 1 };
    return { type: 'bodyweight', weightLabel: 'LBS (OPT)', repLabel: 'REPS', repIcon: Hash, weightPlaceholder: 'BW', repPlaceholder: '12', weightStep: 5, repStep: 1 };
  }
  return { type: 'weighted', weightLabel: 'LBS', repLabel: 'REPS', repIcon: Hash, weightPlaceholder: '45', repPlaceholder: '10', weightStep: 5, repStep: 1 };
};

export const finishWorkoutState = (data: any, today: string, workouts: WorkoutExercise[]) => {
  const cleanedWorkout = workouts.filter((ex: any) => ex.archived || !isExerciseEmpty(ex));
  return {
    ...data,
    workouts: { ...data.workouts, [today]: cleanedWorkout },
    workoutStatus: { ...data.workoutStatus, [today]: { finished: true, finishedAt: new Date().toISOString() } },
  };
};

export const undoFinishState = (data: any, today: string) => {
  return {
    ...data,
    workoutStatus: { ...data.workoutStatus, [today]: { finished: false } },
  };
};

export const startNewSessionState = (data: any, today: string, workouts: WorkoutExercise[]) => {
  const cleanedAndArchived = workouts
    .filter((ex: any) => ex.archived || !isExerciseEmpty(ex))
    .map((ex: any) => ({ ...ex, archived: true }));

  return {
    ...data,
    workouts: { ...data.workouts, [today]: cleanedAndArchived },
    workoutStatus: { ...data.workoutStatus, [today]: { finished: false } },
  };
};

export const abortSessionState = (data: any, today: string, preserveArchivedOnly = true) => {
  const preservedWorkouts = preserveArchivedOnly
    ? (data.workouts?.[today] || []).filter((ex: any) => ex.archived)
    : [];
  return {
    ...data,
    workouts: { ...data.workouts, [today]: preservedWorkouts },
  };
};

