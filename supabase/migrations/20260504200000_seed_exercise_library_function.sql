-- Canonical exercise library, single source of truth.
--
-- Defines public.seed_exercise_library() holding the full master list
-- and immediately calls it. Future expansions edit the function body in
-- a new migration ("create or replace function...") + a single
-- "select public.seed_exercise_library();" to apply. The seed file
-- (supabase/seeds/initial_data.sql) calls the same function on
-- supabase db reset so a fresh DB never diverges from a migrated DB.
--
-- Idempotent end-to-end: the inserts use ON CONFLICT (user_id, name)
-- DO NOTHING so re-running is a no-op. User-added rows
-- (user_id = auth.uid()) are untouched because (NULL, name) does not
-- collide with (uuid, name).

create or replace function public.seed_exercise_library()
returns void
language sql
as $$
  insert into public.exercises (name, muscle_group, equipment, is_public) values
    -- Chest
    ('Bench Press',              'chest',     'barbell',    true),
    ('Incline Dumbbell Press',   'chest',     'dumbbell',   true),
    ('Dumbbell Bench Press',     'chest',     'dumbbell',   true),
    ('Cable Fly',                'chest',     'cable',      true),
    ('Push Up',                  'chest',     'bodyweight', true),

    -- Back
    ('Pull Up',                  'back',      'bodyweight', true),
    ('Barbell Row',              'back',      'barbell',    true),
    ('Dumbbell Row',             'back',      'dumbbell',   true),
    ('T-Bar Row',                'back',      'barbell',    true),
    ('Seated Cable Row',         'back',      'cable',      true),
    ('Lat Pulldown',             'back',      'cable',      true),
    ('Face Pulls',               'back',      'cable',      true),
    ('Deadlift',                 'back',      'barbell',    true),

    -- Shoulders
    ('Overhead Press',           'shoulders', 'barbell',    true),
    ('Dumbbell Shoulder Press',  'shoulders', 'dumbbell',   true),
    ('Arnold Press',             'shoulders', 'dumbbell',   true),
    ('Lateral Raises',           'shoulders', 'dumbbell',   true),
    ('Reverse Fly',              'shoulders', 'dumbbell',   true),
    ('Shrugs',                   'shoulders', 'dumbbell',   true),

    -- Triceps
    ('Tricep Dips',              'triceps',   'bodyweight', true),
    ('Tricep Pushdown',          'triceps',   'cable',      true),
    ('Skullcrusher',             'triceps',   'barbell',    true),
    ('Overhead Tricep Extension','triceps',   'dumbbell',   true),

    -- Biceps
    ('Bicep Curl',               'biceps',    'barbell',    true),
    ('Hammer Curl',              'biceps',    'dumbbell',   true),
    ('Preacher Curl',            'biceps',    'barbell',    true),
    ('Cable Curl',               'biceps',    'cable',      true),

    -- Quads / Legs
    ('Squat',                    'quads',     'barbell',    true),
    ('Leg Press',                'quads',     'machine',    true),
    ('Leg Extension',            'quads',     'machine',    true),
    ('Lunges',                   'quads',     'dumbbell',   true),
    ('Bulgarian Split Squat',    'quads',     'dumbbell',   true),
    ('Goblet Squat',             'quads',     'dumbbell',   true),

    -- Hamstrings
    ('Romanian Deadlift',        'hamstrings','barbell',    true),
    ('Leg Curl',                 'hamstrings','machine',    true),

    -- Glutes
    ('Hip Thrust',               'glutes',    'barbell',    true),
    ('Glute Bridge',             'glutes',    'bodyweight', true),
    ('Kettlebell Swing',         'glutes',    'kettlebell', true),

    -- Calves
    ('Calf Raises',              'calves',    'machine',    true),

    -- Core
    ('Plank',                    'core',      'bodyweight', true),
    ('Side Plank',               'core',      'bodyweight', true),
    ('Hanging Leg Raise',        'core',      'bodyweight', true),
    ('Cable Crunch',             'core',      'cable',      true),
    ('Russian Twist',            'core',      'bodyweight', true),
    ('Sit Up',                   'core',      'bodyweight', true),
    ('Mountain Climbers',        'core',      'bodyweight', true),
    ('Farmers Carry',            'core',      'dumbbell',   true),
    ('Burpee',                   'core',      'bodyweight', true),

    -- Cardio
    ('Treadmill',                'cardio',    'machine',    true),
    ('Rowing Machine',           'cardio',    'machine',    true),
    ('Stationary Bike',          'cardio',    'machine',    true),
    ('Jump Rope',                'cardio',    'bodyweight', true)
  on conflict (user_id, name) do nothing;
$$;

-- Apply now so existing DBs catch up on next migrate.
select public.seed_exercise_library();
