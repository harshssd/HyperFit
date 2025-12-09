import { WorkoutPlan, PlanSession, SessionExercise } from '../../../types/workout';

// Helper to create session exercises quickly
const createExercise = (
  name: string, 
  sets: number = 3, 
  minRep: number = 8, 
  maxRep: number = 12, 
  order: number
): SessionExercise => ({
  id: `ex_${name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
  name,
  primaryMuscleGroup: 'other', // Simplified for default data
  sets,
  repRange: { min: minRep, max: maxRep },
  restSeconds: 90,
  order
});

// 1. Push Pull Legs
const pplSessions: PlanSession[] = [
  {
    id: 'session_push_a',
    name: 'Push A',
    description: 'Chest, Shoulders, Triceps',
    focus: 'push',
    exercises: [
      createExercise('Bench Press', 3, 6, 8, 1),
      createExercise('Overhead Press', 3, 8, 10, 2),
      createExercise('Incline Dumbbell Press', 3, 8, 12, 3),
      createExercise('Lateral Raises', 3, 12, 15, 4),
      createExercise('Tricep Pushdowns', 3, 10, 12, 5)
    ]
  },
  {
    id: 'session_pull_a',
    name: 'Pull A',
    description: 'Back, Biceps, Rear Delts',
    focus: 'pull',
    exercises: [
      createExercise('Deadlift', 3, 5, 5, 1),
      createExercise('Pull-Ups', 3, 6, 10, 2),
      createExercise('Barbell Rows', 3, 8, 10, 3),
      createExercise('Face Pulls', 3, 12, 15, 4),
      createExercise('Barbell Curls', 3, 10, 12, 5)
    ]
  },
  {
    id: 'session_legs_a',
    name: 'Legs A',
    description: 'Quads, Hamstrings, Calves',
    focus: 'legs',
    exercises: [
      createExercise('Squats', 3, 6, 8, 1),
      createExercise('Romanian Deadlift', 3, 8, 10, 2),
      createExercise('Leg Press', 3, 10, 12, 3),
      createExercise('Leg Curls', 3, 10, 12, 4),
      createExercise('Calf Raises', 3, 15, 20, 5)
    ]
  }
];

export const PPL_PLAN: WorkoutPlan = {
  id: 'plan_ppl_default',
  name: 'Push Pull Legs',
  description: 'Classic 3-day rotating split focusing on movement patterns. Ideal for intermediate lifters.',
  frequency: 3, // Can be 3 or 6
  equipment: 'gym',
  duration: 8,
  difficulty: 'intermediate',
  sessions: pplSessions,
  schedule: {
    monday: [{ sessionId: 'session_push_a', order: 1 }],
    wednesday: [{ sessionId: 'session_pull_a', order: 1 }],
    friday: [{ sessionId: 'session_legs_a', order: 1 }]
  },
  tags: ['strength', 'hypertrophy', 'classic'],
  createdAt: new Date().toISOString(),
  isTemplate: true
};

// 2. Full Body
const fbSessions: PlanSession[] = [
  {
    id: 'session_fb_a',
    name: 'Full Body A',
    description: 'Compound movements hitting the entire body',
    focus: 'full-body',
    exercises: [
      createExercise('Squats', 3, 6, 8, 1),
      createExercise('Bench Press', 3, 6, 8, 2),
      createExercise('Barbell Rows', 3, 8, 10, 3),
      createExercise('Overhead Press', 3, 8, 10, 4),
      createExercise('Dumbbell Lunges', 3, 10, 12, 5)
    ]
  },
  {
    id: 'session_fb_b',
    name: 'Full Body B',
    description: 'Complementary compound movements',
    focus: 'full-body',
    exercises: [
      createExercise('Deadlift', 3, 5, 5, 1),
      createExercise('Pull-Ups', 3, 6, 10, 2),
      createExercise('Incline Bench Press', 3, 8, 10, 3),
      createExercise('Leg Press', 3, 10, 12, 4),
      createExercise('Plank', 3, 60, 60, 5) // 60s
    ]
  }
];

export const FULL_BODY_PLAN: WorkoutPlan = {
  id: 'plan_fb_default',
  name: 'Full Body General',
  description: 'Great for beginners or those with limited time. Hits every muscle group 3x a week.',
  frequency: 3,
  equipment: 'gym',
  duration: 4,
  difficulty: 'beginner',
  sessions: fbSessions,
  schedule: {
    monday: [{ sessionId: 'session_fb_a', order: 1 }],
    wednesday: [{ sessionId: 'session_fb_b', order: 1 }],
    friday: [{ sessionId: 'session_fb_a', order: 1 }]
  },
  tags: ['beginner', 'general-fitness'],
  createdAt: new Date().toISOString(),
  isTemplate: true
};

// 3. Upper Lower
const ulSessions: PlanSession[] = [
  {
    id: 'session_upper',
    name: 'Upper Body',
    description: 'Chest, Back, Shoulders, Arms',
    focus: 'upper',
    exercises: [
      createExercise('Bench Press', 3, 6, 8, 1),
      createExercise('Barbell Rows', 3, 6, 8, 2),
      createExercise('Overhead Press', 3, 8, 10, 3),
      createExercise('Pull-Downs', 3, 10, 12, 4),
      createExercise('Bicep Curls', 3, 10, 12, 5),
      createExercise('Tricep Extensions', 3, 10, 12, 6)
    ]
  },
  {
    id: 'session_lower',
    name: 'Lower Body',
    description: 'Legs and Core',
    focus: 'lower',
    exercises: [
      createExercise('Squats', 3, 6, 8, 1),
      createExercise('Romanian Deadlift', 3, 8, 10, 2),
      createExercise('Leg Extensions', 3, 12, 15, 3),
      createExercise('Leg Curls', 3, 12, 15, 4),
      createExercise('Calf Raises', 4, 15, 20, 5),
      createExercise('Hanging Leg Raises', 3, 10, 15, 6)
    ]
  }
];

export const UPPER_LOWER_PLAN: WorkoutPlan = {
  id: 'plan_ul_default',
  name: 'Upper / Lower Split',
  description: '4-day split allowing for more recovery and higher intensity per muscle group.',
  frequency: 4,
  equipment: 'gym',
  duration: 8,
  difficulty: 'intermediate',
  sessions: ulSessions,
  schedule: {
    monday: [{ sessionId: 'session_upper', order: 1 }],
    tuesday: [{ sessionId: 'session_lower', order: 1 }],
    thursday: [{ sessionId: 'session_upper', order: 1 }],
    friday: [{ sessionId: 'session_lower', order: 1 }]
  },
  tags: ['strength', 'hypertrophy', 'split'],
  createdAt: new Date().toISOString(),
  isTemplate: true
};

export const DEFAULT_PLANS: WorkoutPlan[] = [PPL_PLAN, FULL_BODY_PLAN, UPPER_LOWER_PLAN];

