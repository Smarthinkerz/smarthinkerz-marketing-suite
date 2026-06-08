/**
 * Analytics — client-safe types.
 * This file has NO server-side imports and is safe to use in Client Components.
 */

import type { ContentStatus } from "@/lib/org-types";

export interface StatusBreakdown {
  status: ContentStatus;
  count: number;
}

export interface PlatformBreakdown {
  platform: string;
  count: number;
  approved: number;
}

export interface WorkspaceAnalyticsSummary {
  total_posts: number;
  posts_this_month: number;
  approval_rate: number; // 0–100
  avg_review_time_hours: number | null;
  status_breakdown: StatusBreakdown[];
  platform_breakdown: PlatformBreakdown[];
  audit_log_count: number;
}
