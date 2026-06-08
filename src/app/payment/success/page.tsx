/**
 * /payment/success — Tap Payments redirect landing page.
 *
 * IMPORTANT: This page is PRESENTATION ONLY.
 * It does NOT call any confirmation mutation.
 * The authoritative payment confirmation is done by the Tap webhook at
 * /api/webhooks/tap (Step 5 of the payment flow).
 *
 * Tap redirects here after the user completes payment on the Tap hosted page.
 * URL params from Tap: tap_id (charge ID), tap_status (CAPTURED | FAILED etc.)
 */

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Successful — Smarthinkerz Academy",
  description: "Your payment has been received.",
};

interface SuccessPageProps {
  searchParams: Promise<{
    tap_id?: string;
    tap_status?: string;
  }>;
}

export default async function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const chargeId = params.tap_id;
  const tapStatus = params.tap_status?.toUpperCase();

  // Tap sometimes redirects here even for non-captured states
  // The webhook is the authoritative source — show a pending message if status isn't CAPTURED
  const isConfirmed = tapStatus === "CAPTURED" || !tapStatus;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-9 w-9 text-success" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-foreground">
          {isConfirmed ? "Payment Received" : "Payment Processing"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isConfirmed
            ? "Thank you! Your payment has been received and is being processed."
            : "Your payment is being verified. This usually takes a few seconds."}
        </p>

        {/* Charge reference */}
        {chargeId && (
          <div className="mt-4 rounded-md bg-background px-4 py-3">
            <p className="text-xs text-muted">Payment Reference</p>
            <p className="mt-0.5 font-mono text-sm font-medium text-foreground">{chargeId}</p>
          </div>
        )}

        {/* Activation notice */}
        <div className="mt-5 flex items-start gap-2.5 rounded-md bg-primary/5 px-4 py-3 text-left">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Account activation in progress</p>
            <p className="mt-0.5 text-xs text-muted">
              Your program access will be activated automatically within a few minutes once payment
              confirmation is received. You will have full access to all Smarthinkerz Academy tools shortly.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Button href="/dashboard" variant="primary" className="w-full">
            Go to Dashboard
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button href="/dashboard/billing" variant="outline" className="w-full">
            View Billing
          </Button>
        </div>

        <p className="mt-5 text-xs text-muted">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
