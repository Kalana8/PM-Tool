-- Adds a human-readable employee code (department's first letter + a
-- zero-padded sequence number, e.g. "H001") shown alongside the existing
-- internal UID — not replacing it. Assigned once, the first time a user gets
-- a department, and never reassigned again (even across a later department
-- transfer), so it behaves like a stable employee ID rather than a live
-- department label.

alter table pm.users add column employee_code text;

create or replace function pm.assign_employee_code()
returns trigger
language plpgsql
security definer
set search_path = pm, public
as $$
declare
  dept_letter text;
  next_seq int;
begin
  if new.department_id is not null and new.employee_code is null then
    select upper(left(name, 1)) into dept_letter from pm.departments where id = new.department_id;
    dept_letter := coalesce(dept_letter, 'X');

    select count(*) + 1 into next_seq from pm.users where department_id = new.department_id;

    new.employee_code := dept_letter || lpad(next_seq::text, 3, '0');
  end if;
  return new;
end;
$$;

create trigger assign_employee_code_trigger
  before insert or update on pm.users
  for each row execute function pm.assign_employee_code();

-- Backfill: assign codes to existing users who already have a department,
-- in creation order per department (so earlier hires keep lower numbers).
do $$
declare
  r record;
  dept_letter text;
  seq_by_dept jsonb := '{}'::jsonb;
  next_seq int;
begin
  for r in
    select id, department_id from pm.users
    where department_id is not null and employee_code is null
    order by department_id, created_at
  loop
    select upper(left(name, 1)) into dept_letter from pm.departments where id = r.department_id;
    dept_letter := coalesce(dept_letter, 'X');

    next_seq := coalesce((seq_by_dept->>r.department_id)::int, 0) + 1;
    seq_by_dept := jsonb_set(seq_by_dept, array[r.department_id], to_jsonb(next_seq));

    update pm.users set employee_code = dept_letter || lpad(next_seq::text, 3, '0') where id = r.id;
  end loop;
end;
$$;
