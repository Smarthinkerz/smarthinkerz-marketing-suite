import type { ToolKey } from "./plans";

export interface ToolMeta {
  key: ToolKey;
  name: string;
  href: string;
  description: string;
  /** lucide-react icon name */
  icon: string;
  /** tailwind gradient classes for the tool card accent */
  accent: string;
}

export const TOOLS: ToolMeta[] = [
  {
    key: "campaigns",
    name: "Campaigns",
    href: "/dashboard/campaigns",
    description: "Plan and track multi-channel campaigns with live analytics.",
    icon: "Megaphone",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    key: "content",
    name: "Content Creator",
    href: "/dashboard/content",
    description: "Generate blogs, ads, and product copy with GPT.",
    icon: "PenLine",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    key: "seo",
    name: "SEO Tools",
    href: "/dashboard/seo",
    description: "Keyword research and competitor insights in seconds.",
    icon: "Search",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    key: "social",
    name: "Social Media",
    href: "/dashboard/social",
    description: "AI captions and hashtags optimized per platform.",
    icon: "Share2",
    accent: "from-sky-500 to-cyan-500",
  },
  {
    key: "email",
    name: "Email Marketing",
    href: "/dashboard/email",
    description: "Subject lines and copy that convert.",
    icon: "Mail",
    accent: "from-orange-500 to-amber-500",
  },
  {
    key: "chatbot",
    name: "AI Chatbot",
    href: "/dashboard/chatbot",
    description: "Deploy customer service bots with analytics.",
    icon: "Bot",
    accent: "from-blue-500 to-indigo-500",
  },
  {
    key: "media",
    name: "Media Generator",
    href: "/dashboard/media",
    description: "Create images and videos with AI.",
    icon: "Image",
    accent: "from-pink-500 to-rose-500",
  },
  {
    key: "ecommerce",
    name: "E-commerce Tools",
    href: "/dashboard/ecommerce",
    description: "Optimize product listings and analyze competitors.",
    icon: "ShoppingCart",
    accent: "from-teal-500 to-emerald-500",
  },
  {
    key: "ads",
    name: "Ad Manager",
    href: "/dashboard/ads",
    description: "AI-optimized ad campaigns across channels.",
    icon: "Target",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    key: "analytics",
    name: "Analytics",
    href: "/dashboard/analytics",
    description: "Unified dashboard for all your marketing data.",
    icon: "BarChart3",
    accent: "from-cyan-500 to-blue-500",
  },
];

export const TOOL_BY_KEY: Record<ToolKey, ToolMeta> = TOOLS.reduce(
  (acc, t) => {
    acc[t.key] = t;
    return acc;
  },
  {} as Record<ToolKey, ToolMeta>,
);
