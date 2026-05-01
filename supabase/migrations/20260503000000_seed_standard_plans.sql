-- =============================================================================
-- Seed 4 standard plans (system-owned, public, user_id = null).
--
-- These show up in Browse / Change Plan for every signed-in user via the
-- existing `is_public = true` predicate on the workout_plans RLS policy.
-- Idempotent: re-running this migration is a no-op.
-- =============================================================================

create or replace function public._seed_ex_id(p_name text) returns uuid as $$
  declare r uuid;
  begin
    select id into r from public.exercises where name = p_name limit 1;
    if r is null then
      raise exception 'seed: exercise % not found in public.exercises', p_name;
    end if;
    return r;
  end;
$$ language plpgsql;

do $$
declare
  plan_full_body uuid;
  plan_upper_lower uuid;
  plan_ppl3 uuid;
  plan_ppl6 uuid;
  s_full uuid;
  s_upper uuid;
  s_lower uuid;
  s_push uuid;
  s_pull uuid;
  s_legs uuid;
  s_push6 uuid;
  s_pull6 uuid;
  s_legs6 uuid;
begin
  -- Already seeded? Skip. Detection: any public, system-owned plan exists.
  if exists (
    select 1 from public.workout_plans
    where user_id is null and is_public = true
  ) then
    return;
  end if;

  -- ---------------------------------------------------------------------------
  -- 1) Full Body (3-Day) — beginner. One session, M/W/F.
  -- ---------------------------------------------------------------------------
  insert into public.workout_plans (user_id, name, description, frequency,
    equipment, duration, difficulty, tags, is_public)
  values (null,
    'Full Body (3-Day)',
    'Three full-body sessions a week hitting every major muscle group with the big compound lifts. The simplest path for a beginner.',
    3, 'gym', '8', 'beginner',
    array['full-body','beginner','compound'], true)
  returning id into plan_full_body;

  insert into public.plan_sessions (plan_id, name, focus, order_index)
  values (plan_full_body, 'Full Body Day', 'full-body', 1)
  returning id into s_full;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds) values
    (s_full, public._seed_ex_id('Squat'),             1, 4, 6,  8,  120),
    (s_full, public._seed_ex_id('Bench Press'),       2, 4, 6,  8,  120),
    (s_full, public._seed_ex_id('Barbell Row'),       3, 4, 6,  8,  120),
    (s_full, public._seed_ex_id('Overhead Press'),    4, 3, 8,  10, 90),
    (s_full, public._seed_ex_id('Romanian Deadlift'), 5, 3, 8,  10, 90);

  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index) values
    (plan_full_body, 'monday',    s_full, 0),
    (plan_full_body, 'wednesday', s_full, 0),
    (plan_full_body, 'friday',    s_full, 0);

  -- ---------------------------------------------------------------------------
  -- 2) Upper / Lower (4-Day) — intermediate. Upper M/Th, Lower Tu/F.
  -- ---------------------------------------------------------------------------
  insert into public.workout_plans (user_id, name, description, frequency,
    equipment, duration, difficulty, tags, is_public)
  values (null,
    'Upper / Lower (4-Day)',
    'Four sessions a week split between upper-body and lower-body days. More volume per muscle than full-body, easier to recover from than PPL.',
    4, 'gym', '8', 'intermediate',
    array['upper-lower','intermediate'], true)
  returning id into plan_upper_lower;

  insert into public.plan_sessions (plan_id, name, focus, order_index)
  values (plan_upper_lower, 'Upper', 'upper', 1) returning id into s_upper;
  insert into public.plan_sessions (plan_id, name, focus, order_index)
  values (plan_upper_lower, 'Lower', 'lower', 2) returning id into s_lower;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds) values
    (s_upper, public._seed_ex_id('Bench Press'),       1, 4, 6,  8,  120),
    (s_upper, public._seed_ex_id('Barbell Row'),       2, 4, 6,  8,  120),
    (s_upper, public._seed_ex_id('Overhead Press'),    3, 3, 8,  10, 90),
    (s_upper, public._seed_ex_id('Lat Pulldown'),      4, 3, 10, 12, 75),
    (s_upper, public._seed_ex_id('Bicep Curl'),        5, 3, 10, 12, 60),
    (s_upper, public._seed_ex_id('Tricep Pushdown'),   6, 3, 10, 12, 60);

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds) values
    (s_lower, public._seed_ex_id('Squat'),             1, 4, 6,  8,  150),
    (s_lower, public._seed_ex_id('Romanian Deadlift'), 2, 4, 6,  8,  120),
    (s_lower, public._seed_ex_id('Leg Press'),         3, 3, 10, 12, 90),
    (s_lower, public._seed_ex_id('Leg Curl'),          4, 3, 10, 12, 75),
    (s_lower, public._seed_ex_id('Calf Raises'),       5, 4, 12, 15, 60);

  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index) values
    (plan_upper_lower, 'monday',    s_upper, 0),
    (plan_upper_lower, 'tuesday',   s_lower, 0),
    (plan_upper_lower, 'thursday',  s_upper, 0),
    (plan_upper_lower, 'friday',    s_lower, 0);

  -- ---------------------------------------------------------------------------
  -- 3) Push / Pull / Legs (3-Day) — intermediate. M/W/F.
  -- ---------------------------------------------------------------------------
  insert into public.workout_plans (user_id, name, description, frequency,
    equipment, duration, difficulty, tags, is_public)
  values (null,
    'Push / Pull / Legs (3-Day)',
    'Three movement-pattern days a week: pushing, pulling, and legs. Classic split, manageable schedule.',
    3, 'gym', '8', 'intermediate',
    array['ppl','intermediate'], true)
  returning id into plan_ppl3;

  insert into public.plan_sessions (plan_id, name, focus, order_index)
  values (plan_ppl3, 'Push', 'push', 1) returning id into s_push;
  insert into public.plan_sessions (plan_id, name, focus, order_index)
  values (plan_ppl3, 'Pull', 'pull', 2) returning id into s_pull;
  insert into public.plan_sessions (plan_id, name, focus, order_index)
  values (plan_ppl3, 'Legs', 'legs', 3) returning id into s_legs;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds) values
    (s_push, public._seed_ex_id('Bench Press'),            1, 4, 6,  8,  120),
    (s_push, public._seed_ex_id('Overhead Press'),         2, 4, 8,  10, 90),
    (s_push, public._seed_ex_id('Incline Dumbbell Press'), 3, 3, 10, 12, 75),
    (s_push, public._seed_ex_id('Lateral Raises'),         4, 3, 12, 15, 60),
    (s_push, public._seed_ex_id('Tricep Pushdown'),        5, 3, 10, 12, 60);

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds) values
    (s_pull, public._seed_ex_id('Pull Up'),          1, 4, 6,  10, 120),
    (s_pull, public._seed_ex_id('Barbell Row'),      2, 4, 6,  8,  120),
    (s_pull, public._seed_ex_id('Seated Cable Row'), 3, 3, 10, 12, 75),
    (s_pull, public._seed_ex_id('Face Pulls'),       4, 3, 12, 15, 60),
    (s_pull, public._seed_ex_id('Bicep Curl'),       5, 3, 10, 12, 60);

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds) values
    (s_legs, public._seed_ex_id('Squat'),             1, 4, 6,  8,  150),
    (s_legs, public._seed_ex_id('Romanian Deadlift'), 2, 4, 6,  8,  120),
    (s_legs, public._seed_ex_id('Leg Press'),         3, 3, 10, 12, 90),
    (s_legs, public._seed_ex_id('Leg Curl'),          4, 3, 10, 12, 75),
    (s_legs, public._seed_ex_id('Calf Raises'),       5, 4, 12, 15, 60);

  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index) values
    (plan_ppl3, 'monday',    s_push, 0),
    (plan_ppl3, 'wednesday', s_pull, 0),
    (plan_ppl3, 'friday',    s_legs, 0);

  -- ---------------------------------------------------------------------------
  -- 4) Push / Pull / Legs (6-Day) — advanced. M/Tu/W + F/Sa/Su, Th rest.
  -- Same exercises as PPL-3 but a separate plan so each is self-contained.
  -- ---------------------------------------------------------------------------
  insert into public.workout_plans (user_id, name, description, frequency,
    equipment, duration, difficulty, tags, is_public)
  values (null,
    'Push / Pull / Legs (6-Day)',
    'Six sessions a week, hitting each pattern twice. High frequency and high volume — for advanced lifters with time and recovery.',
    6, 'gym', '8', 'advanced',
    array['ppl','advanced','high-volume'], true)
  returning id into plan_ppl6;

  insert into public.plan_sessions (plan_id, name, focus, order_index)
  values (plan_ppl6, 'Push', 'push', 1) returning id into s_push6;
  insert into public.plan_sessions (plan_id, name, focus, order_index)
  values (plan_ppl6, 'Pull', 'pull', 2) returning id into s_pull6;
  insert into public.plan_sessions (plan_id, name, focus, order_index)
  values (plan_ppl6, 'Legs', 'legs', 3) returning id into s_legs6;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds) values
    (s_push6, public._seed_ex_id('Bench Press'),            1, 4, 6,  8,  120),
    (s_push6, public._seed_ex_id('Overhead Press'),         2, 4, 8,  10, 90),
    (s_push6, public._seed_ex_id('Incline Dumbbell Press'), 3, 3, 10, 12, 75),
    (s_push6, public._seed_ex_id('Lateral Raises'),         4, 3, 12, 15, 60),
    (s_push6, public._seed_ex_id('Tricep Pushdown'),        5, 3, 10, 12, 60);

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds) values
    (s_pull6, public._seed_ex_id('Pull Up'),          1, 4, 6,  10, 120),
    (s_pull6, public._seed_ex_id('Barbell Row'),      2, 4, 6,  8,  120),
    (s_pull6, public._seed_ex_id('Seated Cable Row'), 3, 3, 10, 12, 75),
    (s_pull6, public._seed_ex_id('Face Pulls'),       4, 3, 12, 15, 60),
    (s_pull6, public._seed_ex_id('Bicep Curl'),       5, 3, 10, 12, 60);

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds) values
    (s_legs6, public._seed_ex_id('Squat'),             1, 4, 6,  8,  150),
    (s_legs6, public._seed_ex_id('Romanian Deadlift'), 2, 4, 6,  8,  120),
    (s_legs6, public._seed_ex_id('Leg Press'),         3, 3, 10, 12, 90),
    (s_legs6, public._seed_ex_id('Leg Curl'),          4, 3, 10, 12, 75),
    (s_legs6, public._seed_ex_id('Calf Raises'),       5, 4, 12, 15, 60);

  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index) values
    (plan_ppl6, 'monday',    s_push6, 0),
    (plan_ppl6, 'tuesday',   s_pull6, 0),
    (plan_ppl6, 'wednesday', s_legs6, 0),
    (plan_ppl6, 'friday',    s_push6, 0),
    (plan_ppl6, 'saturday',  s_pull6, 0),
    (plan_ppl6, 'sunday',    s_legs6, 0);
end $$;

drop function public._seed_ex_id(text);
