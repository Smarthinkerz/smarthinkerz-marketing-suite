import Link from "next/link";
import { Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment Pending — SmarThinkerz" };

export default function CheckoutPendingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-10 text-center shadow-sm">
        <Clock className="mx-auto mb-4 h-16 w-16 text-warning" />
        <h1 className="text-2xl font-bold text-foreground">Payment Pending</h1>
        <p className="mt-3 text-sm text-muted">
          Your payment is being processed. This usually takes a few minutes. We will email you once it is confirmed.
        </p>
        <p className="mt-2 text-xs text-muted">
          Do not refresh or close this page — you will be notified automatically.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
