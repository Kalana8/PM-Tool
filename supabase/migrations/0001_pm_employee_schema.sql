-- PM tool schema, part 1: employee/department/project-tracking tables.
--
-- pm already has projects/tasks/task_assignees/task_comments (different shape:
-- uuid PKs, generic status vocab, task_assignees join table) owned by another
-- app in this schema — those are left untouched. This app's equivalents are
-- added under employee_projects/employee_tasks/employee_task_comments to
-- avoid colliding, keeping this app's original text PKs (the app generates
-- its own ids client-side, e.g. `task-new-<timestamp>`, which aren't valid
-- uuids).
--
-- NOTE: this file's DDL is already applied on the shared dev database
-- (Supabase project uaifxlpiwuupwiqfyzvl) under its own migration history
-- (pm_employee_schema_types, pm_employee_schema_tables,
-- pm_employee_helpers_and_rls). This file exists for provenance/PR review
-- only — do not re-run it.

create type pm.user_role as enum ('Admin', 'Team Leader', 'Team Member');
create type pm.active_status as enum ('Active', 'Inactive');
create type pm.project_status as enum ('Planning', 'In Progress', 'In Review', 'Completed');
create type pm.task_status as enum ('Todo', 'In Progress', 'Review', 'Completed', 'Cancelled');
create type pm.task_priority as enum ('High', 'Medium', 'Low');
create type pm.task_category as enum ('daily', 'continuous');
create type pm.attendance_status as enum ('Present', 'Late', 'Half Day', 'Absent');
create type pm.submission_status as enum ('Pending', 'Approved', 'Changes Requested');
create type pm.media_type as enum ('image', 'video', 'document');
create type pm.notification_type as enum (
  'task_assigned', 'task_completed', 'task_approved', 'task_rejected',
  'new_project', 'attendance', 'deadline'
);

create table pm.departments (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  icon text not null,
  code text not null,
  description text not null default '',
  status pm.active_status not null default 'Active',
  created_at timestamptz not null default now()
);

create table pm.users (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  auth_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  role pm.user_role,
  department_id text references pm.departments(id) on delete set null,
  status pm.active_status not null default 'Active',
  avatar text not null default '',
  title text not null default '',
  performance_score int not null default 0,
  phone text,
  team_leader_id text references pm.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Renamed from 'projects' to avoid colliding with the existing pm.projects table.
create table pm.employee_projects (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  department_id text references pm.departments(id) on delete set null,
  description text not null default '',
  start_date date not null,
  deadline date not null,
  status pm.project_status not null default 'Planning',
  progress int not null default 0,
  leader_id text references pm.users(id) on delete set null,
  assignee_id text references pm.users(id) on delete set null,
  notes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table pm.project_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  project_id text not null references pm.employee_projects(id) on delete cascade,
  user_id text not null references pm.users(id) on delete cascade,
  primary key (project_id, user_id)
);

create table pm.media_files (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  type pm.media_type not null,
  url text not null,
  size text not null default '',
  extension text not null default '',
  uploaded_by text not null default '',
  date_added date not null default current_date,
  project_id text references pm.employee_projects(id) on delete cascade,
  department_id text references pm.departments(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Renamed from 'tasks' to avoid colliding with the existing pm.tasks table.
create table pm.employee_tasks (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  project_id text not null references pm.employee_projects(id) on delete cascade,
  department_id text references pm.departments(id) on delete set null,
  category pm.task_category not null default 'daily',
  description text not null default '',
  priority pm.task_priority not null default 'Medium',
  status pm.task_status not null default 'Todo',
  progress int not null default 0,
  start_date date,
  start_time time,
  due_date date not null,
  due_time time,
  due_days int,
  assigned_to text references pm.users(id) on delete set null,
  milestones jsonb not null default '[]'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table pm.subtasks (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_id text not null references pm.employee_tasks(id) on delete cascade,
  name text not null,
  owner_id text references pm.users(id) on delete set null,
  assigned_to text references pm.users(id) on delete set null,
  priority pm.task_priority not null default 'Medium',
  status pm.task_status not null default 'Todo',
  start_date date,
  due_date date,
  progress int not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Renamed from 'task_comments' to avoid colliding with the existing pm.task_comments table.
create table pm.employee_task_comments (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_id text not null references pm.employee_tasks(id) on delete cascade,
  user_name text not null,
  user_avatar text not null default '',
  text text not null,
  "timestamp" text not null,
  created_at timestamptz not null default now()
);

create table pm.task_submissions (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_id text not null references pm.employee_tasks(id) on delete cascade,
  user_id text references pm.users(id) on delete set null,
  user_name text not null,
  date text not null,
  work_done text not null default '',
  notes text not null default '',
  status pm.submission_status not null default 'Pending',
  feedback text,
  created_at timestamptz not null default now()
);

create table pm.task_submission_attachments (
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_submission_id text not null references pm.task_submissions(id) on delete cascade,
  media_file_id text not null references pm.media_files(id) on delete cascade,
  primary key (task_submission_id, media_file_id)
);

create table pm.attendance (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id text not null references pm.users(id) on delete cascade,
  date date not null,
  check_in_time time not null,
  check_out_time time,
  status pm.attendance_status not null default 'Present',
  working_hours numeric,
  created_at timestamptz not null default now()
);

create table pm.notifications (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id text not null, -- 'all' or a pm.users.id; not FK-constrained because of the 'all' sentinel
  title text not null,
  message text not null,
  type pm.notification_type not null,
  time text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table pm.daily_worklogs (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id text not null references pm.users(id) on delete cascade,
  user_name text not null,
  date date not null,
  tasks_done text not null default '',
  problems text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table pm.daily_worklog_attachments (
  business_id uuid not null references public.businesses(id) on delete cascade,
  daily_worklog_id text not null references pm.daily_worklogs(id) on delete cascade,
  media_file_id text not null references pm.media_files(id) on delete cascade,
  primary key (daily_worklog_id, media_file_id)
);

-- Grants are scoped to only the new tables above (not `all tables in schema
-- pm`) so the existing pm.projects/pm.tasks/pm.task_assignees/pm.task_comments
-- grants owned by the other app are left untouched.
grant select, insert, update, delete on
  pm.departments, pm.users, pm.employee_projects, pm.project_members, pm.media_files,
  pm.employee_tasks, pm.subtasks, pm.employee_task_comments, pm.task_submissions,
  pm.task_submission_attachments, pm.attendance, pm.notifications, pm.daily_worklogs,
  pm.daily_worklog_attachments
to authenticated;

-- Role-lookup helpers and RLS for the tables above.

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
