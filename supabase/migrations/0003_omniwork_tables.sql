-- omniwork's own tables, ported from the old project's supabase/schema.sql.
--
-- Two deliberate deviations from that file:
--   1. Every table gains `business_id uuid not null references public.businesses(id)
--      on delete cascade` (including join tables) per the multi-tenant template.
--   2. All FK targets are fully qualified to `omniwork.*` (schema is no longer
--      implicit/public). Primary keys stay `text`, not `uuid` — see the plan's
--      "Design" section for why: the app's own id-generation and every insert
--      in lib/supabase/mutations.ts already pass explicit string ids.

create table omniwork.departments (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  icon text not null,
  code text not null,
  description text not null default '',
  status omniwork.active_status not null default 'Active',
  created_at timestamptz not null default now()
);

create table omniwork.users (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  auth_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  role omniwork.user_role,
  department_id text references omniwork.departments(id) on delete set null,
  status omniwork.active_status not null default 'Active',
  avatar text not null default '',
  title text not null default '',
  performance_score int not null default 0,
  phone text,
  team_leader_id text references omniwork.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table omniwork.projects (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  department_id text references omniwork.departments(id) on delete set null,
  description text not null default '',
  start_date date not null,
  deadline date not null,
  status omniwork.project_status not null default 'Planning',
  progress int not null default 0,
  leader_id text references omniwork.users(id) on delete set null,
  assignee_id text references omniwork.users(id) on delete set null,
  notes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table omniwork.project_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  project_id text not null references omniwork.projects(id) on delete cascade,
  user_id text not null references omniwork.users(id) on delete cascade,
  primary key (project_id, user_id)
);

create table omniwork.media_files (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  type omniwork.media_type not null,
  url text not null,
  size text not null default '',
  extension text not null default '',
  uploaded_by text not null default '',
  date_added date not null default current_date,
  project_id text references omniwork.projects(id) on delete cascade,
  department_id text references omniwork.departments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table omniwork.tasks (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  project_id text not null references omniwork.projects(id) on delete cascade,
  department_id text references omniwork.departments(id) on delete set null,
  category omniwork.task_category not null default 'daily',
  description text not null default '',
  priority omniwork.task_priority not null default 'Medium',
  status omniwork.task_status not null default 'Todo',
  progress int not null default 0,
  start_date date,
  start_time time,
  due_date date not null,
  due_time time,
  due_days int,
  assigned_to text references omniwork.users(id) on delete set null,
  milestones jsonb not null default '[]'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table omniwork.subtasks (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_id text not null references omniwork.tasks(id) on delete cascade,
  name text not null,
  owner_id text references omniwork.users(id) on delete set null,
  assigned_to text references omniwork.users(id) on delete set null,
  priority omniwork.task_priority not null default 'Medium',
  status omniwork.task_status not null default 'Todo',
  start_date date,
  due_date date,
  progress int not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table omniwork.task_comments (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_id text not null references omniwork.tasks(id) on delete cascade,
  user_name text not null,
  user_avatar text not null default '',
  text text not null,
  "timestamp" text not null,
  created_at timestamptz not null default now()
);

create table omniwork.task_submissions (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_id text not null references omniwork.tasks(id) on delete cascade,
  user_id text references omniwork.users(id) on delete set null,
  user_name text not null,
  date text not null,
  work_done text not null default '',
  notes text not null default '',
  status omniwork.submission_status not null default 'Pending',
  feedback text,
  created_at timestamptz not null default now()
);

create table omniwork.task_submission_attachments (
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_submission_id text not null references omniwork.task_submissions(id) on delete cascade,
  media_file_id text not null references omniwork.media_files(id) on delete cascade,
  primary key (task_submission_id, media_file_id)
);

create table omniwork.attendance (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id text not null references omniwork.users(id) on delete cascade,
  date date not null,
  check_in_time time not null,
  check_out_time time,
  status omniwork.attendance_status not null default 'Present',
  working_hours numeric,
  created_at timestamptz not null default now()
);

create table omniwork.notifications (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id text not null, -- 'all' or an omniwork.users.id; not FK-constrained because of the 'all' sentinel
  title text not null,
  message text not null,
  type omniwork.notification_type not null,
  time text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table omniwork.daily_worklogs (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id text not null references omniwork.users(id) on delete cascade,
  user_name text not null,
  date date not null,
  tasks_done text not null default '',
  problems text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table omniwork.daily_worklog_attachments (
  business_id uuid not null references public.businesses(id) on delete cascade,
  daily_worklog_id text not null references omniwork.daily_worklogs(id) on delete cascade,
  media_file_id text not null references omniwork.media_files(id) on delete cascade,
  primary key (daily_worklog_id, media_file_id)
);

-- Custom schemas aren't pre-granted to `authenticated` the way `public` is —
-- without this, every query below would 403 at the grant level before RLS
-- even gets evaluated.
grant select, insert, update, delete on all tables in schema omniwork to authenticated;
