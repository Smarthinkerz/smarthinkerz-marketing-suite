"use client";

import { useState } from "react";
import { Check, CreditCard, FileText, Layers } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIST, PLANS, TRACK_LIST, tierRank, type Tier } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import type { Invoice, SessionUser } from "@/lib/types";

// USD formatting
const USD_TO_USD = 3.67;
function toAed(usd: number) {
  return Math.round(usd * USD_TO_USD * 100) / 100;
}
function fmtUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}
function fmtCurrency(amount: number, currency?: string | null) {
  if (currency?.toUpperCase() === "USD") return fmtUsd(amount);
  // Legacy USD invoices
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

const invoiceVariant: Record<string, "success" | "warning" | "error" | "default"> = {
  paid: "success",
  pending: "warning",
  failed: "error",
  refunded: "default",
};

interface ExtendedInvoice extends Invoice {
  tap_charge_id?: string | null;
  installment_number?: number | null;
}

export function BillingClient({
  user,
  invoices,
  usage,
  tapConfigured,
}: {
  user: SessionUser;
  invoices: ExtendedInvoice[];
  usage: number;
  tapConfigured: boolean;
  /** @deprecated kept for backward compat, ignored */
  checkoutConfigured?: boolean;
}) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">(user.cycle ?? "monthly");
  const plan = PLANS[user.tier];
  const limit = plan.aiGenerationLimit;
  const pct = limit ? Math.min(100, Math.round((usage / limit) * 100)) : 0;

  // Installment progress from user subscription
  const installmentCount = (user as any).installmentCount ?? 1;
  const installmentsPaid = (user as any).installmentsPaid ?? (user.status === "active" ? 1 : 0);
  const hasInstallments = installmentCount > 1;

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
          {/* Installment progress */}
          {hasInstallments && (
            <div className="mt-4 rounded-md bg-surface-2 px-3 py-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted">
                  <Layers className="h-3.5 w-3.5" />
                  Installments
                </span>
                <span className="font-medium text-foreground">
                  {installmentsPaid} / {installmentCount} paid
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.round((installmentsPaid / installmentCount) * 100)}%` }}
                />
              </div>
            </div>
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
          subtitle="Upgrade or downgrade anytime. Secure checkout via Tap Payments."
          action={
            <div className="flex rounded-md border border-border p-1">
              {(["monthly", "yearly"] as const).map((c) => (
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

        {!tapConfigured && (
          <div className="mb-4 rounded-md bg-warning/10 px-4 py-2.5 text-sm text-warning">
            Tap Payments is not configured. Set <code className="font-mono text-xs">TAP_SECRET_KEY</code> to enable live upgrades.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_LIST.map((p) => {
            const isCurrent = p.id === user.tier;
            const priceAed = toAed(cycle === "yearly" ? p.priceYearly : p.priceMonthly);
            // Map tier → track slug for the checkout URL
            const track = TRACK_LIST.find((t) => t.tier === p.id);
            const checkoutUrl = track ? `/checkout?track=${track.slug}` : `/checkout?plan=${p.id}`;
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
                  {fmtUsd(priceAed)}
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
                  ) : (
                    <Button
                      href={checkoutUrl}
                      className="w-full"
                      variant={p.highlighted ? "primary" : "outline"}
                    >
                      <CreditCard className="mr-1.5 h-3.5 w-3.5" />
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
          <CardHeader title="Invoice history" subtitle="Your past payments via Tap Payments." />
        </div>
        {invoices.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tap Reference</th>
                  <th className="px-6 py-3">Installment</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const chargeId = inv.tap_charge_id ?? inv.hub_charge_id;
                  return (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                      <td className="px-6 py-3 text-foreground">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted" />
                          {formatDate(inv.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium tabular-nums text-foreground">
                        {fmtCurrency(inv.amount, inv.currency)}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={invoiceVariant[inv.status] ?? "default"}>{inv.status}</Badge>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-muted">
                        {chargeId ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-xs text-muted">
                        {inv.installment_number != null ? `#${inv.installment_number}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
