-- Quantity label on nutrition entries.
--
-- Why: kcal/macros alone don't tell the user *how much* they ate ("210 kcal"
-- could be one large or three small whatevers). A free-text quantity label
-- ("3 eggs", "200 g chicken", "8 oz egg whites") gives recents recall value
-- without requiring a units schema or per-unit data.
--
-- Display-only — kcal/macros remain the source of truth for the daily
-- summary. The label is just an aide-mémoire surfaced in the entry row,
-- the meal share card, and the recent-meals chip.

alter table public.nutrition_entries
  add column if not exists quantity_label text;

-- Same length cap as meal_label so a runaway paste doesn't break rendering.
alter table public.nutrition_entries
  add constraint nutrition_entries_quantity_label_length
  check (quantity_label is null or char_length(quantity_label) between 1 and 32);

comment on column public.nutrition_entries.quantity_label is
  'Optional user-supplied portion (e.g. "3 eggs", "200 g"). Display-only;
   kcal/macros stay the truth for daily totals.';
