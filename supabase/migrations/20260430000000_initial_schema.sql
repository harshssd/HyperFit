-- =============================================================================
-- HyperFit — initial schema (greenfield)
-- =============================================================================
-- Single source of truth for the database. Designed against actual app usage,
-- not historical accumulation. Anything not referenced by source code on
-- 2026-04-30 was dropped.
--
-- Concepts:
--   exercises                 — master library (own + public).
--   workout_plans             — blueprints (catalog).
--   plan_sessions             — sessions inside a plan (push, pull, ...).
--   plan_exercises            — exercises in a plan_session.
--   plan_schedule             — which session(s) on which day.
--   user_workout_plans        — a user's *instance* of a plan.
--   workout_sessions          — one row per logged workout.
--   workout_sets              — one row per set, child of workout_sessions.
--   templates                 — reusable exercise lists (kind = plan_session | quick).
--   template_exercises        — exercises in a template (FK; not text[]).
--   template_folders          — user-organized folders for quick templates.
--   user_template_favorites   — bookmarks.
--
-- Views:
--   session_summary_view      — folded session totals; History reads this.
--   muscle_volume_view        — per-day per-muscle aggregate; heatmap reads this.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- exercises
-- -----------------------------------------------------------------------------
create table public.exercises (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,  -- null = system / shared
  name            text not null,
  muscle_group    text,
  equipment       text,
  is_public       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, name)
);

create index exercises_muscle_group_idx on public.exercises(muscle_group);

alter table public.exercises enable row level security;

create policy "exercises_read"
  on public.exercises for select
  using (is_public or user_id = auth.uid() or user_id is null);

create policy "exercises_write"
  on public.exercises for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- workout_plans + plan_sessions + plan_exercises + plan_schedule
-- -----------------------------------------------------------------------------
create table public.workout_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  frequency       int,
  equipment       text,
  duration        text,
  difficulty      text,
  tags            text[] not null default '{}',
  is_public       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.plan_sessions (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.workout_plans(id) on delete cascade,
  name            text not null,
  description     text,
  focus           text,
  order_index     int not null,
  unique (plan_id, order_index)
);

create table public.plan_exercises (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.plan_sessions(id) on delete cascade,
  exercise_id     uuid not null references public.exercises(id) on delete restrict,
  order_index     int not null,
  sets            int not null default 3,
  reps_min        int,
  reps_max        int,
  rest_seconds    int,
  unique (session_id, order_index)
);

create table public.plan_schedule (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.workout_plans(id) on delete cascade,
  day_of_week     text not null check (day_of_week in
    ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  session_id      uuid not null references public.plan_sessions(id) on delete cascade,
  order_index     int not null default 0
);

create index plan_schedule_plan_idx on public.plan_schedule(plan_id);

create table public.user_workout_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  plan_id         uuid not null references public.workout_plans(id) on delete cascade,
  custom_name     text,
  is_active       boolean not null default false,
  started_at      timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- At most one active plan per user.
create unique index user_workout_plans_active_unique
  on public.user_workout_plans(user_id)
  where is_active = true;

alter table public.workout_plans enable row level security;
alter table public.plan_sessions enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.plan_schedule enable row level security;
alter table public.user_workout_plans enable row level security;

create policy "plans_read"
  on public.workout_plans for select
  using (is_public or user_id = auth.uid());

create policy "plans_write"
  on public.workout_plans for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Children of a plan are visible if the plan itself is visible.
create policy "plan_sessions_read"
  on public.plan_sessions for select
  using (exists (
    select 1 from public.workout_plans p
    where p.id = plan_id and (p.is_public or p.user_id = auth.uid())
  ));

create policy "plan_sessions_write"
  on public.plan_sessions for all
  using (exists (
    select 1 from public.workout_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));

create policy "plan_exercises_read"
  on public.plan_exercises for select
  using (exists (
    select 1 from public.plan_sessions s
    join public.workout_plans p on p.id = s.plan_id
    where s.id = session_id and (p.is_public or p.user_id = auth.uid())
  ));

create policy "plan_exercises_write"
  on public.plan_exercises for all
  using (exists (
    select 1 from public.plan_sessions s
    join public.workout_plans p on p.id = s.plan_id
    where s.id = session_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.plan_sessions s
    join public.workout_plans p on p.id = s.plan_id
    where s.id = session_id and p.user_id = auth.uid()
  ));

create policy "plan_schedule_read"
  on public.plan_schedule for select
  using (exists (
    select 1 from public.workout_plans p
    where p.id = plan_id and (p.is_public or p.user_id = auth.uid())
  ));

create policy "plan_schedule_write"
  on public.plan_schedule for all
  using (exists (
    select 1 from public.workout_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));

create policy "user_plans_owner"
  on public.user_workout_plans for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- workout_sessions + workout_sets (replaces denormalized workout_log)
-- -----------------------------------------------------------------------------
create table public.workout_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  plan_id             uuid references public.workout_plans(id) on delete set null,
  plan_session_id     uuid references public.plan_sessions(id) on delete set null,
  workout_date        date not null,
  name                text not null,
  start_time          timestamptz,
  end_time            timestamptz,
  notes               text,
  created_at          timestamptz not null default now()
);

