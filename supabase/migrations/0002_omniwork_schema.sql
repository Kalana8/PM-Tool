-- This app's own "apartment": a dedicated schema, separate from the shared
-- `public` lobby (0001) and from any other app that ends up sharing this
-- project later.

create schema omniwork;

grant usage on schema omniwork to authenticated;

create type omniwork.user_role as enum ('Admin', 'Team Leader', 'Team Member');
create type omniwork.active_status as enum ('Active', 'Inactive');
create type omniwork.project_status as enum ('Planning', 'In Progress', 'In Review', 'Completed');
create type omniwork.task_status as enum ('Todo', 'In Progress', 'Review', 'Completed', 'Cancelled');
create type omniwork.task_priority as enum ('High', 'Medium', 'Low');
create type omniwork.task_category as enum ('daily', 'continuous');
create type omniwork.attendance_status as enum ('Present', 'Late', 'Half Day', 'Absent');
create type omniwork.submission_status as enum ('Pending', 'Approved', 'Changes Requested');
create type omniwork.media_type as enum ('image', 'video', 'document');
create type omniwork.notification_type as enum (
  'task_assigned', 'task_completed', 'task_approved', 'task_rejected',
  'new_project', 'attendance', 'deadline'
);
