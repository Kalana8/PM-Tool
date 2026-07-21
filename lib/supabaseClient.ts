import { createClient } from '@supabase/supabase-js';

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
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'pm' }
});
