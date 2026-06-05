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
   * Billing is handled by an external, hosted Payment Hub (hosted checkout page
   * + signed webhook). This app never touches card data and integrates no card
   * processor directly. All values are configurable via env so the product is
   * decoupled from any specific payment provider.
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
  config.payments.isConfigured &&
  config.resend.isConfigured;
