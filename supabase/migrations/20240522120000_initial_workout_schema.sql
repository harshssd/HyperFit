-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Master Exercises Table (Definitions)
-- Stores individual exercises like "Bench Press", "Pushups"
-- System exercises have null user_id; custom exercises have user_id
create table if not exists public.exercises (
    id text primary key default uuid_generate_v4()::text,
    user_id uuid references auth.users(id) on delete cascade, 
    name text not null,
    description text,
    muscle_group text, -- 'chest', 'back', 'legs', etc.
    equipment text, -- 'barbell', 'dumbbell', 'bodyweight', etc.
    video_url text,
    is_public boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Workout Plans (Header)
-- Defines a workout routine (e.g., "Push Pull Legs")
create table if not exists public.workout_plans (
    id text primary key default uuid_generate_v4()::text,
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    description text,
    frequency integer,
    equipment text,
    duration integer,
    difficulty text,
    tags text[] default array[]::text[],
    is_public boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. Plan Sessions (Day A, Day B...)
-- A specific day/routine within a plan (e.g., "Push Day")
create table if not exists public.plan_sessions (
    id text primary key default uuid_generate_v4()::text,
    plan_id text references public.workout_plans(id) on delete cascade not null,
    name text not null,
    description text,
    focus text, -- 'push', 'pull', 'upper', etc.
    order_index integer not null default 0,
    created_at timestamptz default now()
);

-- 4. Plan Exercises (Exercises within a Plan Session)
-- Links a Session to an Exercise with target sets/reps
create table if not exists public.plan_exercises (
    id text primary key default uuid_generate_v4()::text,
    session_id text references public.plan_sessions(id) on delete cascade not null,
    exercise_id text references public.exercises(id) on delete restrict not null, -- Links to Master Exercise
    sets integer default 3,
    reps_min integer,
    reps_max integer,
    rest_seconds integer,
    order_index integer not null default 0,
    notes text,
    created_at timestamptz default now()
);

-- 5. Plan Schedule (Mapping days to sessions)
-- Defines which session happens on which day (e.g., Monday -> Push Day)
create table if not exists public.plan_schedule (
    id text primary key default uuid_generate_v4()::text,
    plan_id text references public.workout_plans(id) on delete cascade not null,
    session_id text references public.plan_sessions(id) on delete cascade not null,
    day_of_week text not null, -- 'monday', 'tuesday', etc.
    order_index integer default 0,
    is_optional boolean default false,
    created_at timestamptz default now()
);

-- 6. User Workout Plans (Active Instances)
-- Tracks a user's active engagement with a plan
create table if not exists public.user_workout_plans (
    id text primary key default uuid_generate_v4()::text,
    user_id uuid references auth.users(id) on delete cascade not null,
    plan_id text references public.workout_plans(id) on delete cascade not null,
    custom_name text,
    started_at timestamptz,
    ends_at timestamptz,
    is_active boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 7. Workout Sessions (Log Header)
-- A specific workout event performed by a user
create table if not exists public.workout_sessions (
    id text primary key default uuid_generate_v4()::text,
    user_id uuid references auth.users(id) on delete cascade not null,
    user_plan_id text references public.user_workout_plans(id) on delete set null,
    plan_session_id text references public.plan_sessions(id) on delete set null, -- Link to original plan session
    name text not null,
    date text not null, -- Format: YYYY-MM-DD
    start_time timestamptz,
    end_time timestamptz,
    duration_seconds integer,
    volume_load numeric default 0,
    status text default 'completed',
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 8. Workout Exercises (Log Details)
-- Records an exercise performed during a session
create table if not exists public.workout_exercises (
    id text primary key default uuid_generate_v4()::text,
    session_id text references public.workout_sessions(id) on delete cascade not null,
    exercise_id text references public.exercises(id) on delete set null, -- Links to Master Exercise
    user_id uuid references auth.users(id) on delete cascade not null,
    order_index integer not null default 0,
    notes text,
    created_at timestamptz default now()
);

-- 9. Workout Sets (Log Sets)
-- Records individual sets
create table if not exists public.workout_sets (
    id text primary key default uuid_generate_v4()::text,
    exercise_id text references public.workout_exercises(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    set_number integer not null,
    weight numeric,
    reps numeric,
    rpe numeric,
    completed boolean default false,
    created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.plan_sessions enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.plan_schedule enable row level security;
alter table public.user_workout_plans enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

-- Policies for Exercises (Master Table)
create policy "Users can view system exercises and their own"
    on public.exercises for select
    using (auth.uid() = user_id or is_public = true or user_id is null);

create policy "Users can insert their own exercises"
    on public.exercises for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own exercises"
    on public.exercises for update
    using (auth.uid() = user_id);

-- Policies for Workout Plans & Components
-- (Repeat similar logic for Plans, Sessions, Plan Exercises, Schedule)
-- Generic policy generator logic:
-- View: own or public
-- Edit/Delete: own only

-- PLANS
create policy "View plans" on public.workout_plans for select using (auth.uid() = user_id or is_public = true);
create policy "Manage plans" on public.workout_plans for all using (auth.uid() = user_id);

-- PLAN SESSIONS (Linked to Plan)
create policy "View plan sessions" on public.plan_sessions for select 
    using (exists (select 1 from public.workout_plans where id = plan_id and (user_id = auth.uid() or is_public = true)));
create policy "Manage plan sessions" on public.plan_sessions for all 
    using (exists (select 1 from public.workout_plans where id = plan_id and user_id = auth.uid()));

-- PLAN EXERCISES (Linked to Session)
create policy "View plan exercises" on public.plan_exercises for select 
    using (exists (select 1 from public.plan_sessions ps join public.workout_plans wp on ps.plan_id = wp.id where ps.id = session_id and (wp.user_id = auth.uid() or wp.is_public = true)));
create policy "Manage plan exercises" on public.plan_exercises for all 
    using (exists (select 1 from public.plan_sessions ps join public.workout_plans wp on ps.plan_id = wp.id where ps.id = session_id and wp.user_id = auth.uid()));

-- PLAN SCHEDULE (Linked to Plan)
create policy "View plan schedule" on public.plan_schedule for select 
    using (exists (select 1 from public.workout_plans where id = plan_id and (user_id = auth.uid() or is_public = true)));
create policy "Manage plan schedule" on public.plan_schedule for all 
    using (exists (select 1 from public.workout_plans where id = plan_id and user_id = auth.uid()));

-- USER WORKOUT PLANS (Instances)
create policy "Manage user plans" on public.user_workout_plans for all using (auth.uid() = user_id);

-- WORKOUT SESSIONS (Logs)
create policy "Manage sessions" on public.workout_sessions for all using (auth.uid() = user_id);

-- WORKOUT EXERCISES (Logs)
create policy "Manage exercises" on public.workout_exercises for all using (auth.uid() = user_id);

-- WORKOUT SETS (Logs)
create policy "Manage sets" on public.workout_sets for all using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_exercises_user on public.exercises(user_id);
create index if not exists idx_workout_plans_user on public.workout_plans(user_id);
create index if not exists idx_plan_sessions_plan on public.plan_sessions(plan_id);
create index if not exists idx_plan_exercises_session on public.plan_exercises(session_id);
create index if not exists idx_plan_exercises_exercise on public.plan_exercises(exercise_id);
create index if not exists idx_workout_sessions_user_date on public.workout_sessions(user_id, date);
create index if not exists idx_workout_exercises_session on public.workout_exercises(session_id);
create index if not exists idx_workout_exercises_exercise on public.workout_exercises(exercise_id);
