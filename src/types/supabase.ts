// Hand-maintained Supabase types matching supabase/migrations/20250101000000_clean_initial_schema.sql.
// Regenerate with: supabase gen types typescript --project-id <id> > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;

export type WorkoutFocus = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full-body' | 'conditioning';
export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutEquipment = 'bodyweight' | 'dumbbell' | 'barbell' | 'gym' | 'mixed';
export type WorkoutCategory = 'strength' | 'hypertrophy' | 'endurance' | 'conditioning' | 'sport_specific' | 'rehab';
export type WorkoutType = 'planned' | 'manual' | 'template';
export type ProgressMetric = 'weight' | 'reps' | 'volume' | 'rpe';

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          muscle_group: string | null;
          equipment: string | null;
          video_url: string | null;
          is_public: boolean | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          muscle_group?: string | null;
          equipment?: string | null;
          video_url?: string | null;
          is_public?: boolean | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };

      session_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          focus: WorkoutFocus | null;
          difficulty: WorkoutDifficulty | null;
          equipment: WorkoutEquipment | null;
          estimated_duration_minutes: number | null;
          created_by: string | null;
          is_public: boolean | null;
          tags: string[] | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          focus?: WorkoutFocus | null;
          difficulty?: WorkoutDifficulty | null;
          equipment?: WorkoutEquipment | null;
          estimated_duration_minutes?: number | null;
          created_by?: string | null;
          is_public?: boolean | null;
          tags?: string[] | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['session_templates']['Insert']>;
      };

      template_exercises: {
        Row: {
          id: string;
          template_id: string;
          exercise_id: string;
          sets: number | null;
          reps_min: number | null;
          reps_max: number | null;
          rest_seconds: number | null;
          order_index: number;
          notes: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          exercise_id: string;
          sets?: number | null;
          reps_min?: number | null;
          reps_max?: number | null;
          rest_seconds?: number | null;
          order_index?: number;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['template_exercises']['Insert']>;
      };

      workout_plans: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          frequency: number | null;
          equipment: string | null;
          duration: number | null;
          difficulty: string | null;
          tags: string[] | null;
          is_public: boolean | null;
          focus_areas: string[] | null;
          target_audience: string[] | null;
          estimated_weekly_volume: number | null;
          primary_goals: string[] | null;
          category: WorkoutCategory | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          frequency?: number | null;
          equipment?: string | null;
          duration?: number | null;
          difficulty?: string | null;
          tags?: string[] | null;
          is_public?: boolean | null;
          focus_areas?: string[] | null;
          target_audience?: string[] | null;
          estimated_weekly_volume?: number | null;
          primary_goals?: string[] | null;
          category?: WorkoutCategory | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['workout_plans']['Insert']>;
      };

      plan_sessions: {
        Row: {
          id: string;
          plan_id: string;
          name: string;
          description: string | null;
          focus: string | null;
          order_index: number;
          template_id: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          plan_id: string;
          name: string;
          description?: string | null;
          focus?: string | null;
          order_index?: number;
          template_id?: string | null;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['plan_sessions']['Insert']>;
      };

      plan_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          sets: number | null;
          reps_min: number | null;
          reps_max: number | null;
          rest_seconds: number | null;
          order_index: number;
          notes: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          sets?: number | null;
          reps_min?: number | null;
          reps_max?: number | null;
          rest_seconds?: number | null;
          order_index?: number;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['plan_exercises']['Insert']>;
      };

      plan_schedule: {
        Row: {
          id: string;
          plan_id: string;
          session_id: string;
          day_of_week: string;
          order_index: number | null;
          is_optional: boolean | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          plan_id: string;
          session_id: string;
          day_of_week: string;
          order_index?: number | null;
          is_optional?: boolean | null;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['plan_schedule']['Insert']>;
      };

      user_workout_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          custom_name: string | null;
          started_at: Timestamp | null;
          ends_at: Timestamp | null;
          is_active: boolean | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          custom_name?: string | null;
          started_at?: Timestamp | null;
          ends_at?: Timestamp | null;
          is_active?: boolean | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['user_workout_plans']['Insert']>;
      };

      workout_log: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          session_id: string | null;
          exercise_id: string;
          workout_date: string;
          session_name: string;
          start_time: Timestamp | null;
          end_time: Timestamp | null;
          set_number: number;
          weight: number | null;
          reps: number | null;
          rpe: number | null;
          rest_duration_seconds: number | null;
          completed: boolean;
          notes: string | null;
          muscle_groups: string[] | null;
          equipment_used: string | null;
          workout_type: WorkoutType;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          session_id?: string | null;
          exercise_id: string;
          workout_date: string;
          session_name: string;
          start_time?: Timestamp | null;
          end_time?: Timestamp | null;
          set_number: number;
          weight?: number | null;
          reps?: number | null;
          rpe?: number | null;
          rest_duration_seconds?: number | null;
          completed?: boolean;
          notes?: string | null;
          muscle_groups?: string[] | null;
          equipment_used?: string | null;
          workout_type?: WorkoutType;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['workout_log']['Insert']>;
      };

      user_exercise_progress: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          metric_type: ProgressMetric;
          value: number;
          achieved_at: Timestamp;
          context: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          metric_type: ProgressMetric;
          value: number;
          achieved_at: Timestamp;
          context?: string | null;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['user_exercise_progress']['Insert']>;
      };

      workout_templates: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string | null;
          name: string;
          description: string | null;
          icon: string | null;
          exercises: string[] | null;
          tags: string[] | null;
          created_by_username: string | null;
          is_standard: boolean | null;
          is_public: boolean | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id?: string | null;
          name: string;
          description?: string | null;
          icon?: string | null;
          exercises?: string[] | null;
          tags?: string[] | null;
          created_by_username?: string | null;
          is_standard?: boolean | null;
          is_public?: boolean | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['workout_templates']['Insert']>;
      };

      workout_template_folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          icon: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string | null;
          icon?: string | null;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['workout_template_folders']['Insert']>;
      };

      user_template_favorites: {
        Row: {
          user_id: string;
          template_id: string;
          created_at: Timestamp | null;
        };
        Insert: {
          user_id: string;
          template_id: string;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['user_template_favorites']['Insert']>;
      };

      workout_summaries: {
        Row: {
          id: string;
          user_id: string;
          workout_date: string;
          plan_id: string | null;
          session_name: string | null;
          total_sets: number | null;
          total_reps: number | null;
          total_volume: number | null;
          average_rpe: number | null;
          duration_minutes: number | null;
          workout_type: WorkoutType | null;
          completed: boolean | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_date: string;
          plan_id?: string | null;
          session_name?: string | null;
          total_sets?: number | null;
          total_reps?: number | null;
          total_volume?: number | null;
          average_rpe?: number | null;
          duration_minutes?: number | null;
          workout_type?: WorkoutType | null;
          completed?: boolean | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database['public']['Tables']['workout_summaries']['Insert']>;
      };
    };
    Views: {
      session_details: {
        Row: {
          id: string;
          plan_id: string;
          name: string;
          description: string | null;
          focus: string | null;
          order_index: number;
          template_id: string | null;
          display_name: string;
          display_description: string | null;
          display_focus: string | null;
          equipment: string;
          difficulty: string;
          exercise_count: number;
          created_at: Timestamp | null;
        };
      };
      plan_complete_details: {
        Row: Database['public']['Tables']['workout_plans']['Row'] & {
          sessions: Json;
        };
      };
      session_summary_view: {
        Row: {
          user_id: string;
          workout_date: string;
          session_name: string;
          id: string;
          plan_id: string | null;
          session_id: string | null;
          start_time: Timestamp | null;
          end_time: Timestamp | null;
          total_sets: number;
          exercise_count: number;
          volume_load: number;
          average_rpe: number | null;
          all_completed: boolean;
          status: 'completed' | 'incomplete';
          duration_seconds: number | null;
        };
      };
    };
  };
}
