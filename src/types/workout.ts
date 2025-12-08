export type WorkoutSet = {
  id: number;
  weight: string | number;
  reps: string | number;
  completed: boolean;
  restSeconds?: number;
  completedAt?: string;
};

export type WorkoutExercise = {
  id: number;
  name: string;
  sets: WorkoutSet[];
  archived?: boolean;
  supersetGroupId?: string | number;
};

export type WorkoutStatus = {
  [date: string]: {
    finished?: boolean;
  };
};

export type Template = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  exercises: string[];
  user_id?: string;
  folder_id?: string | null;
  tags?: string[];
  created_by_username?: string;
  is_standard?: boolean;
  is_public?: boolean;
};

// Accepts both remote (string ids) and local (number ids) templates
export type TemplateType = Template & {
  id: string | number;
  exercises: string[];
};

export type TemplateFolder = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  type: 'push-pull-legs' | 'full-body' | 'upper-lower' | 'custom';
  frequency: number; // workouts per week
  equipment: 'gym' | 'bodyweight' | 'dumbbells' | 'mixed';
  duration?: number; // in weeks, for standard plans
  endDate?: string; // calculated from duration
  workouts: {
    [key: string]: string[]; // day name -> exercise names
  };
  createdAt: string;
  isActive?: boolean;
};

export type UserData = {
  gymLogs: string[];
  workouts: Record<string, WorkoutExercise[]>;
  workoutStatus?: WorkoutStatus;
  customTemplates?: Template[];
  workoutPlans?: WorkoutPlan[];
  activePlanId?: string;
  [key: string]: any;
};

