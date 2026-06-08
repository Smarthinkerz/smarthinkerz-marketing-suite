import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TRACK_LIST } from "@/lib/plans";
import { cn } from "@/lib/utils";

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
      {TRACK_LIST.map((track) => {
        // Link to /checkout?track=<canonical-slug>
        const checkoutUrl = `/checkout?track=${track.slug}`;
        return (
          <div
            key={track.slug}
            className={cn(
              "relative flex flex-col rounded-lg border bg-surface p-6 transition-transform hover:-translate-y-1",
              track.highlighted
                ? "border-primary shadow-xl shadow-primary/15 ring-1 ring-primary"
                : "border-border shadow-sm",
            )}
          >
            {track.highlighted && (
              <Badge variant="primary" className="absolute -top-3 left-6">
                Most popular
              </Badge>
            )}
            <h3 className="text-lg font-bold text-foreground">{track.name}</h3>
            <p className="mt-1 min-h-10 text-sm text-muted">{track.description}</p>

            {/* Duration badge */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>{track.durationMonths}-month program</span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-foreground">
                {fmtAed(track.totalAed)}
              </span>
              <span className="mb-1 text-sm text-muted">total</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Billed in AED · Tap Payments · Installments available
            </p>

            <Button
              href={checkoutUrl}
              variant={track.highlighted ? "primary" : "outline"}
              className="mt-5 w-full"
            >
              Enroll Now
            </Button>

            {!compact && (
              <ul className="mt-6 space-y-3">
                {track.features.map((f) => (
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
