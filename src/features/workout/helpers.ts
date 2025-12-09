import { Clock, Hash } from 'lucide-react-native';

import { 
  WorkoutExercise, 
  WorkoutPlan, 
  Template, 
  CompletedWorkout, 
  WorkoutSession, 
  UserData, 
  ScheduledSession,
  PlanSession,
  SessionExercise,
  EquipmentType,
  UserWorkoutPlan
} from '../../types/workout';

/**
 * WORKOUT DATA RELATIONSHIP HELPERS
 * ================================
 *
 * These functions provide clear operations for working with the different
 * levels of workout data: Templates → Plans → Workouts → Sessions
 */

const RANKS = [
  { level: 1, title: "INITIATE", minXp: 0, color: "#94a3b8" },
  { level: 5, title: "KINETIC", minXp: 5000, color: "#fb923c" },
  { level: 10, title: "VOLTAGE", minXp: 15000, color: "#fbbf24" },
  { level: 20, title: "OVERDRIVE", minXp: 50000, color: "#fb7185" },
  { level: 50, title: "TITAN", minXp: 200000, color: "#34d399" },
  { level: 100, title: "HYPER GOD", minXp: 1000000, color: "#22d3ee" },
];

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

/**
 * TEMPLATE → PLAN CONVERSION
 * -------------------------
 * Convert a workout template into a workout plan structure
 */
export const templateToPlan = (
  template: Template,
  frequency: number = 3,
  durationWeeks: number = 4
): Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'> => {
  // Convert template exercises to SessionExercises
  const sessionExercises: SessionExercise[] = template.exercises.map((name, idx) => ({
    id: `ex_${Date.now()}_${idx}`,
    name,
    primaryMuscleGroup: 'full-body', // Default
    alternativeExercise: undefined,
    sets: 3,
    repRange: { min: 8, max: 12 },
    restSeconds: 90,
    order: idx + 1
  }));

  // Create a single session from the template
  const session: PlanSession = {
    id: `session_${Date.now()}`,
    name: template.name,
    description: template.description,
    focus: 'full-body', // Default
    exercises: sessionExercises
  };

  const sessions = [session];
  const schedule: WorkoutPlan['schedule'] = {};
  const dayNames: (keyof WorkoutPlan['schedule'])[] = ['monday', 'wednesday', 'friday']; // Default 3x

  // Simple distribution: schedule the same session multiple times
  for (let i = 0; i < Math.min(frequency, 7); i++) {
    // Basic day distribution logic could be better, but this works for now
    const day = i < dayNames.length ? dayNames[i] : (['tuesday', 'thursday', 'saturday', 'sunday'][i - 3] as keyof WorkoutPlan['schedule']);
    
    if (day) {
      schedule[day] = [{
        sessionId: session.id,
        order: 1,
        isOptional: false
      }];
    }
  }

  return {
    name: template.name,
    description: `Plan based on ${template.name} template`,
    frequency,
    equipment: 'mixed', // Default
    duration: durationWeeks,
    sessions,
    schedule,
    isTemplate: false
  };
};

/**
 * PLAN → WORKOUT INSTANCE
 * ----------------------
 * Create a workout instance from a plan for a specific day
 */
