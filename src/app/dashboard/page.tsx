import Link from "next/link";
import { ArrowUpRight, Lock, Sparkles, Zap, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ContentStatusBadge } from "@/components/ui/content-status-badge";
import { resolveUser, isSetupMode } from "@/lib/session";
import { getMonthlyUsage } from "@/lib/usage";
import { getPendingApprovals, getWorkspaceContentPosts } from "@/lib/content-workflow";
import { getMyWorkspaces } from "@/lib/workspace";
import { TOOLS } from "@/lib/tools";
import { PLANS, tierHasTool } from "@/lib/plans";
import { cn } from "@/lib/utils";
import type { ContentPost } from "@/lib/content-workflow";

// ---------------------------------------------------------------------------
// Demo data for setup mode
// ---------------------------------------------------------------------------
const DEMO_PENDING: ContentPost[] = [
  {
    id: "demo-p1",
    user_id: "demo",
    workspace_id: "demo-ws",
    platform: "linkedin",
    content_status: "in_review",
    angle: "Thought leadership",
    body: "AI-powered marketing is no longer a competitive advantage — it's the baseline. Here's how leading teams are using automation to reclaim creative time.",
    hashtags: ["marketing", "AI", "automation"],
    image_url: null,
    link_url: null,
    scheduled_for: null,
    published_at: null,
    approved_by: null,
    approved_at: null,
    review_notes: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const DEMO_RECENT: ContentPost[] = [
  {
    id: "demo-r1",
    user_id: "demo",
    workspace_id: "demo-ws",
    platform: "instagram",
    content_status: "changes_requested",
    angle: "Brand story",
    body: "Every great brand starts with a story worth telling. What's yours?",
    hashtags: ["branding", "storytelling"],
    image_url: null,
    link_url: null,
    scheduled_for: null,
    published_at: null,
    approved_by: null,
    approved_at: null,
    review_notes: "Add a stronger call-to-action and include the product name.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-r2",
    user_id: "demo",
    workspace_id: "demo-ws",
    platform: "twitter",
    content_status: "approved",
    angle: "Industry insight",
    body: "The brands winning on social aren't posting more — they're posting smarter.",
    hashtags: ["socialmedia", "strategy"],
    image_url: null,
    link_url: null,
    scheduled_for: null,
    published_at: null,
    approved_by: null,
    approved_at: new Date(Date.now() - 43200000).toISOString(),
    review_notes: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
  },
];

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  google: "Google",
  email: "Email",
};

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const user = await resolveUser();
  const plan = PLANS[user.tier];
  const used = isSetupMode() ? 0 : await getMonthlyUsage(user.id);
  const limit = plan.aiGenerationLimit;
  const usagePct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const firstName = (user.fullName || "there").split(" ")[0];

  let pendingApprovals: ContentPost[] = [];
  let recentPosts: ContentPost[] = [];

  if (!isSetupMode()) {
    const workspaces = await getMyWorkspaces();
    const firstWs = workspaces[0];
    if (firstWs) {
      [pendingApprovals, recentPosts] = await Promise.all([
        getPendingApprovals(),
        getWorkspaceContentPosts(firstWs.id, [
          "draft",
          "changes_requested",
          "approved",
          "scheduled",
        ]),
      ]);
      recentPosts = recentPosts.slice(0, 5);
    }
  } else {
    pendingApprovals = DEMO_PENDING;
    recentPosts = DEMO_RECENT;
  }

  const changesRequested = recentPosts.filter(
    (p) => p.content_status === "changes_requested",
  );

  return (
    <div className="space-y-8">
      {/* My Work header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Work</h1>
        <p className="mt-1 text-sm text-muted">
          Good {getTimeOfDay()}, {firstName}. Here&apos;s what needs your attention today.
        </p>
      </div>

      {/* Attention row */}
      {(pendingApprovals.length > 0 || changesRequested.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pendingApprovals.length > 0 && (
            <Link href="/dashboard/approvals">
              <Card className="cursor-pointer border-warning/30 bg-warning/5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning/15">
                    <Clock className="h-5 w-5 text-warning" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {pendingApprovals.length} post{pendingApprovals.length !== 1 ? "s" : ""} awaiting review
                    </p>
                    <p className="text-sm text-muted">Go to Approvals Inbox →</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
          {changesRequested.length > 0 && (
            <Link href="/dashboard/auto-promote">
              <Card className="cursor-pointer border-error/30 bg-error/5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-error/15">
                    <AlertCircle className="h-5 w-5 text-error" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {changesRequested.length} post{changesRequested.length !== 1 ? "s" : ""} need changes
                    </p>
                    <p className="text-sm text-muted">Review feedback and resubmit →</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Usage summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">Current plan</p>
              <Badge variant="primary">{plan.name}</Badge>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">
              ${plan.priceMonthly}
              <span className="text-base font-normal text-muted">/mo</span>
            </p>
            {user.tier !== "enterprise" && (
              <Link
                href="/dashboard/billing"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Upgrade <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">AI generations</p>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
              {used}
              <span className="text-base font-normal text-muted"> / {limit ?? "∞"}</span>
            </p>
            {limit && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-xs text-muted">Resets monthly</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">Tools unlocked</p>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
              {plan.tools.length}
              <span className="text-base font-normal text-muted"> / {TOOLS.length}</span>
            </p>
            <p className="mt-2 text-xs text-muted">
              {user.tier === "enterprise"
                ? "All tools available"
                : `Unlock more with ${PLANS.enterprise.name}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent content table */}
      {recentPosts.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent content</h2>
            <Link
              href="/dashboard/auto-promote"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    Platform
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    Preview
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {PLATFORM_LABELS[post.platform] ?? post.platform}
                      </Badge>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate text-foreground">{post.body}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ContentStatusBadge status={post.content_status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tools grid */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">Marketing tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const unlocked = tierHasTool(user.tier, tool.key);
            return (
              <Link
                key={tool.key}
                href={tool.href}
                className={cn(
                  "group relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  !unlocked && "opacity-75",
                )}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-surface-2 text-primary">
                  <Icon name={tool.icon} className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{tool.name}</h3>
                    {!unlocked && <Lock className="h-3.5 w-3.5 text-muted" />}
                  </div>
                  <p className="mt-1 text-sm text-muted">{tool.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
