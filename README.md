# Project Management

Part of the business tools platform. One shared database, one login, separate tools.

## Start here
1. Read **BEGINNER_DEV_GUIDE.md** (in this repo) fully before writing code.
2. `pnpm install`
3. Create `.env.local` from `.env.example` (values from the lead)
4. `pnpm dev` → opens redirect to `/dev-login` → sign in with the test user
5. Build your features. Every schema change = a numbered file in `supabase/migrations/`.

## Never touch
- `middleware.ts`, `lib/supabase/*` (auth — managed by lead)
- `public.*`, `auth.*`, or other tools' schemas in any SQL

## Note for the PM developer
You already built this tool once (Tracking-System). Your job here:
1. Re-create your tables inside the `pm` schema (starter tables `projects`, `tasks`,
   `task_assignees`, `task_comments` already exist — extend/alter them via migration
   files to match your real structure)
2. Port your pages/components into this repo, inside the app shell
3. Delete your old login/register pages — auth comes from this template
4. Every schema change = numbered migration file, same rules as everyone
