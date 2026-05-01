-- =============================================================================
-- HyperFit — plan moderation
-- =============================================================================
--
-- Adds a review state machine to workout_plans so user-published plans go
-- through admin approval before becoming visible in the public library.
--
--   private          (default — owner-only)
--   pending_review   (user has submitted; admin sees it in queue)
--   approved         (admin has accepted; flips is_public=true)
--   rejected         (admin has declined; review_notes carries the reason)
--
-- RLS read access for the public branch tightens from `is_public` to
-- `(is_public AND review_status = 'approved')`. A BEFORE UPDATE trigger
-- prevents users from setting these fields directly — the only legal user
-- transitions are `private <-> pending_review`, both with `is_public=false`.
-- Admins use approve_plan / reject_plan RPCs (security definer, gated to a
-- hard-coded email allowlist).
--
-- =============================================================================

create type public.plan_review_status as enum (
  'private',
  'pending_review',
  'approved',
  'rejected'
);

alter table public.workout_plans
  add column review_status   public.plan_review_status not null default 'private',
  add column reviewed_at     timestamptz,
  add column reviewed_by     uuid references auth.users(id) on delete set null,
  add column review_notes    text;

-- Existing rows: legacy is_public=true plans are grandfathered as approved.
update public.workout_plans
  set review_status = 'approved',
      reviewed_at   = coalesce(updated_at, created_at)
  where is_public = true;

-- Index the moderator queue path (`where review_status = 'pending_review'`).
create index workout_plans_review_status_idx
  on public.workout_plans(review_status);

-- ----------------------------------------------------------------------------
-- Tighten read access for the public branch
-- ----------------------------------------------------------------------------

drop policy if exists "plans_read" on public.workout_plans;
create policy "plans_read"
  on public.workout_plans for select
  using (
    user_id = auth.uid()
    or (is_public and review_status = 'approved')
  );

-- Transitive child-read policies need the same gate.
drop policy if exists "plan_sessions_read" on public.plan_sessions;
create policy "plan_sessions_read"
  on public.plan_sessions for select
  using (exists (
    select 1 from public.workout_plans p
    where p.id = plan_id
      and (p.user_id = auth.uid() or (p.is_public and p.review_status = 'approved'))
  ));

drop policy if exists "plan_exercises_read" on public.plan_exercises;
create policy "plan_exercises_read"
  on public.plan_exercises for select
  using (exists (
    select 1 from public.plan_sessions s
    join public.workout_plans p on p.id = s.plan_id
    where s.id = session_id
      and (p.user_id = auth.uid() or (p.is_public and p.review_status = 'approved'))
  ));

drop policy if exists "plan_schedule_read" on public.plan_schedule;
create policy "plan_schedule_read"
  on public.plan_schedule for select
  using (exists (
    select 1 from public.workout_plans p
    where p.id = plan_id
      and (p.user_id = auth.uid() or (p.is_public and p.review_status = 'approved'))
  ));

-- ----------------------------------------------------------------------------
-- BEFORE UPDATE trigger: lock down moderation fields for non-admin writes
-- ----------------------------------------------------------------------------
--
-- Users own their plan rows but cannot set is_public, review_status (except
-- the toggle private<->pending_review with is_public=false), reviewed_at,
-- reviewed_by, or review_notes. Admin RPCs run as SECURITY DEFINER so they
-- bypass this trigger by setting `app.bypass_review_guard = on` for their
-- transaction.
--
create or replace function public.workout_plans_review_guard()
returns trigger
language plpgsql
as $$
declare
  bypass text;
begin
  begin
    bypass := current_setting('app.bypass_review_guard', true);
  exception when others then
    bypass := null;
  end;
  if bypass = 'on' then
    return new;
  end if;

  -- Only allow the user-driven submit/withdraw transitions, both keeping
  -- is_public=false. Anything else on the moderation columns is rejected.
  if new.is_public is distinct from old.is_public then
    raise exception 'is_public can only be set via approve_plan/reject_plan';
  end if;
  if new.reviewed_at is distinct from old.reviewed_at
     or new.reviewed_by is distinct from old.reviewed_by
     or new.review_notes is distinct from old.review_notes then
    raise exception 'review fields are admin-only';
  end if;
  if new.review_status is distinct from old.review_status then
    if not (
      (old.review_status = 'private'        and new.review_status = 'pending_review')
      or (old.review_status = 'pending_review' and new.review_status = 'private')
    ) then
      raise exception 'review_status transition % -> % is not allowed for users',
        old.review_status, new.review_status;
    end if;
  end if;

  return new;
end;
$$;

create trigger workout_plans_review_guard
  before update on public.workout_plans
  for each row execute function public.workout_plans_review_guard();

-- ----------------------------------------------------------------------------
-- Admin RPCs
-- ----------------------------------------------------------------------------
--
-- Admin allowlist is a single email for now. Future: separate `admins` table
-- or a custom JWT claim. Hard-coding here keeps the surface small and
-- auditable in git history; flipping the allowlist requires a migration.
--
create or replace function public.is_plan_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select email = 'harsh.ssd@gmail.com' from auth.users where id = auth.uid()),
    false
  );
$$;

create or replace function public.approve_plan(p_plan_id uuid, p_notes text default null)
returns public.workout_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.workout_plans;
begin
  if not public.is_plan_admin() then
    raise exception 'permission denied: not a plan admin';
  end if;

  perform set_config('app.bypass_review_guard', 'on', true);
  update public.workout_plans
    set review_status = 'approved',
        is_public     = true,
        reviewed_at   = now(),
        reviewed_by   = auth.uid(),
        review_notes  = p_notes
    where id = p_plan_id
    returning * into result;
  perform set_config('app.bypass_review_guard', 'off', true);

  if result.id is null then
    raise exception 'plan % not found', p_plan_id;
  end if;
  return result;
end;
$$;

create or replace function public.reject_plan(p_plan_id uuid, p_notes text default null)
returns public.workout_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.workout_plans;
begin
  if not public.is_plan_admin() then
    raise exception 'permission denied: not a plan admin';
  end if;

  perform set_config('app.bypass_review_guard', 'on', true);
  update public.workout_plans
    set review_status = 'rejected',
        is_public     = false,
        reviewed_at   = now(),
        reviewed_by   = auth.uid(),
        review_notes  = p_notes
    where id = p_plan_id
    returning * into result;
  perform set_config('app.bypass_review_guard', 'off', true);

  if result.id is null then
    raise exception 'plan % not found', p_plan_id;
  end if;
  return result;
end;
$$;

-- Tighten function permissions: anonymous role should not be able to call
-- approve/reject. The is_plan_admin check is the actual gate, but defense
-- in depth never hurts.
revoke all on function public.approve_plan(uuid, text) from public, anon;
revoke all on function public.reject_plan(uuid, text) from public, anon;
grant execute on function public.approve_plan(uuid, text) to authenticated;
grant execute on function public.reject_plan(uuid, text) to authenticated;
