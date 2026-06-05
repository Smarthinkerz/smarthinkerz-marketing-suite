import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isAccessAllowed } from "@/lib/auth";
import { PLANS, tierHasTool, minTierForTool, type ToolKey } from "@/lib/plans";
import type { SessionUser } from "@/lib/types";

export interface GateResult {
  ok: boolean;
  user?: SessionUser;
  reason?: "unauthenticated" | "inactive" | "tier" | "limit";
  message?: string;
  requiredTier?: string;
  used?: number;
  limit?: number | null;
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Authorizes a tool action: verifies session, subscription standing, tier
 * access to the tool, and the monthly AI-generation quota. Returns a structured
 * result so the caller can render precise upsell/limit messaging.
 */
export async function gateToolAction(tool: ToolKey): Promise<GateResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "unauthenticated", message: "Please sign in to continue." };

  if (!isAccessAllowed(user)) {
    return {
      ok: false,
      user,
      reason: "inactive",
      message: "Your subscription is inactive. Update billing to regain access.",
    };
  }

  if (!tierHasTool(user.effectiveTier, tool)) {
    const required = minTierForTool(tool);
    return {
      ok: false,
      user,
      reason: "tier",
      requiredTier: required,
      message: `This tool requires the ${PLANS[required].name} plan or higher.`,
    };
  }

  const limit = PLANS[user.effectiveTier].aiGenerationLimit;
  if (limit !== null) {
    const used = await getMonthlyUsage(user.id);
    if (used >= limit) {
      return {
        ok: false,
        user,
        reason: "limit",
        used,
        limit,
        message: `You've reached your monthly AI limit (${limit}). Upgrade for more.`,
      };
    }
    return { ok: true, user, used, limit };
  }

  return { ok: true, user, limit: null };
}

/** Total AI generations used by a user in the current billing period. */
export async function getMonthlyUsage(userId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;
  const { data } = await supabase
    .from("usage_counters")
    .select("count")
    .eq("user_id", userId)
    .eq("period", currentPeriod());
  return (data ?? []).reduce((sum, row) => sum + (row.count as number), 0);
}

/** Records a generation: increments usage counter and stores history row. */
export async function recordGeneration(
  userId: string,
  tool: ToolKey,
  prompt: string,
  result: unknown,
): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  const period = currentPeriod();

  await supabase.from("ai_generations").insert({ user_id: userId, tool, prompt, result });

  // Atomic-ish upsert increment via RPC-free pattern.
  const { data: existing } = await supabase
    .from("usage_counters")
    .select("count")
    .eq("user_id", userId)
    .eq("period", period)
    .eq("tool", tool)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("usage_counters")
      .update({ count: (existing.count as number) + 1 })
      .eq("user_id", userId)
      .eq("period", period)
      .eq("tool", tool);
  } else {
    await supabase
      .from("usage_counters")
      .insert({ user_id: userId, period, tool, count: 1 });
  }
}
