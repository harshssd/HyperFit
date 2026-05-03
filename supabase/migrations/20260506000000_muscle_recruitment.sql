-- Muscle recruitment model.
--
-- Every exercise so far had a single free-text `muscle_group`, which forces
-- the heatmap to either credit *only* the primary muscle (under-counts
-- compounds) or split volume evenly across N regions (gives Bench Press the
-- same triceps credit as it gives chest, which is wrong). Replace that with
-- an explicit primary/secondary recruitment list per exercise so downstream
-- aggregates can weight properly.
--
-- Canonical muscle id space (text, not enum — easier to iterate):
--   chest, front_delts, side_delts, rear_delts,
--   biceps, triceps, forearms,
--   traps, lats, mid_back, lower_back,
--   abs, obliques,
--   quads, hamstrings, glutes, adductors, calves,
--   cardio
--
-- Effective-set / effective-volume convention:
--   primary muscles count at 1.0
--   secondary muscles count at 0.5 ("half a hard set")
-- This is the same convention Hevy/Fitbod use; keeping it explicit in the
-- view body makes it trivial to retune later without a schema migration.
--
-- The legacy `muscle_volume_view` (per-day, per-muscle_group, even split)
-- stays alive so the existing heatmap keeps rendering until PR 3 rewires
-- the React hook to the new view.

-- 1. Add the new columns. Default to empty array so backfill is the only
--    thing that ever needs to populate them.
alter table public.exercises
  add column if not exists primary_muscles   text[] not null default '{}',
  add column if not exists secondary_muscles text[] not null default '{}';

alter table public.user_exercises
  add column if not exists primary_muscles   text[] not null default '{}',
  add column if not exists secondary_muscles text[] not null default '{}';

create index if not exists exercises_primary_muscles_idx
  on public.exercises using gin (primary_muscles);
create index if not exists user_exercises_primary_muscles_idx
  on public.user_exercises using gin (primary_muscles);

-- 2. Best-effort backfill from the legacy `muscle_group` column. The seed
--    function below overwrites the canonical library rows with curated
--    recruitment data, so this only matters for user_exercises and any
--    exercises that may exist outside the canonical seed.
create or replace function public.muscle_group_to_primary(group_text text)
returns text[]
language sql
immutable
as $$
  select case lower(coalesce(group_text, ''))
    when 'chest'       then array['chest']
    when 'back'        then array['lats']
    when 'lats'        then array['lats']
    when 'shoulders'   then array['side_delts']
    when 'delts'       then array['side_delts']
    when 'biceps'      then array['biceps']
    when 'triceps'     then array['triceps']
    when 'forearms'    then array['forearms']
    when 'traps'       then array['traps']
    when 'core'        then array['abs']
    when 'abs'         then array['abs']
    when 'quads'       then array['quads']
    when 'hamstrings'  then array['hamstrings']
    when 'glutes'      then array['glutes']
    when 'calves'      then array['calves']
    when 'legs'        then array['quads','glutes','hamstrings','calves']
    when 'full-body'   then array['chest','lats','side_delts','quads','glutes']
    when 'cardio'      then array['cardio']
    else array[]::text[]
  end;
$$;

update public.exercises
set primary_muscles = public.muscle_group_to_primary(muscle_group)
where (primary_muscles is null or primary_muscles = '{}')
  and muscle_group is not null;

update public.user_exercises
set primary_muscles = public.muscle_group_to_primary(muscle_group)
where (primary_muscles is null or primary_muscles = '{}')
  and muscle_group is not null;

