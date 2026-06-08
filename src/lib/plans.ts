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
  | "analytics"
  | "autopromote";

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
  /**
   * Max Auto-Promote promotion profiles a user on this tier may create.
   * 0 = feature locked, null = unlimited (fair-use).
   */
  promotionProfileLimit: number | null;
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
    promotionProfileLimit: 0,
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
    promotionProfileLimit: 0,
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
      "Auto-Promote (up to 3 brands, autonomous posting)",
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
      "autopromote",
    ],
    campaignLimit: null,
    aiGenerationLimit: 5000,
    promotionProfileLimit: 3,
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
      "Auto-Promote (unlimited brands, autonomous posting)",
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
      "autopromote",
    ],
    campaignLimit: null,
    aiGenerationLimit: null,
    promotionProfileLimit: null,
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

/** Max Auto-Promote profiles for a tier (0 = locked, null = unlimited). */
export function promotionProfileLimit(tier: Tier): number | null {
  return PLANS[tier].promotionProfileLimit;
}

/** Lowest tier that unlocks a given tool. */
export function minTierForTool(tool: ToolKey): Tier {
  for (const tier of TIER_ORDER) {
    if (PLANS[tier].tools.includes(tool)) return tier;
  }
  return "enterprise";
}

// ---------------------------------------------------------------------------
// SmarThinkerz Academy — Track / Plan definitions
// ---------------------------------------------------------------------------
// These are the four fixed-duration tracks sold via Tap Payments.
// URL param: ?track=<slug>  or  ?plan=<planKey>
// Plan aliases (spec): foundations → 2-month-sprint
//                      accelerator → 3-month-accelerator
//                      professional → 6-month-professional
//                      master → 12-month-master
// ---------------------------------------------------------------------------

export type TrackSlug =
  | "2-month-sprint"
  | "3-month-accelerator"
  | "6-month-professional"
  | "12-month-master";

export interface TrackDefinition {
  /** Canonical slug used in Tap metadata.trackSlug */
  slug: TrackSlug;
  /** Human-readable alias (URL param alias) */
  alias: string;
  name: string;
  /** Total price in AED (full payment) */
  totalAed: number;
  /** Duration in months */
  durationMonths: number;
  /** Internal marketing-suite tier this track maps to */
  tier: Tier;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const TRACKS: Record<TrackSlug, TrackDefinition> = {
  "2-month-sprint": {
    slug: "2-month-sprint",
    alias: "foundations",
    name: "Foundations Sprint",
    totalAed: 1499,
    durationMonths: 2,
    tier: "basic",
    description: "2-month intensive to master marketing fundamentals.",
    features: [
      "2 months full access",
      "Content Creator & SEO tools",
      "Social media automation",
      "Email marketing basics",
      "Certificate of completion",
    ],
  },
  "3-month-accelerator": {
    slug: "3-month-accelerator",
    alias: "accelerator",
    name: "Accelerator Program",
    totalAed: 2999,
    durationMonths: 3,
    tier: "pro",
    description: "3-month accelerator for growing marketing teams.",
    highlighted: true,
    features: [
      "3 months full access",
      "All Pro tools unlocked",
      "AI Chatbot deployment",
      "Full analytics dashboard",
      "Priority support",
      "Certificate of completion",
    ],
  },
  "6-month-professional": {
    slug: "6-month-professional",
    alias: "professional",
    name: "Professional Track",
    totalAed: 7999,
    durationMonths: 6,
    tier: "business",
    description: "6-month professional program for agencies and power users.",
    features: [
      "6 months full access",
      "All Business tools unlocked",
      "Media Generator (images + video)",
      "Ad Manager & Auto-Promote",
      "E-commerce optimization",
      "Dedicated onboarding session",
      "Certificate of completion",
    ],
  },
  "12-month-master": {
    slug: "12-month-master",
    alias: "master",
    name: "Master Program",
    totalAed: 14999,
    durationMonths: 12,
    tier: "enterprise",
    description: "12-month mastery program with full Enterprise access.",
    features: [
      "12 months full access",
      "Full Enterprise suite",
      "White-label option",
      "Multi-user team accounts",
      "Custom API integrations",
      "Dedicated account manager",
      "Certificate of completion",
    ],
  },
};

export const TRACK_LIST: TrackDefinition[] = [
  TRACKS["2-month-sprint"],
  TRACKS["3-month-accelerator"],
  TRACKS["6-month-professional"],
  TRACKS["12-month-master"],
];

/**
 * Resolve a track by slug or alias.
 * Accepts both canonical slugs ("6-month-professional") and
 * URL aliases ("professional").
 */
export function resolveTrack(slugOrAlias: string): TrackDefinition | null {
  // Try canonical slug first
  if (slugOrAlias in TRACKS) return TRACKS[slugOrAlias as TrackSlug];
  // Try alias
  const byAlias = TRACK_LIST.find((t) => t.alias === slugOrAlias);
  return byAlias ?? null;
}

/** Map a track slug back to the internal marketing-suite tier. */
export function tierFromTrackSlug(slug: string): Tier | null {
  const track = resolveTrack(slug);
  return track?.tier ?? null;
}
