-- Expand the master exercise library beyond the 27 seeded in
-- supabase/seeds/initial_data.sql. The original seed covered the big
-- compounds and a few isolations but missed staples that show up in
-- nearly every program: lunges, single-arm rows, skullcrushers, side
-- plank, kettlebell swing, and the cardio machines.
--
-- Idempotent: ON CONFLICT (user_id, name) DO NOTHING. Safe to re-run
-- and safe even on databases where a user already added one of these
-- names manually (their row stays).

insert into public.exercises (name, muscle_group, equipment, is_public) values
  -- Chest
  ('Dumbbell Bench Press',     'chest',     'dumbbell',   true),
  ('Cable Fly',                'chest',     'cable',      true),

  -- Back
  ('Dumbbell Row',             'back',      'dumbbell',   true),
  ('T-Bar Row',                'back',      'barbell',    true),

  -- Shoulders
  ('Reverse Fly',              'shoulders', 'dumbbell',   true),
  ('Arnold Press',             'shoulders', 'dumbbell',   true),
  ('Shrugs',                   'shoulders', 'dumbbell',   true),

  -- Triceps
  ('Skullcrusher',             'triceps',   'barbell',    true),
  ('Overhead Tricep Extension','triceps',   'dumbbell',   true),

  -- Biceps
  ('Preacher Curl',            'biceps',    'barbell',    true),
  ('Cable Curl',               'biceps',    'cable',      true),

  -- Legs
  ('Lunges',                   'quads',     'dumbbell',   true),
  ('Bulgarian Split Squat',    'quads',     'dumbbell',   true),
  ('Goblet Squat',             'quads',     'dumbbell',   true),
  ('Glute Bridge',             'glutes',    'bodyweight', true),

  -- Core
  ('Russian Twist',            'core',      'bodyweight', true),
  ('Sit Up',                   'core',      'bodyweight', true),
  ('Mountain Climbers',        'core',      'bodyweight', true),
  ('Side Plank',               'core',      'bodyweight', true),

  -- Conditioning
  ('Kettlebell Swing',         'glutes',    'kettlebell', true),
  ('Farmers Carry',            'core',      'dumbbell',   true),
  ('Burpee',                   'core',      'bodyweight', true),

  -- Cardio
  ('Treadmill',                'cardio',    'machine',    true),
  ('Rowing Machine',           'cardio',    'machine',    true),
  ('Stationary Bike',          'cardio',    'machine',    true),
  ('Jump Rope',                'cardio',    'bodyweight', true)
on conflict (user_id, name) do nothing;
