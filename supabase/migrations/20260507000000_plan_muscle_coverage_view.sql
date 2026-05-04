-- Plan muscle coverage view
-- =========================
-- Sister to muscle_volume_v2_view, but for *planned* work rather than logged
-- work. Aggregates recruitment-weighted set count per (plan, plan_session,
-- muscle_id) using exercises.primary_muscles[] / secondary_muscles[].
--
-- Used by:
--   * The shareable plan card (PR C) to drive the body silhouette without
--     any logged sessions.
--   * Future plan analytics ("does this plan hit every muscle?").
--
-- Recruitment weights match muscle_volume_v2_view: primary = 1.0, secondary
-- = 0.5. Multiplied by `plan_exercises.sets` so a 5x heavy compound carries
-- more weight than a 2x isolation cue.
--
-- security_invoker = on so RLS on workout_plans / plan_sessions /
-- plan_exercises is honored — users only see coverage for plans they own
-- or that are public.

create or replace view public.plan_muscle_coverage_view
with (security_invoker = on)
as
with directory as (
  -- Mirrors muscle_volume_v2_view: plan_exercises.exercise_id is a soft
  -- reference (no FK) since 20260504300000_split_user_exercises, so the
  -- view must union both tables or user-scoped exercises silently fall
  -- out of plan coverage.
  select id, primary_muscles, secondary_muscles from public.exercises
  union all
  select id, primary_muscles, secondary_muscles from public.user_exercises
),
exercise_muscle_pairs as (
  select
    pe.id              as plan_exercise_id,
    pe.session_id      as plan_session_id,
    ps.plan_id         as plan_id,
    pe.sets            as sets,
    m.muscle_id        as muscle_id,
    m.recruitment      as recruitment
  from public.plan_exercises pe
  join public.plan_sessions  ps on ps.id = pe.session_id
  join directory             e  on e.id  = pe.exercise_id
  cross join lateral (
    select unnest(coalesce(e.primary_muscles,   '{}')) as muscle_id, 1.0::numeric as recruitment
    union all
    select unnest(coalesce(e.secondary_muscles, '{}')) as muscle_id, 0.5::numeric as recruitment
  ) m
  where m.muscle_id is not null
    and m.muscle_id <> ''
)
select
  plan_id,
  plan_session_id,
  muscle_id,
  sum(sets * recruitment)::numeric as recruitment_score,
  sum(sets)::int                   as planned_sets
from exercise_muscle_pairs
group by plan_id, plan_session_id, muscle_id;

comment on view public.plan_muscle_coverage_view is
  'Recruitment-weighted muscle coverage per (plan, plan_session). '
  'primary=1.0 / secondary=0.5, multiplied by plan_exercises.sets. '
  'security_invoker honors RLS on plan_* tables.';

grant select on public.plan_muscle_coverage_view to authenticated;
