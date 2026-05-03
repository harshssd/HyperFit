import {
  WorkoutExercise,
  WorkoutPlan,
  Template,
  CompletedWorkout,
  WorkoutSession,
  PlanSession,
  SessionExercise,
} from '../../../types/workout';
import { calculateTotalVolume } from './stats';

/**
 * Conversions between the four data tiers — Template → Plan → Workout →
 * Session → CompletedWorkout. Plus plan validation. Each transform is a pure
 * factory (uses Date.now() for ids; no other side effects).
 */

/**
 * TEMPLATE → PLAN CONVERSION
 * Convert a workout template into a workout plan structure
 */
export const templateToPlan = (
  template: Template,
  frequency: number = 3,
  durationWeeks: number = 4
): Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'> => {
  const sessionExercises: SessionExercise[] = template.exercises.map((name, idx) => ({
    id: `ex_${Date.now()}_${idx}`,
    name,
    primaryMuscleGroup: 'full-body',
    alternativeExercise: undefined,
    sets: 3,
    repRange: { min: 8, max: 12 },
    restSeconds: 90,
    order: idx + 1
  }));

  const session: PlanSession = {
    id: `session_${Date.now()}`,
    name: template.name,
    description: template.description,
    focus: 'full-body',
    exercises: sessionExercises
  };

  const sessions = [session];
  const schedule: WorkoutPlan['schedule'] = {};
  const dayNames: (keyof WorkoutPlan['schedule'])[] = ['monday', 'wednesday', 'friday'];

  for (let i = 0; i < Math.min(frequency, 7); i++) {
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
    equipment: 'mixed',
    duration: durationWeeks,
    sessions,
    schedule,
    isTemplate: false
  };
};

/**
 * PLAN → WORKOUT INSTANCE
 * Create a workout instance from a plan for a specific day
 */
export const planToWorkout = (
  plan: WorkoutPlan,
  date: string,
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
): WorkoutExercise[] => {
  const dayNames: (keyof WorkoutPlan['schedule'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

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
 * Check if a workout plan is valid and complete.
 */
export const validatePlan = (plan: WorkoutPlan): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!plan.name?.trim()) errors.push('Plan must have a name');
  if (!plan.description?.trim()) errors.push('Plan must have a description');
  if (!plan.frequency || plan.frequency < 1 || plan.frequency > 7) {
    errors.push('Frequency must be between 1 and 7 workouts per week');
  }

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
