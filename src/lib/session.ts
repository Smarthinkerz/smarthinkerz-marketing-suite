import { getSessionUser } from "@/lib/auth";
import { config } from "@/lib/config";
import type { SessionUser } from "@/lib/types";

/** Demo session used in setup mode so the dashboard is fully explorable. */
export const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "demo@smarthinkerz.com",
  fullName: "Demo Admin",
  role: "admin",
  tier: "enterprise",
  effectiveTier: "enterprise",
  status: "trialing",
  graceUntil: null,
  currentPeriodEnd: null,
  cycle: "monthly",
};

/**
 * Resolves the active dashboard user. Returns the real Supabase session when
 * configured, otherwise a demo user so screens render without live keys.
 */
export async function resolveUser(): Promise<SessionUser> {
  if (config.supabase.isConfigured) {
    const user = await getSessionUser();
    return user ?? DEMO_USER;
  }
  return DEMO_USER;
}

/** True when running without a real backend (setup/demo mode). */
export function isSetupMode(): boolean {
  return !config.supabase.isConfigured;
}
