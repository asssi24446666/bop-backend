// Supabase client — server-side only, using the service role key
// (full access, bypasses row-level security). NEVER import this file
// or ship this key into the frontend. The frontend never talks to
// Supabase directly in this architecture; it only calls this backend.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/config/env.js";

let client: SupabaseClient | null = null;

/**
 * Returns a Supabase client, or null if SUPABASE_URL /
 * SUPABASE_SERVICE_ROLE_KEY aren't set. Callers must handle the null
 * case explicitly (return "not configured" to the API caller) rather
 * than crash — the app should run in LIVE ANALYSIS mode against a
 * market-data provider alone, with persistence simply unavailable,
 * rather than refuse to boot.
 */
export function getSupabase(): SupabaseClient | null {
  if (!config.supabase.isConfigured) return null;
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false }
    });
  }
  return client;
}
