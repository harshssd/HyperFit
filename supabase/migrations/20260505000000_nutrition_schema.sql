-- Nutrition tab v1 schema. Mirrors the workout-side split:
--
--   * user_nutrition_settings  — per-user goals (singleton).
--   * nutrition_days           — per-user-per-date parent row (cheat flag,
--                                optional per-day target overrides, note).
--   * nutrition_entries        — meal entries, FK to nutrition_days.
--   * water_logs               — one row per tap (250ml cup, 500ml bottle,
--                                or custom). Separate from food because the
--                                input pattern is fundamentally different.
--   * nutrition_day_summary_view — folds entries+water into one row per day
--                                  with totals and status. History should
--                                  read this view, never re-aggregate in JS.
--
-- All volumes are stored in ml. Display unit (ml | oz) is a per-user pref
-- on user_nutrition_settings — the DB never sees oz.
--
-- RLS: every row scopes by user_id = auth.uid(). No public read.

-- 1. user_nutrition_settings -------------------------------------------------

create table public.user_nutrition_settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  kcal_target          int  not null default 2200 check (kcal_target between 800 and 6000),
  protein_target_g     int  not null default 160  check (protein_target_g between 0 and 500),
  carb_target_g        int  not null default 250  check (carb_target_g between 0 and 800),
  fat_target_g         int  not null default 70   check (fat_target_g between 0 and 300),
  fiber_target_g       int  not null default 30   check (fiber_target_g between 0 and 150),
  cheat_days_per_week  int  not null default 1    check (cheat_days_per_week between 0 and 7),
  water_target_ml      int  not null default 2000 check (water_target_ml between 250 and 10000),
  water_cup_ml         int  not null default 250  check (water_cup_ml    between 50 and 2000),
  water_bottle_ml      int  not null default 500  check (water_bottle_ml between 100 and 2000),
  water_unit           text not null default 'ml' check (water_unit in ('ml','oz')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.user_nutrition_settings enable row level security;

create policy "uns_read"  on public.user_nutrition_settings for select using (user_id = auth.uid());
create policy "uns_write" on public.user_nutrition_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. nutrition_days ----------------------------------------------------------

create table public.nutrition_days (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  date              date not null,
  is_cheat_day      boolean not null default false,
  -- per-day overrides; null = inherit from user_nutrition_settings.
  kcal_target       int,
  protein_target_g  int,
  carb_target_g     int,
  fat_target_g      int,
  fiber_target_g    int,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, date),
  -- Required as the target of the composite FK from nutrition_entries.
  -- Without it, day_id alone could be referenced and an attacker could
  -- insert entries against another user's day_id (FK checks bypass RLS).
  unique (id, user_id)
);

create index nutrition_days_user_date_idx on public.nutrition_days(user_id, date desc);

alter table public.nutrition_days enable row level security;

create policy "nutrition_days_read"  on public.nutrition_days for select using (user_id = auth.uid());
create policy "nutrition_days_write" on public.nutrition_days for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 3. nutrition_entries -------------------------------------------------------

create type public.meal_slot as enum ('breakfast','lunch','dinner','snack');

create table public.nutrition_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  day_id        uuid not null,
  meal_slot     meal_slot not null,
  name          text,
  kcal          int not null default 0 check (kcal      between 0 and 10000),
  protein_g     int not null default 0 check (protein_g between 0 and 500),
  carb_g        int not null default 0 check (carb_g    between 0 and 1000),
  fat_g         int not null default 0 check (fat_g     between 0 and 500),
  fiber_g       int not null default 0 check (fiber_g   between 0 and 200),
  order_index   int not null default 0,
  logged_at     timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Composite FK forces day_id to belong to the same user_id. A simple
  -- references nutrition_days(id) would be insufficient: Postgres FK
  -- validation bypasses RLS, so an attacker could insert (user_id=self,
  -- day_id=victim_day) and the resulting row would aggregate into the
  -- victim's day in nutrition_day_summary_view. Pairing day_id with
  -- user_id makes that insert fail at the constraint layer.
  foreign key (day_id, user_id)
    references public.nutrition_days(id, user_id)
    on delete cascade
);

