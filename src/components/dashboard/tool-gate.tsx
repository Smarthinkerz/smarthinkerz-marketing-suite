import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS, type Tier } from "@/lib/plans";

/**
 * Full-screen upsell shown when the current plan does not include a tool.
 * Lists what unlocks at the required tier and links to billing.
 */
export function ToolGate({
  toolName,
  requiredTier,
}: {
  toolName: string;
  requiredTier: Tier;
}) {
  const plan = PLANS[requiredTier];
  return (
    <div className="mx-auto max-w-lg py-10">
      <Card className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-foreground">
          {toolName} is a {plan.name} feature
        </h2>
        <p className="mt-2 text-sm text-muted">
          Upgrade to the {plan.name} plan to unlock {toolName} and more.
        </p>

        <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
          {plan.features.slice(0, 4).map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col items-center gap-2">
          <Button href="/dashboard/billing" className="w-full sm:w-auto">
            Upgrade to {plan.name} — ${plan.priceMonthly}/mo
          </Button>
          <Link href="/dashboard" className="text-xs font-medium text-muted hover:text-foreground">
            Back to dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
