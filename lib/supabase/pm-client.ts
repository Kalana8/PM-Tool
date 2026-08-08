"use client";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser client for this tool's data (mappers.ts/mutations.ts), typed
 * against the pm schema. createClient() is only typed <Database> (defaults
 * to "public") even though it's wired at runtime to NEXT_PUBLIC_TOOL_SCHEMA=pm
 * (see lib/supabase/client.ts, which we can't edit) — recast here so
 * .from(...) resolves against pm's tables instead of "never".
 */
export const supabase = createClient() as unknown as SupabaseClient<Database, "pm">;
