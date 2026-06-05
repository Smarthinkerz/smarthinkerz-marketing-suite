"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signInAction } from "@/app/auth/actions";

/**
 * Subtle footer affordance that lets administrators sign in without exposing
 * an admin entry point in the primary navigation. On success it routes to the
 * admin area; the admin layout + Supabase RLS enforce that only admins proceed.
 */
export function FooterAdminLogin() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function close() {
    if (loading) return;
    setOpen(false);
    setError(null);
  }

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
      router.push("/admin");
      router.refresh();
    } else {
      setError(res.error ?? "Unable to sign in.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ShieldCheck className="h-4 w-4" />
        Admin
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Admin sign in"
        description="Restricted access. Administrator credentials are required to manage the platform."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@company.com"
            />
          </div>
          <div>
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
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
            Sign in to admin
          </Button>
        </form>
      </Modal>
    </>
  );
}