create index workout_sessions_user_date_idx
  on public.workout_sessions(user_id, workout_date desc);

create table public.workout_sets (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id     uuid not null references public.exercises(id) on delete restrict,
  order_index     int not null,
  set_number      int not null,
  weight          numeric,
  reps            numeric,
  completed       boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (session_id, order_index, set_number)
);

create index workout_sets_session_idx on public.workout_sets(session_id);
create index workout_sets_exercise_idx on public.workout_sets(exercise_id);

alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

create policy "sessions_owner"
  on public.workout_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "sets_owner"
  on public.workout_sets for all
  using (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- templates (merged session_templates + workout_templates)
-- -----------------------------------------------------------------------------
create type public.template_kind as enum ('plan_session', 'quick');

create table public.template_folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create table public.templates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,  -- null = system
  folder_id       uuid references public.template_folders(id) on delete set null,
  kind            public.template_kind not null,
  name            text not null,
  description     text,
  icon            text,
  tags            text[] not null default '{}',
  is_public       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index templates_kind_idx on public.templates(kind);

create table public.template_exercises (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid not null references public.templates(id) on delete cascade,
  exercise_id     uuid not null references public.exercises(id) on delete restrict,
  order_index     int not null,
  -- Plan-session-kind details. Null on quick templates.
  sets            int,
  reps_min        int,
  reps_max        int,
  rest_seconds    int,
  unique (template_id, order_index)
);

create table public.user_template_favorites (
  user_id     uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.templates(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, template_id)
);

alter table public.template_folders enable row level security;
alter table public.templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.user_template_favorites enable row level security;

create policy "folders_owner"
  on public.template_folders for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "templates_read"
  on public.templates for select
  using (is_public or user_id = auth.uid() or user_id is null);

create policy "templates_write"
  on public.templates for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "template_exercises_read"
  on public.template_exercises for select
  using (exists (
    select 1 from public.templates t
    where t.id = template_id
      and (t.is_public or t.user_id = auth.uid() or t.user_id is null)
  ));

create policy "template_exercises_write"
  on public.template_exercises for all
  using (exists (
    select 1 from public.templates t
    where t.id = template_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.templates t
    where t.id = template_id and t.user_id = auth.uid()
  ));

create policy "favorites_owner"
  on public.user_template_favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Views
-- -----------------------------------------------------------------------------

-- One row per logged session with totals. The canonical read surface for the
-- History tab; client code should NEVER reaggregate workout_sets in JS.
create view public.session_summary_view as
select
  s.id,
  s.user_id,
  s.plan_id,
  s.plan_session_id,
  s.workout_date,
  s.name                                   as session_name,
  s.start_time,
  s.end_time,
  s.notes,
  count(st.id)::int                        as total_sets,
  count(distinct st.exercise_id)::int      as exercise_count,
  coalesce(sum(coalesce(st.weight,0)
            * coalesce(st.reps,0)), 0)::numeric as volume_load,
  bool_and(st.completed) filter (where st.id is not null) as all_completed,
  case
    when count(st.id) = 0 then 'empty'
    when bool_and(st.completed) filter (where st.id is not null) then 'completed'
    else 'incomplete'
  end as status,
  extract(epoch from (s.end_time - s.start_time))::int as duration_seconds
from public.workout_sessions s
left join public.workout_sets st on st.session_id = s.id
group by s.id;

-- Per-day per-muscle volume; powers MuscleHeatmap without client-side rollup.
create view public.muscle_volume_view as
select
  s.user_id,
  s.workout_date,
  e.muscle_group,
  sum(coalesce(st.weight, 0) * coalesce(st.reps, 0))::numeric as volume,
  count(st.id)::int                                            as set_count
from public.workout_sets st
join public.workout_sessions s on s.id = st.session_id
join public.exercises e        on e.id = st.exercise_id
where st.completed = true
  and st.weight is not null
  and st.reps is not null
  and e.muscle_group is not null
group by s.user_id, s.workout_date, e.muscle_group;
