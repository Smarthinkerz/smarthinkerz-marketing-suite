import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import {
  SIGNATURE_HEADER,
  verifySignature,
  processEvent,
  type PaymentHubEvent,
} from "@/lib/payment-hub";

// Webhooks require the raw body and Node crypto — never edge/static.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Read the raw body exactly as sent so the HMAC matches the hub's signature.
  const rawBody = await req.text();

  if (!config.payments.webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "Webhook secret not configured." },
      { status: 503 },
    );
  }

  const signature =
    req.headers.get(SIGNATURE_HEADER) ??
    req.headers.get("x-signature") ??
    req.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  let event: PaymentHubEvent;
  try {
    event = JSON.parse(rawBody) as PaymentHubEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const result = await processEvent(event);
  if (!result.ok) {
    // 500 lets the hub retry; idempotency guards against double-processing.
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 200 });
}

// Lightweight health probe for configuration checks.
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: config.payments.isConfigured,
    endpoint: "payment-hub",
  });
}
