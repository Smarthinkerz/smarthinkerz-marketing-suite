import { createBrowserClient } from "@supabase/ssr";
import { config } from "@/lib/config";

/**
 * Browser-side Supabase client. Returns null when Supabase is not configured
 * so callers can render a setup notice instead of crashing.
 */
export function createClient() {
  if (!config.supabase.isConfigured) return null;
  return createBrowserClient(config.supabase.url!, config.supabase.anonKey!);
}
