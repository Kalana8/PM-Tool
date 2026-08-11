"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Business {
  id: string;
  name: string;
  slug: string | null;
}

function BizYepMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 shrink-0">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" x2="21" y1="9" y2="9" />
      <line x1="9" x2="9" y1="21" y2="9" />
    </svg>
  );
}

export function LoginForm({ business }: { business: Business }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotDone, setForgotDone] = useState(false);

  async function signIn() {
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setLoading(false);
      setError(signInError?.message ?? "Failed to sign in.");
      return;
    }

    // Confirm this login actually belongs to *this* company — RLS
    // (is_business_member) means a non-member simply gets no row back here,
    // so a valid password for a different business's account doesn't land
    // someone in a business they don't belong to.
    const { data: membership } = await supabase
      .schema("public")
      .from("business_members")
      .select("business_id")
      .eq("business_id", business.id)
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!membership) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(`You don't have access to ${business.name} with this account.`);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-900 pb-4 mb-5">
          <BizYepMark />
          <div>
            <p className="text-sm font-extrabold tracking-tight text-gray-950 dark:text-gray-50">BizYep</p>
            <p className="text-[11px] text-gray-400">Sign in to {business.name}</p>
          </div>
        </div>

        {!showForgot ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
              <input
                id="login-email-input"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                type="email"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
              <input
                id="login-password-input"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && signIn()}
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              id="login-submit-btn"
              onClick={signIn}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-md shadow-blue-500/10 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <button
              id="forgot-password-link"
              type="button"
              onClick={() => {
                setShowForgot(true);
                setForgotEmail(email);
                setForgotPassword("");
                setForgotConfirm("");
                setForgotError("");
                setForgotDone(false);
              }}
              className="w-full text-center text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {forgotDone ? (
              <>
                <p className="text-xs text-emerald-600">Password updated — you can now sign in with it.</p>
                <button
                  id="back-to-login-link"
                  type="button"
                  onClick={() => {
                    setEmail(forgotEmail);
                    setPassword("");
                    setShowForgot(false);
                  }}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-md shadow-blue-500/10"
                >
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Enter your email and choose a new password for your account at {business.name}.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    id="forgot-email-input"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    type="email"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Password</label>
                  <input
                    id="forgot-new-password-input"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={forgotPassword}
                    onChange={(e) => setForgotPassword(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Confirm Password</label>
                  <input
                    id="forgot-confirm-password-input"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={forgotConfirm}
                    onChange={(e) => setForgotConfirm(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                {forgotError && <p className="text-xs text-red-600">{forgotError}</p>}

                <button
                  id="forgot-password-submit-btn"
                  type="button"
                  disabled={forgotLoading || !forgotEmail.trim() || forgotPassword.length < 6}
                  onClick={async () => {
                    setForgotError("");
                    if (forgotPassword !== forgotConfirm) {
                      setForgotError("Passwords do not match.");
                      return;
                    }
                    setForgotLoading(true);
                    try {
                      const res = await fetch(`/api/${business.slug}/forgot-password`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: forgotEmail.trim(), newPassword: forgotPassword })
                      });
                      const responseBody = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(responseBody.error || "Failed to reset password.");
                      setForgotDone(true);
                    } catch (err) {
                      setForgotError(err instanceof Error ? err.message : "Failed to reset password.");
                    } finally {
                      setForgotLoading(false);
                    }
                  }}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-md shadow-blue-500/10 disabled:opacity-60"
                >
                  {forgotLoading ? "Updating..." : "Set New Password"}
                </button>

                <button
                  id="back-to-login-link"
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full text-center text-[11px] font-semibold text-gray-500 hover:underline"
                >
                  Back to sign in
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
