"use client";

import { Download, BarChart2, CheckCircle2, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentStatusBadge } from "@/components/ui/content-status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import type { WorkspaceAnalyticsSummary } from "@/lib/analytics-types";
import type { SessionUser } from "@/lib/types";

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  google: "Google Ads",
  email: "Email",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted">{label}</p>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function exportCsv(summary: WorkspaceAnalyticsSummary) {
  const rows: string[][] = [
    ["Metric", "Value"],
    ["Total Posts", String(summary.total_posts)],
    ["Posts This Month", String(summary.posts_this_month)],
    ["Approval Rate (%)", String(summary.approval_rate)],
    ["Avg Review Time (hrs)", summary.avg_review_time_hours != null ? String(summary.avg_review_time_hours) : "N/A"],
    ["Audit Log Events", String(summary.audit_log_count)],
    [],
    ["Status", "Count"],
    ...summary.status_breakdown.map((s) => [s.status, String(s.count)]),
    [],
    ["Platform", "Total Posts", "Approved"],
    ...summary.platform_breakdown.map((p) => [
      PLATFORM_LABELS[p.platform] ?? p.platform,
      String(p.count),
      String(p.approved),
    ]),
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workspace-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsClient({
  user,
  summary,
}: {
  user: SessionUser;
  summary: WorkspaceAnalyticsSummary;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Reports"
          description="Workspace-level content performance, approval metrics, and audit activity."
          icon="BarChart2"
        />
        <Button
          variant="outline"
          onClick={() => exportCsv(summary)}
          className="shrink-0 gap-1.5"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total posts"
          value={summary.total_posts}
          sub="All time"
          icon={FileText}
        />
        <StatCard
          label="Posts this month"
          value={summary.posts_this_month}
          sub="Current calendar month"
          icon={BarChart2}
        />
        <StatCard
          label="Approval rate"
          value={`${summary.approval_rate}%`}
          sub="Approved / total submitted"
          icon={CheckCircle2}
        />
        <StatCard
          label="Avg review time"
          value={summary.avg_review_time_hours != null ? `${summary.avg_review_time_hours}h` : "N/A"}
          sub="Draft → approved"
          icon={Clock}
        />
      </div>

      {/* Status breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold text-foreground">Content by status</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.status_breakdown
                .sort((a, b) => b.count - a.count)
                .map((s) => {
                  const pct = summary.total_posts
                    ? Math.round((s.count / summary.total_posts) * 100)
                    : 0;
                  return (
                    <div key={s.status} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <ContentStatusBadge status={s.status} />
                        <span className="tabular-nums text-sm text-muted">
                          {s.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Platform breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold text-foreground">Content by platform</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      Platform
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                      Posts
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                      Approved
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summary.platform_breakdown
                    .sort((a, b) => b.count - a.count)
                    .map((p) => {
                      const rate = p.count ? Math.round((p.approved / p.count) * 100) : 0;
                      return (
                        <tr key={p.platform} className="hover:bg-surface-2">
                          <td className="px-3 py-2 font-medium text-foreground">
                            {PLATFORM_LABELS[p.platform] ?? p.platform}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted">
                            {p.count}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted">
                            {p.approved}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-foreground">
                            {rate}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit activity */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">
              {summary.audit_log_count.toLocaleString()} audit log events
            </p>
            <p className="text-sm text-muted">
              All content state transitions, approvals, and admin actions are logged for compliance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
