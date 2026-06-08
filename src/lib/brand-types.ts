/**
 * Brand Guardrails — client-safe types and constants.
 * This file has NO server-side imports and is safe to use in Client Components.
 */

export interface PlatformRule {
  platform: string;
  max_length: number | null;
  tone_notes: string;
  hashtag_limit: number | null;
}

export interface BrandGuardrails {
  id: string;
  workspace_id: string;
  voice_pillars: string[];
  banned_terms: string[];
  required_hashtags: string[];
  optional_hashtags: string[];
  platform_rules: PlatformRule[];
  updated_at: string;
}

export type BrandGuardrailsInput = Omit<BrandGuardrails, "id" | "updated_at">;

export const DEFAULT_GUARDRAILS: Omit<BrandGuardrails, "id" | "workspace_id" | "updated_at"> = {
  voice_pillars: ["Professional", "Clear", "Empowering", "Data-driven"],
  banned_terms: ["cheap", "guarantee", "free money", "limited time only"],
  required_hashtags: [],
  optional_hashtags: ["marketing", "AI", "automation", "growth"],
  platform_rules: [
    {
      platform: "linkedin",
      max_length: 3000,
      tone_notes: "Professional, thought-leadership tone. Use data and insights.",
      hashtag_limit: 5,
    },
    {
      platform: "instagram",
      max_length: 2200,
      tone_notes: "Visual-first, conversational, aspirational. Use emojis sparingly.",
      hashtag_limit: 10,
    },
    {
      platform: "twitter",
      max_length: 280,
      tone_notes: "Concise, punchy, opinionated. No jargon.",
      hashtag_limit: 2,
    },
    {
      platform: "facebook",
      max_length: 63206,
      tone_notes: "Community-focused, engaging, informative.",
      hashtag_limit: 3,
    },
  ],
};
