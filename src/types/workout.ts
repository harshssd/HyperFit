/**
 * HYPERFIT DATA MODEL
 * ==================
 *
 * WORKOUT PLANS & SESSIONS
 * ========================
 *
 * This file defines the core data structures for workout plans, templates,
 * sessions, and user progress.
 */

// -----------------------------
// Basic shared enums / aliases
// -----------------------------

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type EquipmentType = 'gym' | 'bodyweight' | 'dumbbells' | 'mixed';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'glutes'
  | 'hamstrings'
  | 'quads'
  | 'calves'
  | 'core'
  | 'full-body'
  | 'other';

export type SessionFocus =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'full-body'
  | 'conditioning'
  | 'other';

// ---------------------------------------
// Exercise as it exists in a given plan
// ---------------------------------------

export type SessionExercise = {
  id: string;                      // Unique within the plan (e.g., "ex_bench_press")
  name: string;                    // Exercise name (e.g., "Barbell Bench Press")
  primaryMuscleGroup: MuscleGroup; // Main muscle group targeted
  secondaryMuscleGroups?: MuscleGroup[]; // Optional secondary muscle groups
  alternativeExercise?: string;            // Exercise that can be used to replace with
  equipment?: EquipmentType;       // Overrides plan-level equipment if needed
  sets: number;                    // Number of working sets
  repRange: {                      // Target rep range per set
    min: number;                   // e.g., 6
    max: number;                   // e.g., 8
  };
  restSeconds?: number;            // Rest time between sets (e.g., 90)
  order: number;                   // Order within the session (1, 2, 3...)
  notes?: string;                  // Any coaching cues or comments
};

// -----------------------------
// One workout session / "day" in a Plan
// -----------------------------

export type PlanSession = {
  id: string;                      // Unique within the plan (e.g., "session_push_a")
  name: string;                    // e.g., "Push Day"
  description?: string;            // e.g., "Chest, shoulders and triceps focus"
  focus: SessionFocus;             // e.g., 'push'
  exercises: SessionExercise[];    // Exercises for this session
};

// A scheduled reference to a session on a given day
export type ScheduledSession = {
  sessionId: string;               // References PlanSession.id within the same plan
  order: number;                   // Order if multiple sessions per day
  isOptional?: boolean;            // For "optional cardio" etc.
  notes?: string;                  // Day-specific notes
};

// ---------------------------------------
// Standalone, user-agnostic WorkoutPlan
// ---------------------------------------
// This is your canonical plan “template” – no user linkage, no “active plan” flag here.

export type WorkoutPlan = {
  id: string;                      // Unique plan identifier (e.g., "plan_ppl_3day")
  name: string;                    // Plan display name (e.g., "Push-Pull-Legs (3-Day Split)")
  description: string;             // Brief description of the plan
  frequency: number;               // Weekly workout frequency (e.g., 3, 4, 5, 6)
  equipment: EquipmentType;        // Required / primary equipment
  duration?: number;               // Plan duration in weeks (e.g., 4, 8, 12)
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Optional difficulty tag
  
  // All possible sessions in this plan, e.g. Push / Pull / Legs etc.
  sessions: PlanSession[];

  // The core schedule mapping days to one or more sessions
  schedule: {
    [K in DayOfWeek]?: ScheduledSession[];
  };

  tags?: string[];                 // Optional tags like ["hypertrophy", "strength"]
  createdAt: string;               // ISO timestamp of creation
  updatedAt?: string;              // ISO timestamp of last update
  isTemplate?: boolean;            // True if this is a library template
  is_public?: boolean;             // True if this is a public system plan
};

// ---------------------------------------
// User-Specific Plan Instance
// ---------------------------------------

export type UserWorkoutPlan = {
  id: string;                      // Unique identifier for this user-plan relation
  userId: string;                  // Your app's user identifier
  planId: string;                  // References WorkoutPlan.id
  planData?: WorkoutPlan;          // Embedded plan data (optional, or fetched separately)
  customName?: string;             // User-renamed version of the plan
  startedAt: string;               // ISO timestamp when user started the plan
  endsAt?: string;                 // Optional expected end date
  isActive: boolean;               // Whether this is the user's currently active plan
  createdAt: string;               // ISO timestamp for this user-plan record
  updatedAt?: string;              // ISO timestamp for this user-plan record
};

// ==============================================================================
// EXECUTION & HISTORY TYPES (Legacy/Active)
// These types track the actual performance of workouts
// ==============================================================================

