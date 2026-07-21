-- Moves this app's tables from their own `omniwork` schema into the shared
-- `pm` schema (see 0011, which drops `omniwork`). `pm` already has its own
-- `projects`/`tasks`/`task_comments` tables (different shape: uuid PKs,
-- generic status vocab, task_assignees join table) owned by another app —
-- those are left untouched. This app's equivalents are added under
-- `employee_projects`/`employee_tasks`/`employee_task_comments` to avoid
-- colliding, keeping this app's original `text` PKs (the app generates its
-- own ids client-side, e.g. `task-new-<timestamp>`, which aren't valid uuids).

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
