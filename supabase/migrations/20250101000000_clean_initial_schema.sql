-- =============================================================================
-- CLEAN INITIAL SCHEMA - HyperFit Database
-- =============================================================================
-- This is a clean, consolidated migration that represents the final desired
-- database schema after cleaning up all the corrupted migration history.
--
-- SCHEMA OVERVIEW:
-- 1. Master Data: exercises, session_templates, workout_plans
-- 2. Plan Structure: plan_sessions, plan_exercises, plan_schedule
-- 3. User Management: user_workout_plans
-- 4. Workout Logging: workout_log (unified)
-- 5. Analytics: user_exercise_progress, workout_summaries
-- =============================================================================

-- Enable required extensions
-- Note: In Supabase, UUID generation is handled differently
-- We'll use gen_random_uuid() which is available by default

-- =============================================================================
-- 1. MASTER DATA TABLES
-- =============================================================================

-- Exercises (unchanged from original)
create table if not exists public.exercises (
    id text primary key default gen_random_uuid()::text,
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    description text,
    muscle_group text,
    equipment text,
    video_url text,
    is_public boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Session Templates (reusable workout sessions)
create table if not exists public.session_templates (
    id text primary key default gen_random_uuid()::text,
    name text not null,
    description text,
    focus text check (focus in ('push', 'pull', 'legs', 'upper', 'lower', 'full-body', 'conditioning')),
    difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')) default 'intermediate',
    equipment text check (equipment in ('bodyweight', 'dumbbell', 'barbell', 'gym', 'mixed')) default 'gym',
    estimated_duration_minutes integer default 45,
    created_by uuid references auth.users(id) on delete set null,
    is_public boolean default false,
    tags text[] default array[]::text[],
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Template Exercises
create table if not exists public.template_exercises (
    id text primary key default gen_random_uuid()::text,
    template_id text references public.session_templates(id) on delete cascade not null,
    exercise_id text references public.exercises(id) on delete restrict not null,
    sets integer default 3,
    reps_min integer,
    reps_max integer,
    rest_seconds integer default 60,
    order_index integer not null default 0,
    notes text,
    created_at timestamptz default now()
);

-- Workout Plans (enhanced)
create table if not exists public.workout_plans (
    id text primary key default gen_random_uuid()::text,
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    description text,
    frequency integer,
    equipment text,
    duration integer,
    difficulty text,
    tags text[] default array[]::text[],
    is_public boolean default false,
    focus_areas text[] default array[]::text[],
    target_audience text[] default array[]::text[],
    estimated_weekly_volume integer,
    primary_goals text[] default array[]::text[],
    category text check (category in ('strength', 'hypertrophy', 'endurance', 'conditioning', 'sport_specific', 'rehab')) default 'strength',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =============================================================================
-- 2. PLAN STRUCTURE TABLES
-- =============================================================================

-- Plan Sessions (always tied to plans, optionally reference templates)
create table if not exists public.plan_sessions (
    id text primary key default gen_random_uuid()::text,
    plan_id text references public.workout_plans(id) on delete cascade not null,
    name text not null,
    description text,
    focus text,
    order_index integer not null default 0,
    template_id text references public.session_templates(id) on delete set null,
    created_at timestamptz default now()
);

-- Plan Exercises (for custom sessions not using templates)
create table if not exists public.plan_exercises (
    id text primary key default gen_random_uuid()::text,
    session_id text references public.plan_sessions(id) on delete cascade not null,
    exercise_id text references public.exercises(id) on delete restrict not null,
    sets integer default 3,
    reps_min integer,
    reps_max integer,
    rest_seconds integer,
    order_index integer not null default 0,
    notes text,
    created_at timestamptz default now()
);

-- Plan Schedule (which session on which day)
create table if not exists public.plan_schedule (
    id text primary key default gen_random_uuid()::text,
    plan_id text references public.workout_plans(id) on delete cascade not null,
    session_id text references public.plan_sessions(id) on delete cascade not null,
    day_of_week text not null,
    order_index integer default 0,
    is_optional boolean default false,
    created_at timestamptz default now()
);

-- =============================================================================
-- 3. USER MANAGEMENT TABLES
-- =============================================================================

-- User Workout Plans (active plan instances)
create table if not exists public.user_workout_plans (
    id text primary key default gen_random_uuid()::text,
    user_id uuid references auth.users(id) on delete cascade not null,
    plan_id text references public.workout_plans(id) on delete cascade not null,
    custom_name text,
    started_at timestamptz,
    ends_at timestamptz,
    is_active boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =============================================================================
-- 4. WORKOUT LOGGING & ANALYTICS TABLES
-- =============================================================================

-- Unified Workout Log (each row = one set of one exercise)
create table if not exists public.workout_log (
    id text primary key default gen_random_uuid()::text,
    user_id uuid references auth.users(id) on delete cascade not null,
    plan_id text references public.workout_plans(id) on delete set null,
    session_id text references public.plan_sessions(id) on delete set null,
    exercise_id text references public.exercises(id) on delete restrict not null,

    -- Session metadata (duplicated for analytics)
    workout_date date not null,
    session_name text not null,
    start_time timestamptz,
    end_time timestamptz,

    -- Set data
    set_number integer not null,
    weight numeric,
    reps numeric,
    rpe numeric,
    rest_duration_seconds integer,
    completed boolean default true,
    notes text,

    -- Analytics enrichments
    muscle_groups text[] default array[]::text[],
    equipment_used text,
    workout_type text check (workout_type in ('planned', 'manual', 'template')) default 'planned',

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- User Exercise Progress (personal records)
create table if not exists public.user_exercise_progress (
    id text primary key default gen_random_uuid()::text,
    user_id uuid references auth.users(id) on delete cascade not null,
    exercise_id text references public.exercises(id) on delete cascade not null,
    metric_type text check (metric_type in ('weight', 'reps', 'volume', 'rpe')) not null,
    value numeric not null,
    achieved_at timestamptz not null,
    context text,
    created_at timestamptz default now(),

    unique(user_id, exercise_id, metric_type, context)
);

-- Workout Summaries (daily aggregates)
create table if not exists public.workout_summaries (
    id text primary key default gen_random_uuid()::text,
    user_id uuid references auth.users(id) on delete cascade not null,
    workout_date date not null,
    plan_id text references public.workout_plans(id) on delete set null,
    session_name text,
    total_sets integer default 0,
    total_reps integer default 0,
    total_volume numeric default 0,
    average_rpe numeric,
    duration_minutes integer,
    workout_type text check (workout_type in ('planned', 'manual', 'template')) default 'planned',
    completed boolean default true,

    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    unique(user_id, workout_date, session_name)
);

-- =============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Master data indexes
create index if not exists idx_exercises_user on public.exercises(user_id);
create index if not exists idx_session_templates_creator on public.session_templates(created_by);
create index if not exists idx_template_exercises_template on public.template_exercises(template_id);
create index if not exists idx_workout_plans_user on public.workout_plans(user_id);

-- Plan structure indexes
create index if not exists idx_plan_sessions_plan on public.plan_sessions(plan_id);
create index if not exists idx_plan_sessions_template on public.plan_sessions(template_id);
create index if not exists idx_plan_exercises_session on public.plan_exercises(session_id);
create index if not exists idx_plan_schedule_plan on public.plan_schedule(plan_id);

-- User data indexes
create index if not exists idx_user_workout_plans_user on public.user_workout_plans(user_id);

-- Workout logging indexes
create index if not exists idx_workout_log_user_date on public.workout_log(user_id, workout_date);
create index if not exists idx_workout_log_exercise on public.workout_log(exercise_id);
create index if not exists idx_workout_log_plan on public.workout_log(plan_id);
create index if not exists idx_workout_log_muscle_groups on public.workout_log using gin(muscle_groups);

-- Analytics indexes
create index if not exists idx_user_exercise_progress_user_exercise on public.user_exercise_progress(user_id, exercise_id);
create index if not exists idx_workout_summaries_user_date on public.workout_summaries(user_id, workout_date);

-- =============================================================================
-- 6. VIEWS FOR BACKWARD COMPATIBILITY & ANALYTICS
-- =============================================================================

-- Session details view (combines plan sessions with template data)
create or replace view public.session_details as
select
    ps.id,
    ps.plan_id,
    ps.name,
    ps.description,
    ps.focus,
    ps.order_index,
    ps.template_id,

    -- Use template data if available, otherwise session data
    coalesce(st.name, ps.name) as display_name,
    coalesce(st.description, ps.description) as display_description,
    coalesce(st.focus, ps.focus) as display_focus,
    coalesce(st.equipment, 'gym') as equipment,
    coalesce(st.difficulty, 'intermediate') as difficulty,

    -- Exercise count (from template or custom exercises)
    case
        when ps.template_id is not null then (
            select count(*) from public.template_exercises te where te.template_id = ps.template_id
        )
        else (
            select count(*) from public.plan_exercises pe where pe.session_id = ps.id
        )
    end as exercise_count,

    ps.created_at
from public.plan_sessions ps
left join public.session_templates st on st.id = ps.template_id;

-- Complete plan details view
create or replace view public.plan_complete_details as
select
    wp.*,
    json_agg(
        json_build_object(
            'id', sd.id,
            'name', sd.display_name,
            'description', sd.display_description,
            'focus', sd.display_focus,
            'equipment', sd.equipment,
            'difficulty', sd.difficulty,
            'exercise_count', sd.exercise_count,
            'order_index', sd.order_index
        ) order by sd.order_index
    ) as sessions
from public.workout_plans wp
left join public.session_details sd on sd.plan_id = wp.id
group by wp.id, wp.user_id, wp.name, wp.description, wp.frequency, wp.equipment,
         wp.duration, wp.difficulty, wp.tags, wp.is_public, wp.created_at, wp.updated_at,
         wp.focus_areas, wp.target_audience, wp.estimated_weekly_volume, wp.primary_goals, wp.category;

-- =============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
alter table public.exercises enable row level security;
alter table public.session_templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.plan_sessions enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.plan_schedule enable row level security;
alter table public.user_workout_plans enable row level security;
alter table public.workout_log enable row level security;
alter table public.user_exercise_progress enable row level security;
alter table public.workout_summaries enable row level security;

-- Exercises policies
create policy "View exercises" on public.exercises for select
    using (auth.uid() = user_id or is_public = true or user_id is null);

create policy "Manage exercises" on public.exercises for all
    using (auth.uid() = user_id);

-- Session templates policies
create policy "View templates" on public.session_templates for select
    using (created_by = auth.uid() or is_public = true);

create policy "Manage templates" on public.session_templates for all
    using (created_by = auth.uid());

-- Template exercises policies
create policy "View template exercises" on public.template_exercises for select
    using (exists (select 1 from public.session_templates st where st.id = template_id and (st.created_by = auth.uid() or st.is_public = true)));

create policy "Manage template exercises" on public.template_exercises for all
    using (exists (select 1 from public.session_templates st where st.id = template_id and st.created_by = auth.uid()));

-- Workout plans policies
create policy "View plans" on public.workout_plans for select
    using (auth.uid() = user_id or is_public = true);

create policy "Manage plans" on public.workout_plans for all
    using (auth.uid() = user_id);

-- Plan sessions policies
create policy "View plan sessions" on public.plan_sessions for select
    using (exists (select 1 from public.workout_plans wp where wp.id = plan_id and (wp.user_id = auth.uid() or wp.is_public = true)));

create policy "Manage plan sessions" on public.plan_sessions for all
    using (exists (select 1 from public.workout_plans wp where wp.id = plan_id and wp.user_id = auth.uid()));

-- Plan exercises policies
create policy "View plan exercises" on public.plan_exercises for select
    using (exists (select 1 from public.plan_sessions ps join public.workout_plans wp on ps.plan_id = wp.id where ps.id = session_id and (wp.user_id = auth.uid() or wp.is_public = true)));

create policy "Manage plan exercises" on public.plan_exercises for all
    using (exists (select 1 from public.plan_sessions ps join public.workout_plans wp on ps.plan_id = wp.id where ps.id = session_id and wp.user_id = auth.uid()));

-- Plan schedule policies
create policy "View plan schedule" on public.plan_schedule for select
    using (exists (select 1 from public.workout_plans wp where wp.id = plan_id and (wp.user_id = auth.uid() or wp.is_public = true)));

create policy "Manage plan schedule" on public.plan_schedule for all
    using (exists (select 1 from public.workout_plans wp where wp.id = plan_id and wp.user_id = auth.uid()));

-- User workout plans policies
create policy "Manage user plans" on public.user_workout_plans for all
    using (auth.uid() = user_id);

-- Workout logging policies
create policy "Manage workout logs" on public.workout_log for all
    using (user_id = auth.uid());

-- Progress tracking policies
create policy "Manage progress" on public.user_exercise_progress for all
    using (user_id = auth.uid());

create policy "Manage summaries" on public.workout_summaries for all
    using (user_id = auth.uid());

-- =============================================================================
-- 8. HELPFUL COMMENTS
-- =============================================================================

comment on table public.exercises is 'Master exercise catalog - both system and user-created exercises';
comment on table public.session_templates is 'Reusable workout session templates for common routines';
comment on table public.template_exercises is 'Exercises belonging to session templates';
comment on table public.workout_plans is 'Workout program definitions with metadata for analytics';
comment on table public.plan_sessions is 'Individual workout sessions within plans (may reference templates)';
comment on table public.plan_exercises is 'Custom exercises for plan sessions not using templates';
comment on table public.plan_schedule is 'Weekly scheduling - which session on which day';
comment on table public.user_workout_plans is 'User instances of workout plans (active plan tracking)';
comment on table public.workout_log is 'Unified workout logging - each row represents one set';
comment on table public.user_exercise_progress is 'Personal records and progress tracking';
comment on table public.workout_summaries is 'Daily workout aggregates for analytics';

comment on column public.workout_log.rpe is 'Rate of Perceived Exertion (1-10 scale)';
comment on column public.workout_plans.category is 'Workout category for organization';