-- 3. Re-seed the canonical library with proper primary/secondary assignments.
--    Recruitment data was sourced from common biomechanics references
--    (Schoenfeld, Israetel, Stronger By Science) and cross-checked against
--    Hevy's public muscle map. It's bro-science-grade for v1; refine later.
create or replace function public.seed_exercise_library()
returns void
language sql
as $$
  with canonical(name, muscle_group, equipment, primary_muscles, secondary_muscles) as (
    values
      -- Chest
      ('Bench Press',              'chest',     'barbell',    array['chest'],                                  array['front_delts','triceps']),
      ('Incline Dumbbell Press',   'chest',     'dumbbell',   array['chest','front_delts'],                    array['triceps']),
      ('Dumbbell Bench Press',     'chest',     'dumbbell',   array['chest'],                                  array['front_delts','triceps']),
      ('Cable Fly',                'chest',     'cable',      array['chest'],                                  array['front_delts']),
      ('Push Up',                  'chest',     'bodyweight', array['chest'],                                  array['front_delts','triceps','abs']),

      -- Back
      ('Pull Up',                  'back',      'bodyweight', array['lats'],                                   array['biceps','mid_back','rear_delts']),
      ('Barbell Row',              'back',      'barbell',    array['mid_back','lats'],                        array['biceps','lower_back','rear_delts']),
      ('Dumbbell Row',             'back',      'dumbbell',   array['lats','mid_back'],                        array['biceps','rear_delts']),
      ('T-Bar Row',                'back',      'barbell',    array['mid_back','lats'],                        array['biceps','rear_delts']),
      ('Seated Cable Row',         'back',      'cable',      array['mid_back','lats'],                        array['biceps','rear_delts']),
      ('Lat Pulldown',             'back',      'cable',      array['lats'],                                   array['biceps','mid_back']),
      ('Face Pulls',               'back',      'cable',      array['rear_delts'],                             array['traps','mid_back']),
      ('Deadlift',                 'back',      'barbell',    array['lower_back','glutes','hamstrings'],       array['traps','lats','forearms','quads']),

      -- Shoulders
      ('Overhead Press',           'shoulders', 'barbell',    array['front_delts','side_delts'],               array['triceps','traps']),
      ('Dumbbell Shoulder Press',  'shoulders', 'dumbbell',   array['front_delts','side_delts'],               array['triceps']),
      ('Arnold Press',             'shoulders', 'dumbbell',   array['front_delts','side_delts'],               array['triceps']),
      ('Lateral Raises',           'shoulders', 'dumbbell',   array['side_delts'],                             array[]::text[]),
      ('Reverse Fly',              'shoulders', 'dumbbell',   array['rear_delts'],                             array['mid_back']),
      ('Shrugs',                   'shoulders', 'dumbbell',   array['traps'],                                  array['forearms']),

      -- Triceps
      ('Tricep Dips',              'triceps',   'bodyweight', array['triceps'],                                array['chest','front_delts']),
      ('Tricep Pushdown',          'triceps',   'cable',      array['triceps'],                                array[]::text[]),
      ('Skullcrusher',             'triceps',   'barbell',    array['triceps'],                                array[]::text[]),
      ('Overhead Tricep Extension','triceps',   'dumbbell',   array['triceps'],                                array[]::text[]),

      -- Biceps
      ('Bicep Curl',               'biceps',    'barbell',    array['biceps'],                                 array['forearms']),
      ('Hammer Curl',              'biceps',    'dumbbell',   array['biceps','forearms'],                      array[]::text[]),
      ('Preacher Curl',            'biceps',    'barbell',    array['biceps'],                                 array[]::text[]),
      ('Cable Curl',               'biceps',    'cable',      array['biceps'],                                 array['forearms']),

      -- Quads / Legs
      ('Squat',                    'quads',     'barbell',    array['quads','glutes'],                         array['hamstrings','lower_back','abs']),
      ('Leg Press',                'quads',     'machine',    array['quads','glutes'],                         array['hamstrings']),
      ('Leg Extension',            'quads',     'machine',    array['quads'],                                  array[]::text[]),
      ('Lunges',                   'quads',     'dumbbell',   array['quads','glutes'],                         array['hamstrings','adductors']),
      ('Bulgarian Split Squat',    'quads',     'dumbbell',   array['quads','glutes'],                         array['hamstrings','adductors']),
      ('Goblet Squat',             'quads',     'dumbbell',   array['quads','glutes'],                         array['abs']),

      -- Hamstrings
      ('Romanian Deadlift',        'hamstrings','barbell',    array['hamstrings','glutes'],                    array['lower_back']),
      ('Leg Curl',                 'hamstrings','machine',    array['hamstrings'],                             array[]::text[]),

      -- Glutes
      ('Hip Thrust',               'glutes',    'barbell',    array['glutes'],                                 array['hamstrings']),
      ('Glute Bridge',             'glutes',    'bodyweight', array['glutes'],                                 array['hamstrings']),
      ('Kettlebell Swing',         'glutes',    'kettlebell', array['glutes','hamstrings'],                    array['lower_back','traps']),

      -- Calves
      ('Calf Raises',              'calves',    'machine',    array['calves'],                                 array[]::text[]),

      -- Core
      ('Plank',                    'core',      'bodyweight', array['abs'],                                    array['obliques']),
      ('Side Plank',               'core',      'bodyweight', array['obliques'],                               array['abs']),
      ('Hanging Leg Raise',        'core',      'bodyweight', array['abs'],                                    array['forearms','obliques']),
      ('Cable Crunch',             'core',      'cable',      array['abs'],                                    array[]::text[]),
      ('Russian Twist',            'core',      'bodyweight', array['obliques'],                               array['abs']),
      ('Sit Up',                   'core',      'bodyweight', array['abs'],                                    array[]::text[]),
      ('Mountain Climbers',        'core',      'bodyweight', array['abs'],                                    array['front_delts','quads']),
      ('Farmers Carry',            'core',      'dumbbell',   array['forearms','traps'],                       array['abs','glutes']),
      ('Burpee',                   'core',      'bodyweight', array['chest','quads'],                          array['abs','front_delts','triceps']),

      -- Cardio
      ('Treadmill',                'cardio',    'machine',    array['cardio'],                                 array[]::text[]),
      ('Rowing Machine',           'cardio',    'machine',    array['cardio'],                                 array['lats','mid_back','quads']),
      ('Stationary Bike',          'cardio',    'machine',    array['cardio'],                                 array['quads']),
      ('Jump Rope',                'cardio',    'bodyweight', array['cardio'],                                 array['calves'])
  )
  insert into public.exercises (name, muscle_group, equipment, is_public, primary_muscles, secondary_muscles)
  select name, muscle_group, equipment, true, primary_muscles, secondary_muscles
  from canonical
  on conflict (name) do update
    set muscle_group      = excluded.muscle_group,
        equipment         = excluded.equipment,
        primary_muscles   = excluded.primary_muscles,
        secondary_muscles = excluded.secondary_muscles,
        updated_at        = now();
