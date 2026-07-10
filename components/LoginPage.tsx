'use client';

import React, { useState } from 'react';
import { Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  const resetFormState = () => {
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
  };

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setSignupMessage(null);
    resetFormState();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
    // On success, the onAuthStateChange listener in app/page.tsx picks up the
    // new session and renders the dashboard — no further action needed here.
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } }
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      // Auto-confirmed: the onAuthStateChange listener in app/page.tsx picks up the new
      // session, sees the account has no role assigned yet, and shows the pending screen.
      return;
    }

    // Email confirmation is required by this project's auth settings.
    setSignupMessage('Account created. Check your email to confirm it, then sign in below.');
    switchMode('signin');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 shrink-0">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="3" x2="21" y1="9" y2="9" />
            <line x1="9" x2="9" y1="21" y2="9" />
          </svg>
          <span className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">OMNIWORK</span>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-7 shadow-sm">
          {mode === 'signin' ? (
            <>
              <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Sign in to your workspace</h1>
              <p className="text-xs text-gray-400 mt-1 mb-6">
                Enter the credentials for your Admin, Team Leader, or Team Member account.
              </p>

              {signupMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5 text-[11px] text-emerald-600 dark:text-emerald-400 mb-4">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{signupMessage}</span>
                </div>
              )}

              <form id="login-form" onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="you@enterprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-3 py-2.5 text-[11px] text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 text-xs font-bold shadow-md shadow-blue-500/10 transition-colors"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-[11px] text-gray-400 mt-5">
                New here?{' '}
                <button
                  id="switch-to-signup-btn"
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-bold text-blue-600 hover:text-blue-700"
                >
                  Create an account
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Create your account</h1>
              <p className="text-xs text-gray-400 mt-1 mb-6">
                An administrator will assign your role and department before you can access the workspace.
              </p>

              <form id="signup-form" onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    id="signup-email-input"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="you@enterprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                  <input
                    id="signup-password-input"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Confirm Password</label>
                  <input
                    id="signup-confirm-password-input"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-3 py-2.5 text-[11px] text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 text-xs font-bold shadow-md shadow-blue-500/10 transition-colors"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              <p className="text-center text-[11px] text-gray-400 mt-5">
                Already have an account?{' '}
                <button
                  id="switch-to-signin-btn"
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-bold text-blue-600 hover:text-blue-700"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
