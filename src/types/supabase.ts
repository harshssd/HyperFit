// Hand-maintained Supabase types matching
// supabase/migrations/20260430000000_initial_schema.sql.
// Regenerate with: supabase gen types typescript --project-id <id> > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;

export type TemplateKind = 'plan_session' | 'quick';
export type PlanReviewStatus = 'private' | 'pending_review' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          muscle_group: string | null;
          equipment: string | null;
          is_public: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          muscle_group?: string | null;
          equipment?: string | null;
          is_public?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };

      workout_plans: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          frequency: number | null;
          equipment: string | null;
          duration: string | null;
          difficulty: string | null;
          tags: string[];
          is_public: boolean;
          review_status: PlanReviewStatus;
          reviewed_at: Timestamp | null;
          reviewed_by: string | null;
          review_notes: string | null;
          share_code: string;
          is_shareable: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          frequency?: number | null;
          equipment?: string | null;
          duration?: string | null;
          difficulty?: string | null;
          tags?: string[];
          is_public?: boolean;
          review_status?: PlanReviewStatus;
          reviewed_at?: Timestamp | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          share_code?: string;
          is_shareable?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
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
        };
        Insert: {
          id?: string;
          plan_id: string;
          name: string;
          description?: string | null;
          focus?: string | null;
          order_index: number;
        };
        Update: Partial<Database['public']['Tables']['plan_sessions']['Insert']>;
      };

      plan_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          order_index: number;
          sets: number;
          reps_min: number | null;
          reps_max: number | null;
          rest_seconds: number | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          order_index: number;
          sets?: number;
          reps_min?: number | null;
          reps_max?: number | null;
          rest_seconds?: number | null;
        };
        Update: Partial<Database['public']['Tables']['plan_exercises']['Insert']>;
      };

      plan_schedule: {
        Row: {
          id: string;
          plan_id: string;
          day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
          session_id: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          plan_id: string;
          day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
          session_id: string;
          order_index?: number;
        };
        Update: Partial<Database['public']['Tables']['plan_schedule']['Insert']>;
      };

      user_workout_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          custom_name: string | null;
          is_active: boolean;
          started_at: Timestamp;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          custom_name?: string | null;
          is_active?: boolean;
          started_at?: Timestamp;
          created_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['user_workout_plans']['Insert']>;
      };

      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          plan_session_id: string | null;
          workout_date: string;
          name: string;
          start_time: Timestamp | null;
          end_time: Timestamp | null;
          notes: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          plan_session_id?: string | null;
          workout_date: string;
          name: string;
          start_time?: Timestamp | null;
          end_time?: Timestamp | null;
          notes?: string | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>;
      };

      workout_sets: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          order_index: number;
          set_number: number;
          weight: number | null;
          reps: number | null;
          completed: boolean;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          order_index: number;
          set_number: number;
          weight?: number | null;
          reps?: number | null;
          completed?: boolean;
          created_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['workout_sets']['Insert']>;
      };

      template_folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['template_folders']['Insert']>;
      };

      templates: {
        Row: {
          id: string;
          user_id: string | null;
          folder_id: string | null;
          kind: TemplateKind;
          name: string;
          description: string | null;
          icon: string | null;
          tags: string[];
          is_public: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          folder_id?: string | null;
          kind: TemplateKind;
          name: string;
          description?: string | null;
          icon?: string | null;
          tags?: string[];
          is_public?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['templates']['Insert']>;
      };

      template_exercises: {
        Row: {
          id: string;
          template_id: string;
          exercise_id: string;
          order_index: number;
          sets: number | null;
          reps_min: number | null;
          reps_max: number | null;
          rest_seconds: number | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          exercise_id: string;
          order_index: number;
          sets?: number | null;
          reps_min?: number | null;
          reps_max?: number | null;
          rest_seconds?: number | null;
        };
        Update: Partial<Database['public']['Tables']['template_exercises']['Insert']>;
      };

      user_template_favorites: {
        Row: {
          user_id: string;
          template_id: string;
          created_at: Timestamp;
        };
        Insert: {
          user_id: string;
          template_id: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['user_template_favorites']['Insert']>;
      };
    };

    Views: {
      session_summary_view: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          plan_session_id: string | null;
          workout_date: string;
          session_name: string;
          start_time: Timestamp | null;
          end_time: Timestamp | null;
          notes: string | null;
          total_sets: number;
          exercise_count: number;
          volume_load: number;
          all_completed: boolean | null;
          status: 'empty' | 'completed' | 'incomplete';
          duration_seconds: number | null;
        };
      };

      muscle_volume_view: {
        Row: {
          user_id: string;
          workout_date: string;
          muscle_group: string;
          volume: number;
          set_count: number;
        };
      };
    };

    Enums: {
      template_kind: TemplateKind;
      plan_review_status: PlanReviewStatus;
    };
  };
}
