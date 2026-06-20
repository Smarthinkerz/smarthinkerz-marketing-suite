import Link from "next/link";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment Successful — SmarThinkerz" };

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-10 text-center shadow-sm">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-success" />
        <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
        <p className="mt-3 text-sm text-muted">
          Your payment has been confirmed. Welcome to SmarThinkerz Academy — your access is now active.
        </p>
        <p className="mt-2 text-xs text-muted">
          A receipt has been sent to your email address.
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
