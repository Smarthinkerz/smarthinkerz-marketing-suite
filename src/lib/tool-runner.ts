import { gateToolAction } from "@/lib/usage";
import { recordGeneration } from "@/lib/usage";
import { isAiConfigured } from "@/lib/ai";
import { isSetupMode } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { ToolKey } from "@/lib/plans";

export interface ActionState<T = unknown> {
  status: "idle" | "success" | "error";
  data?: T;
  error?: string;
  /** Set when blocked by tier/limit so the UI can show an upgrade CTA. */
  upgrade?: { requiredTier?: string; reason: string };
  /** Set when AI keys are missing so the UI can show a setup notice. */
  setup?: boolean;
}

/**
 * Wraps a tool's AI logic with: tier/limit gating, setup-mode handling, and
 * usage recording. The `run` callback performs the actual AI generation and
 * returns the structured result that becomes `data`.
 */
export async function runToolAction<T>(
  tool: ToolKey,
  prompt: string,
  run: () => Promise<T>,
): Promise<ActionState<T>> {
  // In setup mode (no Supabase) we cannot meter usage; still require AI keys to
  // produce real output. Never fabricate results.
  if (!isAiConfigured()) {
    return {
      status: "error",
      setup: true,
      error:
        "AI is not configured yet. Add your OPENAI_API_KEY to enable live generation.",
    };
  }

  if (!isSetupMode()) {
    const gate = await gateToolAction(tool);
    if (!gate.ok) {
      return {
        status: "error",
        error: gate.message,
        upgrade:
          gate.reason === "tier" || gate.reason === "limit"
            ? { requiredTier: gate.requiredTier, reason: gate.reason }
            : undefined,
      };
    }

    // Burst protection: cap rapid-fire AI calls per user, independent of the
    // monthly quota, to prevent runaway cost from automated abuse.
    if (gate.user) {
      const rl = rateLimit(`ai:${gate.user.id}`, RATE_LIMITS.aiPerUser.limit, RATE_LIMITS.aiPerUser.windowMs);
      if (!rl.success) {
        return {
          status: "error",
          error: `Too many requests. Please wait ${Math.ceil(rl.resetMs / 1000)}s and try again.`,
        };
      }
    }
  }

  try {
    const data = await run();
    if (!isSetupMode()) {
      const gate = await gateToolAction(tool).catch(() => null);
      const userId = gate?.user?.id;
      if (userId) await recordGeneration(userId, tool, prompt, data);
    }
    return { status: "success", data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Generation failed. Please try again.";
    return { status: "error", error: message };
  }
}
