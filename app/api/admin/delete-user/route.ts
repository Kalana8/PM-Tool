import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase/adminClient';
import { requireAdmin } from '../../../../lib/supabase/adminAuth';

export async function POST(request: Request) {
  const caller = await requireAdmin(request);
  if (!caller) {
    return NextResponse.json({ error: 'Only an administrator can delete employee accounts.' }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { userId } = (await request.json()) as { userId: string };
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId.' }, { status: 400 });
  }

  const { data: target, error: lookupError } = await supabaseAdmin
    .from('users')
    .select('auth_id')
    .eq('id', userId)
    .maybeSingle();
  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 400 });
  }

  if (target?.auth_id) {
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(target.auth_id);
    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 400 });
    }
  }

  const { error: deleteProfileError } = await supabaseAdmin.from('users').delete().eq('id', userId);
  if (deleteProfileError) {
    return NextResponse.json({ error: deleteProfileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
