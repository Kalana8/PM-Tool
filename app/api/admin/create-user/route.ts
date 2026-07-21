import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase/adminClient';
import { requireAdmin } from '../../../../lib/supabase/adminAuth';
import { CURRENT_BUSINESS_ID } from '../../../../lib/constants';
import type { User } from '../../../../lib/types';

export async function POST(request: Request) {
  const caller = await requireAdmin(request);
  if (!caller) {
    return NextResponse.json({ error: 'Only an administrator can create employee logins.' }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const body = (await request.json()) as { user: User; password: string };
  const { user, password } = body;

  if (!user?.email || !password || password.length < 6) {
    return NextResponse.json({ error: 'A valid email and a password of at least 6 characters are required.' }, { status: 400 });
  }

  const { data: createdAuth, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { name: user.name }
  });

  if (createAuthError || !createdAuth.user) {
    return NextResponse.json({ error: createAuthError?.message ?? 'Failed to create login.' }, { status: 400 });
  }

  const { error: insertError } = await supabaseAdmin.from('users').insert({
    id: user.id,
    business_id: CURRENT_BUSINESS_ID,
    auth_id: createdAuth.user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.departmentId,
    status: user.status,
    avatar: user.avatar,
    title: user.title,
    performance_score: user.performanceScore,
    phone: user.phone ?? null,
    team_leader_id: user.teamLeaderId ?? null
  });

  if (insertError) {
    // Roll back the auth account so we don't leave an orphaned login with no profile.
    await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  // A user created here (unlike self-signup) never goes through a signup
  // trigger, so the business_members row that makes them pass
  // is_business_member() has to be created explicitly.
  const { error: membershipError } = await supabaseAdmin
    .schema('public')
    .from('business_members')
    .insert({ business_id: CURRENT_BUSINESS_ID, user_id: createdAuth.user.id, role: 'member' });

  if (membershipError) {
    // Roll back both the profile row and the auth account.
    await supabaseAdmin.from('users').delete().eq('id', user.id);
    await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
    return NextResponse.json({ error: membershipError.message }, { status: 400 });
  }

  return NextResponse.json({ user });
}
