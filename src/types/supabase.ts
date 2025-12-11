export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          muscle_group: string | null
          equipment: string | null
          video_url: string | null
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          muscle_group?: string | null
          equipment?: string | null
          video_url?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          muscle_group?: string | null
          equipment?: string | null
          video_url?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      workout_plans: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          frequency: number | null
          equipment: string | null
          duration: number | null
          difficulty: string | null
          tags: string[] | null
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          frequency?: number | null
          equipment?: string | null
          duration?: number | null
          difficulty?: string | null
          tags?: string[] | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          frequency?: number | null
          equipment?: string | null
          duration?: number | null
          difficulty?: string | null
          tags?: string[] | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      plan_sessions: {
        Row: {
          id: string
          plan_id: string
          name: string
          description: string | null
          focus: string | null
          order_index: number
          created_at: string | null
        }
        Insert: {
          id?: string
          plan_id: string
          name: string
          description?: string | null
          focus?: string | null
          order_index?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          plan_id?: string
          name?: string
          description?: string | null
          focus?: string | null
          order_index?: number
          created_at?: string | null
        }
      }
      plan_exercises: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          sets: number | null
          reps_min: number | null
          reps_max: number | null
          rest_seconds: number | null
          order_index: number
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id: string
          sets?: number | null
          reps_min?: number | null
          reps_max?: number | null
          rest_seconds?: number | null
          order_index?: number
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          exercise_id?: string
          sets?: number | null
          reps_min?: number | null
          reps_max?: number | null
          rest_seconds?: number | null
          order_index?: number
          notes?: string | null
          created_at?: string | null
        }
      }
      plan_schedule: {
        Row: {
          id: string
          plan_id: string
          session_id: string
          day_of_week: string
          order_index: number | null
          is_optional: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          plan_id: string
          session_id: string
          day_of_week: string
          order_index?: number | null
          is_optional?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          plan_id?: string
          session_id?: string
          day_of_week?: string
          order_index?: number | null
          is_optional?: boolean | null
          created_at?: string | null
        }
      }
      user_workout_plans: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          custom_name: string | null
          started_at: string | null
          ends_at: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          custom_name?: string | null
          started_at?: string | null
          ends_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          custom_name?: string | null
          started_at?: string | null
          ends_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          user_plan_id: string | null
          plan_session_id: string | null
          name: string
          date: string
          start_time: string | null
          end_time: string | null
          duration_seconds: number | null
          volume_load: number | null
          status: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          user_plan_id?: string | null
          plan_session_id?: string | null
          name: string
          date: string
          start_time?: string | null
          end_time?: string | null
          duration_seconds?: number | null
          volume_load?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          user_plan_id?: string | null
          plan_session_id?: string | null
          name?: string
          date?: string
          start_time?: string | null
          end_time?: string | null
          duration_seconds?: number | null
          volume_load?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      workout_exercises: {
        Row: {
          id: string
          session_id: string
          exercise_id: string | null
          user_id: string
          order_index: number
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id?: string | null
          user_id: string
          order_index?: number
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          exercise_id?: string | null
          user_id?: string
          order_index?: number
          notes?: string | null
          created_at?: string | null
        }
      }
      workout_sets: {
        Row: {
          id: string
          exercise_id: string
          user_id: string
          set_number: number
          weight: number | null
          reps: number | null
          rpe: number | null
          completed: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          exercise_id: string
          user_id: string
          set_number: number
          weight?: number | null
          reps?: number | null
          rpe?: number | null
          completed?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          exercise_id?: string
          user_id?: string
          set_number?: number
          weight?: number | null
          reps?: number | null
          rpe?: number | null
          completed?: boolean | null
          created_at?: string | null
        }
      }
    }
  }
}



