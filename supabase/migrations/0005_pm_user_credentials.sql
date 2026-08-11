-- Stores the plaintext password for employees whose real Supabase Auth login
-- was created by an Admin (via app/api/admin/create-employee), so it can be
-- viewed/copied again later from the Users page.
--
-- This is a deliberate, explicitly-requested deviation from the normal
-- "never store retrievable plaintext credentials" practice — the product
-- requirement is that an Admin can view a created employee's password at any
-- time, not just once at creation. Access is restricted to the same
-- 'users.manage_login' action already gating the password field in the UI,
-- so a role that loses that permission also loses read access to previously
-- stored passwords.

create table pm.user_credentials (
  user_id text primary key references pm.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  password text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on pm.user_credentials to authenticated;

alter table pm.user_credentials enable row level security;

create policy "manage login holders access credentials" on pm.user_credentials for all to authenticated
  using (public.is_business_member(business_id) and pm.current_app_has_action('users.manage_login'))
  with check (public.is_business_member(business_id) and pm.current_app_has_action('users.manage_login'));
