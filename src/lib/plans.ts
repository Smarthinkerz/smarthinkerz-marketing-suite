export type Tier = "basic" | "pro" | "business" | "enterprise";

export type ToolKey =
  | "campaigns"
  | "content"
  | "seo"
  | "social"
  | "email"
  | "chatbot"
  | "media"
  | "ecommerce"
  | "ads"
  | "analytics";

export interface PlanDefinition {
  id: Tier;
  /** Payment-hub plan slug (hyphenated) used to build hosted-checkout links. */
  slug: string;
  name: string;
  priceMonthly: number;
  /** Yearly price in USD (≈2 months free). */
  priceYearly: number;
  tagline: string;
  highlighted?: boolean;
  features: string[];
  /** Tools unlocked at this tier */
  tools: ToolKey[];
  /** Monthly campaign creation cap; null = unlimited */
  campaignLimit: number | null;
  /** Monthly AI generation cap across tools; null = unlimited */
  aiGenerationLimit: number | null;
  perks: string[];
}

export const TIER_ORDER: Tier[] = ["basic", "pro", "business", "enterprise"];

export const PLANS: Record<Tier, PlanDefinition> = {
  basic: {
    id: "basic",
    slug: "smarthinkerz-basic",
    name: "Basic",
    priceMonthly: 29,
    priceYearly: 290,
    tagline: "For solo marketers getting started.",
    features: [
      "5 campaigns / month",
      "Content Creator (blog posts, ad copy)",
      "SEO keyword research",
      "Social captions",
      "Email marketing (basic subject lines)",
      "Limited analytics dashboard",
    ],
    tools: ["campaigns", "content", "seo", "social", "email", "analytics"],
    campaignLimit: 5,
    aiGenerationLimit: 100,
    perks: ["Email support"],
  },
  pro: {
    id: "pro",
    slug: "smarthinkerz-pro",
    name: "Pro",
    priceMonthly: 79,
    priceYearly: 790,
    tagline: "For growing teams that ship daily.",
    highlighted: true,
    features: [
      "Unlimited campaigns",
      "Advanced Content Creator",
      "Full SEO suite (keyword + competitor)",
      "Social media automation",
      "Email marketing with AI copy",
      "AI Chatbot (basic deployment)",
      "Full analytics dashboard",
    ],
    tools: ["campaigns", "content", "seo", "social", "email", "chatbot", "analytics"],
    campaignLimit: null,
    aiGenerationLimit: 1000,
    perks: ["Priority email support"],
  },
  business: {
    id: "business",
    slug: "smarthinkerz-business",
    name: "Business",
    priceMonthly: 149,
    priceYearly: 1490,
    tagline: "For agencies running full-funnel marketing.",
    features: [
      "Everything in Pro",
      "Media Generator (images + video)",
      "Advanced AI Chatbot (analytics + reporting)",
      "E-commerce optimization tools",
      "Ad Manager (AI-optimized campaigns)",
      "Priority support",
    ],
    tools: [
      "campaigns",
      "content",
      "seo",
      "social",
      "email",
      "chatbot",
      "media",
      "ecommerce",
      "ads",
      "analytics",
    ],
    campaignLimit: null,
    aiGenerationLimit: 5000,
    perks: ["Priority support"],
  },
  enterprise: {
    id: "enterprise",
    slug: "smarthinkerz-enterprise",
    name: "Enterprise",
    priceMonthly: 299,
    priceYearly: 2990,
    tagline: "For organizations that need control and scale.",
    features: [
      "Everything in Business",
      "White-label option",
      "Multi-user / team accounts",
      "Advanced analytics + reporting",
      "Custom integrations (API access)",
      "Dedicated account manager",
    ],
    tools: [
      "campaigns",
      "content",
      "seo",
      "social",
      "email",
      "chatbot",
      "media",
      "ecommerce",
      "ads",
      "analytics",
    ],
    campaignLimit: null,
    aiGenerationLimit: null,
    perks: ["Dedicated account manager", "API access", "White-label"],
  },
};

export const PLAN_LIST = TIER_ORDER.map((t) => PLANS[t]);

/** Reverse-map a payment-hub plan slug back to an internal tier. */
export function tierFromSlug(slug: string): Tier | null {
  const entry = TIER_ORDER.find((t) => PLANS[t].slug === slug);
  return entry ?? null;
}

export function tierRank(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

export function tierHasTool(tier: Tier, tool: ToolKey): boolean {
  return PLANS[tier].tools.includes(tool);
}

/** Lowest tier that unlocks a given tool. */
export function minTierForTool(tool: ToolKey): Tier {
  for (const tier of TIER_ORDER) {
    if (PLANS[tier].tools.includes(tool)) return tier;
  }
  return "enterprise";
}
