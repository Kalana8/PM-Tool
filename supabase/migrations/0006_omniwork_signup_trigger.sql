-- Self-service signup support, ported from the old project's supabase/signup.sql
-- and folded into the initial schema (role starts nullable already, see 0003)
-- rather than layered on as a later ALTER.
--
-- Every new auth.users signup gets both an omniwork.users row AND a
-- public.business_members row, defaulting into the single seeded business
-- (see 0001). This is the "lobby comes later" shortcut: there's no
-- business-selection UI yet, so every signup joins the one business that
-- exists. When real multi-business onboarding is built, this trigger is
-- what needs to change (e.g. read the target business from signup metadata
-- or an invite token instead of hardcoding it).

create or replace function omniwork.handle_new_signup()
returns trigger
language plpgsql
security definer
set search_path = omniwork, public
as $$
declare
  default_business_id uuid := '4cfd5f44-1ce8-45fb-af17-82c7b84a04eb'; -- '9 Gens Group', matches 0001's seed
begin
  insert into omniwork.users (id, business_id, auth_id, name, email, role, department_id, status, avatar, title, performance_score)
  values (
    'user-' || replace(new.id::text, '-', ''),
    default_business_id,
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    null, null, 'Active',
    'https://picsum.photos/seed/' || split_part(new.email, '@', 1) || '/100/100',
    '', 0
  );

  insert into public.business_members (business_id, user_id, role)
  values (default_business_id, new.id, 'member');

  return new;
exception
  when unique_violation then
    raise exception 'An account with this email already exists. Contact your administrator.';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function omniwork.handle_new_signup();

-- Blocks a signed-in non-admin user from changing their own role, department,
-- team leader, status, or business_id via a direct table update — closes off
-- both the original privilege-escalation path and (new for multi-tenancy) a
-- self-service "hop to a different business" path.
create or replace function omniwork.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = omniwork, public
as $$
begin
  if auth.uid() = old.auth_id and omniwork.current_app_role() is distinct from 'Admin' then
    if new.role is distinct from old.role
       or new.department_id is distinct from old.department_id
       or new.team_leader_id is distinct from old.team_leader_id
       or new.status is distinct from old.status
       or new.business_id is distinct from old.business_id then
      raise exception 'Only an administrator can change role, department, team, status, or business.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_self_update_columns on omniwork.users;
create trigger enforce_self_update_columns
  before update on omniwork.users
  for each row execute function omniwork.prevent_self_privilege_escalation();
