"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { createTapCharge, parseTapPhone } from "@/lib/tap-payments";
import { config } from "@/lib/config";
import { resolveTrack, TRACK_LIST } from "@/lib/plans";

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
  /**
   * Track slug (canonical or alias).
   * Canonical: "2-month-sprint" | "3-month-accelerator" | "6-month-professional" | "12-month-master"
   * Alias:     "foundations"    | "accelerator"          | "professional"          | "master"
   */
  trackSlug: string;
  installmentCount: number; // 1 = pay in full
  phone?: string;           // optional, for Tap customer object
}

// Installment options (count → label)
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

  const { trackSlug, installmentCount, phone } = input;

  // Resolve track by canonical slug or alias
  const track = resolveTrack(trackSlug);
  if (!track) {
    return { ok: false, error: "Invalid track selected." };
  }

  // Amounts in AED (from spec)
  const totalAed = track.totalAed;
  const installmentAmount = Math.round((totalAed / installmentCount) * 100) / 100;

  // Parse customer name
  const fullName = user.fullName ?? user.email;
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] ?? "Customer";
  const lastName = nameParts.slice(1).join(" ") || "—";

  // Parse phone if provided
  const parsedPhone = phone ? parseTapPhone(phone) : undefined;

  // Build redirect URL (per spec: https://smarthinkerzacademy.com/payment/success)
  const appUrl = config.appUrl;
  const redirectUrl = `${appUrl}/payment/success`;

  // Create Tap charge per spec
  const result = await createTapCharge({
    amountAed: totalAed,
    // Description format per spec: "Smarthinkerz Academy - <Plan Name>"
    description: `Smarthinkerz Academy - ${track.name}`,
    customer: {
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      phone: parsedPhone,
    },
    // Metadata per spec: userId, trackSlug, installmentCount, platform
    metadata: {
      userId: user.id,
      trackSlug: track.slug,
      installmentCount: String(installmentCount),
      platform: "smarthinkerz-academy",
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
    plan_key: track.slug,       // stored as plan_key in DB (track slug)
    tier: track.tier,
    cycle: `${track.durationMonths}-month`, // e.g. "6-month"
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

// Re-export track list for the client component
export { TRACK_LIST };
