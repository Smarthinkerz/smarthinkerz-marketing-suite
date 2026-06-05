import { createClient } from "@/lib/supabase/server";
import type { SessionUser, SubscriptionStatus } from "@/lib/types";
import type { Tier } from "@/lib/plans";

/** True when the subscription entitles the user to their paid tier right now. */
export function isAccessAllowed(user: {
  status: SubscriptionStatus;
  graceUntil: string | null;
  currentPeriodEnd?: string | null;
}): boolean {
  if (user.status === "active" || user.status === "trialing") {
    // Active but past the period end with no renewal → treat as lapsed.
    if (user.currentPeriodEnd && new Date(user.currentPeriodEnd).getTime() < Date.now()) {
      // Still allow if within an explicit grace window.
      return user.graceUntil ? new Date(user.graceUntil).getTime() > Date.now() : true;
    }
    return true;
  }
  if (user.status === "past_due" && user.graceUntil) {
    return new Date(user.graceUntil).getTime() > Date.now();
  }
  return false;
}

/**
 * The tier we actually enforce. Equals the paid tier while access is allowed,
 * and falls back to the free "basic" tier once access lapses (canceled or
 * grace expired). Admins always keep full access for support purposes.
 */
export function computeEffectiveTier(
  tier: Tier,
  status: SubscriptionStatus,
  graceUntil: string | null,
  currentPeriodEnd: string | null,
  role: "subscriber" | "admin",
): Tier {
  if (role === "admin") return tier;
  return isAccessAllowed({ status, graceUntil, currentPeriodEnd }) ? tier : "basic";
}

/**
 * Resolves the currently authenticated user along with their profile role and
 * subscription tier/status. Returns null when not signed in or unconfigured.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const role: "subscriber" | "admin" = profile?.role === "admin" ? "admin" : "subscriber";
  const tier = (sub?.tier as Tier) ?? "basic";
  const status: SubscriptionStatus = (sub?.status as SubscriptionStatus) ?? "active";
  const graceUntil = sub?.grace_until ?? null;
  const currentPeriodEnd = sub?.current_period_end ?? null;

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? "",
    fullName: profile?.full_name ?? null,
    role,
    tier,
    effectiveTier: computeEffectiveTier(tier, status, graceUntil, currentPeriodEnd, role),
    status,
    graceUntil,
    currentPeriodEnd,
    cycle: (sub?.cycle as "monthly" | "yearly" | null) ?? null,
  };
}
