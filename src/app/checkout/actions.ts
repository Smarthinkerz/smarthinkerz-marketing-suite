"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import {
  createTapCharge,
  parseTapPhone,
  generateTransactionRef,
  generateOrderRef,
} from "@/lib/tap-payments";
import { config } from "@/lib/config";
import { resolveTrack, TRACK_LIST } from "@/lib/plans";

export type CheckoutResult =
  | {
      ok: true;
      checkoutUrl: string;
      chargeId: string;
      orderId: string;
      amount: number;
    }
  | {
      ok: false;
      error: string;
    };

export interface CreateCheckoutInput {
  trackSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

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
    return {
      ok: false,
      error: "Payment processing is not configured. Set TAP_SECRET_KEY to enable live checkout.",
    };
  }

  const { trackSlug, firstName, lastName, email, phone } = input;

  const track = resolveTrack(trackSlug);
  if (!track) {
    return { ok: false, error: "Invalid track selected." };
  }

  const amount = track.totalUsd;
  const appUrl = config.appUrl;

  const transactionRef = generateTransactionRef(track.slug, `${track.durationMonths}-month`);
  const orderRef = generateOrderRef();

  const parsedPhone = phone ? parseTapPhone(phone) : undefined;

  const result = await createTapCharge({
    amount,
    description: `SmarThinkerz - ${track.name}`,
    statementDescriptor: "SmarThinkerz",
    customer: {
      first_name: firstName,
      last_name: lastName,
      email,
      phone: parsedPhone,
    },
    metadata: {
      plan: track.slug,
      cycle: `${track.durationMonths}-month`,
      product: "SmarThinkerz",
      display: "SmarThinkerz",
      plan_name: track.name,
      userId: user.id,
    },
    redirectUrl: `${appUrl}/checkout/return`,
    postUrl: `${appUrl}/api/tap/webhook`,
    transactionRef,
    orderRef,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const { charge } = result;

  const { data: order, error: dbError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      tap_charge_id: charge.id,
      plan: track.slug,
      plan_name: track.name,
      product: "SmarThinkerz",
      amount,
      currency: "USD",
      status: "initiated",
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_email: email,
      customer_phone: phone ?? null,
      transaction_ref: transactionRef,
      order_ref: orderRef,
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("[checkout] Failed to insert order:", dbError.message);
  }

  return {
    ok: true,
    checkoutUrl: charge.transaction.url,
    chargeId: charge.id,
    orderId: order?.id ?? "",
    amount,
  };
}

export { TRACK_LIST };
