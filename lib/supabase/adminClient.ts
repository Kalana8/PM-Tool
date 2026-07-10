import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Privileged client — bypasses RLS and can manage auth users. Only ever import this from
// server-side code (app/api/**/route.ts). The `server-only` import above makes any accidental
// import from client component code fail the build instead of silently bundling the secret.
//
// Built lazily (not at module load time) so that simply having this file in the project
// doesn't break `next build`/`next dev` for everyone else when SUPABASE_SERVICE_ROLE_KEY
// hasn't been configured yet — only the admin routes that actually call this fail, and only
// when they're actually invoked.
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return cached;
}
