import { config } from "@/lib/config";
import { PLANS, type Tier } from "@/lib/plans";

export type BillingCycle = "monthly" | "yearly";

/**
 * Builds a hosted-checkout URL on the external Payment Hub for a given tier and
 * billing cycle. The hub renders the payment form, processes the charge, and
 * notifies this app via a signed webhook — the app never touches card data.
 *
 * Returns null when no checkout base URL is configured (setup mode), so callers
 * can render a clear "billing not configured" state instead of a broken link.
 */
export function buildCheckoutUrl(
  tier: Tier,
  cycle: BillingCycle = "monthly",
  opts?: { externalRef?: string },
): string | null {
  if (!config.payments.checkoutBaseUrl) return null;
  const slug = PLANS[tier].slug;
  const params = new URLSearchParams({ plan: slug, cycle });
  if (opts?.externalRef) params.set("external_ref", opts.externalRef);
  return `${config.payments.checkoutBaseUrl}?${params.toString()}`;
}

/** Whether hosted checkout links can be generated. */
export function isCheckoutConfigured(): boolean {
  return Boolean(config.payments.checkoutBaseUrl);
}
