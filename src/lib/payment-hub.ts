import "server-only";
import crypto from "node:crypto";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";
import { PLANS, tierFromSlug, type Tier } from "@/lib/plans";
import {
  sendEmail,
  receiptEmail,
  gracePeriodEmail,
  churnEmail,
} from "@/lib/email";

/**
 * Canonical event shape emitted by the external Payment Hub. The hub posts a
 * JSON body and an HMAC-SHA256 signature header computed over the *raw* body
 * using the shared secret. We verify with a constant-time comparison and treat
 * every event as untrusted input until verified.
 */
export interface PaymentHubEvent {
  event_id: string;
  type:
    | "payment.success"
    | "payment.failed"
    | "subscription.cancelled"
    | "subscription.updated";
  data: {
    email?: string;
    user_id?: string;
    external_ref?: string;
    plan?: string; // plan slug, e.g. "smarthinkerz-pro"
    cycle?: "monthly" | "yearly";
    order_id?: string;
    charge_id?: string;
    amount?: number;
    currency?: string;
    grace_until?: string;
    period_end?: string;
  };
}

export const SIGNATURE_HEADER = "x-paymenthub-signature";

/** Compute the hex HMAC-SHA256 signature for a raw payload. */
export function computeSignature(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/** Constant-time signature verification. Accepts optional `sha256=` prefix. */
export function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = config.payments.webhookSecret;
  if (!secret || !signature) return false;
  const provided = signature.replace(/^sha256=/i, "").trim();
  const expected = computeSignature(rawBody, secret);
  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type ProcessResult =
  | { ok: true; status: "processed" | "duplicate" | "ignored"; detail?: string }
  | { ok: false; error: string };

/**
 * Idempotently applies a verified Payment Hub event to the subscription state.
 * Resolves the target user by user_id → external_ref → email. Uses the
 * service-role client because webhooks run without a user session.
 */
export async function processEvent(event: PaymentHubEvent): Promise<ProcessResult> {
  const supabase = createAdminClient();
  if (!supabase) return { ok: false, error: "Supabase service role not configured." };
  if (!event?.event_id || !event?.type) return { ok: false, error: "Malformed event." };

  // Idempotency: reject already-processed events.
  const { data: existing } = await supabase
    .from("processed_events")
    .select("event_id")
    .eq("event_id", event.event_id)
    .maybeSingle();
  if (existing) return { ok: true, status: "duplicate" };

  const userId = await resolveUserId(supabase, event);

  let detail = "no-op";
  if (userId) {
    switch (event.type) {
      case "payment.success":
        detail = await activatePlan(supabase, userId, event);
        break;
      case "subscription.updated":
        detail = await activatePlan(supabase, userId, event, /*silent*/ true);
        break;
      case "payment.failed":
        detail = await startGrace(supabase, userId, event);
        break;
      case "subscription.cancelled":
        detail = await revokePlan(supabase, userId, event);
        break;
      default:
        detail = "ignored-type";
    }
  } else {
    detail = "user-not-found";
  }

  // Record the event regardless so retries are idempotent.
  await supabase.from("processed_events").insert({
    event_id: event.event_id,
    event_type: event.type,
  });

  return { ok: true, status: userId ? "processed" : "ignored", detail };
}

async function resolveUserId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  event: PaymentHubEvent,
): Promise<string | null> {
  const { user_id, external_ref, email } = event.data;
  if (user_id) return user_id;
  if (external_ref) return external_ref;
  if (email) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    return data?.id ?? null;
  }
  return null;
}

function resolveTier(slug?: string): Tier {
  if (!slug) return "basic";
  return tierFromSlug(slug) ?? "basic";
}

async function activatePlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  event: PaymentHubEvent,
  silent = false,
): Promise<string> {
  const tier = resolveTier(event.data.plan);
  const periodEnd =
    event.data.period_end ??
    new Date(
      Date.now() + (event.data.cycle === "yearly" ? 365 : 30) * 86400000,
    ).toISOString();

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    tier,
    status: "active",
    cycle: event.data.cycle ?? "monthly",
    current_period_end: periodEnd,
    grace_until: null,
    hub_order_id: event.data.order_id ?? null,
    updated_at: new Date().toISOString(),
  });

  if (event.data.charge_id || event.data.amount) {
    await supabase.from("invoices").insert({
      user_id: userId,
      amount: event.data.amount ?? PLANS[tier].priceMonthly,
      currency: event.data.currency ?? "USD",
      status: "paid",
      hub_charge_id: event.data.charge_id ?? null,
    });
  }

  await supabase.from("analytics_events").insert({
    user_id: userId,
    type: "payment",
    meta: { tier, cycle: event.data.cycle ?? "monthly" },
  });

  if (!silent) {
    const email = await emailFor(supabase, userId, event);
    if (email) {
      const { subject, html } = receiptEmail(
        PLANS[tier].name,
        formatMoney(event.data.amount ?? PLANS[tier].priceMonthly, event.data.currency ?? "USD"),
      );
      await sendEmail({ to: email, subject, html });
    }
  }
  return `activated:${tier}`;
}

async function startGrace(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  event: PaymentHubEvent,
): Promise<string> {
  const graceUntil = event.data.grace_until ?? new Date(Date.now() + 3 * 86400000).toISOString();
  await supabase
    .from("subscriptions")
    .update({ status: "past_due", grace_until: graceUntil, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  const email = await emailFor(supabase, userId, event);
  if (email) {
    const { subject, html } = gracePeriodEmail(new Date(graceUntil).toLocaleDateString());
    await sendEmail({ to: email, subject, html });
  }
  return "grace-started";
}

async function revokePlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  event: PaymentHubEvent,
): Promise<string> {
  await supabase
    .from("subscriptions")
    .update({ status: "canceled", grace_until: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  await supabase.from("analytics_events").insert({ user_id: userId, type: "churn", meta: {} });

  const email = await emailFor(supabase, userId, event);
  if (email) {
    const { subject, html } = churnEmail();
    await sendEmail({ to: email, subject, html });
  }
  return "revoked";
}

async function emailFor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  event: PaymentHubEvent,
): Promise<string | null> {
  if (event.data.email) return event.data.email;
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
