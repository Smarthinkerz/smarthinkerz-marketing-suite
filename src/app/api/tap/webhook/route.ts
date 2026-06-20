/**
 * POST /api/tap/webhook
 *
 * Inbound Tap Payments webhook handler.
 * This is the authoritative out-of-band reconciliation endpoint.
 * Payment confirmation does NOT depend solely on this webhook —
 * the /checkout/return handler (redirect path) also reconciles every charge.
 *
 * Processing pipeline (in order per spec):
 *  1. Rate limiting  — 30 req/IP/min, 120 req/min global
 *  2. Secret check   — 503 if TAP_WEBHOOK_SECRET unset
 *  3. HMAC verify    — HMAC_SHA256(rawBody, TAP_WEBHOOK_SECRET) as lowercase hex
 *  4. Payload valid  — must be JSON object with id
 *  5. Replay protect — timestamp within TAP_WEBHOOK_TOLERANCE_MS (default 5 min)
 *  6. Idempotency    — event key "<chargeId>:<rawStatus>" in processed_webhook_events
 *  7. Order update   — map Tap status → internal status, update orders table
 *  8. Audit log      — write to webhook_events table
 *
 * NEVER run on Edge — requires Node crypto and Supabase service role.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";
import { mapTapStatus } from "@/lib/tap-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WEBHOOK_TOLERANCE_MS =
  Number(process.env.TAP_WEBHOOK_TOLERANCE_MS ?? 300_000); // 5 min default

const AUDIT_RETENTION_DAYS =
  Number(process.env.WEBHOOK_AUDIT_RETENTION_DAYS ?? 90);

// ---------------------------------------------------------------------------
// In-memory rate limiter (per-IP + global)
// ---------------------------------------------------------------------------

interface RateBucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, RateBucket>();
let globalBucket: RateBucket = { count: 0, resetAt: Date.now() + 60_000 };

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Global bucket: 120 req/min
  if (now > globalBucket.resetAt) {
    globalBucket = { count: 0, resetAt: now + 60_000 };
  }
  globalBucket.count++;
  if (globalBucket.count > 120) return false;

  // Per-IP bucket: 30 req/min
  let bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + 60_000 };
    ipBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (bucket.count > 30) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Tap charge event shape
// ---------------------------------------------------------------------------

interface TapChargeEvent {
  id: string;
  status: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, string>;
  reference?: {
    gateway?: string;
    payment?: string;
    transaction?: string;
    order?: string;
  };
  transaction?: {
    created?: string;
    asof?: string;
  };
  created?: string | number;
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  response?: {
    code?: string;
    message?: string;
  };
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 verification
// Spec: HMAC_SHA256(rawBody, TAP_WEBHOOK_SECRET) as lowercase hex
// Header: hashstring
// ---------------------------------------------------------------------------

function verifySignature(rawBody: string, receivedHash: string): boolean {
  const secret = config.tap.webhookSecret;
  if (!secret) return false;

  const computed = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(receivedHash.toLowerCase(), "hex"),
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Supabase service-role client (bypasses RLS)
// ---------------------------------------------------------------------------

function getServiceClient() {
  const url = config.supabase.url;
  const key = config.supabase.serviceRoleKey;
  if (!url || !key) throw new Error("Supabase service role not configured.");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// Audit logger
// ---------------------------------------------------------------------------

type AuditResult =
  | "received"
  | "invalid_signature"
  | "duplicate"
  | "rejected"
  | "processing_error"
  | "not_configured";

async function writeAudit(
  supabase: ReturnType<typeof getServiceClient>,
  chargeId: string | null,
  result: AuditResult,
  detail?: string,
) {
  try {
    await supabase.from("webhook_events").insert({
      charge_id: chargeId,
      result,
      detail: detail ?? null,
      created_at: new Date().toISOString(),
    });
    // Prune old rows
    const cutoff = new Date(
      Date.now() - AUDIT_RETENTION_DAYS * 86_400_000,
    ).toISOString();
    await supabase
      .from("webhook_events")
      .delete()
      .lt("created_at", cutoff);
  } catch {
    // Audit failures must not affect the response
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      },
    );
  }

  // 2. Secret check
  if (!config.tap.webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "Webhook not configured." },
      { status: 503 },
    );
  }

  // Read raw body for HMAC verification
  const rawBody = await req.text();

  // 3. HMAC signature verification
  const receivedHash =
    req.headers.get("hashstring") ??
    req.headers.get("x-tap-signature") ??
    "";

  if (!verifySignature(rawBody, receivedHash)) {
    console.warn("[tap-webhook] Signature verification failed");
    // Best-effort audit (no supabase client yet — skip if it fails)
    try {
      const sb = getServiceClient();
      await writeAudit(sb, null, "invalid_signature");
    } catch { /* ignore */ }
    return NextResponse.json(
      { ok: false, error: "Invalid signature." },
      { status: 401 },
    );
  }

  // 4. Payload validation
  let event: TapChargeEvent;
  try {
    const parsed = JSON.parse(rawBody);
    if (typeof parsed !== "object" || !parsed || !parsed.id) {
      throw new Error("Missing id");
    }
    event = parsed as TapChargeEvent;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid payload." },
      { status: 400 },
    );
  }

  // 5. Replay protection — check timestamp freshness
  const rawTs =
    event.transaction?.created ??
    event.transaction?.asof ??
    (typeof event.created === "string" || typeof event.created === "number"
      ? String(event.created)
      : undefined);

  if (rawTs) {
    const ts = isNaN(Number(rawTs))
      ? new Date(rawTs).getTime()
      : Number(rawTs) * (String(rawTs).length <= 10 ? 1000 : 1); // unix sec vs ms
    const age = Math.abs(Date.now() - ts);
    if (age > WEBHOOK_TOLERANCE_MS) {
      console.warn(`[tap-webhook] Replay detected: age=${age}ms charge=${event.id}`);
      return NextResponse.json(
        { ok: false, error: "Stale payload." },
        { status: 400 },
      );
    }
  }

  const supabase = getServiceClient();

  // 6. Idempotency — event key = "<chargeId>:<rawStatus>"
  const eventKey = `${event.id}:${event.status}`;
  const { error: idempotencyError } = await supabase
    .from("processed_webhook_events")
    .insert({ event_key: eventKey, charge_id: event.id, status: event.status })
    .select("event_key");

  if (idempotencyError) {
    // Duplicate key → already processed
    if (idempotencyError.code === "23505") {
      await writeAudit(supabase, event.id, "duplicate");
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[tap-webhook] Idempotency insert error:", idempotencyError.message);
  }

  // 7. Order update
  try {
    const internalStatus = mapTapStatus(event.status);
    const updateData: Record<string, unknown> = {
      status: internalStatus,
      tap_status: event.status,
      updated_at: new Date().toISOString(),
    };

    if (internalStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    } else if (internalStatus === "failed" || internalStatus === "cancelled") {
      updateData.failure_message =
        event.response?.message ?? `Payment ${event.status.toLowerCase()}`;
    }

    // Only update if not already in a terminal refund state
    await supabase
      .from("orders")
      .update(updateData)
      .eq("tap_charge_id", event.id)
      .not("status", "in", '("refunded","partially_refunded","refunding")');

    await writeAudit(supabase, event.id, "received", internalStatus);
    console.log(`[tap-webhook] ${event.status} → ${internalStatus} charge=${event.id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[tap-webhook] Handler error:", msg);
    await writeAudit(supabase, event.id, "processing_error", msg);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

// Health probe
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    configured: !!(config.tap.webhookSecret),
    endpoint: "/api/tap/webhook",
  });
}
