import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { config } from "@/lib/config";

/**
 * Server Supabase client bound to the request cookies (RLS-aware).
 * Returns null when Supabase is not configured.
 */
export async function createClient() {
  if (!config.supabase.isConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient(config.supabase.url!, config.supabase.anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // called from a Server Component — safe to ignore, middleware refreshes
        }
      },
    },
  });
}

/**
 * Service-role client that bypasses RLS. Server-only, used for admin
 * operations and webhook provisioning. Never import in client code.
 */
export function createAdminClient() {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) return null;
  return createServiceClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
