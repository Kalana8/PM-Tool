-- Role-lookup helpers and RLS for this app's tables in the pm schema,
-- equivalent to the old omniwork.current_app_role()/current_app_user_id()
-- and RLS policies, just re-pointed at pm.* table/type names.

create or replace function pm.current_app_role()
returns pm.user_role
language sql
stable
security definer
set search_path = pm, public
as $$
  select role from pm.users where auth_id = auth.uid() limit 1;
$$;

create or replace function pm.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = pm, public
as $$
  select id from pm.users where auth_id = auth.uid() limit 1;
$$;

alter table pm.departments enable row level security;
alter table pm.users enable row level security;
alter table pm.employee_projects enable row level security;
alter table pm.project_members enable row level security;
alter table pm.media_files enable row level security;
alter table pm.employee_tasks enable row level security;
alter table pm.subtasks enable row level security;
alter table pm.employee_task_comments enable row level security;
alter table pm.task_submissions enable row level security;
alter table pm.task_submission_attachments enable row level security;
alter table pm.attendance enable row level security;
alter table pm.notifications enable row level security;
alter table pm.daily_worklogs enable row level security;
alter table pm.daily_worklog_attachments enable row level security;

create policy "members read" on pm.departments for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.users for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.employee_projects for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.project_members for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.media_files for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.employee_tasks for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.subtasks for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.employee_task_comments for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.task_submissions for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.task_submission_attachments for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.attendance for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.notifications for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.daily_worklogs for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on pm.daily_worklog_attachments for select to authenticated
  using (public.is_business_member(business_id));

create policy "admin write" on pm.departments for insert to authenticated
  with check (public.is_business_member(business_id) and pm.current_app_role() = 'Admin');
create policy "admin update" on pm.departments for update to authenticated
  using (public.is_business_member(business_id) and pm.current_app_role() = 'Admin');
create policy "admin delete" on pm.departments for delete to authenticated
  using (public.is_business_member(business_id) and pm.current_app_role() = 'Admin');

create policy "leader write" on pm.employee_projects for insert to authenticated
  with check (public.is_business_member(business_id) and pm.current_app_role() in ('Admin', 'Team Leader'));
create policy "leader update" on pm.employee_projects for update to authenticated
  using (public.is_business_member(business_id) and pm.current_app_role() in ('Admin', 'Team Leader'));
create policy "leader delete" on pm.employee_projects for delete to authenticated
  using (public.is_business_member(business_id) and pm.current_app_role() in ('Admin', 'Team Leader'));
create policy "leader manage members" on pm.project_members for all to authenticated
  using (public.is_business_member(business_id) and pm.current_app_role() in ('Admin', 'Team Leader'))
  with check (public.is_business_member(business_id) and pm.current_app_role() in ('Admin', 'Team Leader'));

create policy "leader add users" on pm.users for insert to authenticated
  with check (public.is_business_member(business_id) and pm.current_app_role() in ('Admin', 'Team Leader'));
create policy "admin or self update users" on pm.users for update to authenticated
  using (public.is_business_member(business_id) and (pm.current_app_role() = 'Admin' or auth_id = auth.uid()));
create policy "admin delete users" on pm.users for delete to authenticated
  using (public.is_business_member(business_id) and pm.current_app_role() = 'Admin');

create policy "members write" on pm.employee_tasks for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on pm.employee_tasks for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on pm.employee_tasks for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on pm.subtasks for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on pm.subtasks for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on pm.subtasks for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on pm.employee_task_comments for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on pm.employee_task_comments for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on pm.employee_task_comments for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on pm.task_submissions for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on pm.task_submissions for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on pm.task_submissions for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on pm.task_submission_attachments for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members delete" on pm.task_submission_attachments for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on pm.media_files for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on pm.media_files for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on pm.media_files for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on pm.daily_worklogs for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members write" on pm.daily_worklog_attachments for insert to authenticated
  with check (public.is_business_member(business_id));

create policy "members write" on pm.notifications for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on pm.notifications for update to authenticated
  using (public.is_business_member(business_id));

create policy "self or leader write attendance" on pm.attendance for insert to authenticated
  with check (public.is_business_member(business_id) and (user_id = pm.current_app_user_id() or pm.current_app_role() in ('Admin', 'Team Leader')));
create policy "self or leader update attendance" on pm.attendance for update to authenticated
  using (public.is_business_member(business_id) and (user_id = pm.current_app_user_id() or pm.current_app_role() in ('Admin', 'Team Leader')));
