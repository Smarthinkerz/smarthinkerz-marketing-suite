import type { Tier, ToolKey } from "./plans";

export type Role = "subscriber" | "admin";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Subscription {
  user_id: string;
  tier: Tier;
  status: SubscriptionStatus;
  current_period_end: string | null;
  grace_until: string | null;
  cycle: "monthly" | "yearly" | null;
  hub_order_id: string | null;
  updated_at: string;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  /** The plan the user has paid for (nominal tier). */
  tier: Tier;
  /**
   * The tier actually enforced right now. Equals `tier` while access is in good
   * standing; drops to "basic" once a canceled/past-due grace window expires.
   * UI gating and server actions MUST use this, never the nominal tier.
   */
  effectiveTier: Tier;
  status: SubscriptionStatus;
  graceUntil: string | null;
  currentPeriodEnd: string | null;
  cycle: "monthly" | "yearly" | null;
}

export type Channel = "facebook" | "instagram" | "google" | "email" | "linkedin" | "twitter";

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  channels: Channel[];
  status: "draft" | "active" | "paused" | "completed";
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
}

export interface AiGeneration {
  id: string;
  user_id: string;
  tool: ToolKey;
  prompt: string;
  result: unknown;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  type: "signup" | "upgrade" | "downgrade" | "churn" | "payment" | "login";
  meta: Record<string, unknown>;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded";
  hub_charge_id: string | null;
  created_at: string;
}

/* ----------------------------- CMS content ------------------------------ */

export interface CmsHero {
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  bgImageUrl: string;
}

export interface CmsFeatureItem {
  icon: string;
  title: string;
  desc: string;
}

export interface CmsFeatures {
  title: string;
  subtitle: string;
  items: CmsFeatureItem[];
}

export interface CmsPricing {
  title: string;
  subtitle: string;
}

export interface CmsTestimonialItem {
  quote: string;
  author: string;
  role: string;
}

export interface CmsTestimonials {
  title: string;
  subtitle: string;
  items: CmsTestimonialItem[];
}

export interface CmsFinalCta {
  headline: string;
  subheadline: string;
  button: string;
}

export interface CmsFooterLink {
  label: string;
  href: string;
}

export interface CmsFooter {
  tagline: string;
  links: CmsFooterLink[];
  copyright: string;
}

export interface CmsContent {
  hero: CmsHero;
  features: CmsFeatures;
  pricing: CmsPricing;
  testimonials: CmsTestimonials;
  finalCta: CmsFinalCta;
  footer: CmsFooter;
}

export interface CmsVersion {
  id: string;
  label: string;
  data: CmsContent;
  created_by: string | null;
  created_at: string;
}
