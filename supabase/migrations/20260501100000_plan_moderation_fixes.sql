-- =============================================================================
-- HyperFit — plan moderation security fixes
-- =============================================================================
--
-- Adversarial review of the prior migration (20260501000000) flagged two
-- ship-blockers:
--
-- B1. The plans_write policy had no WITH CHECK on the moderation columns,
--     and the guard trigger was BEFORE UPDATE only. Authenticated users
--     could INSERT a row directly with `is_public=true,
--     review_status='approved'` and bypass the entire flow.
--
-- B2. The trigger detected admin writes via a `app.bypass_review_guard`
--     GUC that the admin RPCs would set. PostgREST does NOT reserve the
--     `app.*` namespace, so any client could set this GUC themselves
--     (`select set_config('app.bypass_review_guard','on',true)`) inside a
--     transaction and self-approve.
--
-- This migration replaces both. The new design:
--
--   1. plans_write policy gets a WITH CHECK that forbids user-set
--      is_public=true and constrains review_status to {private,
--      pending_review}. This covers BOTH insert and user-side update.
--
--   2. The guard trigger no longer reads a GUC. It branches on
--      `current_user` — admin-path writes happen inside SECURITY DEFINER
--      RPCs owned by `postgres`, so `current_user` is `postgres` there.
--      User-path writes come from `authenticated`. The trigger only blocks
--      writes from anon/authenticated, and only on the admin-only fields
--      (reviewed_at / reviewed_by / review_notes), since the policy
--      already covers is_public + review_status.
--
--   3. approve_plan / reject_plan drop their set_config() calls. They
--      execute as SECURITY DEFINER (owner = postgres), so the trigger's
--      current_user branch lets their UPDATEs through, and the policy is
--      bypassed because postgres has BYPASSRLS in Supabase.
--
--   4. SECURITY DEFINER search_path hardened to `pg_catalog, public` so a
--      shadowed `public.users` etc. can't be used as a privilege wedge.
--
--   5. is_plan_admin() loses its default PUBLIC grant for symmetry with
--      approve/reject.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- B1 fix: tighten plans_write
-- ----------------------------------------------------------------------------

drop policy if exists "plans_write" on public.workout_plans;
create policy "plans_write"
  on public.workout_plans for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and is_public = false
    and review_status in ('private', 'pending_review')
  );

-- ----------------------------------------------------------------------------
-- B2 fix: replace trigger; drop GUC dependency
-- ----------------------------------------------------------------------------

drop trigger if exists workout_plans_review_guard on public.workout_plans;

create or replace function public.workout_plans_review_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  -- Admin path runs inside SECURITY DEFINER RPCs owned by postgres, so
  -- current_user = 'postgres' there. Service-role connections also pass.
  -- Only enforce restrictions when the writer is one of the two PostgREST
  -- client roles.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Policy WITH CHECK already enforces is_public/review_status. Block
    -- the admin-only stamp fields here so a user can't pre-fill them.
    if new.reviewed_at is not null
       or new.reviewed_by is not null
       or new.review_notes is not null then
      raise exception 'review_* fields are admin-only';
    end if;
    return new;
  end if;

  -- UPDATE path. Policy WITH CHECK handles is_public + review_status
  -- bounds; we only need to lock the admin stamp fields here.
  if new.reviewed_at  is distinct from old.reviewed_at
     or new.reviewed_by is distinct from old.reviewed_by
     or new.review_notes is distinct from old.review_notes then
    raise exception 'review_* fields are admin-only';
  end if;

  return new;
end;
$$;

create trigger workout_plans_review_guard
  before insert or update on public.workout_plans
  for each row execute function public.workout_plans_review_guard();

-- ----------------------------------------------------------------------------
-- Replace approve_plan / reject_plan — drop the GUC bypass
-- ----------------------------------------------------------------------------

create or replace function public.approve_plan(p_plan_id uuid, p_notes text default null)
returns public.workout_plans
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  result public.workout_plans;
begin
  if not public.is_plan_admin() then
    raise exception 'permission denied: not a plan admin';
  end if;

  update public.workout_plans
    set review_status = 'approved',
        is_public     = true,
        reviewed_at   = now(),
        reviewed_by   = auth.uid(),
        review_notes  = p_notes
    where id = p_plan_id
    returning * into result;

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
set search_path = pg_catalog, public
as $$
declare
  result public.workout_plans;
begin
  if not public.is_plan_admin() then
    raise exception 'permission denied: not a plan admin';
  end if;

  update public.workout_plans
    set review_status = 'rejected',
        is_public     = false,
        reviewed_at   = now(),
        reviewed_by   = auth.uid(),
        review_notes  = p_notes
    where id = p_plan_id
    returning * into result;

  if result.id is null then
    raise exception 'plan % not found', p_plan_id;
  end if;
  return result;
end;
$$;

-- Re-apply grants in case CREATE OR REPLACE reset them.
revoke all on function public.approve_plan(uuid, text) from public, anon;
revoke all on function public.reject_plan(uuid, text) from public, anon;
grant execute on function public.approve_plan(uuid, text) to authenticated;
grant execute on function public.reject_plan(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Harden is_plan_admin (S3 search_path, S4 grant tightening)
-- ----------------------------------------------------------------------------

create or replace function public.is_plan_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    (select email = 'harsh.ssd@gmail.com' from auth.users where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_plan_admin() from public, anon;
grant execute on function public.is_plan_admin() to authenticated;
