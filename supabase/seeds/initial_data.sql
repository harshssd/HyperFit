-- =============================================================================
-- CLEAN SEED DATA - HyperFit
-- =============================================================================
-- Clean seed data that matches the consolidated schema
-- Includes exercises, session templates, and sample workout plans
-- =============================================================================

-- =============================================================================
-- 1. MASTER EXERCISES
-- =============================================================================

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

-- =============================================================================
-- 2. SESSION TEMPLATES
-- =============================================================================

-- Push Template
INSERT INTO public.session_templates (id, name, description, focus, difficulty, equipment, estimated_duration_minutes, is_public) VALUES
('10000000-0000-0000-0000-000000000100', 'Push Day Template', 'Chest, Shoulders, Triceps focus', 'push', 'intermediate', 'gym', 45, true)
ON CONFLICT (id) DO NOTHING;

-- Pull Template
INSERT INTO public.session_templates (id, name, description, focus, difficulty, equipment, estimated_duration_minutes, is_public) VALUES
('10000000-0000-0000-0000-000000000101', 'Pull Day Template', 'Back, Biceps focus', 'pull', 'intermediate', 'gym', 45, true)
ON CONFLICT (id) DO NOTHING;

-- Legs Template
INSERT INTO public.session_templates (id, name, description, focus, difficulty, equipment, estimated_duration_minutes, is_public) VALUES
('10000000-0000-0000-0000-000000000102', 'Legs Day Template', 'Lower body focus', 'legs', 'intermediate', 'gym', 50, true)
ON CONFLICT (id) DO NOTHING;

-- Full Body Template
INSERT INTO public.session_templates (id, name, description, focus, difficulty, equipment, estimated_duration_minutes, is_public) VALUES
('10000000-0000-0000-0000-000000000103', 'Full Body Template', 'Complete workout hitting all major muscle groups', 'full-body', 'beginner', 'gym', 45, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. TEMPLATE EXERCISES
-- =============================================================================

-- Push Template Exercises
INSERT INTO public.template_exercises (template_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index) VALUES
('10000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 3, 6, 8, 90, 1), -- Bench Press
('10000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000004', 3, 8, 10, 90, 2), -- Overhead Press
('10000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000007', 3, 8, 12, 60, 3), -- Incline DB Press
('10000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000009', 3, 10, 15, 60, 4); -- Tricep Pushdown

-- Pull Template Exercises
INSERT INTO public.template_exercises (template_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index) VALUES
('10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000003', 3, 5, 5, 180, 1), -- Deadlift
('10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000005', 3, 6, 10, 90, 2), -- Pull Up
('10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000006', 3, 8, 12, 90, 3), -- Barbell Row
('10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', 3, 10, 12, 60, 4); -- Bicep Curl

-- Legs Template Exercises
INSERT INTO public.template_exercises (template_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index) VALUES
('10000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', 4, 6, 8, 120, 1), -- Squat
('10000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000011', 3, 10, 15, 90, 2); -- Leg Press

-- Full Body Template Exercises
INSERT INTO public.template_exercises (template_id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index) VALUES
('10000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', 3, 8, 10, 90, 1), -- Squat
('10000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 3, 8, 10, 90, 2), -- Bench Press
('10000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000006', 3, 8, 10, 90, 3); -- Row

-- =============================================================================
-- 4. WORKOUT PLANS
-- =============================================================================

-- PPL 3-Day Foundation Plan
INSERT INTO public.workout_plans (id, name, description, frequency, equipment, duration, difficulty, tags, is_public, category, focus_areas, target_audience, primary_goals) VALUES
('20000000-0000-0000-0000-000000000001', 'PPL 3-Day Foundation', 'Classic Push-Pull-Legs split for building strength and muscle. Perfect for intermediate lifters.', 3, 'gym', 8, 'intermediate', ARRAY['strength', 'hypertrophy', 'intermediate'], true, 'strength', ARRAY['push', 'pull', 'legs'], ARRAY['intermediate'], ARRAY['strength', 'hypertrophy'])
ON CONFLICT (id) DO NOTHING;

-- Full Body Beginner Plan
INSERT INTO public.workout_plans (id, name, description, frequency, equipment, duration, difficulty, tags, is_public, category, focus_areas, target_audience, primary_goals) VALUES
('20000000-0000-0000-0000-000000000002', 'Full Body Foundation', 'Complete workouts hitting every muscle group. Ideal for beginners.', 3, 'gym', 4, 'beginner', ARRAY['general', 'beginner', 'full-body'], true, 'strength', ARRAY['full-body'], ARRAY['beginner'], ARRAY['general_fitness'])
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. PLAN SESSIONS (using templates)
-- =============================================================================

-- PPL Plan Sessions
INSERT INTO public.plan_sessions (id, plan_id, name, description, focus, order_index, template_id) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Push Day', 'Chest, Shoulders, Triceps', 'push', 1, '10000000-0000-0000-0000-000000000100'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Pull Day', 'Back, Biceps', 'pull', 2, '10000000-0000-0000-0000-000000000101'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Legs Day', 'Quads, Hamstrings, Calves', 'legs', 3, '10000000-0000-0000-0000-000000000102')
ON CONFLICT (id) DO NOTHING;

-- Full Body Plan Sessions
INSERT INTO public.plan_sessions (id, plan_id, name, description, focus, order_index, template_id) VALUES
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Full Body Workout', 'Complete muscle group coverage', 'full-body', 1, '10000000-0000-0000-0000-000000000103')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. PLAN SCHEDULE
-- =============================================================================

-- PPL Schedule: Mon (Push), Wed (Pull), Fri (Legs)
INSERT INTO public.plan_schedule (plan_id, session_id, day_of_week, order_index) VALUES
('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'monday', 1),
('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'wednesday', 1),
('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'friday', 1)
ON CONFLICT (id) DO NOTHING;

-- Full Body Schedule: Monday
INSERT INTO public.plan_schedule (plan_id, session_id, day_of_week, order_index) VALUES
('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'monday', 1)
ON CONFLICT (id) DO NOTHING;