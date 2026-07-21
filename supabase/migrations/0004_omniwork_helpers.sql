-- Role-lookup helpers, ported from the old project's schema.sql (lines
-- 205-223), fully qualified to omniwork.users. Used by the RLS policies in
-- 0005 to gate writes by app role (Admin / Team Leader / Team Member),
-- separately from (and AND'd with) the business_id tenant check.

create or replace function omniwork.current_app_role()
returns omniwork.user_role
language sql
stable
security definer
set search_path = omniwork, public
as $$
  select role from omniwork.users where auth_id = auth.uid() limit 1;
$$;

create or replace function omniwork.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = omniwork, public
as $$
  select id from omniwork.users where auth_id = auth.uid() limit 1;
$$;
