import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True once NEXT_PUBLIC_SUPABASE_URL and the anon key are set. */
export const supabaseConfigured = Boolean(url && anonKey);

/** True once the service-role key is set — required to read/write orders. */
export const supabaseAdminConfigured = Boolean(url && serviceKey);

let readClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/** Public catalogue reads. Returns null when Supabase is not configured. */
export function supabaseRead(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  readClient ??= createClient(url!, anonKey!, {
    auth: { persistSession: false },
  });
  return readClient;
}

/**
 * Server-only client that bypasses RLS. Used by the admin panel and by the
 * order endpoint. Never import this into a client component.
 */
export function supabaseAdmin(): SupabaseClient | null {
  if (!supabaseAdminConfigured) return null;
  adminClient ??= createClient(url!, serviceKey!, {
    auth: { persistSession: false },
  });
  return adminClient;
}
