-- Run this AFTER creating the 3 login accounts in
-- Supabase Dashboard → Authentication → Users → Add user.
--
-- Suggested accounts to create (any password you like, mark "Auto Confirm User"
-- so no email verification is required):
--   admin@enterprise.com   → will log in as Sarah Connor (Admin)
--   alex@enterprise.com    → will log in as Alex Rivera (Team Leader)
--   david@enterprise.com   → will log in as David Kim (Team Member)
-- (These are the same 3 demo emails already seeded in the `users` table, so no
-- new email address is required — just set a password for each in the dashboard.)
--
-- After creating them, copy each account's UUID (shown in the Users list) and
-- paste it below in place of the placeholders, then run this whole file.

update users set auth_id = '<PASTE-ADMIN-UUID-HERE>'   where id = 'user-admin';
update users set auth_id = '<PASTE-TEAM-LEADER-UUID>'  where id = 'user-leader-web';
update users set auth_id = '<PASTE-TEAM-MEMBER-UUID>'  where id = 'user-member-david';

-- Sanity check — should return exactly 3 rows, each with a non-null auth_id.
select id, name, role, auth_id from users where auth_id is not null;
