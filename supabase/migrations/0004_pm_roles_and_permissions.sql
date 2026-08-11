-- Custom user roles (RBAC): replaces the fixed pm.user_role enum with a
-- per-business pm.roles table so an Admin can create named custom roles and
-- configure which sidebar pages / key actions each role can access, instead
-- of only the 3 hardcoded roles.
--
-- Every existing role keeps a base_level ('admin' | 'team_leader' |
-- 'team_member') so the ~30 existing "who can be a project/task
-- owner/assignee", "which dashboard variant", "am I dept-scoped" call sites
-- in the app keep working unchanged (they key off base_level, a pure rename
-- from the old role string). The new `permissions` jsonb on each role is
-- what's actually admin-configurable and drives sidebar visibility plus a
-- handful of action gates (add/edit/delete user, manage departments, manage
-- projects, edit task progress, manage attendance).
--
-- The 3 seeded system roles per business replicate today's exact hardcoded
-- behavior (pages = all, actions = whatever each role could already do), so
-- this migration is a no-op for every existing user until an Admin actually
-- edits a role's permissions from the new UI.
--
-- Role/permission management itself stays hardcoded to base_level = 'admin'
-- (see the "admin manage roles" policies below) rather than being a
-- delegable permission, to avoid a custom role granting itself Admin rights.

create type pm.role_base_level as enum ('admin', 'team_leader', 'team_member');

create table pm.roles (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  base_level pm.role_base_level not null,
  is_system boolean not null default false,
  permissions jsonb not null default '{"pages":[],"actions":[]}'::jsonb,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

grant select, insert, update, delete on pm.roles to authenticated;

alter table pm.roles enable row level security;

-- Backfill: seed system roles for every business that already has pm.users
-- rows (direct inserts, not via ensure_system_roles() below — that function
-- enforces is_business_member(), which needs auth.uid(), which is NULL in a
-- migration's execution context).
insert into pm.roles (id, business_id, name, base_level, is_system, permissions)
select 'role-admin-' || business_id, business_id, 'Admin', 'admin', true,
  '{"pages":["Dashboard","Departments","Tasks","Calendar","Attendance","Users","Reports","Settings"],
    "actions":["users.add","users.edit","users.delete","users.manage_login","departments.manage","projects.manage","tasks.edit_progress","attendance.manage"]}'::jsonb
from (select distinct business_id from pm.users) b;

insert into pm.roles (id, business_id, name, base_level, is_system, permissions)
select 'role-team-leader-' || business_id, business_id, 'Team Leader', 'team_leader', true,
  '{"pages":["Dashboard","Departments","Tasks","Calendar","Attendance","Users","Reports","Settings"],
    "actions":["users.add","projects.manage","tasks.edit_progress","attendance.manage"]}'::jsonb
from (select distinct business_id from pm.users) b;

insert into pm.roles (id, business_id, name, base_level, is_system, permissions)
select 'role-team-member-' || business_id, business_id, 'Team Member', 'team_member', true,
  '{"pages":["Dashboard","Departments","Tasks","Calendar","Attendance","Users","Reports","Settings"],
    "actions":[]}'::jsonb
from (select distinct business_id from pm.users) b;

-- pm.users.role gets replaced by role_id (FK to pm.roles); add + backfill
-- before dropping the old column so no user is ever left roleless.
alter table pm.users add column role_id text references pm.roles(id) on delete restrict;

update pm.users set role_id = case role
  when 'Admin' then 'role-admin-' || business_id
  when 'Team Leader' then 'role-team-leader-' || business_id
  when 'Team Member' then 'role-team-member-' || business_id
  else null
end;

-- Helper functions: current_app_role() is replaced by current_app_base_level()
-- (same shape, now sourced via the roles join) plus a new
-- current_app_has_action() for the permission-driven RLS checks below. Both
-- need pm.users.role_id, so they're defined only after the column above exists.
create or replace function pm.current_app_base_level()
returns pm.role_base_level
language sql
stable
security definer
set search_path = pm, public
as $$
  select r.base_level
  from pm.users u
  join pm.roles r on r.id = u.role_id
  where u.auth_id = auth.uid()
  limit 1;
$$;

create or replace function pm.current_app_has_action(p_action text)
returns boolean
language sql
stable
security definer
set search_path = pm, public
as $$
  select coalesce(
    (
      select r.base_level = 'admin' or r.permissions->'actions' ? p_action
      from pm.users u
      join pm.roles r on r.id = u.role_id
      where u.auth_id = auth.uid()
      limit 1
    ),
    false
  );
$$;

-- RLS on pm.roles itself (needs current_app_base_level(), just defined above).
create policy "members read" on pm.roles for select to authenticated
  using (public.is_business_member(business_id));

-- Only an Admin (base_level, not a delegable action) can create/edit/delete
-- roles, and system roles can't be deleted (their id is relied on by
-- ensure_system_roles()/self-provisioning and there must always be at least
-- one admin-tier role per business so a business can't lock itself out).
create policy "admin manage roles" on pm.roles for insert to authenticated
  with check (public.is_business_member(business_id) and pm.current_app_base_level() = 'admin');
create policy "admin update roles" on pm.roles for update to authenticated
  using (public.is_business_member(business_id) and pm.current_app_base_level() = 'admin');
create policy "admin delete non-system roles" on pm.roles for delete to authenticated
  using (public.is_business_member(business_id) and pm.current_app_base_level() = 'admin' and not is_system);

