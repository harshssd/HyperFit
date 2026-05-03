-- Split user-added exercises out of the master `exercises` table into a
-- dedicated `user_exercises` table. Rationale: the master library is
-- bounded (~50 entries, slow growth) and a great cache candidate. User
-- entries can fan out per active user with low cross-user reuse and
-- shouldn't compete with the curated set for caching, statistics, or
-- index hot pages.
--
-- Design:
--   * exercises          — system/public library, no user_id column.
--   * user_exercises     — per-user free-text entries; RLS-fenced to
--                          owner.
--   * workout_sets.exercise_id, plan_exercises.exercise_id, and
--     template_exercises.exercise_id become soft references (no FK).
--     Either table can satisfy the lookup; views join via UNION ALL.
--
-- Tradeoff: we lose the database-level guarantee that exercise_id
-- always points somewhere. In practice deletes from either table are
-- rare, and ensureExercise() in the client enforces existence at write
-- time. Worth it for the caching headroom and the bounded master.

-- 1. Create user_exercises with the same shape as exercises minus
--    is_public (always implicit) and minus the public-facing user_id
--    nullable column (always required here).
create table public.user_exercises (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  muscle_group    text,
  equipment       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, name)
);

create index user_exercises_user_idx on public.user_exercises(user_id);
create index user_exercises_muscle_group_idx on public.user_exercises(muscle_group);

alter table public.user_exercises enable row level security;

create policy "user_exercises_read"
  on public.user_exercises for select
  using (user_id = auth.uid());

create policy "user_exercises_write"
  on public.user_exercises for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 2. Migrate any existing user-scoped rows from exercises to
--    user_exercises. Preserves ids so any historical workout_sets
--    rows pointing at them keep resolving.
insert into public.user_exercises
  (id, user_id, name, muscle_group, equipment, created_at, updated_at)
select id, user_id, name, muscle_group, equipment, created_at, updated_at
from public.exercises
where user_id is not null
on conflict (user_id, name) do nothing;

-- 3. Drop strict FKs to public.exercises so soft refs to either table
--    are legal. (Constraint names follow Postgres' default
--    `<table>_<column>_fkey` convention.)
alter table public.workout_sets
  drop constraint if exists workout_sets_exercise_id_fkey;
alter table public.plan_exercises
  drop constraint if exists plan_exercises_exercise_id_fkey;
alter table public.template_exercises
  drop constraint if exists template_exercises_exercise_id_fkey;

-- 4. Now safe to remove the migrated rows from public.exercises.
delete from public.exercises where user_id is not null;

-- 5. Drop policies that reference user_id BEFORE dropping the column
--    (Postgres refuses with 2BP01 otherwise).
drop policy if exists "exercises_read"  on public.exercises;
drop policy if exists "exercises_write" on public.exercises;

-- 6. Remove the user_id column from exercises entirely. With it goes
--    the (user_id, name) unique constraint; recreate as just (name)
--    since the master library is now public-only.
alter table public.exercises drop constraint if exists exercises_user_id_name_key;
alter table public.exercises drop column user_id;
alter table public.exercises add constraint exercises_name_key unique (name);

-- 7. Reset RLS for the now-public-only library. Read is open; writes
--    happen via the seed function under elevated privileges.
create policy "exercises_read"
  on public.exercises for select
  using (true);

-- 8. muscle_volume_view joined exercises directly for muscle_group.
--    Re-create it to source muscle_group from either table.
drop view if exists public.muscle_volume_view;

create view public.muscle_volume_view
  with (security_invoker = on)
  as
with directory as (
  select id, muscle_group from public.exercises
  union all
  select id, muscle_group from public.user_exercises
)
select
  s.user_id,
  s.workout_date,
  d.muscle_group,
  sum(coalesce(st.weight, 0) * coalesce(st.reps, 0))::numeric as volume,
  count(st.id)::int                                            as set_count
from public.workout_sets st
join public.workout_sessions s on s.id = st.session_id
join directory d                on d.id = st.exercise_id
where st.completed = true
  and st.weight is not null
  and st.reps is not null
  and d.muscle_group is not null
group by s.user_id, s.workout_date, d.muscle_group;

-- 9. session_summary_view doesn't reference exercises (just counts
--    distinct exercise_id), so it survives unchanged.
