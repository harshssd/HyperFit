-- Migration: Create Session Library for Reusable Sessions
-- This allows sessions to be referenced by multiple workout plans

-- 1. Create session_library table for reusable session templates
create table if not exists public.session_library (
    id text primary key default uuid_generate_v4()::text,
    name text not null,
    description text,
    focus text, -- 'push', 'pull', 'legs', 'upper', 'lower', etc.
    created_by uuid references auth.users(id) on delete set null,
    source_plan_id text references public.workout_plans(id) on delete set null, -- Original plan this session came from
    is_public boolean default false, -- Public sessions can be referenced by anyone
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Add library_session_id to plan_sessions to reference library sessions
alter table public.plan_sessions 
    add column if not exists library_session_id text references public.session_library(id) on delete set null;

-- 3. Make plan_id nullable in plan_sessions (for backward compatibility and flexibility)
-- Note: This doesn't change existing data, just allows future flexibility
alter table public.plan_sessions 
    alter column plan_id drop not null;

-- 4. Add a check constraint to ensure either plan_id or library_session_id is set
-- (A session must belong to a plan OR be a reference to a library session)
alter table public.plan_sessions
    add constraint plan_or_library_session_check 
    check (plan_id is not null or library_session_id is not null);

-- 5. Create library_exercises table to store exercises for library sessions
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

-- 6. Create indexes for performance
create index if not exists idx_session_library_public on public.session_library(is_public) where is_public = true;
create index if not exists idx_session_library_creator on public.session_library(created_by);
create index if not exists idx_plan_sessions_library_ref on public.plan_sessions(library_session_id) where library_session_id is not null;
create index if not exists idx_library_exercises_session on public.library_exercises(library_session_id);

-- 7. Enable RLS on new tables
alter table public.session_library enable row level security;
alter table public.library_exercises enable row level security;

-- 8. RLS Policies for session_library
-- Users can view their own sessions and public sessions
create policy "View own and public sessions"
    on public.session_library for select
    to authenticated
    using (
        created_by = auth.uid() 
        or is_public = true
    );

-- Users can insert their own sessions
create policy "Insert own sessions"
    on public.session_library for insert
    to authenticated
    with check (created_by = auth.uid());

-- Users can update their own sessions (but not public ones once published)
create policy "Update own non-public sessions"
    on public.session_library for update
    to authenticated
    using (created_by = auth.uid() and is_public = false)
    with check (created_by = auth.uid() and is_public = false);

-- Users can delete their own non-public sessions
create policy "Delete own non-public sessions"
    on public.session_library for delete
    to authenticated
    using (created_by = auth.uid() and is_public = false);

-- 9. RLS Policies for library_exercises
-- Users can view exercises for sessions they have access to
create policy "View library exercises"
    on public.library_exercises for select
    to authenticated
    using (
        exists (
            select 1 from public.session_library sl
            where sl.id = library_session_id
            and (sl.created_by = auth.uid() or sl.is_public = true)
        )
    );

-- Users can manage exercises for their own sessions
create policy "Manage own library exercises"
    on public.library_exercises for all
    to authenticated
    using (
        exists (
            select 1 from public.session_library sl
            where sl.id = library_session_id
            and sl.created_by = auth.uid()
            and sl.is_public = false
        )
    )
    with check (
        exists (
            select 1 from public.session_library sl
            where sl.id = library_session_id
            and sl.created_by = auth.uid()
            and sl.is_public = false
        )
    );

-- 10. Create a function to copy session to library (for promoting existing sessions)
create or replace function public.promote_session_to_library(
    p_session_id text,
    p_is_public boolean default false
) returns text as $$
declare
    v_library_session_id text;
    v_user_id uuid;
    v_session record;
    v_exercise record;
begin
    -- Get current user
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- Get the session details
    select * into v_session
    from public.plan_sessions
    where id = p_session_id;

    if not found then
        raise exception 'Session not found';
    end if;

    -- Create library session
    insert into public.session_library (
        name, description, focus, created_by, source_plan_id, is_public
    ) values (
        v_session.name,
        v_session.description,
        v_session.focus,
        v_user_id,
        v_session.plan_id,
        p_is_public
    ) returning id into v_library_session_id;

    -- Copy exercises to library
    for v_exercise in 
        select * from public.plan_exercises
        where session_id = p_session_id
        order by order_index
    loop
        insert into public.library_exercises (
            library_session_id,
            exercise_id,
            sets,
            reps_min,
            reps_max,
            rest_seconds,
            order_index,
            notes
        ) values (
            v_library_session_id,
            v_exercise.exercise_id,
            v_exercise.sets,
            v_exercise.reps_min,
            v_exercise.reps_max,
            v_exercise.rest_seconds,
            v_exercise.order_index,
            v_exercise.notes
        );
    end loop;

    return v_library_session_id;
end;
$$ language plpgsql security definer;

-- 11. Create a view to easily fetch complete library sessions with exercises
create or replace view public.library_sessions_with_exercises as
select 
    sl.id as session_id,
    sl.name as session_name,
    sl.description,
    sl.focus,
    sl.created_by,
    sl.is_public,
    sl.created_at,
    json_agg(
        json_build_object(
            'id', le.id,
            'exercise_id', le.exercise_id,
            'exercise_name', e.name,
            'exercise_muscle_group', e.muscle_group,
            'sets', le.sets,
            'reps_min', le.reps_min,
            'reps_max', le.reps_max,
            'rest_seconds', le.rest_seconds,
            'order_index', le.order_index,
            'notes', le.notes
        ) order by le.order_index
    ) as exercises
from public.session_library sl
left join public.library_exercises le on sl.id = le.library_session_id
left join public.exercises e on le.exercise_id = e.id
group by sl.id, sl.name, sl.description, sl.focus, sl.created_by, sl.is_public, sl.created_at;

-- 12. Grant access to the view
grant select on public.library_sessions_with_exercises to authenticated;

-- 13. Add comment for documentation
comment on table public.session_library is 'Reusable session templates that can be referenced by multiple workout plans';
comment on table public.library_exercises is 'Exercises belonging to library session templates';
comment on column public.plan_sessions.library_session_id is 'Reference to a library session if this is a referenced session';

