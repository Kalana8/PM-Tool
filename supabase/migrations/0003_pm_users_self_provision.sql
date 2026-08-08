-- Lets a signed-in business member create their own first pm.users profile
-- row (role = null, "pending admin categorization") on first login, since
-- nothing today lets a brand-new member insert their own row: "leader add
-- users" only covers an Admin/Team Leader adding someone ELSE, and
-- "admin or self update users" only covers self-UPDATE, not self-INSERT.

create policy "self provision own profile" on pm.users for insert to authenticated
  with check (
    public.is_business_member(business_id)
    and auth_id = auth.uid()
    and role is null
  );
