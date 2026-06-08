"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";
import { signOutAction } from "@/app/auth/actions";
import type { SessionUser } from "@/lib/types";

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = (user.fullName || user.email || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2.5 transition-colors hover:bg-surface-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-surface p-2 shadow-xl animate-fade-in-up">
          <div className="border-b border-border px-3 py-3">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.fullName || "Account"}
            </p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <div className="mt-2">
              <Badge variant="primary">{PLANS[user.tier].name} plan</Badge>
            </div>
          </div>
          <nav className="py-1">
            <Link
              href="/dashboard/billing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-2"
            >
              <CreditCard className="h-4 w-4 text-muted" /> Billing & Plan
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-2"
            >
              <Settings className="h-4 w-4 text-muted" /> Settings
            </Link>
          </nav>
          <form action={signOutAction} className="border-t border-border pt-1">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
