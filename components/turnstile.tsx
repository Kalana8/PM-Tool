"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile bot check. Once CAPTCHA protection is switched on in the
// Supabase dashboard, Supabase Auth rejects sign in, sign up, resend and
// password reset calls that don't carry a fresh token as `captchaToken`.
// Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so this can ship
// before the Supabase switch is flipped. Keep this file identical in every app.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Theme = "auto" | "light" | "dark";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

let script: Promise<void> | undefined;
function loadScript() {
  script ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      script = undefined;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return script;
}

function Widget({ onToken, theme }: { onToken: (token: string) => void; theme: Theme }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id: string | undefined;
    let gone = false;
    loadScript()
      .then(() => {
        if (gone || !box.current || !window.turnstile) return;
        id = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          theme,
          size: "flexible",
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => onToken(""));
    return () => {
      gone = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [onToken, theme]);

  return <div ref={box} />;
}

/**
 * `widget` goes in the form, `token` goes to Supabase as `captchaToken`, and
 * `ready` gates the submit button. Tokens are single use, so call `reset()`
 * after every attempt that sent one.
 */
export function useTurnstile(theme: Theme = "auto") {
  const [token, setToken] = useState("");
  const [round, setRound] = useState(0);
  return {
    token: token || undefined,
    ready: !SITE_KEY || !!token,
    reset: () => {
      setToken("");
      setRound((r) => r + 1);
    },
    widget: SITE_KEY ? <Widget key={round} onToken={setToken} theme={theme} /> : null,
  };
}