/**
 * WORKOUT SET
 * -----------
 * Individual set within an exercise during a workout session.
 * Tracks weight, reps, completion status, and timing.
 */
export type WorkoutSet = {
  id: number;
  weight: string | number;        // Weight used (lbs/kg)
  reps: string | number;          // Repetitions performed
  completed: boolean;             // Whether set was completed
  restSeconds?: number;           // Rest time before next set
  completedAt?: string;           // ISO timestamp when completed
};

/**
 * WORKOUT EXERCISE
 * ---------------
 * Individual exercise within a workout, containing multiple sets.
 * Can be archived (preserved from previous workouts).
 */
export type WorkoutExercise = {
  id: number;
  name: string;                   // Exercise name (e.g., "Bench Press")
  exerciseId?: string;            // Reference to master exercises table
  sets: WorkoutSet[];            // Array of sets for this exercise
  archived?: boolean;            // Whether this exercise is from a previous workout
  supersetGroupId?: string | number; // For superset grouping
};

/**
 * WORKOUT STATUS
 * -------------
 * Completion status for workouts on specific dates.
 */
export type WorkoutStatus = {
  [date: string]: {
    finished?: boolean;           // Whether workout was completed
    finishedAt?: string;          // When workout was finished
  };
};

/**
 * WORKOUT TEMPLATE (Legacy/Supabase)
 * ---------------
 * Reusable collection of exercises stored in Supabase.
 */
export type Template = {
  id: string;                     // Unique identifier
  name: string;                   // Template name
  icon?: string;                  // Visual icon (emoji)
  description?: string;           // Template description
  exercises: string[];            // Array of exercise names
  user_id?: string;               // Owner user ID
  folder_id?: string | null;      // Organizational folder
  tags?: string[];                // Categorization tags
  created_by_username?: string;   // Creator's display name
  is_standard?: boolean;          // Whether it's a system template
  is_public?: boolean;            // Whether other users can see it
};

/**
 * TEMPLATE TYPE (Compatibility)
 */
export type TemplateType = Template & {
  id: string | number;
  exercises: string[];
};

/**
 * TEMPLATE FOLDER
 */
export type TemplateFolder = {
  id: string;
  name: string;
  color?: string;                 // Folder color theme
  icon?: string;                  // Folder icon (emoji)
};

/**
 * ACTIVE WORKOUT SESSION (Renamed from WorkoutSession to avoid conflict)
 * ---------------------
 * Active execution instance of a workout.
 * Tracks the current state of exercises being performed.
 */
export type ActiveWorkoutSession = {
  date: string;                   // Session date (YYYY-MM-DD)
  exercises: WorkoutExercise[];   // Current exercises with sets
  startTime?: string;             // When session began
  isActive: boolean;              // Whether session is currently running
  planId?: string;                // Associated workout plan ID
  templateId?: string;            // Source template ID (if applicable)
};

// Alias for backward compatibility if needed, but prefer ActiveWorkoutSession
export type WorkoutSession = ActiveWorkoutSession;

/**
 * COMPLETED WORKOUT
 * ----------------
 * Historical record of a finished workout session.
 */
export type CompletedWorkout = {
  date: string;                   // Workout date
  exercises: WorkoutExercise[];   // Final exercise data with completed sets
  totalVolume: number;            // Total weight × reps across all sets
  duration?: number;              // Time spent on workout (minutes)
  planId?: string;                // Associated plan (if workout came from a plan)
  templateId?: string;            // Source template (if workout came from a template)
  completedAt: string;            // When workout was finished
};

/**
 * USER DATA
 * --------
 * Complete user fitness data structure containing all workout-related information.
 */
export type UserData = {
  // Historical Records
  gymLogs: string[];              // Dates when user worked out (legacy)
  workouts: Record<string, WorkoutExercise[]>; // Date -> workout exercises
  workoutStatus?: WorkoutStatus;   // Completion status per date

  // Template Management (Supabase-backed)
  customTemplates?: Template[];    // User's saved templates

  // Plan Management (Local)
  workoutPlans?: UserWorkoutPlan[];    // User's workout plans (Updated type)
  activePlanId?: string;           // Currently active plan ID

  // Session Management
  currentSession?: ActiveWorkoutSession;  // Active workout session

  // Preferences (Future use)
  equipment?: EquipmentType;
  frequency?: number;

  // Extensible for future features
  [key: string]: any;
};
