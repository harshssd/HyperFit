-- Combine exercise_log and set_log into a single workout_log table
-- Migration: 20241210000003_combine_logs_into_workout_log

-- First drop the backward compatibility views created by previous migration
drop view if exists public.workout_exercises cascade;
drop view if exists public.workout_sets cascade;

-- Create new workout_log table combining exercise and set data
create table public.workout_log (
    id text primary key default uuid_generate_v4()::text,
    session_id text references public.session_log(id) on delete cascade not null,
    exercise_id text references public.exercises(id) on delete set null,
    user_id uuid references auth.users(id) on delete cascade not null,
    order_index integer not null default 0,
    notes text,
    set_number integer not null,
    weight numeric,
    reps numeric,
    rpe numeric,
    completed boolean default false,
    created_at timestamptz default now()
);

-- Migrate data from exercise_log and set_log tables
insert into public.workout_log (
    session_id,
    exercise_id,
    user_id,
    order_index,
    notes,
    set_number,
    weight,
    reps,
    rpe,
    completed,
    created_at
)
select
    el.session_id,
    el.exercise_id,
    el.user_id,
    el.order_index,
    el.notes,
    sl.set_number,
    sl.weight,
    sl.reps,
    sl.rpe,
    sl.completed,
    sl.created_at
from exercise_log el
join set_log sl on el.id = sl.exercise_id;

-- Create indexes for the new table
create index idx_workout_log_session on public.workout_log(session_id);
create index idx_workout_log_exercise on public.workout_log(exercise_id);
create index idx_workout_log_user on public.workout_log(user_id);
create index idx_workout_log_session_exercise on public.workout_log(session_id, exercise_id);

-- Enable RLS
alter table public.workout_log enable row level security;

-- Create RLS policy
create policy "Manage workout logs" on public.workout_log for all using (auth.uid() = user_id);

-- Drop old tables after verifying migration works
drop table set_log cascade;
drop table exercise_log cascade;

-- Create backward compatibility views
-- These provide the old table interfaces for existing code
create view public.exercise_log as
select distinct
    session_id || '_' || exercise_id || '_' || order_index as id,
    session_id,
    exercise_id,
    user_id,
    order_index,
    notes,
    min(created_at) as created_at
from public.workout_log
group by session_id, exercise_id, user_id, order_index, notes;

create view public.set_log as
select
    session_id || '_' || exercise_id || '_' || set_number as id,
    exercise_id,
    user_id,
    set_number,
    weight,
    reps,
    rpe,
    completed,
    created_at
from public.workout_log;

-- Keep the old table-based views for maximum compatibility
create view public.workout_exercises as select * from public.exercise_log;
create view public.workout_sets as select * from public.set_log;

