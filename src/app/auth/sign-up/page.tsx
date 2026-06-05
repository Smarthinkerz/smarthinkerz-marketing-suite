import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted">
        Start a 14-day trial. No card required to explore.
      </p>
      <div className="mt-8">
        <Suspense>
          <SignUpForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
