/**
 * GET /checkout/return?tap_id=<charge_id>
 *
 * Tap redirects the customer here after payment.
 * This handler is the authoritative reconciliation path:
 *   1. Re-fetches the charge from Tap (never trusts query params)
 *   2. Maps the status to internal order status
 *   3. Updates the order in the DB
 *   4. Redirects to /checkout/success | /checkout/pending | /checkout/cancelled
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { retrieveCharge, mapTapStatus } from "@/lib/tap-payments";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ tap_id?: string }>;
}

export default async function CheckoutReturnPage({ searchParams }: Props) {
  const { tap_id } = await searchParams;

  if (!tap_id) {
    redirect("/checkout/cancelled?reason=missing_id");
  }

  // Re-fetch the charge from Tap — never trust query params
  const result = await retrieveCharge(tap_id);

  if (!result.ok) {
    console.error("[checkout/return] retrieveCharge failed:", result.error);
    redirect("/checkout/cancelled?reason=retrieve_failed");
  }

  const { charge } = result;
  const internalStatus = mapTapStatus(charge.status);

  // Update the order in the DB
  try {
    const supabase = await createClient();
    if (supabase) {
      const updateData: Record<string, unknown> = {
        status: internalStatus,
        tap_status: charge.status,
        updated_at: new Date().toISOString(),
      };
      if (internalStatus === "paid") {
        updateData.paid_at = new Date().toISOString();
      } else if (internalStatus === "failed" || internalStatus === "cancelled") {
        updateData.failure_message =
          charge.response?.message ?? `Payment ${charge.status.toLowerCase()}`;
      }
      await supabase
        .from("orders")
        .update(updateData)
        .eq("tap_charge_id", charge.id);
    }
  } catch (err) {
    console.error("[checkout/return] DB update error:", err);
    // Don't block redirect — the webhook will reconcile
  }

  // Redirect based on status
  if (internalStatus === "paid") {
    redirect(`/checkout/success?tap_id=${tap_id}`);
  } else if (internalStatus === "initiated") {
    redirect(`/checkout/pending?tap_id=${tap_id}`);
  } else {
    redirect(`/checkout/cancelled?tap_id=${tap_id}`);
  }
}
