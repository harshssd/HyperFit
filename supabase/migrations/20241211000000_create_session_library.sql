-- Migration: Create Session Library for Reusable Sessions
-- Migration: Unified Session Model
-- Refactor plan_sessions to support templates and inheritance instead of separate tables

-- 1. Make plan_id nullable to allow sessions to exist as templates (without a plan)
alter table public.plan_sessions 
    alter column plan_id drop not null;

-- 2. Add columns for template management and lineage
alter table public.plan_sessions
    add column if not exists is_template boolean default false,
    add column if not exists is_public boolean default false,
    add column if not exists original_session_id text references public.plan_sessions(id) on delete set null,
    add column if not exists created_by uuid references auth.users(id) on delete set null,
    add column if not exists description text,
    add column if not exists focus text;

-- 3. Indexes for performance
create index if not exists idx_plan_sessions_template on public.plan_sessions(is_template) where is_template = true;
create index if not exists idx_plan_sessions_public on public.plan_sessions(is_public) where is_public = true;
create index if not exists idx_plan_sessions_creator on public.plan_sessions(created_by);
create index if not exists idx_plan_sessions_original on public.plan_sessions(original_session_id);

-- 4. Enable RLS
alter table public.plan_sessions enable row level security;

-- 5. RLS Policies
-- Users can view their own sessions, public templates, or sessions in their plans
drop policy if exists "View accessible sessions" on public.plan_sessions;
create policy "View accessible sessions"
    on public.plan_sessions for select
    to authenticated
    using (
        created_by = auth.uid() 
        or is_public = true
        or exists (select 1 from public.workout_plans wp where wp.id = plan_id and wp.user_id = auth.uid())
    );

-- Users can manage their own sessions
drop policy if exists "Manage own sessions" on public.plan_sessions;
create policy "Manage own sessions"
    on public.plan_sessions for all
    to authenticated
    using (created_by = auth.uid() or exists (select 1 from public.workout_plans wp where wp.id = plan_id and wp.user_id = auth.uid()));

-- 6. Function to promote session to template (Copy)
create or replace function public.promote_session_to_template(
    p_session_id text,
    p_is_public boolean default false
) returns text as $$
declare
    v_new_session_id text;
    v_user_id uuid;
begin
    v_user_id := auth.uid();
    
    -- Copy session
    insert into public.plan_sessions (
        name, description, focus, created_by, is_template, is_public, original_session_id
    )
    select 
        name, description, focus, v_user_id, true, p_is_public, id
    from public.plan_sessions
    where id = p_session_id
    returning id into v_new_session_id;

    -- Copy exercises
    insert into public.plan_exercises (
        session_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index, notes
    )
    select 
        v_new_session_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index, notes
    from public.plan_exercises
    where session_id = p_session_id;

    return v_new_session_id;
end;
$$ language plpgsql security definer;
