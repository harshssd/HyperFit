-- =============================================================================
-- replace_workout_plan_contents — atomic plan update.
--
-- The TS-side `updateWorkoutPlan` previously did 4-5 separate round-trips
-- (UPDATE plan, DELETE schedule, DELETE sessions, INSERT sessions+exercises,
-- INSERT schedule). A client crash mid-flight could leave a plan with no
-- sessions or schedule. This RPC wraps the entire operation in one Postgres
-- transaction so partial failures roll back cleanly.
--
-- Owner check: the function is SECURITY INVOKER (default), so the calling
-- user's RLS policies still apply on the workout_plans UPDATE — standard
-- plans (user_id = null) remain read-only.
-- =============================================================================

create or replace function public.replace_workout_plan_contents(
  p_plan_id     uuid,
  p_plan_patch  jsonb,                  -- partial workout_plans columns
  p_sessions    jsonb,                  -- [{name,description,focus,order_index,exercises:[{exercise_id,sets,reps_min,reps_max,rest_seconds,order_index}]}]
  p_schedule    jsonb                   -- [{session_index,day_of_week,order_index}]
) returns void
language plpgsql
as $$
declare
  s jsonb;
  ex jsonb;
  sched jsonb;
  new_session_id uuid;
  session_ids uuid[] := array[]::uuid[];
  session_idx int;
begin
  -- Apply partial patch to the parent row (RLS gate fires here).
  update public.workout_plans
  set
    name        = coalesce(p_plan_patch->>'name', name),
    description = coalesce(p_plan_patch->>'description', description),
    frequency   = coalesce((p_plan_patch->>'frequency')::int, frequency),
    equipment   = coalesce(p_plan_patch->>'equipment', equipment),
    duration    = coalesce(p_plan_patch->>'duration', duration),
    difficulty  = coalesce(p_plan_patch->>'difficulty', difficulty),
    tags        = coalesce(
      array(select jsonb_array_elements_text(p_plan_patch->'tags')),
      tags
    ),
    updated_at  = now()
  where id = p_plan_id;

  if not found then
    raise exception 'plan % not found or not owned by current user', p_plan_id;
  end if;

  -- Wipe schedule + sessions (cascades to plan_exercises). workout_sessions
  -- references plan_session_id with ON DELETE SET NULL, so historical logged
  -- workouts are preserved with only the session_id link cleared. Plan_id is
  -- untouched (the plan row itself still exists).
  delete from public.plan_schedule where plan_id = p_plan_id;
  delete from public.plan_sessions where plan_id = p_plan_id;

  -- Re-insert sessions, capturing the new ids in array index order so the
  -- schedule rows can refer to sessions by ordinal position.
  for session_idx in 0..(jsonb_array_length(p_sessions) - 1) loop
    s := p_sessions->session_idx;
    insert into public.plan_sessions (plan_id, name, description, focus, order_index)
    values (
      p_plan_id,
      s->>'name',
      s->>'description',
      s->>'focus',
      coalesce((s->>'order_index')::int, session_idx + 1)
    )
    returning id into new_session_id;
    session_ids := session_ids || new_session_id;

    if jsonb_array_length(coalesce(s->'exercises', '[]'::jsonb)) > 0 then
      for ex in select * from jsonb_array_elements(s->'exercises') loop
        insert into public.plan_exercises (
          session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds
        )
        values (
          new_session_id,
          (ex->>'exercise_id')::uuid,
          coalesce((ex->>'order_index')::int, 1),
          coalesce((ex->>'sets')::int, 3),
          (ex->>'reps_min')::int,
          (ex->>'reps_max')::int,
          (ex->>'rest_seconds')::int
        );
      end loop;
    end if;
  end loop;

  -- Schedule rows reference sessions by their ordinal in p_sessions so the
  -- caller doesn't have to know the freshly-generated UUIDs.
  if jsonb_array_length(coalesce(p_schedule, '[]'::jsonb)) > 0 then
    for sched in select * from jsonb_array_elements(p_schedule) loop
      session_idx := (sched->>'session_index')::int;
      if session_idx is null or session_idx < 0 or session_idx >= array_length(session_ids, 1) then
        continue;
      end if;
      insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index)
      values (
        p_plan_id,
        sched->>'day_of_week',
        session_ids[session_idx + 1],  -- Postgres arrays are 1-indexed
        coalesce((sched->>'order_index')::int, 0)
      );
    end loop;
  end if;
end;
$$;

grant execute on function public.replace_workout_plan_contents(uuid, jsonb, jsonb, jsonb) to authenticated;