-- Idempotently seeds the 3 system roles for a business. security definer
-- because it must also work the very first time a business's owner signs
-- in, before any pm.roles/pm.users row exists for them yet (i.e. before
-- current_app_base_level() can return 'admin') — same bootstrapping problem
-- 0003's self-provisioning policy solves for pm.users. Called at runtime by
-- the app (lib/get-current-profile.ts), not by this migration.
create or replace function pm.ensure_system_roles(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = pm, public
as $$
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'not a member of this business';
  end if;

  insert into pm.roles (id, business_id, name, base_level, is_system, permissions)
  values
    ('role-admin-' || p_business_id, p_business_id, 'Admin', 'admin', true,
     '{"pages":["Dashboard","Departments","Tasks","Calendar","Attendance","Users","Reports","Settings"],
       "actions":["users.add","users.edit","users.delete","users.manage_login","departments.manage","projects.manage","tasks.edit_progress","attendance.manage"]}'::jsonb),
    ('role-team-leader-' || p_business_id, p_business_id, 'Team Leader', 'team_leader', true,
     '{"pages":["Dashboard","Departments","Tasks","Calendar","Attendance","Users","Reports","Settings"],
       "actions":["users.add","projects.manage","tasks.edit_progress","attendance.manage"]}'::jsonb),
    ('role-team-member-' || p_business_id, p_business_id, 'Team Member', 'team_member', true,
     '{"pages":["Dashboard","Departments","Tasks","Calendar","Attendance","Users","Reports","Settings"],
       "actions":[]}'::jsonb)
  on conflict (business_id, name) do nothing;
end;
$$;

grant execute on function pm.ensure_system_roles(uuid) to authenticated;

-- Rewrite every RLS policy that referenced the old role enum to use
-- base_level / current_app_has_action() instead. Same predicates, same
-- effective access for the 3 seeded system roles — just data-driven now.
drop policy "admin write" on pm.departments;
drop policy "admin update" on pm.departments;
drop policy "admin delete" on pm.departments;
create policy "admin write" on pm.departments for insert to authenticated
  with check (public.is_business_member(business_id) and pm.current_app_has_action('departments.manage'));
create policy "admin update" on pm.departments for update to authenticated
  using (public.is_business_member(business_id) and pm.current_app_has_action('departments.manage'));
create policy "admin delete" on pm.departments for delete to authenticated
  using (public.is_business_member(business_id) and pm.current_app_has_action('departments.manage'));

drop policy "leader write" on pm.employee_projects;
drop policy "leader update" on pm.employee_projects;
drop policy "leader delete" on pm.employee_projects;
create policy "leader write" on pm.employee_projects for insert to authenticated
  with check (public.is_business_member(business_id) and pm.current_app_has_action('projects.manage'));
create policy "leader update" on pm.employee_projects for update to authenticated
  using (public.is_business_member(business_id) and pm.current_app_has_action('projects.manage'));
create policy "leader delete" on pm.employee_projects for delete to authenticated
  using (public.is_business_member(business_id) and pm.current_app_has_action('projects.manage'));

drop policy "leader manage members" on pm.project_members;
create policy "leader manage members" on pm.project_members for all to authenticated
  using (public.is_business_member(business_id) and pm.current_app_has_action('projects.manage'))
  with check (public.is_business_member(business_id) and pm.current_app_has_action('projects.manage'));

drop policy "leader add users" on pm.users;
drop policy "admin or self update users" on pm.users;
drop policy "admin delete users" on pm.users;
drop policy "self provision own profile" on pm.users;
create policy "leader add users" on pm.users for insert to authenticated
  with check (public.is_business_member(business_id) and pm.current_app_has_action('users.add'));
create policy "admin or self update users" on pm.users for update to authenticated
  using (public.is_business_member(business_id) and (pm.current_app_base_level() = 'admin' or auth_id = auth.uid()));
create policy "admin delete users" on pm.users for delete to authenticated
  using (public.is_business_member(business_id) and pm.current_app_base_level() = 'admin');
create policy "self provision own profile" on pm.users for insert to authenticated
  with check (
    public.is_business_member(business_id)
    and auth_id = auth.uid()
    and role_id is null
  );

drop policy "self or leader write attendance" on pm.attendance;
drop policy "self or leader update attendance" on pm.attendance;
create policy "self or leader write attendance" on pm.attendance for insert to authenticated
  with check (public.is_business_member(business_id) and (user_id = pm.current_app_user_id() or pm.current_app_has_action('attendance.manage')));
create policy "self or leader update attendance" on pm.attendance for update to authenticated
  using (public.is_business_member(business_id) and (user_id = pm.current_app_user_id() or pm.current_app_has_action('attendance.manage')));

-- Now unreferenced by any policy — safe to drop.
drop function pm.current_app_role();

-- Privilege-escalation guard: same behavior, now checking role_id/base_level.
-- Must be redefined before the old `role` column is dropped below, so the
-- trigger attached to pm.users is never left referencing a dropped column.
create or replace function pm.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = pm, public
as $$
begin
  if auth.uid() = old.auth_id and pm.current_app_base_level() is distinct from 'admin' then
    if new.role_id is distinct from old.role_id
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

-- Now safe to drop the old column/type.
alter table pm.users drop column role;
drop type pm.user_role;
