-- RLS for every omniwork table, ported from the old project's schema.sql
-- (lines 228-329). Every policy — reads included — is AND'd with
-- `public.is_business_member(business_id)`: the old "read all" policies were
-- `using (true)` because there was only one tenant; without adding the
-- business check to *reads* too, any authenticated member of ANY business
-- could read every other business's rows, which would defeat the whole
-- point of business_id. Role gating (Admin / Team Leader / etc.) is
-- preserved unchanged as an additional AND on top.

alter table omniwork.departments enable row level security;
alter table omniwork.users enable row level security;
alter table omniwork.projects enable row level security;
alter table omniwork.project_members enable row level security;
alter table omniwork.media_files enable row level security;
alter table omniwork.tasks enable row level security;
alter table omniwork.subtasks enable row level security;
alter table omniwork.task_comments enable row level security;
alter table omniwork.task_submissions enable row level security;
alter table omniwork.task_submission_attachments enable row level security;
alter table omniwork.attendance enable row level security;
alter table omniwork.notifications enable row level security;
alter table omniwork.daily_worklogs enable row level security;
alter table omniwork.daily_worklog_attachments enable row level security;

-- Reads: any member of the business can read that business's rows. The app
-- already computes fine-grained per-role visibility client-side
-- (visibleTasks, visibleDepartments, etc. in app/page.tsx) — these read
-- policies intentionally stay broad within a business, matching the old
-- project's "read all" baseline.
create policy "members read" on omniwork.departments for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.users for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.projects for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.project_members for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.media_files for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.tasks for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.subtasks for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.task_comments for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.task_submissions for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.task_submission_attachments for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.attendance for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.notifications for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.daily_worklogs for select to authenticated
  using (public.is_business_member(business_id));
create policy "members read" on omniwork.daily_worklog_attachments for select to authenticated
  using (public.is_business_member(business_id));

-- Departments: Admin only (matches DepartmentsView's isAdmin-gated add/edit/delete)
create policy "admin write" on omniwork.departments for insert to authenticated
  with check (public.is_business_member(business_id) and omniwork.current_app_role() = 'Admin');
create policy "admin update" on omniwork.departments for update to authenticated
  using (public.is_business_member(business_id) and omniwork.current_app_role() = 'Admin');
create policy "admin delete" on omniwork.departments for delete to authenticated
  using (public.is_business_member(business_id) and omniwork.current_app_role() = 'Admin');

-- Projects: Admin or Team Leader (matches canManageProjects in DepartmentsView/ProjectsView)
create policy "leader write" on omniwork.projects for insert to authenticated
  with check (public.is_business_member(business_id) and omniwork.current_app_role() in ('Admin', 'Team Leader'));
create policy "leader update" on omniwork.projects for update to authenticated
  using (public.is_business_member(business_id) and omniwork.current_app_role() in ('Admin', 'Team Leader'));
create policy "leader delete" on omniwork.projects for delete to authenticated
  using (public.is_business_member(business_id) and omniwork.current_app_role() in ('Admin', 'Team Leader'));
create policy "leader manage members" on omniwork.project_members for all to authenticated
  using (public.is_business_member(business_id) and omniwork.current_app_role() in ('Admin', 'Team Leader'))
  with check (public.is_business_member(business_id) and omniwork.current_app_role() in ('Admin', 'Team Leader'));

-- Users: Admin or Team Leader can add employees (matches UsersView); only Admin
-- (or the user themself) can update a profile row.
create policy "leader add users" on omniwork.users for insert to authenticated
  with check (public.is_business_member(business_id) and omniwork.current_app_role() in ('Admin', 'Team Leader'));
create policy "admin or self update users" on omniwork.users for update to authenticated
  using (public.is_business_member(business_id) and (omniwork.current_app_role() = 'Admin' or auth_id = auth.uid()));
create policy "admin delete users" on omniwork.users for delete to authenticated
  using (public.is_business_member(business_id) and omniwork.current_app_role() = 'Admin');

-- Tasks/subtasks/comments/submissions/media/worklogs: open to any authenticated
-- member of the business (the app already lets Team Members create/update
-- their own tasks and submit work; Team Leaders/Admins manage everything).
create policy "members write" on omniwork.tasks for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on omniwork.tasks for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on omniwork.tasks for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on omniwork.subtasks for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on omniwork.subtasks for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on omniwork.subtasks for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on omniwork.task_comments for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on omniwork.task_comments for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on omniwork.task_comments for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on omniwork.task_submissions for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on omniwork.task_submissions for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on omniwork.task_submissions for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on omniwork.task_submission_attachments for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members delete" on omniwork.task_submission_attachments for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on omniwork.media_files for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on omniwork.media_files for update to authenticated
  using (public.is_business_member(business_id));
create policy "members delete" on omniwork.media_files for delete to authenticated
  using (public.is_business_member(business_id));

create policy "members write" on omniwork.daily_worklogs for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members write" on omniwork.daily_worklog_attachments for insert to authenticated
  with check (public.is_business_member(business_id));

create policy "members write" on omniwork.notifications for insert to authenticated
  with check (public.is_business_member(business_id));
create policy "members update" on omniwork.notifications for update to authenticated
  using (public.is_business_member(business_id));

-- Attendance: a user can only check themself in/out; Admin/Team Leader can also write.
create policy "self or leader write attendance" on omniwork.attendance for insert to authenticated
  with check (public.is_business_member(business_id) and (user_id = omniwork.current_app_user_id() or omniwork.current_app_role() in ('Admin', 'Team Leader')));
create policy "self or leader update attendance" on omniwork.attendance for update to authenticated
  using (public.is_business_member(business_id) and (user_id = omniwork.current_app_user_id() or omniwork.current_app_role() in ('Admin', 'Team Leader')));
