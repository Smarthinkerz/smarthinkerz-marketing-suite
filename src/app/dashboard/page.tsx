import Link from "next/link";
import { ArrowUpRight, Lock, Sparkles, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { resolveUser, isSetupMode } from "@/lib/session";
import { getMonthlyUsage } from "@/lib/usage";
import { TOOLS } from "@/lib/tools";
import { PLANS, tierHasTool } from "@/lib/plans";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await resolveUser();
  const plan = PLANS[user.tier];
  const used = isSetupMode() ? 0 : await getMonthlyUsage(user.id);
  const limit = plan.aiGenerationLimit;
  const usagePct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const firstName = (user.fullName || "there").split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted">
          Here&apos;s your workspace. Jump into a tool or pick up where you left off.
        </p>
      </div>

      {/* Plan + usage summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col justify-between">
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
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">AI generations</p>
            <Zap className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {used}
            <span className="text-base font-normal text-muted">
              {" "}
              / {limit ?? "∞"}
            </span>
          </p>
          {limit && (
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full gradient-brand"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
          <p className="mt-2 text-xs text-muted">Resets monthly</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">Tools unlocked</p>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">
            {plan.tools.length}
            <span className="text-base font-normal text-muted"> / {TOOLS.length}</span>
          </p>
          <p className="mt-2 text-xs text-muted">
            {user.tier === "enterprise"
              ? "All tools available"
              : `Unlock more with ${PLANS.enterprise.name}`}
          </p>
        </Card>
      </div>

      {/* Tools grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Marketing tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const unlocked = tierHasTool(user.tier, tool.key);
            return (
              <Link
                key={tool.key}
                href={tool.href}
                className={cn(
                  "group relative flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  !unlocked && "opacity-75",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                    tool.accent,
                  )}
                >
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
