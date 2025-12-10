-- Seed Data for HyperFit
-- Includes Master Exercises and Standard Workout Plans (PPL, Full Body)

-- 1. Insert Master Exercises
-- We use a CTE or temporary variables to capture IDs, but plain SQL is safer for raw seeds.
-- For UUIDs, we'll generate specific ones so we can reference them in plans.

-- Exercise UUIDs (Generated for consistency)
-- Bench Press: 00000000-0000-0000-0000-000000000001
-- Squat:       00000000-0000-0000-0000-000000000002
-- Deadlift:    00000000-0000-0000-0000-000000000003
-- Overhead:    00000000-0000-0000-0000-000000000004
-- Pull Up:     00000000-0000-0000-0000-000000000005
-- Row:         00000000-0000-0000-0000-000000000006

INSERT INTO public.exercises (id, name, muscle_group, equipment, is_public) VALUES
('00000000-0000-0000-0000-000000000001', 'Bench Press', 'chest', 'barbell', true),
('00000000-0000-0000-0000-000000000002', 'Squat', 'legs', 'barbell', true),
('00000000-0000-0000-0000-000000000003', 'Deadlift', 'back', 'barbell', true),
('00000000-0000-0000-0000-000000000004', 'Overhead Press', 'shoulders', 'barbell', true),
('00000000-0000-0000-0000-000000000005', 'Pull Up', 'back', 'bodyweight', true),
('00000000-0000-0000-0000-000000000006', 'Barbell Row', 'back', 'barbell', true),
('00000000-0000-0000-0000-000000000007', 'Incline Dumbbell Press', 'chest', 'dumbbell', true),
('00000000-0000-0000-0000-000000000008', 'Lateral Raise', 'shoulders', 'dumbbell', true),
('00000000-0000-0000-0000-000000000009', 'Tricep Pushdown', 'triceps', 'cable', true),
('00000000-0000-0000-0000-000000000010', 'Bicep Curl', 'biceps', 'barbell', true),
('00000000-0000-0000-0000-000000000011', 'Leg Press', 'legs', 'machine', true),
('00000000-0000-0000-0000-000000000012', 'Plank', 'core', 'bodyweight', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Standard Plans

-- PLAN 1: Push Pull Legs (3 Day)
-- ID: 10000000-0000-0000-0000-000000000001
INSERT INTO public.workout_plans (id, name, description, frequency, equipment, duration, difficulty, tags, is_public) VALUES
('10000000-0000-0000-0000-000000000001', 'Push Pull Legs', 'Classic 3-day split for strength and hypertrophy.', 3, 'gym', 8, 'intermediate', ARRAY['strength', 'hypertrophy'], true)
ON CONFLICT (id) DO NOTHING;

-- PLAN 2: Full Body General
-- ID: 10000000-0000-0000-0000-000000000002
INSERT INTO public.workout_plans (id, name, description, frequency, equipment, duration, difficulty, tags, is_public) VALUES
('10000000-0000-0000-0000-000000000002', 'Full Body General', 'Great for beginners. Hits every muscle group.', 3, 'gym', 4, 'beginner', ARRAY['general', 'beginner'], true)
ON CONFLICT (id) DO NOTHING;


-- 3. Insert Plan Sessions

-- PPL: Push Day (Session ID: 2000...01)
INSERT INTO public.plan_sessions (id, plan_id, name, description, focus, order_index) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Push Day', 'Chest, Shoulders, Triceps', 'push', 1)
ON CONFLICT (id) DO NOTHING;

-- PPL: Pull Day (Session ID: 2000...02)
INSERT INTO public.plan_sessions (id, plan_id, name, description, focus, order_index) VALUES
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Pull Day', 'Back, Biceps', 'pull', 2)
ON CONFLICT (id) DO NOTHING;

-- PPL: Legs Day (Session ID: 2000...03)
INSERT INTO public.plan_sessions (id, plan_id, name, description, focus, order_index) VALUES
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Legs Day', 'Quads, Hams, Calves', 'legs', 3)
ON CONFLICT (id) DO NOTHING;

-- Full Body: Workout A (Session ID: 2000...04)
INSERT INTO public.plan_sessions (id, plan_id, name, description, focus, order_index) VALUES
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Full Body A', 'Compound Focus', 'full-body', 1)
ON CONFLICT (id) DO NOTHING;


-- 4. Insert Plan Exercises (Linking Sessions to Master Exercises)

-- Push Day Exercises
INSERT INTO public.plan_exercises (session_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 3, 6, 8, 90, 1), -- Bench Press
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 3, 8, 10, 90, 2), -- Overhead Press
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 3, 8, 12, 60, 3), -- Incline DB Press
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009', 3, 10, 15, 60, 4); -- Tricep Pushdown

-- Pull Day Exercises
INSERT INTO public.plan_exercises (session_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index) VALUES
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 3, 5, 5, 180, 1), -- Deadlift
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 3, 6, 10, 90, 2), -- Pull Up
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 3, 8, 12, 90, 3), -- Barbell Row
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', 3, 10, 12, 60, 4); -- Bicep Curl

-- Legs Day Exercises
INSERT INTO public.plan_exercises (session_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index) VALUES
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 4, 6, 8, 120, 1), -- Squat
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', 3, 10, 15, 90, 2); -- Leg Press

-- Full Body A Exercises
INSERT INTO public.plan_exercises (session_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index) VALUES
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 3, 8, 10, 90, 1), -- Squat
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 3, 8, 10, 90, 2), -- Bench Press
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', 3, 8, 10, 90, 3); -- Row


-- 5. Plan Schedule (Mapping)

-- PPL Schedule
-- Mon: Push, Wed: Pull, Fri: Legs
INSERT INTO public.plan_schedule (plan_id, session_id, day_of_week) VALUES
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'monday'),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'wednesday'),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'friday');

-- Full Body Schedule
-- Mon: Full Body A
INSERT INTO public.plan_schedule (plan_id, session_id, day_of_week) VALUES
('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'monday');


