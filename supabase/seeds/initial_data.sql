-- =============================================================================
-- HyperFit — initial seed
-- =============================================================================
-- Master public exercise list that every signed-in user can pick from.
-- Plans and templates are created in-app per user; nothing system-owned here.

insert into public.exercises (name, muscle_group, equipment, is_public) values
  ('Bench Press',            'chest',     'barbell',    true),
  ('Incline Dumbbell Press', 'chest',     'dumbbell',   true),
  ('Push Up',                'chest',     'bodyweight', true),
  ('Tricep Dips',            'triceps',   'bodyweight', true),
  ('Tricep Pushdown',        'triceps',   'cable',      true),
  ('Overhead Press',         'shoulders', 'barbell',    true),
  ('Dumbbell Shoulder Press','shoulders', 'dumbbell',   true),
  ('Lateral Raises',         'shoulders', 'dumbbell',   true),

  ('Pull Up',                'back',      'bodyweight', true),
  ('Barbell Row',            'back',      'barbell',    true),
  ('Seated Cable Row',       'back',      'cable',      true),
  ('Lat Pulldown',           'back',      'cable',      true),
  ('Face Pulls',             'back',      'cable',      true),
  ('Deadlift',               'back',      'barbell',    true),
  ('Romanian Deadlift',      'hamstrings','barbell',    true),

  ('Bicep Curl',             'biceps',    'barbell',    true),
  ('Hammer Curl',            'biceps',    'dumbbell',   true),

  ('Squat',                  'quads',     'barbell',    true),
  ('Leg Press',              'quads',     'machine',    true),
  ('Leg Extension',          'quads',     'machine',    true),
  ('Leg Curl',               'hamstrings','machine',    true),
  ('Calf Raises',            'calves',    'machine',    true),
  ('Hip Thrust',             'glutes',    'barbell',    true),

  ('Plank',                  'core',      'bodyweight', true),
  ('Hanging Leg Raise',      'core',      'bodyweight', true),
  ('Cable Crunch',           'core',      'cable',      true),

  -- Expanded library (mirrored in
  -- migrations/20260504100000_expand_exercise_library.sql so existing
  -- DBs pick these up on next migrate).
  ('Dumbbell Bench Press',     'chest',     'dumbbell',   true),
  ('Cable Fly',                'chest',     'cable',      true),
  ('Dumbbell Row',             'back',      'dumbbell',   true),
  ('T-Bar Row',                'back',      'barbell',    true),
  ('Reverse Fly',              'shoulders', 'dumbbell',   true),
  ('Arnold Press',             'shoulders', 'dumbbell',   true),
  ('Shrugs',                   'shoulders', 'dumbbell',   true),
  ('Skullcrusher',             'triceps',   'barbell',    true),
  ('Overhead Tricep Extension','triceps',   'dumbbell',   true),
  ('Preacher Curl',            'biceps',    'barbell',    true),
  ('Cable Curl',               'biceps',    'cable',      true),
  ('Lunges',                   'quads',     'dumbbell',   true),
  ('Bulgarian Split Squat',    'quads',     'dumbbell',   true),
  ('Goblet Squat',             'quads',     'dumbbell',   true),
  ('Glute Bridge',             'glutes',    'bodyweight', true),
  ('Russian Twist',            'core',      'bodyweight', true),
  ('Sit Up',                   'core',      'bodyweight', true),
  ('Mountain Climbers',        'core',      'bodyweight', true),
  ('Side Plank',               'core',      'bodyweight', true),
  ('Kettlebell Swing',         'glutes',    'kettlebell', true),
  ('Farmers Carry',            'core',      'dumbbell',   true),
  ('Burpee',                   'core',      'bodyweight', true),
  ('Treadmill',                'cardio',    'machine',    true),
  ('Rowing Machine',           'cardio',    'machine',    true),
  ('Stationary Bike',          'cardio',    'machine',    true),
  ('Jump Rope',                'cardio',    'bodyweight', true)
on conflict (user_id, name) do nothing;
