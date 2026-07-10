-- OmniWork Enterprise Project & Employee Management — Supabase schema
-- Run this ENTIRE file once in the Supabase SQL Editor (Dashboard → SQL Editor → New query),
-- then run seed.sql, then see link-accounts.sql for the final auth-linking step.
--
-- Design note: every table keeps the same human-readable `text` id the app already
-- uses (e.g. 'dept-webdev', 'task-3', 'user-admin') instead of switching to uuid
-- primary keys. This lets seed.sql insert the app's existing demo data verbatim,
-- with all foreign keys intact, and requires zero changes to the app's existing
-- id-generation code (e.g. `task-new-${Date.now()}`).
--
-- Auth linking: `users.auth_id` is a nullable uuid that points at `auth.users.id`.
-- Only the users who should be able to log in ever get this set (see
-- link-accounts.sql). The other seeded demo users (e.g. Chloe Chen, Liam O'Connor)
-- exist purely as data — department members, task assignees — with no login.

-- ============================================================================
-- ENUMS
-- ============================================================================
create type user_role as enum ('Admin', 'Team Leader', 'Team Member');
create type active_status as enum ('Active', 'Inactive');
create type project_status as enum ('Planning', 'In Progress', 'In Review', 'Completed');
create type task_status as enum ('Todo', 'In Progress', 'Review', 'Completed', 'Cancelled');
create type task_priority as enum ('High', 'Medium', 'Low');
create type task_category as enum ('daily', 'continuous');
create type attendance_status as enum ('Present', 'Late', 'Half Day', 'Absent');
create type submission_status as enum ('Pending', 'Approved', 'Changes Requested');
create type media_type as enum ('image', 'video', 'document');
create type notification_type as enum (
  'task_assigned', 'task_completed', 'task_approved', 'task_rejected',
  'new_project', 'attendance', 'deadline'
);

-- ============================================================================
-- TABLES
-- ============================================================================

create table departments (
  id text primary key,
  name text not null,
  icon text not null,
  code text not null,
  description text not null default '',
  status active_status not null default 'Active',
  created_at timestamptz not null default now()
);

create table users (
  id text primary key,
  auth_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  role user_role not null,
  department_id text references departments(id) on delete set null,
  status active_status not null default 'Active',
  avatar text not null default '',
  title text not null default '',
  performance_score int not null default 0,
  phone text,
  team_leader_id text references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table projects (
  id text primary key,
  name text not null,
  department_id text references departments(id) on delete set null,
  description text not null default '',
  start_date date not null,
  deadline date not null,
  status project_status not null default 'Planning',
  progress int not null default 0,
  leader_id text references users(id) on delete set null,
  assignee_id text references users(id) on delete set null,
  notes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table project_members (
  project_id text not null references projects(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  primary key (project_id, user_id)
);

create table media_files (
  id text primary key,
  name text not null,
  type media_type not null,
  url text not null,
  size text not null default '',
  extension text not null default '',
  uploaded_by text not null default '',
  date_added date not null default current_date,
  project_id text references projects(id) on delete cascade,
  department_id text references departments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table tasks (
  id text primary key,
  name text not null,
  project_id text not null references projects(id) on delete cascade,
  department_id text references departments(id) on delete set null,
  category task_category not null default 'daily',
  description text not null default '',
  priority task_priority not null default 'Medium',
  status task_status not null default 'Todo',
  progress int not null default 0,
  start_date date,
  start_time time,
  due_date date not null,
  due_time time,
  due_days int,
  assigned_to text references users(id) on delete set null,
  milestones jsonb not null default '[]'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table subtasks (
  id text primary key,
  task_id text not null references tasks(id) on delete cascade,
  name text not null,
  owner_id text references users(id) on delete set null,
  assigned_to text references users(id) on delete set null,
  priority task_priority not null default 'Medium',
  status task_status not null default 'Todo',
  start_date date,
  due_date date,
  progress int not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table task_comments (
  id text primary key,
  task_id text not null references tasks(id) on delete cascade,
  user_name text not null,
  user_avatar text not null default '',
  text text not null,
  "timestamp" text not null,
  created_at timestamptz not null default now()
);

create table task_submissions (
  id text primary key,
  task_id text not null references tasks(id) on delete cascade,
  user_id text references users(id) on delete set null,
  user_name text not null,
  date text not null,
  work_done text not null default '',
  notes text not null default '',
  status submission_status not null default 'Pending',
  feedback text,
  created_at timestamptz not null default now()
);

create table task_submission_attachments (
  task_submission_id text not null references task_submissions(id) on delete cascade,
  media_file_id text not null references media_files(id) on delete cascade,
  primary key (task_submission_id, media_file_id)
);

create table attendance (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  date date not null,
  check_in_time time not null,
  check_out_time time,
  status attendance_status not null default 'Present',
  working_hours numeric,
  created_at timestamptz not null default now()
);

create table notifications (
  id text primary key,
  user_id text not null, -- 'all' or a users.id; not FK-constrained because of the 'all' sentinel
  title text not null,
  message text not null,
  type notification_type not null,
  time text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table daily_worklogs (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  user_name text not null,
  date date not null,
  tasks_done text not null default '',
  problems text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table daily_worklog_attachments (
  daily_worklog_id text not null references daily_worklogs(id) on delete cascade,
  media_file_id text not null references media_files(id) on delete cascade,
  primary key (daily_worklog_id, media_file_id)
);

-- ============================================================================
-- HELPER: look up the calling user's app role from their Supabase Auth uid
-- ============================================================================
create or replace function current_app_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where auth_id = auth.uid() limit 1;
$$;

create or replace function current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from users where auth_id = auth.uid() limit 1;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table departments enable row level security;
alter table users enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table media_files enable row level security;
alter table tasks enable row level security;
alter table subtasks enable row level security;
alter table task_comments enable row level security;
alter table task_submissions enable row level security;
alter table task_submission_attachments enable row level security;
alter table attendance enable row level security;
alter table notifications enable row level security;
alter table daily_worklogs enable row level security;
alter table daily_worklog_attachments enable row level security;

-- Baseline: any authenticated user can read everything. The app already computes
-- fine-grained per-role visibility client-side (visibleTasks, visibleDepartments,
-- etc. in app/page.tsx) — these read policies intentionally stay broad so that
-- logic keeps working unchanged. Writes are gated to roughly match the UI's own
-- role gates; this is a baseline, not a full re-derivation of every UI nuance.

create policy "read all" on departments for select to authenticated using (true);
create policy "read all" on users for select to authenticated using (true);
create policy "read all" on projects for select to authenticated using (true);
create policy "read all" on project_members for select to authenticated using (true);
create policy "read all" on media_files for select to authenticated using (true);
create policy "read all" on tasks for select to authenticated using (true);
create policy "read all" on subtasks for select to authenticated using (true);
create policy "read all" on task_comments for select to authenticated using (true);
create policy "read all" on task_submissions for select to authenticated using (true);
create policy "read all" on task_submission_attachments for select to authenticated using (true);
create policy "read all" on attendance for select to authenticated using (true);
create policy "read all" on notifications for select to authenticated using (true);
create policy "read all" on daily_worklogs for select to authenticated using (true);
create policy "read all" on daily_worklog_attachments for select to authenticated using (true);

-- Departments: Admin only (matches DepartmentsView's isAdmin-gated add/edit/delete)
create policy "admin write" on departments for insert to authenticated
  with check (current_app_role() = 'Admin');
create policy "admin update" on departments for update to authenticated
  using (current_app_role() = 'Admin');
create policy "admin delete" on departments for delete to authenticated
  using (current_app_role() = 'Admin');

-- Projects: Admin or Team Leader (matches canManageProjects in DepartmentsView/ProjectsView)
create policy "leader write" on projects for insert to authenticated
  with check (current_app_role() in ('Admin', 'Team Leader'));
create policy "leader update" on projects for update to authenticated
  using (current_app_role() in ('Admin', 'Team Leader'));
create policy "leader delete" on projects for delete to authenticated
  using (current_app_role() in ('Admin', 'Team Leader'));
create policy "leader manage members" on project_members for all to authenticated
  using (current_app_role() in ('Admin', 'Team Leader'))
  with check (current_app_role() in ('Admin', 'Team Leader'));

-- Users: Admin or Team Leader can add employees (matches UsersView); only Admin
-- (or the user themself) can update a profile row.
create policy "leader add users" on users for insert to authenticated
  with check (current_app_role() in ('Admin', 'Team Leader'));
create policy "admin or self update users" on users for update to authenticated
  using (current_app_role() = 'Admin' or auth_id = auth.uid());
create policy "admin delete users" on users for delete to authenticated
  using (current_app_role() = 'Admin');

-- Tasks/subtasks/comments/submissions/media/worklogs: open to any authenticated
-- user (the app already lets Team Members create/update their own tasks and
-- submit work; Team Leaders/Admins manage everything).
create policy "authenticated write" on tasks for insert to authenticated with check (true);
create policy "authenticated update" on tasks for update to authenticated using (true);
create policy "authenticated delete" on tasks for delete to authenticated using (true);

create policy "authenticated write" on subtasks for insert to authenticated with check (true);
create policy "authenticated update" on subtasks for update to authenticated using (true);
create policy "authenticated delete" on subtasks for delete to authenticated using (true);

create policy "authenticated write" on task_comments for insert to authenticated with check (true);
create policy "authenticated update" on task_comments for update to authenticated using (true);
create policy "authenticated delete" on task_comments for delete to authenticated using (true);

create policy "authenticated write" on task_submissions for insert to authenticated with check (true);
create policy "authenticated update" on task_submissions for update to authenticated using (true);
create policy "authenticated delete" on task_submissions for delete to authenticated using (true);

create policy "authenticated write" on task_submission_attachments for insert to authenticated with check (true);
create policy "authenticated delete" on task_submission_attachments for delete to authenticated using (true);

create policy "authenticated write" on media_files for insert to authenticated with check (true);
create policy "authenticated update" on media_files for update to authenticated using (true);
create policy "authenticated delete" on media_files for delete to authenticated using (true);

create policy "authenticated write" on daily_worklogs for insert to authenticated with check (true);
create policy "authenticated write" on daily_worklog_attachments for insert to authenticated with check (true);

create policy "authenticated write" on notifications for insert to authenticated with check (true);
create policy "authenticated update" on notifications for update to authenticated using (true);

-- Attendance: a user can only check themself in/out; Admin/Team Leader can also write.
create policy "self or leader write attendance" on attendance for insert to authenticated
  with check (user_id = current_app_user_id() or current_app_role() in ('Admin', 'Team Leader'));
create policy "self or leader update attendance" on attendance for update to authenticated
  using (user_id = current_app_user_id() or current_app_role() in ('Admin', 'Team Leader'));