$$;

-- Apply now so existing DBs catch up on next migrate.
select public.seed_exercise_library();

-- 4. New view: per (user, session, muscle) effective volume + effective sets.
--    Primary muscles count at 1.0, secondaries at 0.5. Aggregations
--    downstream (week, month, all-time) just sum across rows.
drop view if exists public.muscle_volume_v2_view;

create view public.muscle_volume_v2_view
  with (security_invoker = on)
  as
with directory as (
  select id, primary_muscles, secondary_muscles from public.exercises
  union all
  select id, primary_muscles, secondary_muscles from public.user_exercises
),
contribs as (
  select
    ws.user_id,
    ws.id           as workout_session_id,
    ws.workout_date,
    st.id           as set_id,
    coalesce(st.weight, 0) * coalesce(st.reps, 0) as raw_volume,
    d.primary_muscles,
    d.secondary_muscles
  from public.workout_sets st
  join public.workout_sessions ws on ws.id = st.session_id
  join directory d                on d.id  = st.exercise_id
  where st.completed = true
    and st.weight is not null
    and st.reps   is not null
),
exploded as (
  select user_id, workout_session_id, workout_date, set_id, raw_volume,
         unnest(coalesce(primary_muscles, '{}'))   as muscle_id,
         1.0::numeric                              as recruitment
  from contribs
  union all
  select user_id, workout_session_id, workout_date, set_id, raw_volume,
         unnest(coalesce(secondary_muscles, '{}')) as muscle_id,
         0.5::numeric                              as recruitment
  from contribs
)
select
  user_id,
  workout_session_id,
  workout_date,
  muscle_id,
  sum(raw_volume * recruitment)::numeric as effective_volume,
  sum(recruitment)::numeric              as effective_sets,
  count(distinct set_id)::int            as raw_set_count
from exploded
where muscle_id is not null
  and muscle_id <> ''
group by user_id, workout_session_id, workout_date, muscle_id;

comment on view public.muscle_volume_v2_view is
  'Per-(user, session, muscle) effective training volume. Primary muscles count at 1.0, secondaries at 0.5. Aggregate over date ranges downstream — do not pre-aggregate by date here.';
