"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signUpAction, signInAction } from "@/app/auth/actions";

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params?.get("plan") ?? null;
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const res = await signUpAction({
      fullName: String(fd.get("fullName") ?? ""),
      email,
      password,
    });
    if (!res.ok) {
      setError(res.error ?? "Unable to create account.");
      setLoading(false);
      return;
    }
    // Attempt immediate sign-in (works when email confirmation is disabled).
    const signin = await signInAction({ email, password });
    if (signin.ok) {
      const dest = plan ? `/dashboard/billing?plan=${plan}` : "/dashboard";
      router.push(dest);
      router.refresh();
    } else {
      setNotice(
        "Account created. Please check your email to confirm, then sign in.",
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required placeholder="Jane Doe" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
        />
      </div>
      {error && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success" role="status">
          {notice}
        </p>
      )}
      <Button type="submit" className="w-full" loading={loading}>
        Create account
      </Button>
      <p className="text-center text-xs text-muted">
        By creating an account you agree to our{" "}
        <a href="/legal/terms" className="underline">Terms</a> and{" "}
        <a href="/legal/privacy" className="underline">Privacy Policy</a>.
      </p>
    </form>
  );
}
