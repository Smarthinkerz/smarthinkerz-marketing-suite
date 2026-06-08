/**
 * Tap Payments API helpers — server-side only.
 *
 * Tap API reference: https://developers.tap.company/reference
 * All amounts are in the smallest currency unit (fils for AED: 1 AED = 100 fils).
 *
 * SmarThinkerz scheme:
 *   platform: "smarthinkerz-academy"
 *   metadata: { userId, trackSlug, installmentCount, platform }
 *   description: "Smarthinkerz Academy - <Track Name>"
 *   redirect: { url: "https://smarthinkerzacademy.com/payment/success" }
 *   source: { id: "src_all" }  — Tap hosted page, all payment methods
 *
 * NEVER import this file in Client Components.
 */

import { config } from "@/lib/config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TapCustomer {
  first_name: string;
  last_name: string;
  email: string;
  phone?: {
    country_code: string; // e.g. "+971"
    number: string;       // e.g. "501234567"
  };
}

/**
 * Input to createTapCharge.
 * Metadata follows the SmarThinkerz Academy scheme exactly.
 */
export interface TapChargeInput {
  /** Amount in AED (decimal, e.g. 7999.00). Converted to fils internally. */
  amountAed: number;
  /** "Smarthinkerz Academy - <Track Name>" */
  description: string;
  customer: TapCustomer;
  /**
   * Metadata per SmarThinkerz spec:
   *   userId        — Supabase user UUID
   *   trackSlug     — canonical track slug, e.g. "6-month-professional"
   *   installmentCount — "1" | "2" | "3" | "4"
   *   platform      — always "smarthinkerz-academy"
   */
  metadata: {
    userId: string;
    trackSlug: string;
    installmentCount: string;
    platform: "smarthinkerz-academy";
  };
  /** Absolute URL to redirect to on success */
  redirectUrl: string;
}

export interface TapChargeResponse {
  id: string;                   // e.g. "chg_TS01A0720231234Hs5u0906529"
  status: string;               // INITIATED | CAPTURED | FAILED | DECLINED | CANCELLED | ABANDONED | REFUNDED
  amount: number;               // in fils
  currency: string;
  transaction: {
    created: string;
    url: string;                // Tap-hosted payment page URL — redirect user here
  };
  reference: {
    gateway: string;
    payment: string;
  };
}

export interface TapError {
  errors: Array<{ code: string; description: string }>;
}

// ---------------------------------------------------------------------------
// Phone number parser
// ---------------------------------------------------------------------------

/**
 * Parses a full phone number into Tap's required { country_code, number } format.
 *
 * Examples:
 *  "+971 501234567"  → { country_code: "+971", number: "501234567" }
 *  "+96896737452"    → { country_code: "+968", number: "96737452" }
 *  "00971501234567"  → { country_code: "+971", number: "501234567" }
 *  "501234567"       → { country_code: "+971", number: "501234567" } (defaults to UAE)
 */
export function parseTapPhone(raw: string): { country_code: string; number: string } {
  const cleaned = raw.trim().replace(/\s+/g, "");

  // Normalize 00xxx to +xxx
  const normalized = cleaned.startsWith("00") ? "+" + cleaned.slice(2) : cleaned;

  if (!normalized.startsWith("+")) {
    // No country code — default to UAE +971
    return { country_code: "+971", number: normalized };
  }

  // Known country code lengths (digits after +): 1, 2, or 3 digits
  // Try longest match first (3 digits), then 2, then 1
  const digits = normalized.slice(1); // strip leading +
  const knownCodes: Record<string, number> = {
    // 3-digit codes (common MENA)
    "966": 3, "971": 3, "968": 3, "974": 3, "973": 3, "965": 3, "967": 3, "962": 3,
    "963": 3, "964": 3, "961": 3, "970": 3, "972": 3, "212": 3, "213": 3,
    "216": 3, "218": 3, "249": 3, "252": 3,
    // 2-digit codes
    "20": 2, "44": 2, "49": 2, "33": 2, "39": 2, "34": 2,
    // 1-digit codes
    "1": 1,
  };

  for (const len of [3, 2, 1]) {
    const candidate = digits.slice(0, len);
    if (knownCodes[candidate] !== undefined) {
      return {
        country_code: "+" + candidate,
        number: digits.slice(len),
      };
    }
  }

  // Fallback: assume first 3 digits are country code
  return {
    country_code: "+" + digits.slice(0, 3),
    number: digits.slice(3),
  };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const TAP_API_BASE = "https://api.tap.company/v2";

function tapHeaders(): HeadersInit {
  const key = config.tap.secretKey;
  if (!key) throw new Error("TAP_SECRET_KEY is not configured.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

/**
 * Creates a Tap charge and returns the charge object including the hosted
 * payment page URL. The caller should redirect the user to
 * `charge.transaction.url`.
 *
 * Amount is converted from AED to fils (×100) internally.
 * source.id = "src_all" enables the Tap hosted page with all payment methods
 * (Visa, Mastercard, AMEX, mada, KNET, etc.).
 */
export async function createTapCharge(
  input: TapChargeInput,
): Promise<{ ok: true; charge: TapChargeResponse } | { ok: false; error: string }> {
  const { amountAed, description, customer, metadata, redirectUrl } = input;

  // Tap expects amount in fils (smallest unit): 1 AED = 100 fils
  const amountInFils = Math.round(amountAed * 100);

  const body = {
    amount: amountInFils,
    currency: "AED",
    description,
    customer: {
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      ...(customer.phone
        ? {
            phone: {
              country_code: customer.phone.country_code,
              number: customer.phone.number,
            },
          }
        : {}),
    },
    metadata,
    redirect: { url: redirectUrl },
    source: { id: "src_all" }, // Tap hosted page — all payment methods
    save_card: false,
  };

  try {
    const res = await fetch(`${TAP_API_BASE}/charges`, {
      method: "POST",
      headers: tapHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const tapErr = data as TapError;
      const msg =
        tapErr.errors?.[0]?.description ??
        `Tap API error ${res.status}: ${JSON.stringify(data)}`;
      console.error("[tap] createTapCharge error:", msg);
      return { ok: false, error: msg };
    }

    return { ok: true, charge: data as TapChargeResponse };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[tap] createTapCharge network error:", msg);
    return { ok: false, error: msg };
  }
}

/**
 * Retrieves a charge by ID. Used to verify status server-side if needed.
 */
export async function getTapCharge(
  chargeId: string,
): Promise<{ ok: true; charge: TapChargeResponse } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${TAP_API_BASE}/charges/${chargeId}`, {
      method: "GET",
      headers: tapHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      const tapErr = data as TapError;
      const msg = tapErr.errors?.[0]?.description ?? `Tap API error ${res.status}`;
      return { ok: false, error: msg };
    }

    return { ok: true, charge: data as TapChargeResponse };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
