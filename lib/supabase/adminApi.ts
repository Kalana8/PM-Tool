// Client-safe wrappers around the privileged app/api/admin/** routes. These never touch the
// service-role key directly — they just forward the caller's own session token so the server
// route can re-verify (never trust the client) that the caller is actually an Admin.
import { supabase } from '../supabaseClient';
import type { User } from '../types';

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in.');
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function adminCreateUser(user: User, password: string): Promise<User> {
  const res = await fetch('/api/admin/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ user, password })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Failed to create employee login.');
  return body.user as User;
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const res = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? 'Failed to delete employee account.');
  }
}
