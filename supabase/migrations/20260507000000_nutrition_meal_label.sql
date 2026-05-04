-- Custom meal labels on nutrition entries.
--
-- Why: meal_slot is a 4-value enum (breakfast/lunch/dinner/snack), but real
-- eating has more granularity — pre-workout, late night, second breakfast.
-- meal_label is a free-text override that lets the UI render a separate
-- "card" per label without exploding the enum or adding a labels table.
--
-- Slot stays NOT NULL — every entry is still bucketed for streak math, the
-- view, and recents-by-slot. Label is purely a UI grouping aid for entries
-- that don't fit cleanly in the four standard slots.

alter table public.nutrition_entries
  add column if not exists meal_label text;

-- Cap label length so a runaway paste doesn't break card rendering.
-- Null is allowed (the common case). Empty strings should be stored as
-- NULL — UI is responsible for trim+nullify before insert.
alter table public.nutrition_entries
  add constraint nutrition_entries_meal_label_length
  check (meal_label is null or char_length(meal_label) between 1 and 32);

-- Index for the "list distinct labels for today" lookup the UI does on each
-- nutrition_days fetch. Partial — full-table scan for null labels is wasted.
create index if not exists nutrition_entries_meal_label_idx
  on public.nutrition_entries (user_id, day_id, meal_label)
  where meal_label is not null;

comment on column public.nutrition_entries.meal_label is
  'Optional user-supplied label (e.g. "Pre-workout", "Late night"). Renders
   as a separate card in the UI; meal_slot still drives streak math + the
   summary view.';
