"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signInAction } from "@/app/auth/actions";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params?.get("redirect") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signInAction({
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    });
    if (res.ok) {
      router.push(redirectTo);
      router.refresh();
    } else {
      setError(res.error ?? "Unable to sign in.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
