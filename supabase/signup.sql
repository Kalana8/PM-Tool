-- Self-service signup support.
-- Run this ENTIRE file once in the Supabase SQL Editor (Dashboard → SQL Editor → New query),
-- after schema.sql/seed.sql/link-accounts.sql have already been run.
--
-- What this does:
--   1. Makes users.role nullable. NULL means "signed up, not yet categorized by an admin".
--      Every existing role === 'Admin' | 'Team Leader' | 'Team Member' check in the app is
--      untouched — this only adds a new possible state (no role assigned yet).
--   2. Adds a trigger that auto-provisions a `users` row for every new Supabase Auth signup
--      (role/department left NULL), so no manual UUID copy-paste is needed the way
--      link-accounts.sql describes for the original 3 seed accounts.
--   3. Adds a trigger that blocks a signed-in non-admin user from changing their own role,
--      department, team leader, or status via a direct table update — closes off a
--      privilege-escalation path that opens up now that anyone can create an account.

-- ============================================================================
-- 1. Nullable role
-- ============================================================================
alter table users alter column role drop not null;

-- ============================================================================
-- 2. Auto-provisioning trigger
-- ============================================================================
create or replace function public.handle_new_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, auth_id, name, email, role, department_id, status, avatar, title, performance_score)
  values (
    'user-' || replace(new.id::text, '-', ''),
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    null, null, 'Active',
    'https://picsum.photos/seed/' || split_part(new.email, '@', 1) || '/100/100',
    '', 0
  );
  return new;
exception
  when unique_violation then
    raise exception 'An account with this email already exists. Contact your administrator.';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_signup();

-- ============================================================================
-- 3. Self-privilege-escalation guard
-- ============================================================================
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.auth_id and current_app_role() is distinct from 'Admin' then
    if new.role is distinct from old.role
       or new.department_id is distinct from old.department_id
       or new.team_leader_id is distinct from old.team_leader_id
       or new.status is distinct from old.status then
      raise exception 'Only an administrator can change role, department, team, or status.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_self_update_columns on users;
create trigger enforce_self_update_columns
  before update on users
  for each row execute function public.prevent_self_privilege_escalation();

-- Sanity check — should show role as nullable, and both triggers present.
select is_nullable from information_schema.columns where table_name = 'users' and column_name = 'role';
select trigger_name, event_object_table from information_schema.triggers
where trigger_name in ('on_auth_user_created', 'enforce_self_update_columns');
