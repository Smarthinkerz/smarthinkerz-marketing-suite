"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIST, PLANS, tierRank, type Tier } from "@/lib/plans";
import { createCheckoutSession, INSTALLMENT_OPTIONS } from "./actions";
import type { SessionUser } from "@/lib/types";

// AED conversion (1 USD ≈ 3.67 AED)
const USD_TO_AED = 3.67;
function toAed(usd: number): number {
  return Math.round(usd * USD_TO_AED * 100) / 100;
}
function fmtAed(amount: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface CheckoutClientProps {
  user: SessionUser;
  initialPlan?: string;
  initialTier?: string;
  initialCycle?: "monthly" | "yearly";
  tapConfigured: boolean;
}

export function CheckoutClient({
  user,
  initialTier,
  initialCycle = "monthly",
  tapConfigured,
}: CheckoutClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Resolve initial tier from URL param or default to pro
  const resolvedInitialTier: Tier =
    (["basic", "pro", "business", "enterprise"].includes(initialTier ?? "")
      ? (initialTier as Tier)
      : "pro");

  const [selectedTier, setSelectedTier] = useState<Tier>(resolvedInitialTier);
  const [cycle, setCycle] = useState<"monthly" | "yearly">(initialCycle);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const plan = PLANS[selectedTier];
  const priceUsd = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const totalAed = toAed(priceUsd);
  const installmentAed = Math.round((totalAed / installmentCount) * 100) / 100;

  const planKey = `${plan.slug}-${cycle}`;

  function handleProceed() {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession({
        planKey,
        tier: selectedTier,
        cycle,
        installmentCount,
        phone: phone.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Redirect to Tap hosted payment page
      window.location.href = result.checkoutUrl;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">SmarThinkerz Marketing Suite</p>
            <p className="text-xs text-muted">Secure checkout powered by Tap Payments</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>256-bit SSL</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Plan + Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Plan */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                1. Select Plan
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {PLAN_LIST.map((p) => {
                  const isSelected = p.id === selectedTier;
                  const isCurrent = p.id === user.tier;
                  const priceAed = toAed(cycle === "yearly" ? p.priceYearly : p.priceMonthly);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedTier(p.id as Tier)}
                      style={{
                        outline: isSelected ? "2px solid var(--color-primary)" : "none",
                      }}
                      className={`relative rounded-lg border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-surface hover:border-primary/40"
                      }`}
                    >
                      {p.highlighted && (
                        <Badge variant="primary" className="absolute -top-2 right-3 text-[10px]">
                          Popular
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="default" className="absolute -top-2 left-3 text-[10px]">
                          Current
                        </Badge>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{p.name}</p>
                          <p className="mt-0.5 text-xs text-muted">{p.tagline}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{fmtAed(priceAed)}</p>
                          <p className="text-xs text-muted">/{cycle === "yearly" ? "yr" : "mo"}</p>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1">
                        {p.features.slice(0, 3).map((f) => (
                          <li key={f} className="flex items-start gap-1.5 text-xs text-muted">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isSelected && (
                        <div className="absolute right-3 top-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Billing Cycle */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                2. Billing Cycle
              </h2>
              <div className="flex gap-3">
                {(["monthly", "yearly"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    className={`flex-1 rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                      cycle === c
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted hover:border-primary/40"
                    }`}
                  >
                    {c === "monthly" ? "Monthly" : "Yearly"}
                    {c === "yearly" && (
                      <span className="ml-1.5 text-xs text-success font-normal">Save ~17%</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Step 3: Payment Option */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                3. Payment Option
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(INSTALLMENT_OPTIONS).map(([count, label]) => {
                  const n = parseInt(count, 10);
                  const perInstallment = Math.round((totalAed / n) * 100) / 100;
                  const isSelected = installmentCount === n;
                  return (
                    <button
                      key={count}
                      onClick={() => setInstallmentCount(n)}
                      className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted hover:border-primary/40"
                      }`}
                    >
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted">
                        {n === 1
                          ? fmtAed(totalAed) + " today"
                          : fmtAed(perInstallment) + " × " + n + " payments"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 4: Phone (optional) */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                4. Phone Number <span className="normal-case font-normal text-muted">(optional)</span>
              </h2>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 123 4567"
                className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted">
                Used by Tap Payments to send payment receipts via SMS.
              </p>
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-lg border border-border bg-surface p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Plan</span>
                  <span className="font-medium text-foreground">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Billing</span>
                  <span className="font-medium text-foreground capitalize">{cycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Currency</span>
                  <span className="font-medium text-foreground">AED</span>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Total</span>
                    <span className="text-lg font-bold text-foreground">{fmtAed(totalAed)}</span>
                  </div>
                  {installmentCount > 1 && (
                    <div className="mt-1 flex justify-between text-xs">
                      <span className="text-muted">Per installment</span>
                      <span className="text-foreground">{fmtAed(installmentAed)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wide">
                  Included
                </p>
                <ul className="space-y-1.5">
                  {plan.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-muted">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-md bg-error/10 px-3 py-2.5 text-xs text-error">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Not configured warning */}
              {!tapConfigured && (
                <div className="mt-4 rounded-md bg-warning/10 px-3 py-2.5 text-xs text-warning">
                  Payment processing is not configured. Set TAP_SECRET_KEY to enable live checkout.
                </div>
              )}

              <Button
                className="mt-5 w-full"
                variant="primary"
                onClick={handleProceed}
                disabled={isPending || !tapConfigured}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to Tap…
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Proceed to Payment
                  </>
                )}
              </Button>

              <p className="mt-3 text-center text-xs text-muted">
                Secured by Tap Payments · 256-bit SSL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
