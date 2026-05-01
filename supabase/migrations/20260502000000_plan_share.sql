-- =============================================================================
-- HyperFit — share plans by link
-- =============================================================================
--
-- Adds a separate sharing mechanism alongside moderation. Sharing is
-- per-plan, owner-controlled, and bypasses the public-library review
-- queue: the owner toggles `is_shareable=true` and gets a stable
-- `share_code` to hand out (DM, social post, anywhere).
--
-- Reading by code:        get_plan_by_share_code(code)  — returns plan + tree
-- Importing into library: import_shared_plan(code)      — clones under auth.uid()
-- Revoking:               toggle is_shareable=false (link 404s thereafter)
-- Rotating:               rotate_plan_share_code(plan_id) — owner-gated UUID swap
--
-- Security model: both RPCs are SECURITY DEFINER and gate strictly on
-- `is_shareable=true` so a leaked code for a plan whose sharing has been
-- revoked stops working immediately.
-- =============================================================================

alter table public.workout_plans
  add column share_code   uuid not null default gen_random_uuid(),
  add column is_shareable boolean not null default false;

-- Cheap exact lookup by code. Unique constraint also catches the
-- effectively-impossible case of two plans landing on the same UUID.
create unique index workout_plans_share_code_idx
  on public.workout_plans(share_code);

-- ----------------------------------------------------------------------------
-- get_plan_by_share_code: returns plan + sessions + plan_exercises + schedule
-- ----------------------------------------------------------------------------
--
-- Returns a single JSONB blob so the client can hydrate a preview without
-- chaining multiple RPCs. The shape mirrors what fetchWorkoutPlanDetails
-- builds on the client today, with one exception: server returns DB-shape
-- column names (snake_case) and the client does the same field renaming
-- it does for fetchWorkoutPlanDetails.
--
create or replace function public.get_plan_by_share_code(p_code uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_plan public.workout_plans;
  v_sessions jsonb;
  v_schedule jsonb;
begin
  select * into v_plan
    from public.workout_plans
    where share_code = p_code
      and is_shareable = true;
  if v_plan.id is null then
    return null;
  end if;

  select coalesce(jsonb_agg(s_obj order by s_obj->>'order_index'), '[]'::jsonb)
    into v_sessions
  from (
    select jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'description', s.description,
      'focus', s.focus,
      'order_index', s.order_index,
      'exercises', coalesce(
        (select jsonb_agg(jsonb_build_object(
            'exercise_id', pe.exercise_id,
            'name', e.name,
            'muscle_group', e.muscle_group,
            'order_index', pe.order_index,
            'sets', pe.sets,
            'reps_min', pe.reps_min,
            'reps_max', pe.reps_max,
            'rest_seconds', pe.rest_seconds
         ) order by pe.order_index)
         from public.plan_exercises pe
         join public.exercises e on e.id = pe.exercise_id
         where pe.session_id = s.id),
        '[]'::jsonb
      )
    ) as s_obj
    from public.plan_sessions s
    where s.plan_id = v_plan.id
  ) sub;

  select coalesce(jsonb_agg(jsonb_build_object(
    'day_of_week', day_of_week,
    'session_id', session_id,
    'order_index', order_index
  )), '[]'::jsonb)
    into v_schedule
  from public.plan_schedule
  where plan_id = v_plan.id;

  return jsonb_build_object(
    'id', v_plan.id,
    'name', v_plan.name,
    'description', v_plan.description,
    'frequency', v_plan.frequency,
    'equipment', v_plan.equipment,
    'duration', v_plan.duration,
    'difficulty', v_plan.difficulty,
    'tags', v_plan.tags,
    'sessions', v_sessions,
    'schedule', v_schedule
  );
end;
$$;

-- Anyone with a code (including signed-out browsers in a future webview)
-- should be able to read; gating is the is_shareable flag inside.
grant execute on function public.get_plan_by_share_code(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- import_shared_plan: clone plan tree under the calling user
-- ----------------------------------------------------------------------------
--
-- Transactional clone. Returns the new plan's id so the client can
-- navigate to it. The cloned plan is private (review_status='private',
-- is_public=false, is_shareable=false) — the user can re-share or submit
-- the copy for review on their own.
--
create or replace function public.import_shared_plan(p_code uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_caller uuid := auth.uid();
  v_src public.workout_plans;
  v_new_id uuid;
  v_session record;
  v_new_session_id uuid;
  v_session_id_map jsonb := '{}'::jsonb;
begin
  if v_caller is null then
    raise exception 'authentication required';
  end if;

  select * into v_src
    from public.workout_plans
    where share_code = p_code
      and is_shareable = true;
  if v_src.id is null then
    raise exception 'plan not found or sharing disabled';
  end if;

  -- 1. Clone the plan row, owned by the importer, private and non-shared.
  insert into public.workout_plans
    (user_id, name, description, frequency, equipment, duration, difficulty,
     tags, is_public, review_status, is_shareable)
  values
    (v_caller, v_src.name, v_src.description, v_src.frequency, v_src.equipment,
     v_src.duration, v_src.difficulty, v_src.tags, false, 'private', false)
  returning id into v_new_id;

  -- 2. Clone sessions, building a map from old.id -> new.id so we can
  --    rewrite plan_schedule.session_id below.
  for v_session in
    select id, name, description, focus, order_index
      from public.plan_sessions
      where plan_id = v_src.id
  loop
    insert into public.plan_sessions (plan_id, name, description, focus, order_index)
      values (v_new_id, v_session.name, v_session.description, v_session.focus, v_session.order_index)
      returning id into v_new_session_id;
    v_session_id_map := v_session_id_map || jsonb_build_object(v_session.id::text, v_new_session_id::text);

    -- 3. Clone the exercises for this session.
    insert into public.plan_exercises
      (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
    select
      v_new_session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds
    from public.plan_exercises
    where session_id = v_session.id;
  end loop;

  -- 4. Clone the schedule, remapping session_id through the map.
  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index)
  select v_new_id, day_of_week,
         (v_session_id_map ->> session_id::text)::uuid,
         order_index
  from public.plan_schedule
  where plan_id = v_src.id;

  return v_new_id;
end;
$$;

revoke all on function public.import_shared_plan(uuid) from public, anon;
grant execute on function public.import_shared_plan(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- rotate_plan_share_code: owner-gated UUID swap
-- ----------------------------------------------------------------------------
--
-- "Revoke and reissue" — the old code stops resolving immediately, the
-- caller gets a fresh one to redistribute. Owner-only; non-owners get a
-- permission_denied even with a valid plan id.
--
create or replace function public.rotate_plan_share_code(p_plan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_owner uuid;
  v_new_code uuid := gen_random_uuid();
begin
  select user_id into v_owner from public.workout_plans where id = p_plan_id;
  if v_owner is null then
    raise exception 'plan not found';
  end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'permission denied: only the plan owner can rotate the share code';
  end if;
  update public.workout_plans
    set share_code = v_new_code
    where id = p_plan_id;
  return v_new_code;
end;
$$;

revoke all on function public.rotate_plan_share_code(uuid) from public, anon;
grant execute on function public.rotate_plan_share_code(uuid) to authenticated;
