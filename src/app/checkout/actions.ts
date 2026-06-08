"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { createTapCharge, parseTapPhone } from "@/lib/tap-payments";
import { config } from "@/lib/config";
import { PLANS, type Tier } from "@/lib/plans";

export type CheckoutResult =
  | {
      ok: true;
      checkoutUrl: string;
      chargeId: string;
      amount: number;
      installmentCount: number;
      installmentAmount: number;
    }
  | {
      ok: false;
      error: string;
    };

export interface CreateCheckoutInput {
  planKey: string;       // e.g. "smarthinkerz-pro-monthly"
  tier: Tier;
  cycle: "monthly" | "yearly";
  installmentCount: number; // 1 = pay in full
  phone?: string;           // optional, for Tap customer object
}

// ---------------------------------------------------------------------------
// Plan pricing in AED
// ---------------------------------------------------------------------------
// Exchange rate: 1 USD ≈ 3.67 AED (fixed peg)
const USD_TO_AED = 3.67;

function toAed(usd: number): number {
  return Math.round(usd * USD_TO_AED * 100) / 100;
}

function getPlanPriceAed(tier: Tier, cycle: "monthly" | "yearly"): number {
  const plan = PLANS[tier];
  const usd = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
  return toAed(usd);
}

// Installment options per tier (count → label)
export const INSTALLMENT_OPTIONS: Record<number, string> = {
  1: "Pay in full",
  2: "2 installments",
  3: "3 installments",
  4: "4 installments",
};

export async function createCheckoutSession(
  input: CreateCheckoutInput,
): Promise<CheckoutResult> {
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!supabase || !user) {
    return { ok: false, error: "You must be signed in to proceed to checkout." };
  }

  if (!config.tap.isConfigured) {
    return { ok: false, error: "Payment processing is not configured. Please contact support." };
  }

  const { tier, cycle, installmentCount, phone, planKey } = input;
  const plan = PLANS[tier];
  if (!plan) {
    return { ok: false, error: "Invalid plan selected." };
  }

  // Calculate amounts
  const totalAed = getPlanPriceAed(tier, cycle);
  const installmentAmount = Math.round((totalAed / installmentCount) * 100) / 100;

  // Parse customer name
  const fullName = user.fullName ?? user.email;
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] ?? "Customer";
  const lastName = nameParts.slice(1).join(" ") || "—";

  // Parse phone if provided
  const parsedPhone = phone ? parseTapPhone(phone) : undefined;

  // Build redirect URL
  const appUrl = config.appUrl;
  const redirectUrl = `${appUrl}/payment/success`;

  // Create Tap charge
  const result = await createTapCharge({
    amountAed: totalAed,
    description: `SmarThinkerz Marketing Suite — ${plan.name} (${cycle})`,
    customer: {
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      phone: parsedPhone,
    },
    metadata: {
      userId: user.id,
      planKey,
      installmentCount: String(installmentCount),
      tier,
      cycle,
      platform: "smarthinkerz-marketing-suite",
    },
    redirectUrl,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const { charge } = result;

  // Record pending charge in DB for webhook correlation
  await supabase.from("tap_pending_charges").insert({
    tap_charge_id: charge.id,
    user_id: user.id,
    plan_key: planKey,
    tier,
    cycle,
    total_amount_aed: totalAed,
    installment_count: installmentCount,
    installment_amount: installmentAmount,
    status: "pending",
  });

  return {
    ok: true,
    checkoutUrl: charge.transaction.url,
    chargeId: charge.id,
    amount: totalAed,
    installmentCount,
    installmentAmount,
  };
}
