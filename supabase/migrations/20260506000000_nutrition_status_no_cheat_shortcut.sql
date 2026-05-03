-- Drop the cheat-day short-circuit from nutrition_day_summary_view.status.
--
-- Original semantics (PR 1): cheat day → status='cheat', kcal numbers
-- effectively ignored on the day card.
--
-- Refined semantics: cheat day is a forgiveness flag, not a tracking-off
-- switch. The user still logs the pizza; the streak just doesn't punish
-- them for it. The view's `status` column should report what actually
-- happened (hit | over | under | empty), regardless of cheat. The cheat
-- flag stays as a separate column so the streak helper can OR them
-- together: day passes the streak if status='hit' OR is_cheat_day=true.
--
-- Visual: a cheat day where the user went over still renders 2,640 / 2,200
-- in the hero (honest mirror), but the eyebrow flips to
-- "TODAY · CHEAT DAY · STREAK SAFE" and the streak counter ticks up.

create or replace view public.nutrition_day_summary_view
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

comment on view public.nutrition_day_summary_view is
  'One row per user-day. Status reflects real eating (hit/over/under/empty). is_cheat_day is a separate forgiveness flag the streak helper ORs in.';
