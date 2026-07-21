-- Minimal shared "lobby" stub for the new multi-tenant Supabase project.
--
-- This is deliberately minimal: just enough for `business_id` foreign keys and
-- `public.is_business_member()` RLS checks (used by every table in the
-- `omniwork` schema, see 0003/0005) to be real and runnable today. A future
-- pass can extend this with a business switcher UI, invite flow, dev-login,
-- etc. without changing the shape of `businesses`/`business_members` that the
-- rest of the schema already depends on.
--
-- One business is seeded below ("9 Gens Group") since this app is
-- single-company today. `lib/constants.ts` hardcodes the same id as
-- CURRENT_BUSINESS_ID until real multi-business selection exists.

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create policy "members read their businesses" on public.businesses for select to authenticated
  using (id in (select business_id from public.business_members where user_id = auth.uid()));

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

alter table public.business_members enable row level security;

create policy "members read their own memberships" on public.business_members for select to authenticated
  using (user_id = auth.uid());

-- security definer: RLS policies elsewhere call this to check tenant membership
-- without needing their own policy on business_members to grant that read.
create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id and user_id = auth.uid()
  );
$$;

insert into public.businesses (id, name) values
  ('4cfd5f44-1ce8-45fb-af17-82c7b84a04eb', '9 Gens Group');
