"use client";

import { useState } from "react";
import { Check, ExternalLink, FileText } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIST, PLANS, tierRank, type Tier } from "@/lib/plans";
import { buildCheckoutUrl, type BillingCycle } from "@/lib/billing";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, SessionUser } from "@/lib/types";

const invoiceVariant: Record<string, "success" | "warning" | "error" | "default"> = {
  paid: "success",
  pending: "warning",
  failed: "error",
  refunded: "default",
};

export function BillingClient({
  user,
  invoices,
  usage,
  checkoutConfigured,
}: {
  user: SessionUser;
  invoices: Invoice[];
  usage: number;
  checkoutConfigured: boolean;
}) {
  const [cycle, setCycle] = useState<BillingCycle>(user.cycle ?? "monthly");
  const plan = PLANS[user.tier];
  const limit = plan.aiGenerationLimit;
  const pct = limit ? Math.min(100, Math.round((usage / limit) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Current plan + usage */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Current plan" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{plan.name}</p>
              <p className="text-sm text-muted">{plan.tagline}</p>
            </div>
            <Badge variant={user.status === "active" || user.status === "trialing" ? "success" : "warning"}>
              {user.status}
            </Badge>
          </div>
          {user.currentPeriodEnd && (
            <p className="mt-4 text-sm text-muted">
              Renews on <span className="text-foreground">{formatDate(user.currentPeriodEnd)}</span>
            </p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="AI usage this month" subtitle="Generations across all tools" />
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-foreground">
              {usage.toLocaleString()}
              <span className="ml-1 text-base font-normal text-muted">
                / {limit === null ? "Unlimited" : limit.toLocaleString()}
              </span>
            </p>
            {limit !== null && <span className="text-sm text-muted">{pct}%</span>}
          </div>
          {limit !== null && (
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-error" : pct >= 70 ? "bg-warning" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Plan switcher */}
      <Card>
        <CardHeader
          title="Change plan"
          subtitle="Upgrade or downgrade anytime. Secure checkout via our payment hub."
          action={
            <div className="flex rounded-md border border-border p-1">
              {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`rounded px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                    cycle === c ? "bg-primary text-primary-foreground" : "text-muted"
                  }`}
                >
                  {c}
                  {c === "yearly" && <span className="ml-1 opacity-80">-17%</span>}
                </button>
              ))}
            </div>
          }
        />

        {!checkoutConfigured && (
          <div className="mb-4 rounded-xl bg-warning/10 px-4 py-2.5 text-sm text-warning">
            Payment hub is not configured yet. Set the checkout URL and webhook secret to enable live upgrades.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_LIST.map((p) => {
            const isCurrent = p.id === user.tier;
            const price = cycle === "yearly" ? p.priceYearly : p.priceMonthly;
            const url = buildCheckoutUrl(p.id as Tier, cycle, { externalRef: user.id });
            const direction =
              tierRank(p.id) > tierRank(user.tier)
                ? "Upgrade"
                : tierRank(p.id) < tierRank(user.tier)
                  ? "Downgrade"
                  : "Current";
            return (
              <div
                key={p.id}
                className={`relative rounded-lg border p-5 ${
                  isCurrent ? "border-primary ring-1 ring-primary/30" : "border-border"
                }`}
              >
                {p.highlighted && !isCurrent && (
                  <Badge variant="primary" className="absolute -top-2.5 right-4">Popular</Badge>
                )}
                <p className="font-semibold text-foreground">{p.name}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatCurrency(price)}
                  <span className="text-sm font-normal text-muted">/{cycle === "yearly" ? "yr" : "mo"}</span>
                </p>
                <ul className="mt-3 space-y-1.5">
                  {p.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-1.5 text-xs text-muted">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Current plan
                    </Button>
                  ) : url ? (
                    <Button href={url} external className="w-full" variant={p.highlighted ? "primary" : "outline"}>
                      {direction} <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      {direction}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Invoices */}
      <Card className="p-0">
        <div className="p-6 pb-0">
          <CardHeader title="Invoice history" subtitle="Your past payments." />
        </div>
        {invoices.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-foreground">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted" />
                        {formatDate(inv.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-foreground">{formatCurrency(inv.amount, inv.currency)}</td>
                    <td className="px-6 py-3">
                      <Badge variant={invoiceVariant[inv.status] ?? "default"}>{inv.status}</Badge>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-muted">{inv.hub_charge_id ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
