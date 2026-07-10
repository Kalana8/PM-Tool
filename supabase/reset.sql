-- OmniWork — reset script. Only needed if schema.sql was already run (fully or
-- partially) and you need to start over, e.g. after a "type already exists" error.
-- Run this FIRST, then re-run schema.sql, then seed.sql.
--
-- Safe to run repeatedly: every statement uses IF EXISTS.

drop table if exists daily_worklog_attachments cascade;
drop table if exists daily_worklogs cascade;
drop table if exists notifications cascade;
drop table if exists attendance cascade;
drop table if exists task_submission_attachments cascade;
drop table if exists task_submissions cascade;
drop table if exists task_comments cascade;
drop table if exists subtasks cascade;
drop table if exists tasks cascade;
drop table if exists media_files cascade;
drop table if exists project_members cascade;
drop table if exists projects cascade;
drop table if exists users cascade;
drop table if exists departments cascade;

drop function if exists current_app_role() cascade;
drop function if exists current_app_user_id() cascade;

drop type if exists notification_type cascade;
drop type if exists media_type cascade;
drop type if exists submission_status cascade;
drop type if exists attendance_status cascade;
drop type if exists task_category cascade;
drop type if exists task_priority cascade;
drop type if exists task_status cascade;
drop type if exists project_status cascade;
drop type if exists active_status cascade;
drop type if exists user_role cascade;
