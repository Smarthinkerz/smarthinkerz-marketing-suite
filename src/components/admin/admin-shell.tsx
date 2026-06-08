"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, LayoutDashboard, FileEdit, BarChart3, Users, ArrowLeft, ShieldCheck, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Logo } from "@/components/brand/logo";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/cms", label: "Front Page Editor", icon: FileEdit },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  return (
    <div className="flex h-full flex-col gap-1 p-4">
      <div className="mb-2 flex items-center gap-2 px-2 py-3">
        <Logo size={28} showText={false} href={null} />
        <div>
          <p className="text-sm font-bold leading-tight text-foreground">Admin Console</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <ShieldCheck className="h-3 w-3 text-success" /> Admin only
          </p>
        </div>
      </div>
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto border-t border-border pt-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <ArrowLeft className="h-4.5 w-4.5" /> Back to app
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-surface lg:block">
        <AdminNav />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] border-r border-border bg-surface">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted hover:bg-surface-2"
            >
              <X className="h-5 w-5" />
            </button>
            <AdminNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-foreground hover:bg-surface-2 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
