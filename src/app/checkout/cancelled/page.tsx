import Link from "next/link";
import { XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment Cancelled — SmarThinkerz" };

export default function CheckoutCancelledPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-10 text-center shadow-sm">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-error" />
        <h1 className="text-2xl font-bold text-foreground">Payment Cancelled</h1>
        <p className="mt-3 text-sm text-muted">
          Your payment was not completed. No charge has been made to your account.
        </p>
        <p className="mt-2 text-xs text-muted">
          If you believe this is an error, please try again or contact support.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/checkout"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Try Again
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
