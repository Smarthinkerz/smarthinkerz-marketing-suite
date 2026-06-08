import type { ToolKey } from "./plans";

export interface ToolMeta {
  key: ToolKey;
  name: string;
  href: string;
  description: string;
  /** lucide-react icon name */
  icon: string;
}

export const TOOLS: ToolMeta[] = [
  {
    key: "campaigns",
    name: "Campaigns",
    href: "/dashboard/campaigns",
    description: "Plan and track multi-channel campaigns with live analytics.",
    icon: "Megaphone",
  },
  {
    key: "content",
    name: "Content Creator",
    href: "/dashboard/content",
    description: "Generate blogs, ads, and product copy with GPT.",
    icon: "PenLine",
  },
  {
    key: "seo",
    name: "SEO Tools",
    href: "/dashboard/seo",
    description: "Keyword research and competitor insights in seconds.",
    icon: "Search",
  },
  {
    key: "social",
    name: "Social Media",
    href: "/dashboard/social",
    description: "AI captions and hashtags optimized per platform.",
    icon: "Share2",
  },
  {
    key: "email",
    name: "Email Marketing",
    href: "/dashboard/email",
    description: "Subject lines and copy that convert.",
    icon: "Mail",
  },
  {
    key: "chatbot",
    name: "AI Chatbot",
    href: "/dashboard/chatbot",
    description: "Deploy customer service bots with analytics.",
    icon: "Bot",
  },
  {
    key: "media",
    name: "Media Generator",
    href: "/dashboard/media",
    description: "Create images and videos with AI.",
    icon: "Image",
  },
  {
    key: "ecommerce",
    name: "E-commerce Tools",
    href: "/dashboard/ecommerce",
    description: "Optimize product listings and analyze competitors.",
    icon: "ShoppingCart",
  },
  {
    key: "ads",
    name: "Ad Manager",
    href: "/dashboard/ads",
    description: "AI-optimized ad campaigns across channels.",
    icon: "Target",
  },
  {
    key: "analytics",
    name: "Analytics",
    href: "/dashboard/analytics",
    description: "Unified dashboard for all your marketing data.",
    icon: "BarChart3",
  },
  {
    key: "autopromote",
    name: "Auto-Promote",
    href: "/dashboard/auto-promote",
    description: "Autonomously research, write, and publish on-brand posts on a schedule.",
    icon: "Rocket",
  },
];

export const TOOL_BY_KEY: Record<ToolKey, ToolMeta> = TOOLS.reduce(
  (acc, t) => {
    acc[t.key] = t;
    return acc;
  },
  {} as Record<ToolKey, ToolMeta>,
);
