-- Per-entry ingredient breakdown.
--
-- Why: a meal like "Paneer Butter Masala" is more meaningful as its
-- composition (5 g fennel · 1 tsp butter · 30 g paneer ...) than as a
-- single dish-level kcal estimate. Storing the breakdown lets the entry
-- card render the ingredients, the share card list them, and a future
-- macro-estimation pipeline re-derive totals if/when the model improves.
--
-- Display-only for now — kcal/macros on the row remain the source of truth
-- for daily totals. The macros per ingredient are stored optionally on each
-- ingredient object so the structure is forward-compatible with the
-- estimator (which will write per-ingredient kcal back into the array).

alter table public.nutrition_entries
  add column if not exists ingredients jsonb;

-- Cheap guards: must be a JSON array; cap at 50 ingredients per entry so a
-- runaway paste can't blow up the row size or render path.
alter table public.nutrition_entries
  add constraint nutrition_entries_ingredients_shape
  check (
    ingredients is null
    or (jsonb_typeof(ingredients) = 'array' and jsonb_array_length(ingredients) <= 50)
  );

comment on column public.nutrition_entries.ingredients is
  'Optional per-entry ingredient breakdown. JSONB array of objects:
   [{ quantity_label: "30 g", name: "Paneer",
      kcal?: int, protein_g?: int, carb_g?: int, fat_g?: int, fiber_g?: int }, ...].
   Display + future re-estimation only — entry-level kcal/macros stay the
   source of truth for daily totals.';
