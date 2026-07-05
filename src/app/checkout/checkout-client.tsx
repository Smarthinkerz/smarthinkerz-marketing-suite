"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Loader2, ShieldCheck, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TRACK_LIST, resolveTrack, type TrackDefinition } from "@/lib/plans";
import { createCheckoutSession } from "./actions";
import type { SessionUser } from "@/lib/types";

function fmtUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CheckoutClientProps {
  user: SessionUser;
  /** ?track=<slug|alias> or ?plan=<slug|alias> */
  initialTrack?: string;
  tapConfigured: boolean;
}

export function CheckoutClient({
  user,
  initialTrack,
  tapConfigured,
}: CheckoutClientProps) {
  useRouter();
  const [isPending, startTransition] = useTransition();

  // Resolve initial track from URL param or default to accelerator (highlighted)
  const defaultTrack: TrackDefinition =
    (initialTrack ? resolveTrack(initialTrack) : null) ??
    TRACK_LIST.find((t) => t.highlighted) ??
    TRACK_LIST[1];

  const [selectedTrack, setSelectedTrack] = useState<TrackDefinition>(defaultTrack);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalUsd = selectedTrack.totalUsd;

  // Pre-fill name/email from session
  const fullName = user.fullName ?? user.email ?? "";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] ?? "Customer";
  const lastName = nameParts.slice(1).join(" ") || "—";

  function handleProceed() {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession({
        trackSlug: selectedTrack.slug,
        firstName,
        lastName,
        email: user.email ?? "",
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
            <p className="text-sm font-semibold text-foreground">SmarThinkerz</p>
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
          {/* Left: Track + Options */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1: Select Track */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                1. Select Program
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {TRACK_LIST.map((t) => {
                  const isSelected = t.slug === selectedTrack.slug;
                  return (
                    <button
                      key={t.slug}
                      onClick={() => setSelectedTrack(t)}
                      style={{
                        outline: isSelected ? "2px solid var(--color-primary)" : "none",
                      }}
                      className={`relative rounded-lg border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-surface hover:border-primary/40"
                      }`}
                    >
                      {t.highlighted && (
                        <Badge variant="primary" className="absolute -top-2 right-3 text-[10px]">
                          Popular
                        </Badge>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{t.name}</p>
                          <p className="mt-0.5 text-xs text-muted">{t.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-bold text-foreground">{fmtUsd(t.totalUsd)}</p>
                          <p className="flex items-center justify-end gap-0.5 text-xs text-muted">
                            <Clock className="h-3 w-3" />
                            {t.durationMonths} months
                          </p>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1">
                        {t.features.slice(0, 3).map((f) => (
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

            {/* Step 2: Phone (optional) */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                2. Phone Number{" "}
                <span className="normal-case font-normal text-muted">(optional)</span>
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
                  <span className="text-muted">Program</span>
                  <span className="font-medium text-foreground">{selectedTrack.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-medium text-foreground">
                    {selectedTrack.durationMonths} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Currency</span>
                  <span className="font-medium text-foreground">USD</span>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Total</span>
                    <span className="text-lg font-bold text-foreground">{fmtUsd(totalUsd)}</span>
                  </div>
                </div>
              </div>

              {/* Included features */}
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  Included
                </p>
                <ul className="space-y-1.5">
                  {selectedTrack.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-muted">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI token budget note */}
              <div className="mt-4 rounded-md bg-surface-2 px-3 py-2.5 text-xs text-muted">
                <span className="font-medium text-foreground">Sophia AI budget:</span>{" "}
                {fmtUsd(Math.round(totalUsd * 0.1))} of your payment is allocated to Sophia AI
                usage credits.
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
                  Payment processing is not configured. Set{" "}
                  <code className="font-mono">TAP_SECRET_KEY</code> to enable live checkout.
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
