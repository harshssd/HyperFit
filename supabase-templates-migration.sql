-- Supabase Migration: Template Management Schema
-- Run this if you only need to provision the workout template tables.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Folder hierarchy for organizing templates
CREATE TABLE IF NOT EXISTS workout_template_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#f97316',
  icon TEXT DEFAULT '📁',
  parent_folder_id UUID REFERENCES workout_template_folders (id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE (user_id, name, parent_folder_id)
);

CREATE INDEX IF NOT EXISTS workout_template_folders_user_id_idx
  ON workout_template_folders (user_id);

ALTER TABLE workout_template_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own folders" ON workout_template_folders;
CREATE POLICY "Users can read own folders"
  ON workout_template_folders
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own folders" ON workout_template_folders;
CREATE POLICY "Users can insert own folders"
  ON workout_template_folders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own folders" ON workout_template_folders;
CREATE POLICY "Users can update own folders"
  ON workout_template_folders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own folders" ON workout_template_folders;
CREATE POLICY "Users can delete own folders"
  ON workout_template_folders
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_workout_template_folders_updated_at ON workout_template_folders;
CREATE TRIGGER update_workout_template_folders_updated_at
  BEFORE UPDATE ON workout_template_folders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Template storage
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '💪',
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_standard BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  created_by_username TEXT,
  folder_id UUID REFERENCES workout_template_folders (id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS workout_templates_user_id_idx
  ON workout_templates (user_id);

CREATE INDEX IF NOT EXISTS workout_templates_folder_id_idx
  ON workout_templates (folder_id);

CREATE INDEX IF NOT EXISTS workout_templates_is_standard_idx
  ON workout_templates (is_standard);

CREATE INDEX IF NOT EXISTS workout_templates_is_public_idx
  ON workout_templates (is_public);

CREATE INDEX IF NOT EXISTS workout_templates_tags_idx
  ON workout_templates
  USING GIN (tags);

CREATE UNIQUE INDEX IF NOT EXISTS workout_templates_standard_name_idx
  ON workout_templates (name)
  WHERE is_standard = TRUE;

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own templates" ON workout_templates;
CREATE POLICY "Users can read own templates"
  ON workout_templates
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE OR is_standard = TRUE);

DROP POLICY IF EXISTS "Users can insert own templates" ON workout_templates;
CREATE POLICY "Users can insert own templates"
  ON workout_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON workout_templates;
CREATE POLICY "Users can update own templates"
  ON workout_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own templates" ON workout_templates;
CREATE POLICY "Users can delete own templates"
  ON workout_templates
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_workout_templates_updated_at ON workout_templates;
CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Favorite relationships
CREATE TABLE IF NOT EXISTS user_template_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES workout_templates (id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE (user_id, template_id)
);

CREATE INDEX IF NOT EXISTS user_template_favorites_user_id_idx
  ON user_template_favorites (user_id);

CREATE INDEX IF NOT EXISTS user_template_favorites_template_id_idx
  ON user_template_favorites (template_id);

ALTER TABLE user_template_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorites" ON user_template_favorites;
CREATE POLICY "Users can read own favorites"
  ON user_template_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON user_template_favorites;
CREATE POLICY "Users can insert own favorites"
  ON user_template_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON user_template_favorites;
CREATE POLICY "Users can delete own favorites"
  ON user_template_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Seed default standard templates (id auto-generated, user_id null)
INSERT INTO workout_templates (name, description, icon, exercises, is_standard, is_public)
VALUES
  ('Push Day', 'Chest, Shoulders & Triceps.', '🔥', '["Bench Press", "Overhead Press", "Incline Dumbbell Press", "Lateral Raises", "Tricep Dips"]'::jsonb, TRUE, TRUE),
  ('Pull Day', 'Back & Biceps.', '🦍', '["Deadlift", "Pull Ups", "Barbell Rows", "Face Pulls", "Bicep Curls"]'::jsonb, TRUE, TRUE),
  ('Leg Day', 'Quads, Hamstrings & Glutes.', '🦕', '["Squats", "Leg Press", "Romanian Deadlift", "Leg Extensions", "Calf Raises"]'::jsonb, TRUE, TRUE),
  ('Core', 'Stability and strength.', '🧱', '["Plank", "Russian Twists", "Leg Raises", "Cable Crunches"]'::jsonb, TRUE, TRUE)
ON CONFLICT DO NOTHING;
