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
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type NutritionStatus = 'empty' | 'hit' | 'over' | 'under';

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string;
          name: string;
          muscle_group: string | null;
          equipment: string | null;
          is_public: boolean;
          primary_muscles: string[];
          secondary_muscles: string[];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          name: string;
          muscle_group?: string | null;
          equipment?: string | null;
          is_public?: boolean;
          primary_muscles?: string[];
          secondary_muscles?: string[];
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };

      user_exercises: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          muscle_group: string | null;
          equipment: string | null;
          primary_muscles: string[];
          secondary_muscles: string[];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          muscle_group?: string | null;
          equipment?: string | null;
          primary_muscles?: string[];
          secondary_muscles?: string[];
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['user_exercises']['Insert']>;
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

      // -- Nutrition --------------------------------------------------------
      // Schema: 20260505000000_nutrition_schema.sql + 20260506000000_nutrition_status_no_cheat_shortcut.sql

      user_nutrition_settings: {
        Row: {
          user_id: string;
          kcal_target: number;
          protein_target_g: number;
          carb_target_g: number;
          fat_target_g: number;
          fiber_target_g: number;
          cheat_days_per_week: number;
          water_target_ml: number;
          water_cup_ml: number;
          water_bottle_ml: number;
          water_unit: 'ml' | 'oz';
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          user_id: string;
          kcal_target?: number;
          protein_target_g?: number;
          carb_target_g?: number;
          fat_target_g?: number;
          fiber_target_g?: number;
          cheat_days_per_week?: number;
          water_target_ml?: number;
          water_cup_ml?: number;
          water_bottle_ml?: number;
          water_unit?: 'ml' | 'oz';
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['user_nutrition_settings']['Insert']>;
      };

      nutrition_days: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          is_cheat_day: boolean;
          kcal_target: number | null;
          protein_target_g: number | null;
          carb_target_g: number | null;
          fat_target_g: number | null;
          fiber_target_g: number | null;
          note: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          is_cheat_day?: boolean;
          kcal_target?: number | null;
          protein_target_g?: number | null;
          carb_target_g?: number | null;
          fat_target_g?: number | null;
          fiber_target_g?: number | null;
          note?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['nutrition_days']['Insert']>;
      };

      nutrition_entries: {
        Row: {
          id: string;
          user_id: string;
          day_id: string;
          meal_slot: MealSlot;
          name: string | null;
          kcal: number;
          protein_g: number;
          carb_g: number;
          fat_g: number;
          fiber_g: number;
          order_index: number;
          logged_at: Timestamp;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_id: string;
          meal_slot: MealSlot;
          name?: string | null;
          kcal?: number;
          protein_g?: number;
          carb_g?: number;
          fat_g?: number;
          fiber_g?: number;
          order_index?: number;
          logged_at?: Timestamp;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['nutrition_entries']['Insert']>;
      };

      water_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          ml: number;
          logged_at: Timestamp;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          ml: number;
          logged_at?: Timestamp;
          created_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['water_logs']['Insert']>;
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

      muscle_volume_v2_view: {
        Row: {
          user_id: string;
          workout_session_id: string;
          workout_date: string;
          muscle_id: string;
          effective_volume: number;
          effective_sets: number;
          raw_set_count: number;
        };
      };

      plan_muscle_coverage_view: {
        Row: {
          plan_id: string;
          plan_session_id: string;
          muscle_id: string;
          recruitment_score: number;
          planned_sets: number;
        };
      };

      nutrition_day_summary_view: {
        Row: {
          user_id: string;
          day_id: string;
          date: string;
          is_cheat_day: boolean;
          kcal_target: number;
          protein_target_g: number;
          carb_target_g: number;
          fat_target_g: number;
          fiber_target_g: number;
          kcal_total: number;
          protein_total_g: number;
          carb_total_g: number;
          fat_total_g: number;
          fiber_total_g: number;
          entry_count: number;
          water_total_ml: number;
          status: NutritionStatus;
        };
      };
    };

    Enums: {
      template_kind: TemplateKind;
      plan_review_status: PlanReviewStatus;
      meal_slot: MealSlot;
    };
  };
}
