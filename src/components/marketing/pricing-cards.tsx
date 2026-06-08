import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIST } from "@/lib/plans";
import { cn } from "@/lib/utils";

// AED conversion (1 USD ≈ 3.67 AED)
const USD_TO_AED = 3.67;
function toAed(usd: number) {
  return Math.round(usd * USD_TO_AED * 100) / 100;
}
function fmtAed(amount: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {PLAN_LIST.map((plan) => {
        const priceAed = toAed(plan.priceMonthly);
        const checkoutUrl = `/checkout?tier=${plan.id}&cycle=monthly`;
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-lg border bg-surface p-6 transition-transform hover:-translate-y-1",
              plan.highlighted
                ? "border-primary shadow-xl shadow-primary/15 ring-1 ring-primary"
                : "border-border shadow-sm",
            )}
          >
            {plan.highlighted && (
              <Badge variant="primary" className="absolute -top-3 left-6">
                Most popular
              </Badge>
            )}
            <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
            <p className="mt-1 min-h-10 text-sm text-muted">{plan.tagline}</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-foreground">
                {fmtAed(priceAed)}
              </span>
              <span className="mb-1 text-sm text-muted">/month</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">Billed in AED · Installments available</p>
            <Button
              href={checkoutUrl}
              variant={plan.highlighted ? "primary" : "outline"}
              className="mt-5 w-full"
            >
              Get Started
            </Button>
            {!compact && (
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
