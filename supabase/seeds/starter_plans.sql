-- =============================================================================
-- HyperFit — starter plans seed
-- =============================================================================
--
-- Seeds 4 starter plans owned by user_id IS NULL (system plans), all
-- pre-approved (review_status = 'approved', is_public = true) so they
-- show up in the public library on first app open.
--
-- Idempotent: re-running is a no-op for plans whose name already exists
-- with user_id IS NULL. To rebuild, delete the named rows first.
--
-- Depends on:
--   - 20260430000000_initial_schema.sql (tables, exercises seed)
--   - 20260501000000_plan_moderation.sql (review_status column)
--   - supabase/seeds/initial_data.sql (master exercises by name)
-- =============================================================================

-- Helper: build one plan with sessions, exercises, and schedule.
-- Used as an inline DO block per plan below (PG functions can't be created
-- ad-hoc inside a seed without polluting the schema, so we inline).

-- ---- 1. Push Pull Legs (3-Day Split) -----------------------------------------
do $$
declare
  v_plan_id uuid;
  v_push_id uuid;
  v_pull_id uuid;
  v_legs_id uuid;
begin
  if exists (select 1 from public.workout_plans
             where user_id is null and name = 'Push / Pull / Legs (3-Day)') then
    return;
  end if;

  insert into public.workout_plans
    (user_id, name, description, frequency, equipment, duration, difficulty,
     tags, is_public, review_status, reviewed_at)
  values
    (null, 'Push / Pull / Legs (3-Day)',
     'Classic 3-day split hitting each muscle group once a week. Upper-body push on day 1, pull on day 2, legs on day 3.',
     3, 'gym', '8', 'intermediate',
     array['hypertrophy','split','intermediate'], true, 'approved', now())
  returning id into v_plan_id;

  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Push Day', 'Chest, shoulders, triceps', 'push', 1)
  returning id into v_push_id;
  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Pull Day', 'Back, rear delts, biceps', 'pull', 2)
  returning id into v_pull_id;
  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Leg Day', 'Quads, hamstrings, glutes, calves', 'legs', 3)
  returning id into v_legs_id;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_push_id, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Bench Press', 1, 4, 6, 8, 120),
    ('Overhead Press', 2, 3, 6, 8, 120),
    ('Incline Dumbbell Press', 3, 3, 8, 12, 90),
    ('Lateral Raises', 4, 3, 12, 15, 60),
    ('Tricep Pushdown', 5, 3, 10, 12, 60),
    ('Tricep Dips', 6, 3, 8, 12, 90)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_pull_id, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Deadlift', 1, 3, 5, 6, 180),
    ('Pull Up', 2, 4, 6, 10, 120),
    ('Barbell Row', 3, 3, 8, 10, 90),
    ('Lat Pulldown', 4, 3, 10, 12, 90),
    ('Face Pulls', 5, 3, 12, 15, 60),
    ('Bicep Curl', 6, 3, 10, 12, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_legs_id, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Squat', 1, 4, 6, 8, 180),
    ('Romanian Deadlift', 2, 3, 8, 10, 120),
    ('Leg Press', 3, 3, 10, 12, 90),
    ('Leg Curl', 4, 3, 10, 12, 60),
    ('Calf Raises', 5, 4, 12, 15, 60),
    ('Plank', 6, 3, 30, 60, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index) values
    (v_plan_id, 'monday',    v_push_id, 0),
    (v_plan_id, 'wednesday', v_pull_id, 0),
    (v_plan_id, 'friday',    v_legs_id, 0);
end $$;

-- ---- 2. Upper / Lower (4-Day Split) -----------------------------------------
do $$
declare
  v_plan_id uuid;
  v_ua_id uuid;
  v_la_id uuid;
  v_ub_id uuid;
  v_lb_id uuid;
begin
  if exists (select 1 from public.workout_plans
             where user_id is null and name = 'Upper / Lower (4-Day)') then
    return;
  end if;

  insert into public.workout_plans
    (user_id, name, description, frequency, equipment, duration, difficulty,
     tags, is_public, review_status, reviewed_at)
  values
    (null, 'Upper / Lower (4-Day)',
     'Four-day split alternating upper and lower body. Each body region is trained twice per week with two distinct sessions for variation.',
     4, 'gym', '8', 'intermediate',
     array['strength','hypertrophy','split','intermediate'], true, 'approved', now())
  returning id into v_plan_id;

  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Upper A', 'Heavy compound focus', 'upper', 1) returning id into v_ua_id;
  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Lower A', 'Squat-dominant', 'lower', 2) returning id into v_la_id;
  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Upper B', 'Hypertrophy focus', 'upper', 3) returning id into v_ub_id;
  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Lower B', 'Hinge-dominant', 'lower', 4) returning id into v_lb_id;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_ua_id, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Bench Press', 1, 4, 5, 6, 180),
    ('Barbell Row', 2, 4, 6, 8, 120),
    ('Overhead Press', 3, 3, 6, 8, 120),
    ('Pull Up', 4, 3, 6, 10, 90),
    ('Bicep Curl', 5, 3, 8, 10, 60),
    ('Tricep Pushdown', 6, 3, 10, 12, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_la_id, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Squat', 1, 4, 5, 6, 180),
    ('Romanian Deadlift', 2, 3, 8, 10, 120),
    ('Leg Press', 3, 3, 8, 12, 90),
    ('Leg Curl', 4, 3, 10, 12, 60),
    ('Calf Raises', 5, 4, 12, 15, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_ub_id, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Incline Dumbbell Press', 1, 4, 8, 10, 90),
    ('Lat Pulldown', 2, 4, 10, 12, 90),
    ('Dumbbell Shoulder Press', 3, 3, 8, 10, 90),
    ('Seated Cable Row', 4, 3, 10, 12, 60),
    ('Hammer Curl', 5, 3, 10, 12, 60),
    ('Tricep Dips', 6, 3, 8, 12, 90)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_lb_id, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Deadlift', 1, 3, 4, 5, 240),
    ('Hip Thrust', 2, 3, 8, 10, 120),
    ('Leg Extension', 3, 3, 12, 15, 60),
    ('Leg Curl', 4, 3, 12, 15, 60),
    ('Plank', 5, 3, 30, 60, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index) values
    (v_plan_id, 'monday',    v_ua_id, 0),
    (v_plan_id, 'tuesday',   v_la_id, 0),
    (v_plan_id, 'thursday',  v_ub_id, 0),
    (v_plan_id, 'friday',    v_lb_id, 0);
end $$;

-- ---- 3. Full Body (3-Day) ---------------------------------------------------
do $$
declare
  v_plan_id uuid;
  v_a uuid; v_b uuid; v_c uuid;
begin
  if exists (select 1 from public.workout_plans
             where user_id is null and name = 'Full Body (3-Day)') then
    return;
  end if;

  insert into public.workout_plans
    (user_id, name, description, frequency, equipment, duration, difficulty,
     tags, is_public, review_status, reviewed_at)
  values
    (null, 'Full Body (3-Day)',
     'Beginner-friendly full-body routine. Three workouts per week, each hitting every major muscle group with the big compound lifts.',
     3, 'gym', '8', 'beginner',
     array['beginner','full-body','strength'], true, 'approved', now())
  returning id into v_plan_id;

  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Day A', 'Squat focus', 'full-body', 1) returning id into v_a;
  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Day B', 'Deadlift focus', 'full-body', 2) returning id into v_b;
  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Day C', 'Press focus', 'full-body', 3) returning id into v_c;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_a, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Squat', 1, 3, 5, 8, 180),
    ('Bench Press', 2, 3, 5, 8, 150),
    ('Barbell Row', 3, 3, 6, 10, 120),
    ('Plank', 4, 3, 30, 60, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_b, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Deadlift', 1, 3, 5, 6, 180),
    ('Overhead Press', 2, 3, 5, 8, 150),
    ('Lat Pulldown', 3, 3, 8, 12, 90),
    ('Hanging Leg Raise', 4, 3, 8, 12, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_c, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Leg Press', 1, 3, 8, 12, 120),
    ('Incline Dumbbell Press', 2, 3, 8, 12, 90),
    ('Seated Cable Row', 3, 3, 8, 12, 90),
    ('Bicep Curl', 4, 2, 10, 12, 60),
    ('Tricep Pushdown', 5, 2, 10, 12, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index) values
    (v_plan_id, 'monday',    v_a, 0),
    (v_plan_id, 'wednesday', v_b, 0),
    (v_plan_id, 'friday',    v_c, 0);
end $$;

-- ---- 4. Bodyweight Basics (3-Day) -------------------------------------------
do $$
declare
  v_plan_id uuid;
  v_a uuid; v_b uuid; v_c uuid;
begin
  if exists (select 1 from public.workout_plans
             where user_id is null and name = 'Bodyweight Basics (3-Day)') then
    return;
  end if;

  insert into public.workout_plans
    (user_id, name, description, frequency, equipment, duration, difficulty,
     tags, is_public, review_status, reviewed_at)
  values
    (null, 'Bodyweight Basics (3-Day)',
     'No equipment, no excuses. A simple full-body bodyweight routine for travel weeks or anyone starting out without a gym.',
     3, 'bodyweight', '4', 'beginner',
     array['beginner','bodyweight','no-equipment'], true, 'approved', now())
  returning id into v_plan_id;

  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Day A', 'Push focus', 'full-body', 1) returning id into v_a;
  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Day B', 'Pull focus', 'full-body', 2) returning id into v_b;
  insert into public.plan_sessions (plan_id, name, description, focus, order_index)
  values (v_plan_id, 'Day C', 'Core focus', 'full-body', 3) returning id into v_c;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_a, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Push Up', 1, 4, 8, 15, 90),
    ('Tricep Dips', 2, 3, 8, 12, 90),
    ('Plank', 3, 3, 30, 60, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_b, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Pull Up', 1, 4, 5, 10, 120),
    ('Push Up', 2, 3, 8, 15, 90),
    ('Hanging Leg Raise', 3, 3, 6, 12, 60)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_exercises (session_id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds)
  select v_c, e.id, t.ord, t.sets, t.rmin, t.rmax, t.rest
  from (values
    ('Plank', 1, 4, 30, 60, 60),
    ('Hanging Leg Raise', 2, 3, 8, 12, 60),
    ('Push Up', 3, 3, 8, 15, 90)
  ) as t(name, ord, sets, rmin, rmax, rest)
  join public.exercises e on e.name = t.name;

  insert into public.plan_schedule (plan_id, day_of_week, session_id, order_index) values
    (v_plan_id, 'monday',    v_a, 0),
    (v_plan_id, 'wednesday', v_b, 0),
    (v_plan_id, 'friday',    v_c, 0);
end $$;
