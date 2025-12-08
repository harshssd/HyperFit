export type WorkoutSet = {
  id: number;
  weight: string | number;
  reps: string | number;
  completed: boolean;
};

export type WorkoutExercise = {
  id: number;
  name: string;
  sets: WorkoutSet[];
  archived?: boolean;
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

export type UserData = {
  gymLogs: string[];
  workouts: Record<string, WorkoutExercise[]>;
  workoutStatus?: WorkoutStatus;
  customTemplates?: Template[];
  [key: string]: any;
};

