# 🟢 Beginner Guide — Building Your Tool (CRM / SMM)

Read this like a recipe. Follow steps in order. If anything is confusing, ask the lead — do NOT guess.

---

## 1. The Big Picture (2-minute read)

Think of our platform like an **apartment building**:

- 🏢 **The building** = one shared database (Supabase)
- 🚪 **The lobby** = shared stuff everyone uses: user accounts, businesses, team members. The building manager (lead) owns the lobby.
- 🏠 **Your apartment** = your own "schema" in the database. CRM dev owns the `crm` apartment. SMM dev owns the `smm` apartment.
- 🔑 **Keys** = login. Users get their key at the lobby (the portal website). Your app never gives out keys.

**Golden rule: You decorate YOUR apartment only. You never touch the lobby or anyone else's apartment.**

What you are actually building: a normal Next.js app (like any tutorial project), except:
1. You skip building login — it already works
2. Your tables live inside your schema (`crm` or `smm`)
3. Every table follows one copy-paste template

That's it. 90% of your work is normal UI + features.

---

## 2. Setup (Day 1 — should take under 1 hour)

The lead already created a **practice database just for you** (your own dev Supabase project). You can't break anything important — worst case, the lead resets it.

### Step 1 — Get these 4 things from the lead
1. Your repo link (starter template)
2. Your dev Supabase project login (email invite)
3. `.env.local` file contents
4. This guide

### Step 2 — Run the project
```bash
git clone <your-repo-link>
cd <project-folder>
pnpm install
# create a file called .env.local and paste what the lead gave you
pnpm dev
```
Open http://localhost:3000

### Step 3 — Log in with the test account
Go to `http://localhost:3000/dev-login` and sign in:
- Email: `dev@test.com`
- Password: `password123`

You should now see the app shell (sidebar, header, business name). ✅ You are ready.

### Step 4 — Connect your Supabase MCP
Point your Supabase MCP (in Claude Code) at YOUR dev project (the lead's invite). Now you can create tables, run SQL, and generate types like you normally do.

---

## 3. The Only 3 Rules

### Rule 1 — Auth is already done. Don't build any of it.
❌ No login page, no signup page, no logout logic, no password reset.
✅ To get the current user, copy this:

```ts
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

Also **never edit these files** (they make auth work):
- `middleware.ts`
- anything inside `lib/supabase/`

### Rule 2 — Every table you create uses this template. Copy-paste it.

```sql
create table crm.YOUR_TABLE_NAME (            -- ⚠️ smm. if you are the SMM dev
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  -- 👇 your own columns go here
  name text not null,
  -- 👆 your own columns end here
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table crm.YOUR_TABLE_NAME enable row level security;

create policy "members read"   on crm.YOUR_TABLE_NAME for select using (public.is_business_member(business_id));
create policy "members insert" on crm.YOUR_TABLE_NAME for insert with check (public.is_business_member(business_id));
create policy "members update" on crm.YOUR_TABLE_NAME for update using (public.is_business_member(business_id));
create policy "members delete" on crm.YOUR_TABLE_NAME for delete using (public.is_business_member(business_id));
```

Why: `business_id` + those policies = each business only sees its own data. You don't need to understand HOW yet — just never skip any line of the template.

### Rule 3 — Save every SQL you run into the repo.
Every time you create or change a table, save that exact SQL as a new file:

```
supabase/migrations/0001_create_contacts.sql
supabase/migrations/0002_add_deals.sql
supabase/migrations/0003_add_phone_to_contacts.sql
```

Number them in order. Never edit an old file — always add a new one.
This is how the lead copies your work to the real database. **SQL that isn't saved in a file = work that never reaches production.**

---

## 4. Daily Workflow (repeat for every feature)

1. **Pick a feature** from the task list (Zoho)
2. **Need a new table/column?** → Write SQL using the Rule 2 template → run it on YOUR dev project (via MCP or SQL editor) → save it as a numbered file in `supabase/migrations/`
3. **Regenerate types** (via your Supabase MCP, or ask the lead) into `types/database.ts`
4. **Build the UI** — query your tables like this:
   ```ts
   const supabase = await createClient()
   const { data } = await supabase.from('contacts').select()   // your schema is automatic
   ```
5. **Test it** while logged in as `dev@test.com`
6. **Extra test:** log in as the second test user `other@test.com` / `password123` (different business) → you must see NONE of the first user's data. If you see it, your RLS template is wrong — fix before PR.
7. **Push a branch + open a PR**: code + your migration files together
8. Lead reviews → merge → lead puts it live. You start the next feature.

---

## 5. Things That Will Get Your PR Rejected

- Creating a table WITHOUT `business_id` or WITHOUT the RLS policy lines
- SQL that touches `public.`, `pm.`, `auth.`, or the other developer's schema
- Editing `middleware.ts` or `lib/supabase/` files
- Tables created in your dev project but no matching file in `supabase/migrations/`
- Building any login/signup screen

If you're unsure whether something is allowed → ask BEFORE building it.

---

## 6. When To Ask the Lead (don't struggle alone)

Ask immediately if:
- You think you need a change to the shared tables (businesses, members, profiles)
- You need file/image uploads (lead creates the storage bucket for you)
- You need an external API key or any secret
- Login/session behaves weirdly
- You broke your dev database (it's fine — it happens — the lead resets it in 5 minutes)

Asking early = professional. Guessing = expensive.

---

## 7. Cheat Sheet

| I want to... | Do this |
|---|---|
| Get logged-in user | `const { data: { user } } = await supabase.auth.getUser()` |
| Query my table | `supabase.from('my_table').select()` |
| Read team members | `supabase.schema('public').from('business_members').select('user_id, role, profiles(full_name)')` |
| New table | Copy Rule 2 template → run → save file in `supabase/migrations/` |
| Log in locally | `/dev-login` → `dev@test.com` / `password123` |
| Test data isolation | Log in as `other@test.com` → must see nothing of business #1 |
