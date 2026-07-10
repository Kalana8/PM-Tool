-- Diagnostic + fix for "Database error creating new user" / "Database error saving new user".
-- This almost always means a trigger fires on every insert into auth.users and fails
-- (commonly a leftover `on_auth_user_created` trigger from a Supabase starter template
-- that tries to insert into a `public.profiles` table that doesn't exist in this project).
--
-- Run this WHOLE file in the SQL Editor. Step 1 shows you what's installed (read the
-- result). Step 2 removes the known common culprits — safe to run even if they don't
-- exist (IF EXISTS guards).

-- STEP 1: list every trigger currently attached to auth.users
select trigger_name, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'auth' and event_object_table = 'users';

-- STEP 2: drop the common default-template culprit, if present
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- STEP 3: re-run STEP 1's query alone afterward to confirm the trigger list is now
-- empty (or only shows triggers unrelated to a "profiles" table).
select trigger_name, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'auth' and event_object_table = 'users';
