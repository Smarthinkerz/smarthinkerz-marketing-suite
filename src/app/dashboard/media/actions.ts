"use server";

import { generateImage, isAiConfigured } from "@/lib/ai";
import { gateToolAction, recordGeneration } from "@/lib/usage";
import { isSetupMode } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export interface MediaResult {
  ok: boolean;
  url?: string;
  error?: string;
  setup?: boolean;
  upgrade?: boolean;
}

const SIZES: Record<string, "1024x1024" | "1792x1024" | "1024x1792"> = {
  square: "1024x1024",
  landscape: "1792x1024",
  portrait: "1024x1792",
};

export async function generateMedia(input: {
  prompt: string;
  style: string;
  aspect: string;
}): Promise<MediaResult> {
  if (!isAiConfigured()) {
    return { ok: false, setup: true, error: "AI image generation is not configured yet." };
  }

  let userId: string | undefined;
  if (!isSetupMode()) {
    const gate = await gateToolAction("media");
    if (!gate.ok) {
      return {
        ok: false,
        error: gate.message,
        upgrade: gate.reason === "tier" || gate.reason === "limit",
      };
    }
    userId = gate.user?.id;
    if (userId) {
      const rl = rateLimit(`ai:${userId}`, RATE_LIMITS.aiPerUser.limit, RATE_LIMITS.aiPerUser.windowMs);
      if (!rl.success) {
        return { ok: false, error: `Too many requests. Please wait ${Math.ceil(rl.resetMs / 1000)}s.` };
      }
    }
  }

  const fullPrompt = `${input.prompt}. Style: ${input.style}. High quality, professional marketing visual.`;
  const size = SIZES[input.aspect] ?? "1024x1024";

  try {
    const url = await generateImage(fullPrompt, size);
    if (userId) await recordGeneration(userId, "media", fullPrompt, { url });
    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Image generation failed.",
    };
  }
}
