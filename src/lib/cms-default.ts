import type { CmsContent } from "./types";

/**
 * Canonical default homepage content. Used to seed the database and as a
 * fallback when Supabase is not yet configured, so the public site always
 * renders fully.
 */
export const DEFAULT_CMS_CONTENT: CmsContent = {
  hero: {
    eyebrow: "AI-Native Marketing Platform",
    headline: "AI-Powered Marketing, Built for Teams Who Want Control",
    subheadline:
      "Run campaigns, create content, optimize SEO, and analyze results — all in one AI-driven platform.",
    ctaPrimary: "Subscribe Now",
    ctaSecondary: "See Demo",
    bgImageUrl: "",
  },
  features: {
    title: "All-in-One Marketing Tools",
    subtitle: "10 integrated tools designed to replace 5-6 separate subscriptions.",
    items: [
      { icon: "Megaphone", title: "Campaigns", desc: "Plan and track multi-channel campaigns with live analytics." },
      { icon: "PenLine", title: "Content Creator", desc: "Generate blogs, ads, and product copy with GPT." },
      { icon: "Search", title: "SEO Tools", desc: "Keyword research and competitor insights in seconds." },
      { icon: "Share2", title: "Social Media", desc: "AI captions and hashtags optimized per platform." },
      { icon: "Mail", title: "Email Marketing", desc: "Subject lines and copy that convert." },
      { icon: "Bot", title: "AI Chatbot", desc: "Deploy customer service bots with analytics." },
      { icon: "Image", title: "Media Generator", desc: "Create images and videos with AI." },
      { icon: "ShoppingCart", title: "E-commerce Tools", desc: "Optimize product listings and analyze competitors." },
      { icon: "Target", title: "Ad Manager", desc: "AI-optimized ad campaigns across channels." },
      { icon: "BarChart3", title: "Analytics", desc: "Unified dashboard for all your marketing data." },
    ],
  },
  pricing: {
    title: "Choose Your Plan",
    subtitle: "Flexible pricing for every stage of growth.",
  },
  testimonials: {
    title: "Trusted by Marketers Worldwide",
    subtitle: "See how teams and agencies grow faster with the suite.",
    items: [
      { quote: "We replaced 5 tools with this suite — and cut costs by 70%.", author: "Sarah Lin", role: "Head of Growth, Northwind" },
      { quote: "AI-generated campaigns doubled our engagement in 3 months.", author: "Marcus Reed", role: "CMO, Brightline Agency" },
      { quote: "Finally, a marketing platform that gives us control over our data.", author: "Aisha Karim", role: "Founder, Cedar & Co." },
    ],
  },
  finalCta: {
    headline: "Ready to Own Your Marketing Data?",
    subheadline: "Join hundreds of marketers who trust the suite to run their growth engine.",
    button: "Subscribe Today",
  },
  footer: {
    tagline: "The AI-native, self-hostable marketing platform you control.",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
    copyright: `© ${new Date().getFullYear()} SmarThinkerz Marketing Suite. All rights reserved.`,
  },
};
