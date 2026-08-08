"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Local development login. Hidden in production — real login lives on the portal. */
export default function DevLogin() {
  const [email, setEmail] = useState("dev@test.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const router = useRouter();

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Log in via the portal.
      </div>
    );
  }

  async function signIn() {
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return setError(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-80 space-y-3 rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="font-semibold">Dev login (local only)</h1>
        <input
          className="w-full rounded border border-neutral-300 p-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />
        <input
          className="w-full rounded border border-neutral-300 p-2 text-sm"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
        />
        <button
          onClick={signIn}
          className="w-full rounded bg-neutral-900 p-2 text-sm text-white hover:bg-neutral-700"
        >
          Sign in
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
