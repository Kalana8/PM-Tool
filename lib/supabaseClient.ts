import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
}

// This app's tables live in the `pm` schema (shared with other apps' tables
// there), not `public` — every `.from(...)` call elsewhere in the app
// resolves against it without changes. `projects`/`tasks`/`task_comments`
// were renamed to `employee_projects`/`employee_tasks`/`employee_task_comments`
// to avoid colliding with pm's existing tables of those names.
// Schema now comes from NEXT_PUBLIC_TOOL_SCHEMA (source of truth, set to `pm`),
// falling back to `pm` so behaviour is unchanged if the env var is missing.
//
// Built with @supabase/ssr's createBrowserClient (not @supabase/supabase-js's
// createClient) so the session comes from the shared auth cookie — the same
// session the middleware and central portal use — instead of localStorage.
// cookieOptions.domain scopes it to the parent domain for cross-subdomain SSO.
const TOOL_SCHEMA = process.env.NEXT_PUBLIC_TOOL_SCHEMA ?? 'pm';
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: TOOL_SCHEMA },
  cookieOptions: { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined },
});
