/**
 * Centralized runtime configuration.
 *
 * Every external integration degrades gracefully when its key is absent so the
 * app remains fully navigable in development. Production deployments MUST set
 * the real values. `isConfigured` flags let the UI surface clear setup notices
 * instead of crashing or showing fake data.
 */

function get(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export const config = {
  appName: get("NEXT_PUBLIC_APP_NAME") ?? "SmarThinkerz Marketing Suite",
  appUrl: get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",

  supabase: {
    url: get("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: get("SUPABASE_SERVICE_ROLE_KEY"),
    get isConfigured() {
      return Boolean(this.url && this.anonKey);
    },
  },

  openai: {
    apiKey: get("OPENAI_API_KEY"),
    model: get("OPENAI_MODEL") ?? "gpt-4o",
    imageModel: get("OPENAI_IMAGE_MODEL") ?? "dall-e-3",
    get isConfigured() {
      return Boolean(this.apiKey);
    },
  },

  /**
   * Tap Payments — direct integration (no payment hub intermediary).
   *
   * TAP_SECRET_KEY:    From Tap Dashboard → Developers → API Keys → Secret Key
   * TAP_WEBHOOK_SECRET: Tap uses the same secret key for HMAC-SHA256 webhook
   *                     verification. Set this to the same value as TAP_SECRET_KEY
   *                     unless you configure a separate webhook secret in the Tap
   *                     Dashboard.
   *
   * Tap Dashboard setup:
   *   1. Log in to business.tap.company
   *   2. Developers → API Keys → copy Secret Key → set as TAP_SECRET_KEY
   *   3. Developers → Webhooks → add https://yourdomain.com/api/webhooks/tap
   *      → select events: charge.captured, charge.failed, charge.refunded
   */
  tap: {
    secretKey: get("TAP_SECRET_KEY"),
    /** Tap uses the secret key for HMAC-SHA256 webhook verification. */
    webhookSecret: get("TAP_WEBHOOK_SECRET") ?? get("TAP_SECRET_KEY"),
    get isConfigured() {
      return Boolean(this.secretKey);
    },
  },

  /**
   * Legacy payment-hub config — kept for backward compatibility.
   * New installations should use the `tap` config above.
   * @deprecated Use config.tap instead.
   */
  payments: {
    checkoutBaseUrl: get("NEXT_PUBLIC_PAYMENT_HUB_CHECKOUT_URL") ?? "",
    productKey: get("PAYMENT_HUB_PRODUCT_KEY") ?? "SmarThinkerz Marketing Suite",
    webhookSecret: get("PAYMENT_HUB_WEBHOOK_SECRET"),
    returnUrl: get("NEXT_PUBLIC_PAYMENT_HUB_RETURN_URL"),
    get isConfigured() {
      return Boolean(this.webhookSecret && this.checkoutBaseUrl);
    },
  },

  resend: {
    apiKey: get("RESEND_API_KEY"),
    fromEmail: get("RESEND_FROM_EMAIL") ?? "SmarThinkerz Marketing Suite <onboarding@resend.dev>",
    get isConfigured() {
      return Boolean(this.apiKey);
    },
  },
} as const;

/** True when running against live external services. */
export const isProductionReady =
  config.supabase.isConfigured &&
  config.openai.isConfigured &&
  config.tap.isConfigured &&
  config.resend.isConfigured;
