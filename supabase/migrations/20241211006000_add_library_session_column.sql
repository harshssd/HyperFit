-- Ensure library session support exists before seeds that reference library_session_id
-- This is incremental and safe to apply on top of existing migrations.

-- 1) Ensure uuid extension exists (needed for earlier migrations that used uuid_generate_v4)
create extension if not exists "uuid-ossp";

-- 2) Ensure session_library table exists (idempotent)
create table if not exists public.session_library (
    id text primary key default uuid_generate_v4()::text,
    name text not null,
    description text,
    focus text,
    created_by uuid references auth.users(id) on delete set null,
    source_plan_id text references public.workout_plans(id) on delete set null,
    is_public boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3) Ensure library_exercises table exists (idempotent)
create table if not exists public.library_exercises (
    id text primary key default uuid_generate_v4()::text,
    library_session_id text references public.session_library(id) on delete cascade not null,
    exercise_id text references public.exercises(id) on delete restrict not null,
    sets integer default 3,
    reps_min integer,
    reps_max integer,
    rest_seconds integer,
    order_index integer not null default 0,
    notes text,
    created_at timestamptz default now()
);

-- 4) Add library_session_id to plan_sessions if missing
alter table public.plan_sessions
  add column if not exists library_session_id text references public.session_library(id) on delete set null;

-- 5) Make plan_id nullable to allow library-only references
alter table public.plan_sessions
  alter column plan_id drop not null;

-- 6) Ensure the check constraint exists (plan_id OR library_session_id)
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'plan_or_library_session_check'
      and conrelid = 'public.plan_sessions'::regclass
  ) then
    alter table public.plan_sessions drop constraint plan_or_library_session_check;
  end if;
end$$;

alter table public.plan_sessions
  add constraint plan_or_library_session_check
  check (plan_id is not null or library_session_id is not null);

-- 7) Helpful index for library lookups
create index if not exists idx_plan_sessions_library_session on public.plan_sessions(library_session_id);


