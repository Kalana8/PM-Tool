-- Password reset flow: every admin-created/reset password is treated as
-- temporary — must_change_password forces a one-time password change on
-- first login (see components/ChangePasswordGate.tsx), after which the
-- stored pm.user_credentials row for that user is deleted (self-service,
-- via the new policy below), so the admin-visible "view credentials" icon
-- naturally disappears once the stored password is no longer accurate.
--
-- Also adds a notification type so an unauthenticated "forgot password"
-- request (app/api/[company]/forgot-password) can notify that business's
-- Admins in-app instead of relying on email-based reset infrastructure.

alter type pm.notification_type add value 'password_reset_request';

alter table pm.users add column must_change_password boolean not null default false;

-- Additive: OR'd with the existing "manage login holders access credentials"
-- policy (for(all)) — this only ever *adds* the ability for a user to
-- delete their own row, it doesn't restrict admin access to others' rows.
create policy "self delete own credentials" on pm.user_credentials for delete to authenticated
  using (exists (select 1 from pm.users u where u.id = user_credentials.user_id and u.auth_id = auth.uid()));
