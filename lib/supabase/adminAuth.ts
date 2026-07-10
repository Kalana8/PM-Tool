import 'server-only';
import { getSupabaseAdmin } from './adminClient';

// Verifies the bearer token on an incoming admin API request actually belongs to a
// signed-in Admin. Never trust a client-supplied role — always re-derive it server-side
// from the caller's own auth token.
export async function requireAdmin(request: Request): Promise<{ authId: string } | null> {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('auth_id', userData.user.id)
    .maybeSingle();
  if (profileError || !profile || profile.role !== 'Admin') return null;

  return { authId: userData.user.id };
}
