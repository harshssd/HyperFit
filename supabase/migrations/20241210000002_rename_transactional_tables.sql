-- Rename transactional tables to follow naming convention
-- Migration: 20241210000002_rename_transactional_tables

-- Rename workout_sessions to session_log
alter table public.workout_sessions rename to session_log;

-- Rename workout_exercises to exercise_log
alter table public.workout_exercises rename to exercise_log;

-- Rename workout_sets to set_log
alter table public.workout_sets rename to set_log;

-- Update foreign key references in the renamed tables
-- exercise_log.session_id should now reference session_log.id
-- This should be handled automatically by PostgreSQL when renaming tables

-- Update foreign key references from other tables that reference the renamed tables
-- user_workout_plans.plan_id still references workout_plans (unchanged - that's master data)
-- user_workout_plans references workout_plans (master) and user_workout_plans.id is referenced by session_log.user_plan_id

-- Create views for backward compatibility (optional but recommended during transition)
create view public.workout_sessions as select * from public.session_log;
create view public.workout_exercises as select * from public.exercise_log;
create view public.workout_sets as select * from public.set_log;

-- Update indexes to match new table names
-- Drop old indexes
drop index if exists idx_workout_sessions_user_date;
drop index if exists idx_workout_exercises_session;
drop index if exists idx_workout_exercises_exercise;
drop index if exists idx_workout_sets_exercise;

-- Create new indexes with updated names
create index idx_session_log_user_date on public.session_log(user_id, date);
create index idx_exercise_log_session on public.exercise_log(session_id);
create index idx_exercise_log_exercise on public.exercise_log(exercise_id);
create index idx_set_log_exercise on public.set_log(exercise_id);

-- Update RLS policies with new table names
drop policy if exists "Manage sessions" on public.workout_sessions;
drop policy if exists "Manage exercises" on public.workout_exercises;
drop policy if exists "Manage sets" on public.workout_sets;

create policy "Manage session logs" on public.session_log for all using (auth.uid() = user_id);
create policy "Manage exercise logs" on public.exercise_log for all using (auth.uid() = user_id);
create policy "Manage set logs" on public.set_log for all using (auth.uid() = user_id);
