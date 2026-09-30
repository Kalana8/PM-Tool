import { createClient } from "@supabase/supabase-js";

const TOOL = "pm";

// Reports a server-side failure to the BizYep Monitor (platform-monitor) via
// public.log_tool_error. Best effort: never throws, so reporting can't break
// the request that failed.
export async function reportServerError(operation: string, error: unknown) {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const message = error instanceof Error ? error.message : String(error);
    await db.rpc("log_tool_error", { p_tool: TOOL, p_operation: operation, p_error: message });
  } catch {
    /* monitoring is best effort */
  }
}
