"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { config } from "@/lib/config";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

/** Escapes user input before embedding it in notification HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function submitContact(input: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fill in all fields with valid values." };
  }

  // Abuse protection keyed by client IP (best-effort behind proxies).
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`contact:${ip}`, RATE_LIMITS.contactPerIp.limit, RATE_LIMITS.contactPerIp.windowMs);
  if (!rl.success) {
    return {
      ok: false,
      error: `Too many submissions. Please wait ${Math.ceil(rl.resetMs / 1000)}s and try again.`,
    };
  }

  const { name, email, message } = parsed.data;

  const result = await sendEmail({
    to: config.resend.fromEmail,
    subject: `New contact form submission from ${name}`,
    html: `<p><strong>Name:</strong> ${esc(name)}</p><p><strong>Email:</strong> ${esc(email)}</p><p><strong>Message:</strong></p><p>${esc(message).replace(/\n/g, "<br/>")}</p>`,
    replyTo: email,
  });

  // When email isn't configured yet (setup mode) we still acknowledge the user
  // so the flow is never a dead end; the submission is simply not delivered.
  if (!result.delivered && !result.skipped) {
    return { ok: false, error: "We couldn't send your message right now. Please email us directly." };
  }

  return { ok: true };
}
