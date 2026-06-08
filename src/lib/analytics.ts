/**
 * Analytics summary — server-side data access.
 * Aggregates content post metrics by workspace for the reporting dashboard.
 */

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { isSetupMode } from "@/lib/session";
// Re-export client-safe types from analytics-types.ts
export type { StatusBreakdown, PlatformBreakdown, WorkspaceAnalyticsSummary } from "@/lib/analytics-types";
import type { WorkspaceAnalyticsSummary } from "@/lib/analytics-types";
import type { ContentStatus } from "@/lib/org-types";

// Demo data
const DEMO_SUMMARY: WorkspaceAnalyticsSummary = {
  total_posts: 47,
  posts_this_month: 12,
  approval_rate: 78,
  avg_review_time_hours: 4.2,
  status_breakdown: [
    { status: "draft", count: 8 },
    { status: "in_review", count: 3 },
    { status: "approved", count: 18 },
    { status: "scheduled", count: 5 },
    { status: "published", count: 11 },
    { status: "changes_requested", count: 2 },
  ],
  platform_breakdown: [
    { platform: "linkedin", count: 14, approved: 11 },
    { platform: "instagram", count: 12, approved: 9 },
    { platform: "twitter", count: 10, approved: 8 },
    { platform: "facebook", count: 7, approved: 5 },
    { platform: "email", count: 4, approved: 3 },
  ],
  audit_log_count: 142,
};

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

export async function getAnalyticsSummary(
  workspaceId?: string,
): Promise<WorkspaceAnalyticsSummary> {
  if (isSetupMode()) return DEMO_SUMMARY;

  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return DEMO_SUMMARY;

  let query = supabase.from("content_posts").select("content_status, platform, created_at");
  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data: posts } = await query;
  if (!posts || posts.length === 0) return DEMO_SUMMARY;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const total = posts.length;
  const thisMonth = posts.filter((p) => new Date(p.created_at) >= monthStart).length;

  // Status breakdown
  const statusMap = new Map<string, number>();
  for (const p of posts) {
    statusMap.set(p.content_status, (statusMap.get(p.content_status) ?? 0) + 1);
  }
  const status_breakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
    status: status as ContentStatus,
    count,
  }));

  // Platform breakdown
  const platformMap = new Map<string, { count: number; approved: number }>();
  for (const p of posts) {
    const cur = platformMap.get(p.platform) ?? { count: 0, approved: 0 };
    cur.count++;
    if (["approved", "scheduled", "published"].includes(p.content_status)) cur.approved++;
    platformMap.set(p.platform, cur);
  }
  const platform_breakdown = Array.from(platformMap.entries()).map(([platform, v]) => ({
    platform,
    ...v,
  }));

  const approved = posts.filter((p) =>
    ["approved", "scheduled", "published"].includes(p.content_status),
  ).length;
  const approval_rate = total ? Math.round((approved / total) * 100) : 0;

  // Audit log count
  const { count: auditCount } = await supabase
    .from("audit_log")
    .select("*", { count: "exact", head: true });

  return {
    total_posts: total,
    posts_this_month: thisMonth,
    approval_rate,
    avg_review_time_hours: null, // Would require approval timestamps diff
    status_breakdown,
    platform_breakdown,
    audit_log_count: auditCount ?? 0,
  };
}
