"use client";
import { createClient } from "@/lib/supabase/client";

const TOOL = "pm";

// Reports a failure the user ran into to the BizYep Monitor (platform-monitor)
// via public.log_tool_error. Fire and forget: never throws or blocks the UI.
export function reportError(operation: string, error: unknown) {
  try {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error);
    void createClient()
      .schema("public" as never)
      .rpc("log_tool_error" as never, { p_tool: TOOL, p_operation: operation, p_error: message } as never)
      .then(
        () => {},
        () => {},
      );
  } catch {
    /* monitoring is best effort */
  }
}