create index nutrition_entries_day_idx  on public.nutrition_entries(day_id, order_index);
create index nutrition_entries_user_idx on public.nutrition_entries(user_id, logged_at desc);

alter table public.nutrition_entries enable row level security;

create policy "nutrition_entries_read"  on public.nutrition_entries for select using (user_id = auth.uid());
create policy "nutrition_entries_write" on public.nutrition_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. water_logs --------------------------------------------------------------
-- One row per tap. Per-tap granularity (vs a single per-day counter) lets us
-- show drink-time-of-day later and supports clean undo.

create table public.water_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  ml          int  not null check (ml between 1 and 5000),
  logged_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index water_logs_user_date_idx on public.water_logs(user_id, date desc);

alter table public.water_logs enable row level security;

create policy "water_logs_read"  on public.water_logs for select using (user_id = auth.uid());
create policy "water_logs_write" on public.water_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 5. nutrition_day_summary_view ---------------------------------------------
-- Folds entries + water into one row per (user_id, date). Status is computed
-- here so the client never has to: 'cheat' (override), 'empty' (no entries
-- and not a cheat), 'hit' (kcal within ±5% of target), 'over' (kcal > target
-- by >5%), 'under' (kcal < target by >5%).
--
-- Targets resolve as: per-day override > user settings > hardcoded fallback.
-- Days with no entries AND no nutrition_days row are NOT returned by this
-- view (it joins on nutrition_days). Surfacing "empty days in calendar
-- form" is the planner strip's job, not this view.

create view public.nutrition_day_summary_view
  with (security_invoker = on)
  as
select
  d.user_id,
  d.id                                                          as day_id,
  d.date,
  d.is_cheat_day,
  coalesce(d.kcal_target,      s.kcal_target,      2200)        as kcal_target,
  coalesce(d.protein_target_g, s.protein_target_g, 160)         as protein_target_g,
  coalesce(d.carb_target_g,    s.carb_target_g,    250)         as carb_target_g,
  coalesce(d.fat_target_g,     s.fat_target_g,     70)          as fat_target_g,
  coalesce(d.fiber_target_g,   s.fiber_target_g,   30)          as fiber_target_g,
  coalesce(e.kcal_total,      0)                                as kcal_total,
  coalesce(e.protein_total_g, 0)                                as protein_total_g,
  coalesce(e.carb_total_g,    0)                                as carb_total_g,
  coalesce(e.fat_total_g,     0)                                as fat_total_g,
  coalesce(e.fiber_total_g,   0)                                as fiber_total_g,
  coalesce(e.entry_count,     0)                                as entry_count,
  coalesce(w.water_total_ml,  0)                                as water_total_ml,
  case
    when d.is_cheat_day                              then 'cheat'
    when coalesce(e.entry_count, 0) = 0              then 'empty'
    when coalesce(e.kcal_total, 0) > coalesce(d.kcal_target, s.kcal_target, 2200) * 1.05
                                                     then 'over'
    when coalesce(e.kcal_total, 0) < coalesce(d.kcal_target, s.kcal_target, 2200) * 0.95
                                                     then 'under'
    else 'hit'
  end                                                           as status
from public.nutrition_days d
left join public.user_nutrition_settings s on s.user_id = d.user_id
left join (
  select
    day_id,
    sum(kcal)      as kcal_total,
    sum(protein_g) as protein_total_g,
    sum(carb_g)    as carb_total_g,
    sum(fat_g)     as fat_total_g,
    sum(fiber_g)   as fiber_total_g,
    count(*)       as entry_count
  from public.nutrition_entries
  group by day_id
) e on e.day_id = d.id
left join (
  select user_id, date, sum(ml) as water_total_ml
  from public.water_logs
  group by user_id, date
) w on w.user_id = d.user_id and w.date = d.date;

-- security_invoker = on makes the view execute as the querying user, so RLS
-- on the base tables (nutrition_days, nutrition_entries, water_logs) applies
-- to reads through the view. Without this, Postgres defaults to security
-- definer, the view would run as its owner, and RLS would be bypassed —
-- leaking every user's nutrition data. Matches the convention already in
-- session_summary_view and muscle_volume_view.

comment on view public.nutrition_day_summary_view is
  'One row per user-day. Folds entries + water + targets into a single read. Use this for History and the Day Card.';
