/**
 * Tap Payments Webhook Handler
 * POST /api/webhooks/tap
 *
 * This is the authoritative payment confirmation endpoint.
 * Tap POSTs here after every charge event.
 *
 * Verification: HMAC-SHA256 over the hashstring (see spec).
 * Idempotency: processed_tap_events table prevents double-processing.
 *
 * NEVER run on Edge — requires Node crypto and Supabase service role.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";
import { resolveTrack, tierFromTrackSlug } from "@/lib/plans";
import type { Tier } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Tap charge event shape (subset we care about)
// ---------------------------------------------------------------------------

interface TapChargeEvent {
  id: string;         // charge ID e.g. chg_xxxxxxx
  status: string;     // CAPTURED | FAILED | DECLINED | CANCELLED | ABANDONED | REFUNDED
  amount: number;     // in fils
  currency: string;
  description?: string;
  metadata?: {
    userId?: string;
    /** SmarThinkerz Academy scheme: canonical track slug e.g. "6-month-professional" */
    trackSlug?: string;
    installmentCount?: string;
    platform?: string;
    /** Legacy fields — kept for backward compat */
    planKey?: string;
    tier?: string;
    cycle?: string;
  };
  reference?: {
    gateway?: string;
    payment?: string;
  };
  transaction?: {
    created?: string;
  };
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 hashstring verification (per Tap spec)
// ---------------------------------------------------------------------------

/**
 * Builds the hashstring exactly as Tap documents:
 *   "x_id"                + charge.id
 *   "x_amount"            + charge.amount
 *   "x_currency"          + charge.currency
 *   "x_gateway_reference" + charge.reference.gateway
 *   "x_payment_reference" + charge.reference.payment
 *   "x_status"            + charge.status
 *   "x_created"           + charge.transaction.created
 */
function buildHashString(charge: TapChargeEvent): string {
  return (
    "x_id" + (charge.id ?? "") +
    "x_amount" + (charge.amount ?? "") +
    "x_currency" + (charge.currency ?? "") +
    "x_gateway_reference" + (charge.reference?.gateway ?? "") +
    "x_payment_reference" + (charge.reference?.payment ?? "") +
    "x_status" + (charge.status ?? "") +
    "x_created" + (charge.transaction?.created ?? "")
  );
}

function verifyTapSignature(charge: TapChargeEvent, receivedHash: string): boolean {
  const secret = config.tap.webhookSecret;
  if (!secret) return false;

  const hashString = buildHashString(charge);
  const computed = createHmac("sha256", secret)
    .update(hashString)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(receivedHash, "hex"),
    );
  } catch {
    // Buffer lengths differ — definitely invalid
    return false;
  }
}

// ---------------------------------------------------------------------------
// Supabase service-role client (bypasses RLS for webhook writes)
// ---------------------------------------------------------------------------

function getServiceClient() {
  const url = config.supabase.url;
  const key = config.supabase.serviceRoleKey;
  if (!url || !key) throw new Error("Supabase service role not configured.");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCaptured(charge: TapChargeEvent): Promise<string> {
  const supabase = getServiceClient();
  const meta = charge.metadata ?? {};

  // 1. Look up the pending charge record to get user/plan details
  const { data: pending } = await supabase
    .from("tap_pending_charges")
    .select("*")
    .eq("tap_charge_id", charge.id)
    .maybeSingle();

  // Resolve userId — prefer DB record, fall back to metadata
  const userId = pending?.user_id ?? meta.userId;
  if (!userId) {
    console.error("[tap-webhook] CAPTURED: no userId found for charge", charge.id);
    return "error:no-user-id";
  }

  // Resolve plan details — prefer SmarThinkerz Academy trackSlug scheme
  const trackSlug = meta.trackSlug ?? pending?.plan_key ?? meta.planKey ?? "";
  const installmentCount = pending?.installment_count ?? parseInt(meta.installmentCount ?? "1", 10);
  const installmentAmount = pending?.installment_amount ?? (charge.amount / 100 / installmentCount);
  const totalAmountAed = pending?.total_amount_aed ?? (charge.amount / 100);

  // Resolve internal tier from track slug (SmarThinkerz Academy scheme)
  const resolvedTierFromTrack = tierFromTrackSlug(trackSlug);
  const legacyTierRaw = pending?.tier ?? meta.tier ?? "";
  const tier: Tier = resolvedTierFromTrack ?? (legacyTierRaw as Tier) ?? "basic";

  // Resolve track for duration-based period end
  const track = resolveTrack(trackSlug);
  const durationMonths = track?.durationMonths ?? 1;

  // 2. Calculate period end per spec:
  //    - Full payment: currentPeriodEnd = now + durationMonths (365 days for 12-month, etc.)
  //    - Installment:  currentPeriodEnd = now + 30 days per payment
  const now = new Date();
  const periodEnd = new Date(now);
  if (installmentCount > 1) {
    // Installment: each captured payment extends access by 30 days
    periodEnd.setDate(periodEnd.getDate() + 30);
  } else {
    // Pay in full: extend by the full track duration
    periodEnd.setDate(periodEnd.getDate() + durationMonths * 30);
  }

  // 3. Upsert subscription — activate or increment installments_paid
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("installments_paid, ai_token_budget")
    .eq("user_id", userId)
    .maybeSingle();

  const newInstallmentsPaid = (existingSub?.installments_paid ?? 0) + 1;
  // 10% of each payment allocated to AI token budget
  const tokenBudgetIncrement = totalAmountAed * 0.1;
  const newTokenBudget = (existingSub?.ai_token_budget ?? 0) + tokenBudgetIncrement;

  // Derive cycle label from track duration
  const cycleLabel = track ? `${track.durationMonths}-month` : (pending?.cycle ?? "monthly");

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    tier,
    status: "active",
    cycle: cycleLabel,
    plan_key: trackSlug,
    tap_pay_ref: charge.id,
    installment_count: installmentCount,
    installments_paid: newInstallmentsPaid,
    installment_amount: installmentAmount,
    total_amount_aed: totalAmountAed,
    ai_token_budget: newTokenBudget,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    grace_until: null,
    updated_at: now.toISOString(),
  });

  // 4. Record invoice
  await supabase.from("invoices").insert({
    user_id: userId,
    amount: charge.amount / 100, // convert fils → AED
    currency: "AED",
    status: "paid",
    hub_charge_id: charge.id,
    tap_charge_id: charge.id,
    installment_number: newInstallmentsPaid,
    currency_override: "AED",
  });

  // 5. Mark pending charge as captured
  if (pending) {
    await supabase
      .from("tap_pending_charges")
      .update({ status: "captured" })
      .eq("tap_charge_id", charge.id);
  }

  // 6. Analytics event
  await supabase.from("analytics_events").insert({
    user_id: userId,
    type: "payment",
      meta: {
        tier,
        cycle: cycleLabel,
        trackSlug,
        platform: meta.platform ?? "smarthinkerz-academy",
        chargeId: charge.id,
        amountAed: charge.amount / 100,
        installmentNumber: newInstallmentsPaid,
      },
  });

  console.log(`[tap-webhook] CAPTURED: user=${userId} tier=${tier} track=${trackSlug} charge=${charge.id}`);
  return `activated:${tier}:installment=${newInstallmentsPaid}`;
}

