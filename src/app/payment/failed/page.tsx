/**
 * /payment/failed — Tap Payments redirect landing page for failed payments.
 *
 * Tap redirects here when the charge status is FAILED, DECLINED, CANCELLED,
 * or ABANDONED. The user can retry from here.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Failed — SmarThinkerz Marketing Suite",
  description: "Your payment could not be processed.",
};

interface FailedPageProps {
  searchParams: Promise<{
    tap_id?: string;
    tap_status?: string;
    plan?: string;
    tier?: string;
    cycle?: string;
  }>;
}

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  FAILED: {
    title: "Payment Failed",
    description:
      "Your payment could not be processed. This may be due to insufficient funds or a card issue.",
  },
  DECLINED: {
    title: "Payment Declined",
    description:
      "Your card was declined. Please check your card details or try a different payment method.",
  },
  CANCELLED: {
    title: "Payment Cancelled",
    description: "You cancelled the payment. Your subscription has not been activated.",
  },
  ABANDONED: {
    title: "Payment Session Expired",
    description:
      "Your payment session expired before completion. Please try again.",
  },
};

export default async function PaymentFailedPage({ searchParams }: FailedPageProps) {
  const params = await searchParams;
  const chargeId = params.tap_id;
  const tapStatus = params.tap_status?.toUpperCase() ?? "FAILED";
  const tier = params.tier ?? "pro";
  const cycle = params.cycle ?? "monthly";

  const msg = STATUS_MESSAGES[tapStatus] ?? STATUS_MESSAGES.FAILED;

  // Build retry URL
  const retryParams = new URLSearchParams({ tier, cycle });
  const retryUrl = `/checkout?${retryParams.toString()}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <XCircle className="h-9 w-9 text-error" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-foreground">{msg.title}</h1>
        <p className="mt-2 text-sm text-muted">{msg.description}</p>

        {/* Charge reference */}
        {chargeId && (
          <div className="mt-4 rounded-md bg-background px-4 py-3">
            <p className="text-xs text-muted">Reference</p>
            <p className="mt-0.5 font-mono text-sm font-medium text-foreground">{chargeId}</p>
          </div>
        )}

        {/* Common causes */}
        <div className="mt-5 rounded-md bg-surface-2 px-4 py-3 text-left">
          <p className="text-xs font-medium text-foreground">Common reasons for payment failure:</p>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            <li>· Insufficient funds on the card</li>
            <li>· Card not enabled for online transactions</li>
            <li>· Incorrect card details entered</li>
            <li>· Bank declined for security reasons</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Button href={retryUrl} variant="primary" className="w-full">
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Try Again
          </Button>
          <Button href="/pricing" variant="outline" className="w-full">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Pricing
          </Button>
        </div>

        <p className="mt-5 text-xs text-muted">
          Still having trouble?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