export const planToWorkout = (
  plan: WorkoutPlan,
  date: string,
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
): WorkoutExercise[] => {
  const dayNames: (keyof WorkoutPlan['schedule'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  // Get scheduled sessions for this day
  const dailySchedule = plan.schedule[dayName] || [];
  
  let allExercises: SessionExercise[] = [];
  dailySchedule.forEach(scheduled => {
    const session = plan.sessions.find(s => s.id === scheduled.sessionId);
    if (session) {
      allExercises = [...allExercises, ...session.exercises];
    }
  });

  return allExercises.map((exercise, index) => ({
    id: Date.now() + index,
    name: exercise.name,
    sets: Array.from({ length: exercise.sets }).map((_, i) => ({
      id: Date.now() + index + i + 1,
      weight: '',
      reps: '',
      completed: false
    })),
    archived: false
  }));
};

/**
 * TEMPLATE → WORKOUT INSTANCE
 * --------------------------
 * Create a workout instance directly from a template
 */
export const templateToWorkout = (template: Template): WorkoutExercise[] => {
  return template.exercises.map((exerciseName, index) => ({
    id: Date.now() + index,
    name: exerciseName,
    sets: [{ id: Date.now() + index + 1, weight: '', reps: '', completed: false }],
    archived: false
  }));
};

/**
 * WORKOUT → SESSION CONVERSION
 * ---------------------------
 * Convert a workout instance into an active session
 */
export const workoutToSession = (
  workout: WorkoutExercise[],
  date: string,
  planId?: string,
  templateId?: string
): WorkoutSession => {
  return {
    date,
    exercises: workout,
    startTime: new Date().toISOString(),
    isActive: true,
    planId,
    templateId
  };
};

/**
 * SESSION → COMPLETED WORKOUT
 * --------------------------
 * Convert a finished session into a completed workout record
 */
export const sessionToCompletedWorkout = (
  session: WorkoutSession
): CompletedWorkout => {
  const totalVolume = calculateTotalVolume(session.exercises);

  return {
    date: session.date,
    exercises: session.exercises,
    totalVolume,
    planId: session.planId,
    templateId: session.templateId,
    completedAt: new Date().toISOString()
  };
};

/**
 * PLAN VALIDATION
 * --------------
 * Check if a workout plan is valid and complete
 */
export const validatePlan = (plan: WorkoutPlan): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!plan.name?.trim()) errors.push('Plan must have a name');
  if (!plan.description?.trim()) errors.push('Plan must have a description');
  if (!plan.frequency || plan.frequency < 1 || plan.frequency > 7) {
    errors.push('Frequency must be between 1 and 7 workouts per week');
  }

  // Check if plan has scheduled sessions
  const dayNames: (keyof WorkoutPlan['schedule'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let scheduledDays = 0;

  dayNames.forEach(day => {
    if ((plan.schedule[day]?.length || 0) > 0) scheduledDays++;
  });

  if (scheduledDays === 0) {
    errors.push('Plan must have at least one scheduled workout day');
  } else if (scheduledDays > plan.frequency) {
    errors.push(`Plan has ${scheduledDays} scheduled days but frequency is ${plan.frequency}x/week`);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * WORKOUT PROGRESS CALCULATION
 * ---------------------------
 * Calculate completion progress for a workout session
 */
export const calculateWorkoutProgress = (exercises: WorkoutExercise[]) => {
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce((acc, ex) =>
    acc + ex.sets.filter(set => set.completed).length, 0
  );

  return {
    totalSets,
    completedSets,
    progressPercentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    isComplete: totalSets > 0 && completedSets === totalSets
  };
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

// --- NEW HELPERS ---

/**
 * Gets the workout status for a specific date
 */
export const getWorkoutForDate = (date: Date, recentWorkouts: any[], activePlan?: UserWorkoutPlan) => {
  const dateStr = date.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Check for past/completed workouts (History)
  const completedWorkout = recentWorkouts.find(w => w.dateStr === dateStr);
  if (completedWorkout) {
    return { ...completedWorkout, type: 'completed' };
  }

  // 2. Determine if date is in the future or today
  const isFutureOrToday = dateStr >= todayStr;

  // 3. If active plan exists and date is future/today, show planned workout
  if (activePlan && activePlan.planData && activePlan.planData.schedule && isFutureOrToday) {
    const dayOfWeek = date.getDay();
    const dayNames: (keyof WorkoutPlan['schedule'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const dailySchedule = activePlan.planData.schedule[dayName] || [];
    
    if (dailySchedule.length > 0) {
      const scheduledSession = dailySchedule[0];
      const session = activePlan.planData.sessions.find(s => s.id === scheduledSession.sessionId);
      
      if (session) {
        return {
          type: 'planned',
          exercises: session.exercises.length,
          name: session.name,
          exerciseList: session.exercises.map(e => e.name),
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          totalWorkouts: dailySchedule.length
        };
      }
    }
  }

  return null;
};