async function handleFailed(charge: TapChargeEvent): Promise<string> {
  const supabase = getServiceClient();
  const meta = charge.metadata ?? {};

  // Look up pending charge for userId
  const { data: pending } = await supabase
    .from("tap_pending_charges")
    .select("user_id")
    .eq("tap_charge_id", charge.id)
    .maybeSingle();

  const userId = pending?.user_id ?? meta.userId;

  if (userId) {
    // Set subscription to incomplete (not cancelled — user can retry)
    await supabase
      .from("subscriptions")
      .update({ status: "incomplete", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "pending"); // only update if still pending, don't downgrade active subs
  }

  // Mark pending charge as failed
  await supabase
    .from("tap_pending_charges")
    .update({ status: "failed" })
    .eq("tap_charge_id", charge.id);

  console.log(`[tap-webhook] FAILED: charge=${charge.id} status=${charge.status}`);
  return `failed:${charge.status.toLowerCase()}`;
}

async function handleRefunded(charge: TapChargeEvent): Promise<string> {
  const supabase = getServiceClient();

  // Find subscription by tap_pay_ref
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("tap_pay_ref", charge.id)
    .maybeSingle();

  if (sub?.user_id) {
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", sub.user_id);

    // Update invoice status
    await supabase
      .from("invoices")
      .update({ status: "refunded" })
      .eq("tap_charge_id", charge.id);

    await supabase.from("analytics_events").insert({
      user_id: sub.user_id,
      type: "refund",
      meta: { chargeId: charge.id },
    });

    console.log(`[tap-webhook] REFUNDED: user=${sub.user_id} charge=${charge.id}`);
  }

  return "refunded";
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!config.tap.isConfigured) {
    return NextResponse.json(
      { ok: false, error: "Tap Payments not configured." },
      { status: 503 },
    );
  }

  // Read raw body for HMAC verification
  const rawBody = await req.text();

  // Parse charge event
  let charge: TapChargeEvent;
  try {
    charge = JSON.parse(rawBody) as TapChargeEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const receivedHash =
    req.headers.get("hashstring") ??
    req.headers.get("x-tap-signature") ??
    "";

  if (!verifyTapSignature(charge, receivedHash)) {
    console.warn("[tap-webhook] Signature verification failed for charge:", charge.id);
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  // Idempotency — skip if already processed
  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("processed_tap_events")
    .select("event_id")
    .eq("event_id", charge.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, result: "already-processed" });
  }

  // Record event as processed (before handling to prevent race conditions)
  await supabase.from("processed_tap_events").insert({
    event_id: charge.id,
    event_type: charge.status,
  });

  // Route to handler
  let result: string;
  const status = charge.status?.toUpperCase();

  try {
    if (status === "CAPTURED") {
      result = await handleCaptured(charge);
    } else if (
      status === "FAILED" ||
      status === "DECLINED" ||
      status === "CANCELLED" ||
      status === "ABANDONED"
    ) {
      result = await handleFailed(charge);
    } else if (status === "REFUNDED") {
      result = await handleRefunded(charge);
    } else {
      // Unknown status — acknowledge but take no action
      result = `unhandled:${status}`;
      console.log(`[tap-webhook] Unhandled status: ${status} for charge ${charge.id}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[tap-webhook] Handler error:", msg);
    // Return 500 so Tap retries — idempotency guard will prevent double-processing
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result });
}

// Health probe
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    configured: config.tap.isConfigured,
    endpoint: "tap-webhook",
  });
}
