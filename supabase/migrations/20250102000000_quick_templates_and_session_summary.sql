-- =============================================================================
-- Quick-save workout templates + per-session aggregate view
-- =============================================================================
-- Adds the tables that src/services/templates.ts and useTemplates.ts expect
-- (these were referenced from the app but never had a migration), plus a
-- view that aggregates workout_log into per-session rows so HistoryAnalytics
-- and workoutService.fetchWorkoutSessions can stop doing the grouping in JS.
--
-- Two distinct template concepts coexist:
--   * session_templates (clean schema)   -> reusable session blueprints used
--                                            inside a workout_plan.
--   * workout_templates (this migration) -> user's quick-save bookmark of an
--                                            ad-hoc exercise list ("Today's
--                                            quad day", "Hotel workout").
-- =============================================================================

-- ---- Quick templates ---------------------------------------------------------

create table if not exists public.workout_template_folders (
    id text primary key default gen_random_uuid()::text,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    color text default '#f97316',
    icon text default '📁',
    created_at timestamptz default now()
);

create table if not exists public.workout_templates (
    id text primary key default gen_random_uuid()::text,
    user_id uuid references auth.users(id) on delete cascade not null,
    folder_id text references public.workout_template_folders(id) on delete set null,
    name text not null,
    description text,
    icon text default '💾',
    exercises text[] default array[]::text[],
    tags text[] default array[]::text[],
    created_by_username text,
    is_standard boolean default false,
    is_public boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.user_template_favorites (
    user_id uuid references auth.users(id) on delete cascade not null,
    template_id text references public.workout_templates(id) on delete cascade not null,
    created_at timestamptz default now(),
    primary key (user_id, template_id)
);

-- ---- Indexes -----------------------------------------------------------------

create index if not exists idx_workout_templates_user on public.workout_templates(user_id);
create index if not exists idx_workout_templates_folder on public.workout_templates(folder_id);
create index if not exists idx_workout_template_folders_user on public.workout_template_folders(user_id);
create index if not exists idx_user_template_favorites_user on public.user_template_favorites(user_id);

-- ---- RLS ---------------------------------------------------------------------

alter table public.workout_templates enable row level security;
alter table public.workout_template_folders enable row level security;
alter table public.user_template_favorites enable row level security;

create policy "View templates" on public.workout_templates for select
    using (auth.uid() = user_id or is_standard = true or is_public = true);

create policy "Manage own templates" on public.workout_templates for all
    using (auth.uid() = user_id);

create policy "Manage own folders" on public.workout_template_folders for all
    using (auth.uid() = user_id);

create policy "Manage own favorites" on public.user_template_favorites for all
    using (auth.uid() = user_id);

-- ---- Per-session aggregate view ---------------------------------------------
-- One row per (user, workout_date, session_name). Replaces the JS-side
-- Map() aggregation in workoutService.fetchWorkoutSessions and
-- HistoryAnalyticsView.loadSessions.

create or replace view public.session_summary_view as
select
    user_id,
    workout_date,
    session_name,
    -- Composite ID used by the client for deep links / lookups.
    workout_date || '-' || session_name as id,
    min(plan_id)             as plan_id,
    min(session_id)          as session_id,
    min(start_time)          as start_time,
    max(end_time)            as end_time,
    count(*)::int            as total_sets,
    count(distinct exercise_id)::int as exercise_count,
    coalesce(sum(weight * reps), 0)::numeric as volume_load,
    avg(rpe)                 as average_rpe,
    bool_and(completed)      as all_completed,
    case when bool_and(completed) then 'completed' else 'incomplete' end as status,
    extract(epoch from (max(end_time) - min(start_time)))::int as duration_seconds
from public.workout_log
group by user_id, workout_date, session_name;

comment on view public.session_summary_view is
    'Per-session rollup over workout_log; canonical source for History list.';
