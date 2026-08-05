import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client (anonymous, public role).
 * Used mainly for object storage (images). Guarded so the app works even
 * when Supabase env vars are not configured yet.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}
