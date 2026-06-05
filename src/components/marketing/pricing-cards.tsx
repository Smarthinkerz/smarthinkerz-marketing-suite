import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIST } from "@/lib/plans";
import { formatCurrency, cn } from "@/lib/utils";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {PLAN_LIST.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative flex flex-col rounded-2xl border bg-surface p-6 transition-transform hover:-translate-y-1",
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
              {formatCurrency(plan.priceMonthly)}
            </span>
            <span className="mb-1 text-sm text-muted">/month</span>
          </div>
          <Button
            href={`/auth/sign-up?plan=${plan.id}`}
            variant={plan.highlighted ? "primary" : "outline"}
            className="mt-5 w-full"
          >
            Subscribe Now
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
      ))}
    </div>
  );
}
