-- =============================================================================
-- HyperFit — plan share fixes
-- =============================================================================
--
-- Adversarial review of PR-B (share-by-link) surfaced one real bug, plus
-- a small UX guard:
--
-- B1. The plans_write WITH CHECK from 20260501100000_plan_moderation_fixes
--     forces `is_public=false AND review_status in ('private','pending_review')`
--     on EVERY user-driven update — including ones that aren't touching
--     those columns. Once a plan is approved+public, the owner can no
--     longer edit ANY field (rename, toggle is_shareable, anything),
--     because PostgreSQL re-checks the WITH CHECK against the NEW row
--     and `is_public=true` fails it.
--
--     Fix: relax the WITH CHECK to just `user_id = auth.uid()` and move
--     the moderation invariants into the trigger, which CAN compare OLD
--     vs NEW. Now the rule is "you can't *change* is_public to true and
--     you can't *transition* review_status outside private<->pending"
--     — but you CAN keep an approved/rejected/etc state untouched while
--     editing other fields.
--
-- S2. import_shared_plan now refuses to clone your own plan.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- B1: relax policy, tighten trigger
-- ----------------------------------------------------------------------------

drop policy if exists "plans_write" on public.workout_plans;
create policy "plans_write"
  on public.workout_plans for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.workout_plans_review_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  -- Admin path: SECURITY DEFINER RPCs run as postgres, service-role
  -- connections also pass. Only enforce restrictions for PostgREST
  -- client roles.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- New rows must start clean. Owners can't pre-publish themselves.
    if coalesce(new.is_public, false) is true then
      raise exception 'is_public can only be set via approve_plan';
    end if;
    if new.review_status not in ('private', 'pending_review') then
      raise exception 'new plans must start in private or pending_review';
    end if;
    if new.reviewed_at is not null
       or new.reviewed_by is not null
       or new.review_notes is not null then
      raise exception 'review_* fields are admin-only';
    end if;
    return new;
  end if;

  -- UPDATE: enforce on *changes*, not on the snapshot. An approved plan
  -- whose owner is editing the name (without touching moderation cols)
  -- must pass.

  if new.is_public is distinct from old.is_public then
    raise exception 'is_public can only be set via approve_plan/reject_plan';
  end if;

  if new.review_status is distinct from old.review_status then
    if not (
      (old.review_status = 'private'        and new.review_status = 'pending_review')
      or (old.review_status = 'pending_review' and new.review_status = 'private')
      or (old.review_status = 'rejected'    and new.review_status = 'pending_review')
    ) then
      raise exception 'review_status transition % -> % is not allowed for users',
        old.review_status, new.review_status;
    end if;
  end if;

  if new.reviewed_at  is distinct from old.reviewed_at
     or new.reviewed_by is distinct from old.reviewed_by
     or new.review_notes is distinct from old.review_notes then
    raise exception 'review_* fields are admin-only';
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- S2: import_shared_plan refuses to clone your own plan
-- ----------------------------------------------------------------------------

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

  if v_src.user_id = v_caller then
    raise exception 'cannot import your own plan';
  end if;

  insert into public.workout_plans
    (user_id, name, description, frequency, equipment, duration, difficulty,
     tags, is_public, review_status, is_shareable)
  values
    (v_caller, v_src.name, v_src.description, v_src.frequency, v_src.equipment,
     v_src.duration, v_src.difficulty, v_src.tags, false, 'private', false)
  returning id into v_new_id;

  for v_session in
    select id, name, description, focus, order_index
      from public.plan_sessions
      where plan_id = v_src.id
  loop
    insert into public.plan_sessions (plan_id, name, description, focus, order_index)
      values (v_new_id, v_session.name, v_session.description, v_session.focus, v_session.order_index)
      returning id into v_new_session_id;
    v_session_id_map := v_session_id_map || jsonb_build_object(v_session.id::text, v_new_session_id::text);

    insert into public.plan_exercises
      (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
    select
      v_new_session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds
    from public.plan_exercises
    where session_id = v_session.id;
  end loop;

  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index)
  select v_new_id, day_of_week,
         (v_session_id_map ->> session_id::text)::uuid,
         order_index
  from public.plan_schedule
  where plan_id = v_src.id;

  return v_new_id;
end;
$$;
