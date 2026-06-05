import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted">
        Sign in to access your marketing workspace.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-64" />}>
          <SignInForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
