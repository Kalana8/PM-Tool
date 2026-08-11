'use client';

import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { dbClearMustChangePassword, dbDeleteOwnCredentials } from '@/lib/supabase/mutations';

/**
 * Blocks access to the app until a user sets their own password, the first
 * time they sign in with an admin-set temporary one (see
 * app/page.tsx — rendered instead of <BizYepApp> while must_change_password
 * is true). Once set, the admin-visible temp password is deleted so it
 * stops showing up as "viewable" on the Users page.
 */
export function ChangePasswordGate({ userId, name }: { userId: string; name: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      await dbClearMustChangePassword(userId);
      await dbDeleteOwnCredentials(userId);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to set new password.');
      return;
    }

    window.location.reload();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-2.5 text-blue-600 dark:text-blue-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Set Your Password</h1>
            <p className="text-[10px] text-gray-400">Welcome, {name} — choose a new password to continue.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Password</label>
            <input
              id="new-password-input"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Confirm Password</label>
            <input
              id="confirm-password-input"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            id="submit-change-password-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-md shadow-blue-500/10 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
