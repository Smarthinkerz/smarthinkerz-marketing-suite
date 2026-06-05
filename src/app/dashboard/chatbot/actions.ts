"use server";

import { generateText, isAiConfigured } from "@/lib/ai";
import { gateToolAction } from "@/lib/usage";
import { isSetupMode } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export interface ChatReply {
  ok: boolean;
  reply?: string;
  error?: string;
  setup?: boolean;
  upgrade?: boolean;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Stateless chatbot reply. The client maintains the transcript and sends the
 * persona + recent turns each time. Gated by tier when Supabase is configured.
 */
export async function sendChat(input: {
  persona: string;
  business: string;
  history: ChatTurn[];
  message: string;
}): Promise<ChatReply> {
  if (!isAiConfigured()) {
    return { ok: false, setup: true, error: "AI is not configured yet." };
  }

  if (!isSetupMode()) {
    const gate = await gateToolAction("chatbot");
    if (!gate.ok) {
      return {
        ok: false,
        error: gate.message,
        upgrade: gate.reason === "tier" || gate.reason === "limit",
      };
    }
    if (gate.user) {
      const rl = rateLimit(`ai:${gate.user.id}`, RATE_LIMITS.aiPerUser.limit, RATE_LIMITS.aiPerUser.windowMs);
      if (!rl.success) {
        return { ok: false, error: `Too many requests. Please wait ${Math.ceil(rl.resetMs / 1000)}s.` };
      }
    }
  }

  const transcript = input.history
    .slice(-8)
    .map((t) => `${t.role === "user" ? "Customer" : "Assistant"}: ${t.content}`)
    .join("\n");

  try {
    const reply = await generateText({
      system: `You are a helpful customer-service chatbot for the following business: ${input.business || "a company"}. Persona/instructions: ${input.persona || "Friendly, concise, professional."}. Answer customer questions accurately and concisely. If you don't know, offer to connect them with a human.`,
      prompt: `${transcript ? transcript + "\n" : ""}Customer: ${input.message}\nAssistant:`,
      temperature: 0.6,
      maxTokens: 500,
    });
    return { ok: true, reply };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to get a reply.",
    };
  }
}
