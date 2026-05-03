-- =============================================================================
-- HyperFit — initial seed
-- =============================================================================
-- Master public exercise list lives in a single canonical Postgres
-- function (see migrations/20260504200000_seed_exercise_library_function.sql).
-- Edit the function body there to add or remove exercises; the seed
-- file just calls it so a fresh DB never diverges from a migrated one.
--
-- Plans and templates are created in-app per user; nothing system-owned
-- needs seeding beyond the exercise library.

select public.seed_exercise_library();
