-- Blocks a signed-in non-admin user from changing their own role, department,
-- team leader, status, or business_id via a direct table update on pm.users.

create or replace function pm.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = pm, public
as $$
begin
  if auth.uid() = old.auth_id and pm.current_app_role() is distinct from 'Admin' then
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

create trigger enforce_self_update_columns
  before update on pm.users
  for each row execute function pm.prevent_self_privilege_escalation();
